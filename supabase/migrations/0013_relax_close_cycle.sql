-- ============================================================
-- 0013_relax_close_cycle.sql
-- Permite encerrar o ciclo a qualquer momento, independente
-- do progresso das avaliações. Contratados sem par completo
-- (self + client submitted) simplesmente não aparecem na
-- final_scores view e não terão entrada em contractor_history.
-- ============================================================

create or replace function close_cycle(p_cycle uuid)
returns void language plpgsql security definer as $$
declare
  v_caller_role  user_role;
  v_cycle_status cycle_status;
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

  -- Fecha o ciclo (sem validar progresso)
  update public.cycles
     set status    = 'closed',
         closed_at = now()
   where id = p_cycle;

  -- Snapshota scores de quem tiver par completo (self + client submitted)
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
