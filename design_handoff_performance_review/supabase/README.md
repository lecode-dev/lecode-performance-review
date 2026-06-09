# Supabase — LeCode Performance Review

Migrations versionadas + seed. Implementam o **schema**, o **cálculo de score**, as **políticas RLS** (regras anti-viés) e os **RPCs** descritos em `../Plano Tecnico.html`.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `migrations/0001_schema.sql` | Enums, tabelas, índices, trigger `updated_at`. Inclui `contractor_history` (auditoria) e `cycles.submit_ends_on` (janela de envio dia 1→15). |
| `migrations/0002_auth_and_scores.sql` | Trigger de profile no signup, Auth Hook (role no JWT), views `review_dimension_scores`/`final_scores`, e triggers de auditoria (`log_contractor_change`, `log_allocation_change`). |
| `migrations/0003_rls.sql` | Helpers + RLS de todas as tabelas (incl. `contractor_history`). **Regras anti-viés aqui.** |
| `migrations/0004_rpc.sql` | RPCs: `open_cycle` (por mês → deriva 1/15/fim), `close_cycle`, `submit_review`, `get_final_score`, `assign_role`. |
| `seed.sql` | Formulário (5×5), clientes, ciclos; profiles/contractors comentados (casar com `auth.users`). |

## Como aplicar

### Opção A — Supabase CLI (recomendado)
```bash
supabase init                 # se ainda não existir
# copie esta pasta para supabase/ do seu projeto
supabase db reset             # aplica migrations + seed.sql em ordem
# ou, contra um projeto remoto já linkado:
supabase db push
```

### Opção B — SQL Editor do Dashboard
Rode os arquivos **em ordem** (0001 → 0002 → 0003 → 0004 → seed.sql).

## Pós-migration (obrigatório)

1. **Auth Hook da role:** Dashboard → Authentication → Hooks → *Custom Access Token* → selecione `add_role_to_jwt`. Sem isso o JWT não carrega `app_metadata.role` (o front ainda funciona lendo do banco, mas perde o atalho).
2. **Crie os usuários** no Supabase Auth e popule `profiles` com os mesmos UUIDs (ver bloco comentado no `seed.sql`), ou use `select assign_role('<uuid>', 'lecode_admin')` para elevar perfis.
3. **Confirme o vínculo `client_rep` → `clients`** (a constraint exige `client_id` para reps).

## Princípios (não quebrar)

- **A role vem do banco** (`profiles.role`), nunca do cliente. Signup força `contractor`; elevação só via `assign_role` (admin).
- **Anti-viés é RLS:** `client_rep` só vê a self após o ciclo encerrar; `contractor` só vê a do cliente após encerrar. Ver `reviews_*_read` em `0003`.
- **Editar enquanto aberto:** as policies `*_update`/`*_insert` exigem `cycle_is_open()`. Encerrar trava tudo.
- **Ciclo em 2 fases:** `open_cycle(p_month)` deriva início=dia 1, `submit_ends_on`=dia 15 (fim do envio) e `ends_on`=fim do mês (apuração/discussão). `cycle_phase(cycle)` retorna `submission`|`review`|`closed` conforme a data.
- **Auditoria automática:** mudanças de cargo/senioridade/trilha (em `contractors`) e de vínculo (em `allocations`) gravam em `contractor_history` via trigger `security definer` — não escreva nessa tabela pelo app. RLS de leitura: admin tudo; contratado o próprio; rep dos alocados.
- **Score consolidado** para não-admin só sai por `get_final_score()` com ciclo encerrado — não leia `final_scores` direto no front para não-admins.
- Toda função sensível é `security definer` com `search_path = public` e checagem explícita de `is_admin()` quando aplicável; `submit_review` é `security invoker` de propósito (a RLS já autoriza).

## Smoke test rápido (psql)
```sql
-- como contratado, durante ciclo aberto: deve gravar
select submit_review(
  '00000000-0000-0000-0000-0000000000a3',          -- Jul/2026 (aberto)
  '<meu_contractor_id>', 'self',
  jsonb_object_agg(q.id, 4), '{"strengths":"ok"}'::jsonb)
from form_questions q
where q.form_version_id = '00000000-0000-0000-0000-0000000000f1';

-- score final antes de encerrar, como não-admin: deve falhar
select * from get_final_score('00000000-0000-0000-0000-0000000000a3','<contractor_id>');
--> ERROR: score_indisponivel_ate_encerrar
```
