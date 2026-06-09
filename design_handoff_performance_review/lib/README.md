# Camada de aplicação (TypeScript) — arranque

Tipos, clientes Supabase, helpers de acesso a dados, guards de auth, Server Actions e stores Zustand. **Código de arranque** para o app Next.js — copie para a raiz do projeto e ajuste imports/paths.

## Onde cada arquivo vai (no app Next.js)

```
<raiz-do-app>/
├─ middleware.ts                 ← renova sessão + gating grosseiro por perfil
├─ lib/
│  ├─ database.types.ts          ← tipos do schema (ou gere com supabase gen types)
│  ├─ domain.ts                  ← DIMENSIONS, SCALE, DECISIONS, finalScore()… (espelha store.jsx)
│  ├─ auth.ts                    ← getSessionProfile / requireRole (role do BANCO)
│  ├─ supabase/
│  │  ├─ server.ts               ← cliente p/ Server Components (cookies → JWT do usuário)
│  │  └─ client.ts               ← cliente p/ Client Components
│  └─ data/
│     ├─ cycles.ts               ← listar/abrir/encerrar ciclos, progresso
│     ├─ reviews.ts              ← ler review+respostas, submit_review, get_final_score
│     └─ contractors.ts          ← contratados, equipe, formulário ativo, alocação
├─ app/
│  └─ actions/
│     └─ reviews.ts              ← Server Actions (submit/close/open) + revalidatePath
└─ stores/
   ├─ reviewDraft.ts             ← rascunho do formulário (Zustand)
   └─ uiPrefs.ts                 ← idioma/tema/densidade (Zustand + persist)
```

## Dependências
```bash
npm i @supabase/supabase-js @supabase/ssr zustand
# (Next.js, React, Tailwind já no projeto)
```

## Variáveis de ambiente (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Service role NUNCA no cliente; só em jobs/serverless de admin se necessário.
```

## Princípios que este código respeita
- **Server Components buscam com o JWT do usuário** (`lib/supabase/server.ts`) → a RLS filtra os dados. Os helpers em `lib/data/*` não reimplementam regras de visibilidade; confiam na RLS.
- **A role vem do banco** (`lib/auth.ts` lê `profiles.role`). O `app_metadata.role` do JWT (usado no `middleware.ts`) é só atalho de roteamento — nunca libera dados.
- **Mutações sensíveis via RPC** (`submit_review`, `close_cycle`, `open_cycle`, `assign_role`), encapsuladas em `lib/data/*` e expostas por Server Actions com `revalidatePath`.
- **Anti-viés e editar-enquanto-aberto** acontecem no banco — o front só reflete o que volta. `get_final_score` retorna `null` (tratado) antes do encerramento para não-admins.

## Fluxo de uma avaliação (exemplo)
1. Página `/contractor/self-review` (Server Component) chama `getActiveForm()` + `getReview(cycle, me, 'self')` para pré-preencher.
2. `useReviewDraft.hydrate(...)` carrega as respostas no cliente; o usuário edita.
3. Ao enviar, o componente chama `submitReviewAction(...)` (Server Action) → `submit_review` (RPC) sob RLS.
4. `revalidatePath` atualiza as telas; se o ciclo estiver fechado, a RLS bloqueia e a action devolve `sem_permissao`.

## Próximos arquivos a criar (não inclusos — derivar do protótipo)
- Componentes de UI recriando `design/*` com Tailwind (EvaluationForm, ReviewDetail, Radar, ScoreChip, ConfirmDialog…).
- `app/(app)/{admin,client,contractor}/...` conforme §3 do README principal e §08 do Plano Técnico.
- `i18n` (3 idiomas) — reaproveitar os dicionários de `design/i18n.jsx`.
