-- ============================================================
-- 0004_rpc.sql  –  RPCs security definer
-- ============================================================

-- ─── close_cycle ─────────────────────────────────────────────
-- Valida que todos os pares (self + client) estão submitted,
-- fecha o ciclo e snapshota os scores em contractor_history.
create or replace function close_cycle(p_cycle uuid)
returns void language plpgsql security definer as $$
declare
  v_caller_role  user_role;
  v_cycle_status cycle_status;
  v_total        integer;
  v_complete     integer;
begin
  -- Somente admin pode fechar
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is distinct from 'lecode_admin' then
    raise exception 'Unauthorized: only lecode_admin can close cycles';
  end if;

  -- Ciclo deve estar open
  select status into v_cycle_status from public.cycles where id = p_cycle;
  if v_cycle_status is distinct from 'open' then
    raise exception 'Cycle is already closed';
  end if;

  -- Conta contractors com ao menos uma review no ciclo
  select count(distinct contractor_id)
    into v_total
    from public.reviews
   where cycle_id = p_cycle;

  if v_total = 0 then
    raise exception 'No reviews found for this cycle';
  end if;

  -- Conta pares completos (self submitted + client submitted)
  select count(distinct rs.contractor_id)
    into v_complete
    from public.reviews rs
    join public.reviews rc
      on  rc.cycle_id      = rs.cycle_id
      and rc.contractor_id = rs.contractor_id
      and rc.type          = 'client'
      and rc.status        = 'submitted'
   where rs.cycle_id = p_cycle
     and rs.type     = 'self'
     and rs.status   = 'submitted';

  if v_total <> v_complete then
    raise exception
      'Cannot close: % of % contractors have complete review pairs',
      v_complete, v_total;
  end if;

  -- Fecha o ciclo
  update public.cycles
     set status    = 'closed',
         closed_at = now()
   where id = p_cycle;

  -- Snapshota scores em contractor_history
  insert into public.contractor_history
    (cycle_id, contractor_id, self_avg, client_avg, final_score, self_weight, client_weight, snapshot)
  select
    fs.cycle_id,
    fs.contractor_id,
    fs.self_avg,
    fs.client_avg,
    fs.final_score,
    fs.self_weight,
    fs.client_weight,
    jsonb_build_object(
      'cycle_id',      fs.cycle_id,
      'contractor_id', fs.contractor_id,
      'self_avg',      fs.self_avg,
      'client_avg',    fs.client_avg,
      'final_score',   fs.final_score,
      'self_weight',   fs.self_weight,
      'client_weight', fs.client_weight,
      'closed_at',     now()
    )
  from public.final_scores fs
  where fs.cycle_id = p_cycle
  on conflict (cycle_id, contractor_id) do update
    set self_avg      = excluded.self_avg,
        client_avg    = excluded.client_avg,
        final_score   = excluded.final_score,
        snapshot      = excluded.snapshot;
end;
$$;

-- ─── get_final_score ─────────────────────────────────────────
-- Admin: sempre retorna.
-- Outros: só retorna se cycle.status = 'closed'.
create or replace function get_final_score(p_cycle uuid, p_contractor uuid)
returns table(
  self_avg      numeric,
  client_avg    numeric,
  final_score   numeric,
  self_weight   numeric,
  client_weight numeric
) language plpgsql security definer as $$
declare
  v_role   user_role;
  v_status cycle_status;
begin
  select role   into v_role   from public.profiles where id = auth.uid();
  select status into v_status from public.cycles   where id = p_cycle;

  if v_role = 'lecode_admin' or v_status = 'closed' then
    return query
      select
        fs.self_avg,
        fs.client_avg,
        fs.final_score,
        fs.self_weight,
        fs.client_weight
      from public.final_scores fs
      where fs.cycle_id      = p_cycle
        and fs.contractor_id = p_contractor;
  end if;
  -- Retorna vazio para ciclos abertos (exceto admin)
end;
$$;

-- ─── submit_review ───────────────────────────────────────────
-- Valida que todas as perguntas foram respondidas e submete.
create or replace function submit_review(p_review uuid)
returns void language plpgsql security definer as $$
declare
  v_author       uuid;
  v_cycle_id     uuid;
  v_review_type  review_type;
  v_form_version uuid;
  v_q_count      integer;
  v_a_count      integer;
begin
  -- Verifica autoria
  select author_id, cycle_id, type
    into v_author, v_cycle_id, v_review_type
    from public.reviews
   where id = p_review;

  if v_author is distinct from auth.uid() and auth_role() <> 'lecode_admin' then
    raise exception 'Unauthorized';
  end if;

  -- Busca form_version do ciclo
  select id into v_form_version
    from public.form_versions
   where cycle_id = v_cycle_id
   limit 1;

  -- Conta perguntas esperadas para o tipo
  select count(*) into v_q_count
    from public.form_questions
   where form_version_id = v_form_version
     and applies_to      = v_review_type;

  -- Conta respostas existentes
  select count(*) into v_a_count
    from public.review_answers
   where review_id = p_review;

  if v_a_count < v_q_count then
    raise exception
      'Incomplete review: % of % questions answered',
      v_a_count, v_q_count;
  end if;

  update public.reviews
     set status       = 'submitted',
         submitted_at = now()
   where id = p_review;
end;
$$;
