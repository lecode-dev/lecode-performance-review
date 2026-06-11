-- ============================================================
-- 0005_fix_rls_recursion.sql
-- Fix: auth_role() lia profiles dentro de policy de profiles → recursão infinita.
-- Solução: ler role direto do JWT (app_metadata), sem tocar no banco.
-- ============================================================

create or replace function auth_role()
returns user_role language sql security definer stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role')::user_role,
    'contractor'::user_role
  );
$$;
