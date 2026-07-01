-- ============================================================
-- 0012_fix_close_cycle_rpc.sql
-- Fix close_cycle: use active allocations for v_total instead of
-- counting distinct contractors from reviews (which included ghost
-- contractors with only draft reviews, causing false failures).
-- ============================================================

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

  -- Conta contractors ativos (alocações sem data de término)
  select count(distinct contractor_id)
    into v_total
    from public.allocations
   where ended_on is null;

  if v_total = 0 then
    raise exception 'No active contractors found';
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
