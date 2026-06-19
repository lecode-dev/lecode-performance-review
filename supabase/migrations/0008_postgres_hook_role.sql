-- ============================================================
-- 0008_postgres_hook_role.sql
-- Substitui a Edge Function add_role_to_jwt por uma Postgres
-- Hook que injeta profiles.role no JWT sem cold start.
-- ============================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  user_role  text;
  claims     jsonb;
begin
  select role::text into user_role
  from public.profiles
  where id = (event->>'user_id')::uuid;

  claims := event->'claims';

  claims := jsonb_set(
    claims,
    '{app_metadata}',
    coalesce(claims->'app_metadata', '{}'::jsonb)
      || jsonb_build_object('role', coalesce(user_role, 'contractor'))
  );

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Permissão para o auth chamar a função
grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon, public;
