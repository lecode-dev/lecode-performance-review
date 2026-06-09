-- =============================================================================
-- 0002_auth_and_scores.sql · LeCode Performance Review
-- (1) Provisionamento de profile no signup  (2) Hook de role no JWT
-- (3) Views de score por dimensão e final.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- (1) Ao criar um auth.users, cria o profile correspondente como 'contractor'.
--     Elevação de role (client_rep / lecode_admin) é ação administrativa.
-- -----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'contractor'                         -- SEMPRE contractor no signup
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- -----------------------------------------------------------------------------
-- (2) Custom Access Token Hook: injeta a role no JWT a cada emissão.
--     Apenas atalho de UI — a autoridade continua sendo a RLS lendo do banco.
--     Registrar em: Dashboard > Authentication > Hooks > Custom Access Token.
-- -----------------------------------------------------------------------------
create or replace function add_role_to_jwt(event jsonb)
returns jsonb language plpgsql stable as $$
declare
  r text;
  claims jsonb;
begin
  select role::text into r from public.profiles
   where id = (event->>'user_id')::uuid;

  claims := coalesce(event->'claims', '{}'::jsonb);
  if r is not null then
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(r));
  end if;
  return jsonb_set(event, '{claims}', claims);
end; $$;

-- -----------------------------------------------------------------------------
-- (3) Scores derivados — nunca gravados em duplicidade.
--     security_invoker => respeitam a RLS de quem consulta.
-- -----------------------------------------------------------------------------

-- Média por dimensão (apenas reviews enviadas).
create view review_dimension_scores with (security_invoker = on) as
select r.cycle_id,
       r.contractor_id,
       r.type,
       q.dimension,
       avg(a.score)::numeric(4,2) as dim_score
from reviews r
join review_answers a on a.review_id = r.id
join form_questions q on q.id = a.question_id
where r.status = 'submitted'
group by r.cycle_id, r.contractor_id, r.type, q.dimension;

-- Score final = self*0.30 + cliente*0.70 (pesos da versão ativa).
-- Observação: para não-admins, antes do ciclo fechar a RLS oculta a linha da
-- contraparte e esta view sairia incompleta — por isso o número consolidado é
-- entregue via RPC get_final_score() (ver 0004). Esta view serve admin/relatórios.
create view final_scores with (security_invoker = on) as
with overall as (
  select cycle_id, contractor_id, type, avg(dim_score) as s
  from review_dimension_scores
  group by cycle_id, contractor_id, type
),
weights as (
  select self_weight, client_weight from form_versions where is_active limit 1
)
select o.cycle_id,
       o.contractor_id,
       max(o.s) filter (where type = 'self')   as self_score,
       max(o.s) filter (where type = 'client') as client_score,
       round(
         coalesce(max(o.s) filter (where type = 'self'),   0) * w.self_weight +
         coalesce(max(o.s) filter (where type = 'client'), 0) * w.client_weight
       , 2) as final_score
from overall o
cross join weights w
group by o.cycle_id, o.contractor_id, w.self_weight, w.client_weight;

-- -----------------------------------------------------------------------------
-- (4) Auditoria: registra em contractor_history toda mudança de
--     role / seniority / track (em contractors) e de vínculo (em allocations).
--     changed_by = usuário corrente (auth.uid()); se nulo (job), fica null.
-- -----------------------------------------------------------------------------
create or replace function log_contractor_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role_title is distinct from old.role_title then
    insert into contractor_history(contractor_id, field, old_value, new_value, changed_by)
    values (new.id, 'role', old.role_title, new.role_title, auth.uid());
  end if;
  if new.seniority is distinct from old.seniority then
    insert into contractor_history(contractor_id, field, old_value, new_value, changed_by)
    values (new.id, 'seniority', old.seniority, new.seniority, auth.uid());
  end if;
  if new.track is distinct from old.track then
    insert into contractor_history(contractor_id, field, old_value, new_value, changed_by)
    values (new.id, 'track', old.track, new.track, auth.uid());
  end if;
  return new;
end; $$;

create trigger contractors_audit
  after update on contractors
  for each row execute function log_contractor_change();

-- Vínculo: novo registro em allocations = nova alocação.
create or replace function log_allocation_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare client_name text;
begin
  select name into client_name from clients where id = new.client_id;
  insert into contractor_history(contractor_id, field, old_value, new_value, changed_by)
  values (new.contractor_id, 'allocation', null, client_name, auth.uid());
  return new;
end; $$;

create trigger allocations_audit
  after insert on allocations
  for each row execute function log_allocation_change();
