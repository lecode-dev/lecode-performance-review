-- ============================================================
-- 0011_fix_jwt_client_id.sql
-- Fix: auth hook was not injecting client_id into JWT,
-- causing all client_rep RLS policies to deny access.
-- ============================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  user_role      text;
  user_client_id uuid;
  claims         jsonb;
  meta           jsonb;
begin
  select role::text, client_id
  into user_role, user_client_id
  from public.profiles
  where id = (event->>'user_id')::uuid;

  claims := event->'claims';
  meta   := coalesce(claims->'app_metadata', '{}'::jsonb)
            || jsonb_build_object('role', coalesce(user_role, 'contractor'));

  if user_client_id is not null then
    meta := meta || jsonb_build_object('client_id', user_client_id);
  end if;

  claims := jsonb_set(claims, '{app_metadata}', meta);

  return jsonb_set(event, '{claims}', claims);
end;
$$;
