-- ============================================================
-- 0009_prototype_fields.sql — campos do protótipo
-- ============================================================

-- ─── contractors: seniority, track, since ────────────────────
alter table contractors
  add column if not exists seniority text not null default 'Pleno',
  add column if not exists track     text not null default 'Dev',
  add column if not exists since     text; -- e.g. '2026-06'

-- ─── clients: industry, color ────────────────────────────────
alter table clients
  add column if not exists industry text,
  add column if not exists color    text;

-- ─── contractor_changelog (alterações de cargo/senioridade etc)
create table if not exists contractor_changelog (
  id            uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  field         text not null,       -- 'role' | 'seniority' | 'track' | 'allocation'
  old_value     text,
  new_value     text,
  note          text,
  changed_by    text,                -- nome de quem fez a alteração
  changed_at    date not null default current_date,
  created_at    timestamptz not null default now()
);

-- RLS for contractor_changelog
alter table contractor_changelog enable row level security;

create policy "Admin full access on contractor_changelog"
  on contractor_changelog for all
  using (
    (select role from profiles where id = auth.uid()) = 'lecode_admin'
  );
