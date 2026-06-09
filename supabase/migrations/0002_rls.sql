-- ============================================================
-- 0002_rls.sql  –  Row Level Security + Anti-Viés
-- ============================================================

-- ─── Habilitar RLS ───────────────────────────────────────────
alter table clients            enable row level security;
alter table profiles           enable row level security;
alter table contractors        enable row level security;
alter table allocations        enable row level security;
alter table cycles             enable row level security;
alter table form_versions      enable row level security;
alter table form_questions     enable row level security;
alter table reviews            enable row level security;
alter table review_answers     enable row level security;
alter table contractor_history enable row level security;

-- ─── Helper: role do usuário logado ──────────────────────────
create or replace function auth_role()
returns user_role language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ─── clients ─────────────────────────────────────────────────
create policy "admin: full access on clients"
  on clients for all
  using (auth_role() = 'lecode_admin')
  with check (auth_role() = 'lecode_admin');

create policy "client_rep: read own client"
  on clients for select
  using (
    auth_role() = 'client_rep'
    and id = (select client_id from profiles where id = auth.uid())
  );

-- ─── profiles ────────────────────────────────────────────────
create policy "admin: full access on profiles"
  on profiles for all
  using (auth_role() = 'lecode_admin')
  with check (auth_role() = 'lecode_admin');

create policy "own profile: select"
  on profiles for select
  using (id = auth.uid());

-- Role auto-escalation blocked: with check garante que role não muda
create policy "own profile: update (sem escalada de role)"
  on profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from profiles where id = auth.uid())
  );

create policy "client_rep: read allocated contractors profiles"
  on profiles for select
  using (
    auth_role() = 'client_rep'
    and id in (
      select a.contractor_id from allocations a
      where a.client_id = (select client_id from profiles where id = auth.uid())
        and a.ended_on is null
    )
  );

-- ─── contractors ─────────────────────────────────────────────
create policy "admin: full access on contractors"
  on contractors for all
  using (auth_role() = 'lecode_admin')
  with check (auth_role() = 'lecode_admin');

create policy "own contractor: select"
  on contractors for select
  using (id = auth.uid());

create policy "client_rep: read allocated contractors"
  on contractors for select
  using (
    auth_role() = 'client_rep'
    and id in (
      select a.contractor_id from allocations a
      where a.client_id = (select client_id from profiles where id = auth.uid())
        and a.ended_on is null
    )
  );

-- ─── allocations ─────────────────────────────────────────────
create policy "admin: full access on allocations"
  on allocations for all
  using (auth_role() = 'lecode_admin')
  with check (auth_role() = 'lecode_admin');

create policy "contractor: read own allocations"
  on allocations for select
  using (auth_role() = 'contractor' and contractor_id = auth.uid());

create policy "client_rep: read own client allocations"
  on allocations for select
  using (
    auth_role() = 'client_rep'
    and client_id = (select client_id from profiles where id = auth.uid())
  );

-- ─── cycles ──────────────────────────────────────────────────
create policy "admin: full access on cycles"
  on cycles for all
  using (auth_role() = 'lecode_admin')
  with check (auth_role() = 'lecode_admin');

create policy "authenticated: read cycles"
  on cycles for select
  using (auth.uid() is not null);

-- ─── form_versions ───────────────────────────────────────────
create policy "admin: full access on form_versions"
  on form_versions for all
  using (auth_role() = 'lecode_admin')
  with check (auth_role() = 'lecode_admin');

create policy "authenticated: read form_versions"
  on form_versions for select
  using (auth.uid() is not null);

-- ─── form_questions ──────────────────────────────────────────
create policy "admin: full access on form_questions"
  on form_questions for all
  using (auth_role() = 'lecode_admin')
  with check (auth_role() = 'lecode_admin');

create policy "authenticated: read form_questions"
  on form_questions for select
  using (auth.uid() is not null);

-- ─── reviews ─────────────────────────────────────────────────
create policy "admin: full access on reviews"
  on reviews for all
  using (auth_role() = 'lecode_admin')
  with check (auth_role() = 'lecode_admin');

-- Contractor: gerencia própria auto-avaliação
create policy "contractor: manage own self-review"
  on reviews for all
  using (
    auth_role() = 'contractor'
    and type      = 'self'
    and author_id = auth.uid()
  )
  with check (
    auth_role() = 'contractor'
    and type      = 'self'
    and author_id = auth.uid()
  );

-- ANTI-VIÉS: Contractor NÃO vê client review até ciclo fechar
create policy "contractor: read client review only after close"
  on reviews for select
  using (
    auth_role()   = 'contractor'
    and type          = 'client'
    and contractor_id = auth.uid()
    and exists (
      select 1 from cycles c
      where c.id = cycle_id and c.status = 'closed'
    )
  );

-- Client rep: gerencia avaliações de contractors alocados
create policy "client_rep: manage allocated client-reviews"
  on reviews for all
  using (
    auth_role() = 'client_rep'
    and type = 'client'
    and contractor_id in (
      select a.contractor_id from allocations a
      where a.client_id = (select client_id from profiles where id = auth.uid())
        and a.ended_on is null
    )
  )
  with check (
    auth_role() = 'client_rep'
    and type = 'client'
    and contractor_id in (
      select a.contractor_id from allocations a
      where a.client_id = (select client_id from profiles where id = auth.uid())
        and a.ended_on is null
    )
  );

-- ANTI-VIÉS: Client rep NÃO vê self-review até ciclo fechar
create policy "client_rep: read self-review only after close"
  on reviews for select
  using (
    auth_role() = 'client_rep'
    and type = 'self'
    and contractor_id in (
      select a.contractor_id from allocations a
      where a.client_id = (select client_id from profiles where id = auth.uid())
    )
    and exists (
      select 1 from cycles c
      where c.id = cycle_id and c.status = 'closed'
    )
  );

-- ─── review_answers ──────────────────────────────────────────
create policy "admin: full access on review_answers"
  on review_answers for all
  using (auth_role() = 'lecode_admin')
  with check (auth_role() = 'lecode_admin');

-- Autor pode gerenciar próprias respostas (cobre contractor + client_rep)
create policy "author: manage own review answers"
  on review_answers for all
  using (
    review_id in (
      select id from reviews where author_id = auth.uid()
    )
  )
  with check (
    review_id in (
      select id from reviews where author_id = auth.uid()
    )
  );

-- ANTI-VIÉS: Client rep lê respostas de self-review só após fechar
create policy "client_rep: read self-review answers after close"
  on review_answers for select
  using (
    auth_role() = 'client_rep'
    and review_id in (
      select r.id from reviews r
      join cycles c on c.id = r.cycle_id
      where c.status = 'closed'
        and r.type   = 'self'
        and r.contractor_id in (
          select a.contractor_id from allocations a
          where a.client_id = (select client_id from profiles where id = auth.uid())
        )
    )
  );

-- ANTI-VIÉS: Contractor lê respostas de client review só após fechar
create policy "contractor: read client answers after close"
  on review_answers for select
  using (
    auth_role() = 'contractor'
    and review_id in (
      select r.id from reviews r
      join cycles c on c.id = r.cycle_id
      where c.status       = 'closed'
        and r.type         = 'client'
        and r.contractor_id = auth.uid()
    )
  );

-- ─── contractor_history ──────────────────────────────────────
create policy "admin: full access on contractor_history"
  on contractor_history for all
  using (auth_role() = 'lecode_admin')
  with check (auth_role() = 'lecode_admin');

create policy "contractor: read own history"
  on contractor_history for select
  using (auth_role() = 'contractor' and contractor_id = auth.uid());

create policy "client_rep: read allocated contractors history"
  on contractor_history for select
  using (
    auth_role() = 'client_rep'
    and contractor_id in (
      select a.contractor_id from allocations a
      where a.client_id = (select client_id from profiles where id = auth.uid())
    )
  );
