-- =============================================================================
-- 0004_rpc.sql · LeCode Performance Review
-- Ações sensíveis com invariantes que uma policy de linha não expressa bem.
-- security definer + search_path fixo + checagem explícita de autorização.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Abrir ciclo (admin). Recebe o MÊS de referência e deriva as janelas:
--   início = dia 1 · fim do envio = dia 15 · término = último dia do mês.
-- Garante no máximo um aberto (o índice único reforça).
-- -----------------------------------------------------------------------------
create or replace function open_cycle(p_month date)   -- qualquer data do mês; usa-se o mês
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
  v_start date := date_trunc('month', p_month)::date;
  v_submit date := v_start + 14;                              -- dia 15
  v_end date := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
  v_label text := initcap(to_char(p_month, 'TMMon')) || '/' || to_char(p_month, 'YYYY');
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if exists (select 1 from cycles where status = 'open') then
    raise exception 'ja_existe_ciclo_aberto';
  end if;

  insert into cycles (label, starts_on, submit_ends_on, ends_on, created_by)
  values (v_label, v_start, v_submit, v_end, auth.uid())
  returning id into new_id;
  return new_id;
end; $$;

-- -----------------------------------------------------------------------------
-- Encerrar ciclo (admin). Só permite se TODA dupla (self, client) dos
-- contratados alocados no período estiver 'submitted'.
-- -----------------------------------------------------------------------------
create or replace function close_cycle(p_cycle uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;

  if not exists (select 1 from cycles where id = p_cycle and status = 'open') then
    raise exception 'ciclo_nao_esta_aberto';
  end if;

  if exists (
    select 1
    from allocations al
    join cycles c on c.id = p_cycle
    cross join (values ('self'::review_type), ('client'::review_type)) as t(type)
    where al.started_on <= c.ends_on
      and coalesce(al.ended_on, 'infinity'::date) >= c.starts_on
      and not exists (
        select 1 from reviews r
        where r.cycle_id = p_cycle
          and r.contractor_id = al.contractor_id
          and r.type = t.type
          and r.status = 'submitted'
      )
  ) then
    raise exception 'avaliacoes_pendentes';
  end if;

  update cycles set status = 'closed', closed_at = now() where id = p_cycle;
end; $$;

-- -----------------------------------------------------------------------------
-- Submeter (ou re-submeter, enquanto aberto) uma review completa de uma vez:
-- upsert da review + substituição das respostas. As policies de RLS continuam
-- valendo (a função NÃO é security definer) — autorização é a mesma do INSERT.
-- p_answers: jsonb { "<question_id>": <1..5>, ... }
-- p_comments: jsonb { strengths, growth, extra }
-- -----------------------------------------------------------------------------
create or replace function submit_review(
  p_cycle uuid, p_contractor uuid, p_type review_type,
  p_answers jsonb, p_comments jsonb default '{}'::jsonb
) returns uuid language plpgsql security invoker set search_path = public as $$
declare r_id uuid;
begin
  insert into reviews (cycle_id, contractor_id, type, author_id, status, comments, submitted_at)
  values (p_cycle, p_contractor, p_type, auth.uid(), 'submitted', p_comments, now())
  on conflict (cycle_id, contractor_id, type)
  do update set status = 'submitted', comments = excluded.comments,
                submitted_at = now(), author_id = auth.uid()
  returning id into r_id;

  delete from review_answers where review_id = r_id;
  insert into review_answers (review_id, question_id, score)
  select r_id, (key)::uuid, (value)::int
  from jsonb_each_text(p_answers);

  return r_id;
end; $$;

-- -----------------------------------------------------------------------------
-- Score final consolidado. Admin sempre; demais perfis só com ciclo encerrado.
-- Evita o vazamento indireto da view antes do encerramento.
-- -----------------------------------------------------------------------------
create or replace function get_final_score(p_cycle uuid, p_contractor uuid)
returns table (self_score numeric, client_score numeric, final_score numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and not cycle_is_closed(p_cycle) then
    raise exception 'score_indisponivel_ate_encerrar';
  end if;

  -- Visibilidade adicional para não-admin: contratado vê o seu; rep vê alocados.
  if not is_admin() then
    if not (
      p_contractor = my_contractor_id()
      or (auth_role() = 'client_rep' and rep_sees_contractor(p_contractor, p_cycle))
    ) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
  end if;

  return query
    select fs.self_score, fs.client_score, fs.final_score
    from final_scores fs
    where fs.cycle_id = p_cycle and fs.contractor_id = p_contractor;
end; $$;

-- -----------------------------------------------------------------------------
-- Atribuir/alterar role de um usuário (somente admin). Mantém o invariante:
-- client_rep precisa de client_id; demais zeram client_id.
-- -----------------------------------------------------------------------------
create or replace function assign_role(p_user uuid, p_role user_role, p_client uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_role = 'client_rep' and p_client is null then
    raise exception 'client_rep_requer_client_id';
  end if;

  update profiles
    set role = p_role,
        client_id = case when p_role = 'client_rep' then p_client else null end
  where id = p_user;
end; $$;

-- Permissões de execução (RLS continua mediando o acesso a dados).
grant execute on function open_cycle(date)                   to authenticated;
grant execute on function close_cycle(uuid)                   to authenticated;
grant execute on function submit_review(uuid, uuid, review_type, jsonb, jsonb) to authenticated;
grant execute on function get_final_score(uuid, uuid)         to authenticated;
grant execute on function assign_role(uuid, user_role, uuid)  to authenticated;
