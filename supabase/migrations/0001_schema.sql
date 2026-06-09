-- ============================================================
-- 0001_schema.sql  –  LeCode Performance Review
-- ============================================================

-- ─── Enums ───────────────────────────────────────────────────
create type user_role     as enum ('lecode_admin', 'client_rep', 'contractor');
create type cycle_status  as enum ('open', 'closed');
create type review_type   as enum ('self', 'client');
create type review_status as enum ('draft', 'submitted');
create type dimension_key as enum ('tech', 'delivery', 'comm', 'collab', 'autonomy');

-- ─── clients ─────────────────────────────────────────────────
create table clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  created_at timestamptz not null default now()
);

-- ─── profiles (1:1 auth.users) ───────────────────────────────
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       user_role    not null default 'contractor',
  full_name  text         not null,
  email      text         not null,
  client_id  uuid         references clients(id) on delete set null,
  created_at timestamptz  not null default now(),
  updated_at timestamptz  not null default now()
);

-- ─── contractors ─────────────────────────────────────────────
create table contractors (
  id            uuid primary key references profiles(id) on delete cascade,
  github_handle text,
  skills        text[],
  created_at    timestamptz not null default now()
);

-- ─── allocations (vínculo temporal contractor ↔ client) ──────
create table allocations (
  id            uuid  primary key default gen_random_uuid(),
  contractor_id uuid  not null references contractors(id) on delete cascade,
  client_id     uuid  not null references clients(id)     on delete cascade,
  started_on    date  not null,
  ended_on      date,
  created_at    timestamptz not null default now()
);

-- ─── cycles ──────────────────────────────────────────────────
create table cycles (
  id         uuid         primary key default gen_random_uuid(),
  name       text         not null,
  status     cycle_status not null default 'open',
  opens_at   date         not null,
  closes_at  date         not null,
  created_at timestamptz  not null default now(),
  closed_at  timestamptz
);

-- ─── form_versions ───────────────────────────────────────────
create table form_versions (
  id            uuid    primary key default gen_random_uuid(),
  cycle_id      uuid    not null references cycles(id) on delete cascade,
  self_weight   numeric not null default 0.30,
  client_weight numeric not null default 0.70,
  created_at    timestamptz not null default now(),
  constraint form_versions_weights check (
    abs(self_weight + client_weight - 1.0) < 0.001
  )
);

-- ─── form_questions ──────────────────────────────────────────
create table form_questions (
  id              uuid          primary key default gen_random_uuid(),
  form_version_id uuid          not null references form_versions(id) on delete cascade,
  dimension       dimension_key not null,
  text            text          not null,
  order_index     integer       not null,
  applies_to      review_type   not null,
  created_at      timestamptz   not null default now()
);

-- ─── reviews ─────────────────────────────────────────────────
create table reviews (
  id            uuid          primary key default gen_random_uuid(),
  cycle_id      uuid          not null references cycles(id)      on delete cascade,
  contractor_id uuid          not null references contractors(id) on delete cascade,
  type          review_type   not null,
  author_id     uuid          not null references profiles(id)    on delete cascade,
  status        review_status not null default 'draft',
  strengths     text,
  growth        text,
  extra         text,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  submitted_at  timestamptz,
  unique(cycle_id, contractor_id, type)
);

-- ─── review_answers ──────────────────────────────────────────
create table review_answers (
  id          uuid    primary key default gen_random_uuid(),
  review_id   uuid    not null references reviews(id)        on delete cascade,
  question_id uuid    not null references form_questions(id) on delete cascade,
  score       integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint review_answers_score check (score >= 1 and score <= 5),
  unique(review_id, question_id)
);

-- ─── contractor_history (snapshot imutável pós-fechamento) ───
create table contractor_history (
  id            uuid    primary key default gen_random_uuid(),
  cycle_id      uuid    not null references cycles(id)      on delete cascade,
  contractor_id uuid    not null references contractors(id) on delete cascade,
  self_avg      numeric,
  client_avg    numeric,
  final_score   numeric,
  self_weight   numeric,
  client_weight numeric,
  snapshot      jsonb,
  created_at    timestamptz not null default now(),
  unique(cycle_id, contractor_id)
);

-- ─── View: final_scores ──────────────────────────────────────
create or replace view final_scores as
select
  r_self.cycle_id,
  r_self.contractor_id,
  fv.self_weight,
  fv.client_weight,
  round(avg(ra_self.score)::numeric,   2) as self_avg,
  round(avg(ra_client.score)::numeric, 2) as client_avg,
  round(
    (avg(ra_self.score)::numeric   * fv.self_weight +
     avg(ra_client.score)::numeric * fv.client_weight),
    2
  ) as final_score
from reviews r_self
join reviews r_client
  on  r_client.cycle_id      = r_self.cycle_id
  and r_client.contractor_id = r_self.contractor_id
  and r_client.type          = 'client'
  and r_client.status        = 'submitted'
join review_answers ra_self   on ra_self.review_id   = r_self.id
join review_answers ra_client on ra_client.review_id = r_client.id
join form_versions fv         on fv.cycle_id         = r_self.cycle_id
where r_self.type   = 'self'
  and r_self.status = 'submitted'
group by r_self.cycle_id, r_self.contractor_id, fv.self_weight, fv.client_weight;

-- ─── Triggers ────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();

create trigger reviews_updated_at
  before update on reviews
  for each row execute procedure set_updated_at();

create trigger review_answers_updated_at
  before update on review_answers
  for each row execute procedure set_updated_at();

-- ─── Trigger: auto-cria profile + contractor no signup ───────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    'contractor',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );

  insert into public.contractors (id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
