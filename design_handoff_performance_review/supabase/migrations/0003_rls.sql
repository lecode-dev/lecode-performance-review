-- =============================================================================
-- 0003_rls.sql · LeCode Performance Review
-- Helpers + Row Level Security. AQUI ficam as regras de autorização e anti-viés.
-- Nenhuma policy permissiva por padrão: tudo nega até uma policy liberar.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers (stable) — centralizam a leitura do perfil do usuário corrente.
-- -----------------------------------------------------------------------------
create or replace function auth_role() returns user_role language sql stable as
$$ select role from profiles where id = auth.uid() $$;

create or replace function is_admin() returns boolean language sql stable as
$$ select coalesce(auth_role() = 'lecode_admin', false) $$;

create or replace function my_client_id() returns uuid language sql stable as
$$ select client_id from profiles where id = auth.uid() $$;

create or replace function my_contractor_id() returns uuid language sql stable as
$$ select id from contractors where profile_id = auth.uid() $$;

-- Ciclo está encerrado?
create or replace function cycle_is_closed(p_cycle uuid) returns boolean language sql stable as
$$ select exists (select 1 from cycles where id = p_cycle and status = 'closed') $$;

-- Ciclo está aberto?
create or replace function cycle_is_open(p_cycle uuid) returns boolean language sql stable as
$$ select exists (select 1 from cycles where id = p_cycle and status = 'open') $$;

-- O contratado esteve alocado no cliente do usuário durante o período do ciclo?
create or replace function rep_sees_contractor(p_contractor uuid, p_cycle uuid)
returns boolean language sql stable as $$
  select exists (
    select 1
    from allocations al
    join cycles c on c.id = p_cycle
    where al.contractor_id = p_contractor
      and al.client_id = my_client_id()
      and al.started_on <= c.ends_on
      and coalesce(al.ended_on, 'infinity'::date) >= c.starts_on
  )
$$;

-- O contratado tem vínculo ATIVO com o cliente do usuário? (para escrita)
create or replace function rep_can_eval_contractor(p_contractor uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from allocations al
    where al.contractor_id = p_contractor
      and al.client_id = my_client_id()
      and al.ended_on is null
  )
$$;

-- =============================================================================
-- Habilita RLS em todas as tabelas
-- =============================================================================
alter table clients        enable row level security;
alter table profiles       enable row level security;
alter table contractors    enable row level security;
alter table allocations    enable row level security;
alter table cycles         enable row level security;
alter table form_versions  enable row level security;
alter table form_questions enable row level security;
alter table reviews        enable row level security;
alter table review_answers enable row level security;

-- =============================================================================
-- PROFILES
-- =============================================================================
-- Cada um lê o próprio profile; admin lê todos.
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or is_admin());
-- Cada um edita campos próprios NÃO sensíveis (a role nunca é editável aqui;
-- alteração de role é via RPC admin — ver 0004). Admin gerencia todos.
create policy profiles_self_update on profiles
  for update using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());
create policy profiles_admin_insert on profiles
  for insert with check (is_admin());

-- =============================================================================
-- CLIENTS — admin gerencia; reps e contratados leem (catálogo).
-- =============================================================================
create policy clients_read on clients for select using (auth.uid() is not null);
create policy clients_admin_write on clients
  for all using (is_admin()) with check (is_admin());

-- =============================================================================
-- CONTRACTORS
--   admin: tudo
--   contractor: o próprio
--   client_rep: contratados alocados (a qualquer tempo) no seu cliente
-- =============================================================================
create policy contractors_admin_all on contractors
  for all using (is_admin()) with check (is_admin());
create policy contractors_self_read on contractors
  for select using (profile_id = auth.uid());
create policy contractors_rep_read on contractors
  for select using (
    auth_role() = 'client_rep' and exists (
      select 1 from allocations al
      where al.contractor_id = contractors.id
        and al.client_id = my_client_id()
    )
  );

-- =============================================================================
-- ALLOCATIONS — admin gerencia; rep vê as do seu cliente; contratado vê as suas
-- =============================================================================
create policy allocations_admin_all on allocations
  for all using (is_admin()) with check (is_admin());
create policy allocations_rep_read on allocations
  for select using (auth_role() = 'client_rep' and client_id = my_client_id());
create policy allocations_self_read on allocations
  for select using (contractor_id = my_contractor_id());

-- =============================================================================
-- CYCLES — todos leem; só admin escreve (abrir/encerrar via RPC).
-- =============================================================================
create policy cycles_read on cycles for select using (auth.uid() is not null);
create policy cycles_admin_write on cycles
  for all using (is_admin()) with check (is_admin());

-- =============================================================================
-- FORM — todos leem (para renderizar o formulário); só admin escreve.
-- =============================================================================
create policy form_versions_read on form_versions for select using (auth.uid() is not null);
create policy form_versions_admin_write on form_versions
  for all using (is_admin()) with check (is_admin());
create policy form_questions_read on form_questions for select using (auth.uid() is not null);
create policy form_questions_admin_write on form_questions
  for all using (is_admin()) with check (is_admin());

-- =============================================================================
-- REVIEWS — núcleo das regras anti-viés
-- =============================================================================

-- Admin: acesso total.
create policy reviews_admin_all on reviews
  for all using (is_admin()) with check (is_admin());

-- Contratado (leitura): sua self sempre; a do cliente só com ciclo ENCERRADO.
create policy reviews_contractor_read on reviews for select using (
  contractor_id = my_contractor_id()
  and (
    type = 'self'
    or (type = 'client' and cycle_is_closed(cycle_id))
  )
);

-- Representante (leitura): contratados que esteve alocado no seu cliente no
-- período do ciclo; a self só com ciclo ENCERRADO (anti-viés).
create policy reviews_client_read on reviews for select using (
  auth_role() = 'client_rep'
  and rep_sees_contractor(contractor_id, cycle_id)
  and (
    type = 'client'
    or (type = 'self' and cycle_is_closed(cycle_id))
  )
);

-- Contratado (escrita): cria/edita a própria self, só com ciclo ABERTO.
create policy reviews_self_insert on reviews for insert with check (
  type = 'self'
  and contractor_id = my_contractor_id()
  and author_id = auth.uid()
  and cycle_is_open(cycle_id)
);
create policy reviews_self_update on reviews for update
  using (type = 'self' and contractor_id = my_contractor_id() and cycle_is_open(cycle_id))
  with check (type = 'self' and contractor_id = my_contractor_id() and cycle_is_open(cycle_id));

-- Representante (escrita): cria/edita a review do cliente, só com ciclo ABERTO
-- e exigindo vínculo ATIVO do contratado no seu cliente.
create policy reviews_client_insert on reviews for insert with check (
  type = 'client'
  and auth_role() = 'client_rep'
  and author_id = auth.uid()
  and cycle_is_open(cycle_id)
  and rep_can_eval_contractor(contractor_id)
);
create policy reviews_client_update on reviews for update
  using (
    type = 'client' and auth_role() = 'client_rep'
    and cycle_is_open(cycle_id) and rep_can_eval_contractor(contractor_id)
  )
  with check (
    type = 'client' and auth_role() = 'client_rep'
    and cycle_is_open(cycle_id) and rep_can_eval_contractor(contractor_id)
  );

-- =============================================================================
-- REVIEW_ANSWERS — herda a visibilidade/edição da review-pai.
-- =============================================================================
create policy review_answers_read on review_answers for select using (
  exists (select 1 from reviews r where r.id = review_answers.review_id)
  -- a policy de SELECT de reviews já restringe o que é visível
);
create policy review_answers_write on review_answers for all
  using (
    exists (
      select 1 from reviews r
      where r.id = review_answers.review_id
        and (
          is_admin()
          or (r.type = 'self'   and r.contractor_id = my_contractor_id() and cycle_is_open(r.cycle_id))
          or (r.type = 'client' and auth_role() = 'client_rep'
              and cycle_is_open(r.cycle_id) and rep_can_eval_contractor(r.contractor_id))
        )
    )
  )
  with check (
    exists (
      select 1 from reviews r
      where r.id = review_answers.review_id
        and (
          is_admin()
          or (r.type = 'self'   and r.contractor_id = my_contractor_id() and cycle_is_open(r.cycle_id))
          or (r.type = 'client' and auth_role() = 'client_rep'
              and cycle_is_open(r.cycle_id) and rep_can_eval_contractor(r.contractor_id))
        )
    )
  );

-- =============================================================================
-- CONTRACTOR_HISTORY — auditoria (somente leitura via app; escrita pelos triggers)
-- Admin: tudo. Contratado: o próprio. Cliente: dos contratados alocados a ele.
-- (As inserções vêm de triggers SECURITY DEFINER, que ignoram a RLS.)
-- =============================================================================
alter table contractor_history enable row level security;

create policy ch_admin_read on contractor_history
  for select using (is_admin());
create policy ch_self_read on contractor_history
  for select using (
    contractor_id = my_contractor_id()
  );
create policy ch_rep_read on contractor_history
  for select using (
    auth_role() = 'client_rep' and exists (
      select 1 from allocations al
      where al.contractor_id = contractor_history.contractor_id
        and al.client_id = my_client_id()
    )
  );
