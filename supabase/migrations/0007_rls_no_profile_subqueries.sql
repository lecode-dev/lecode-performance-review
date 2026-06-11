-- ============================================================
-- 0007_rls_no_profile_subqueries.sql
-- Reescreve TODAS as policies que subquotam `profiles` em
-- qualquer tabela. Toda verificação de role/client usa JWT.
-- ============================================================

-- ── clients ──────────────────────────────────────────────────
drop policy if exists "client_rep: read own client" on public.clients;
create policy "client_rep: read own client"
  on public.clients for select
  using (
    auth_role() = 'client_rep'
    and id = auth_client_id()
  );

-- ── contractors ──────────────────────────────────────────────
drop policy if exists "client_rep: read allocated contractors" on public.contractors;
create policy "client_rep: read allocated contractors"
  on public.contractors for select
  using (
    auth_role() = 'client_rep'
    and id in (
      select contractor_id from public.allocations
      where client_id = auth_client_id() and ended_on is null
    )
  );

-- ── allocations ──────────────────────────────────────────────
drop policy if exists "client_rep: read own client allocations" on public.allocations;
create policy "client_rep: read own client allocations"
  on public.allocations for select
  using (
    auth_role() = 'client_rep'
    and client_id = auth_client_id()
  );

-- ── reviews ──────────────────────────────────────────────────
drop policy if exists "client_rep: manage allocated client-reviews" on public.reviews;
create policy "client_rep: manage allocated client-reviews"
  on public.reviews for all
  using (
    auth_role() = 'client_rep'
    and type = 'client'
    and contractor_id in (
      select contractor_id from public.allocations
      where client_id = auth_client_id() and ended_on is null
    )
  )
  with check (
    auth_role() = 'client_rep'
    and type = 'client'
    and contractor_id in (
      select contractor_id from public.allocations
      where client_id = auth_client_id() and ended_on is null
    )
  );

drop policy if exists "client_rep: read self-review only after close" on public.reviews;
create policy "client_rep: read self-review only after close"
  on public.reviews for select
  using (
    auth_role() = 'client_rep'
    and type = 'self'
    and contractor_id in (
      select contractor_id from public.allocations
      where client_id = auth_client_id()
    )
    and exists (
      select 1 from public.cycles c
      where c.id = cycle_id and c.status = 'closed'
    )
  );

-- ── review_answers ───────────────────────────────────────────
drop policy if exists "client_rep: read self-review answers after close" on public.review_answers;
create policy "client_rep: read self-review answers after close"
  on public.review_answers for select
  using (
    auth_role() = 'client_rep'
    and review_id in (
      select r.id from public.reviews r
      join public.cycles c on c.id = r.cycle_id
      where c.status = 'closed'
        and r.type = 'self'
        and r.contractor_id in (
          select contractor_id from public.allocations
          where client_id = auth_client_id()
        )
    )
  );

-- ── contractor_history ───────────────────────────────────────
drop policy if exists "client_rep: read allocated contractors history" on public.contractor_history;
create policy "client_rep: read allocated contractors history"
  on public.contractor_history for select
  using (
    auth_role() = 'client_rep'
    and contractor_id in (
      select contractor_id from public.allocations
      where client_id = auth_client_id()
    )
  );
