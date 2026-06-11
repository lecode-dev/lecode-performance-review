-- ============================================================
-- 0006_fix_profiles_policies_recursion.sql
-- Duas policies em `profiles` subquotavam `profiles` causando recursão:
--   1. client_rep: read allocated contractors profiles
--   2. own profile: update (WITH CHECK)
-- Fix: ler client_id do JWT (mesmo padrão de auth_role()).
-- ============================================================

-- Helper: client_id do usuário logado via JWT (sem tocar no banco)
create or replace function auth_client_id()
returns uuid language sql security definer stable as $$
  select (auth.jwt() -> 'app_metadata' ->> 'client_id')::uuid;
$$;

-- Fix 1: own profile update — substituir subquery por auth_role()
drop policy "own profile: update (sem escalada de role)" on public.profiles;

create policy "own profile: update (sem escalada de role)"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = auth_role()
  );

-- Fix 2: client_rep profiles — usar auth_client_id() em vez de subquery
drop policy "client_rep: read allocated contractors profiles" on public.profiles;

create policy "client_rep: read allocated contractors profiles"
  on public.profiles for select
  using (
    auth_role() = 'client_rep'
    and id in (
      select a.contractor_id from public.allocations a
      where a.client_id = auth_client_id()
        and a.ended_on is null
    )
  );
