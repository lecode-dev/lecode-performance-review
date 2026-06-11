do $$
declare v_id uuid;
begin
  select id into v_id from auth.users where email = 'kaique@lecode.dev';

  -- Role no JWT
  update auth.users
  set raw_app_meta_data = raw_app_meta_data || '{"role":"lecode_admin"}'::jsonb
  where id = v_id;

  -- Profile (cria ou promove para admin)
  insert into public.profiles (id, role, full_name, email)
  select v_id, 'lecode_admin',
    coalesce(raw_user_meta_data->>'full_name', split_part(email,'@',1)),
    email
  from auth.users where id = v_id
  on conflict (id) do update set role = 'lecode_admin';

  -- Contractor row (trigger cria para novos users; garante para os antigos)
  insert into public.contractors (id) values (v_id)
  on conflict (id) do nothing;
end;
$$;
