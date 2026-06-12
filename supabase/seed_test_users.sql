-- ============================================================
-- seed_test_users.sql  –  Usuários de teste (dev only)
-- ============================================================
do $$
declare
  v_admin_id      uuid := gen_random_uuid();
  v_client_id     uuid := gen_random_uuid();
  v_contractor_id uuid := gen_random_uuid();
  v_acme_id       uuid;
begin

  select id into v_acme_id from public.clients where slug = 'acme';

  -- ── Admin ──────────────────────────────────────────────────
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_admin_id, 'authenticated', 'authenticated',
    'admin@lecode.dev',
    crypt('Test1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"lecode_admin"}',
    '{"full_name":"Admin LeCode"}',
    now(), now(), '', '', '', ''
  );

  -- ── Client Rep ─────────────────────────────────────────────
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_client_id, 'authenticated', 'authenticated',
    'client@lecode.dev',
    crypt('Test1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"client_rep"}',
    '{"full_name":"Client Rep"}',
    now(), now(), '', '', '', ''
  );

  -- ── Contractor ─────────────────────────────────────────────
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_contractor_id, 'authenticated', 'authenticated',
    'contractor@lecode.dev',
    crypt('Test1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"contractor"}',
    '{"full_name":"Contractor LeCode"}',
    now(), now(), '', '', '', ''
  );

  -- ── Corrigir roles no profiles (trigger cria todos como contractor) ──
  update public.profiles set role = 'lecode_admin' where id = v_admin_id;
  update public.profiles set role = 'client_rep',
                              client_id = v_acme_id
    where id = v_client_id;

  -- ── Alocar contractor na Acme Corp ─────────────────────────
  insert into public.allocations (contractor_id, client_id, started_on)
  values (v_contractor_id, v_acme_id, '2026-01-01');

end;
$$;
