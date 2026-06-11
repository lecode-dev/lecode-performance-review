update auth.users
set raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
  'client_id', (select id from public.clients where slug = 'acme')
)
where email = 'client@lecode.dev';
