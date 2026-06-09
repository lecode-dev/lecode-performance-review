-- =============================================================================
-- 0001_schema.sql · LeCode Performance Review
-- Tipos, tabelas e índices. Base do domínio.
-- =============================================================================

-- ---- Extensões ----
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---- Enums ----
create type user_role     as enum ('lecode_admin', 'client_rep', 'contractor');
create type cycle_status  as enum ('open', 'closed');
create type review_type   as enum ('self', 'client');
create type review_status as enum ('draft', 'submitted');
create type dimension_key as enum ('tech', 'delivery', 'comm', 'collab', 'autonomy');

-- ---- Clientes ----
create table clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  industry    text,
  created_at  timestamptz not null default now()
);

-- ---- Perfis (1:1 com auth.users; carrega a role — fonte de verdade) ----
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null unique,
  role        user_role not null default 'contractor',
  client_id   uuid references clients(id),   -- preenchido apenas para client_rep
  created_at  timestamptz not null default now(),
  -- client_rep precisa de um cliente; os demais não têm client_id
  constraint client_rep_has_client check (
    (role = 'client_rep' and client_id is not null)
    or (role <> 'client_rep' and client_id is null)
  )
);

-- ---- Contratados (dados profissionais; 1:1 com um profile contractor) ----
create table contractors (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null unique references profiles(id) on delete cascade,
  role_title  text not null,                 -- ex.: "Senior Frontend Engineer"
  track       text not null,                 -- "Dev" | "Gestão"
  seniority   text not null,                 -- "Júnior" | "Pleno" | "Sênior"
  started_on  date not null default current_date
);

-- ---- Alocações (vínculo TEMPORAL contratado ↔ cliente) ----
create table allocations (
  id            uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  client_id     uuid not null references clients(id) on delete cascade,
  started_on    date not null default current_date,
  ended_on      date                         -- null = vínculo ativo
);
-- No máximo um vínculo ativo por contratado.
create unique index one_active_alloc
  on allocations(contractor_id) where ended_on is null;
create index allocations_contractor_idx on allocations(contractor_id);
create index allocations_client_idx     on allocations(client_id);

-- ---- Ciclos de avaliação ----
create table cycles (
  id             uuid primary key default gen_random_uuid(),
  label          text not null,                 -- ex.: "Jul/2026"
  starts_on      date not null,                 -- dia 1 (início da janela de envio)
  submit_ends_on date not null,                 -- dia 15 (fim do envio; início da apuração)
  ends_on        date not null,                 -- fim do mês (encerramento/apuração)
  status         cycle_status not null default 'open',
  closed_at      timestamptz,
  created_by     uuid references profiles(id),
  created_at     timestamptz not null default now(),
  check (submit_ends_on >= starts_on),
  check (ends_on >= submit_ends_on)
);
-- No máximo um ciclo aberto por vez.
create unique index one_open_cycle on cycles((status)) where status = 'open';

-- Fase do ciclo conforme a data corrente: 'submission' (1→15) | 'review' (15→fim) | 'closed'.
create or replace function cycle_phase(c cycles)
returns text language sql immutable as $$
  select case
    when c.status = 'closed' then 'closed'
    when current_date > c.submit_ends_on then 'review'
    else 'submission'
  end;
$$;

-- ---- Histórico de alterações do contratado (append-only / auditoria) ----
create table contractor_history (
  id            uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  field         text not null,                 -- 'role' | 'seniority' | 'track' | 'allocation'
  old_value     text,
  new_value     text,
  note          text,
  changed_by    uuid references profiles(id),
  changed_at    timestamptz not null default now()
);
create index contractor_history_idx on contractor_history(contractor_id, changed_at desc);

-- ---- Formulário versionado (pesos + perguntas) ----
create table form_versions (
  id            uuid primary key default gen_random_uuid(),
  version       int not null unique,
  self_weight   numeric(3,2) not null default 0.30,
  client_weight numeric(3,2) not null default 0.70,
  is_active     boolean not null default false,
  created_at    timestamptz not null default now(),
  check (self_weight + client_weight = 1)
);
-- Apenas uma versão ativa.
create unique index one_active_form on form_versions((is_active)) where is_active;

create table form_questions (
  id              uuid primary key default gen_random_uuid(),
  form_version_id uuid not null references form_versions(id) on delete cascade,
  dimension       dimension_key not null,
  position        int not null,              -- ordem dentro da dimensão (1..5)
  text            text not null,
  unique (form_version_id, dimension, position)
);

-- ---- Reviews (uma self + uma client por contratado/ciclo) ----
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  cycle_id      uuid not null references cycles(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  type          review_type not null,
  author_id     uuid not null references profiles(id),
  status        review_status not null default 'draft',
  comments      jsonb not null default '{}'::jsonb,  -- {strengths, growth, extra}
  submitted_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (cycle_id, contractor_id, type)
);
create index reviews_cycle_idx      on reviews(cycle_id);
create index reviews_contractor_idx on reviews(contractor_id);

create table review_answers (
  review_id   uuid not null references reviews(id) on delete cascade,
  question_id uuid not null references form_questions(id),
  score       smallint not null check (score between 1 and 5),
  primary key (review_id, question_id)
);

-- ---- updated_at automático em reviews ----
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

create trigger reviews_touch
  before update on reviews
  for each row execute function touch_updated_at();
