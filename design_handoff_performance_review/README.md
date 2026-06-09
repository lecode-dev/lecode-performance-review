# Handoff: LeCode · Performance Review

> Pacote de handoff para implementação em codebase real usando **Claude Code**.
> Stack-alvo: **TypeScript · Next.js (App Router) · React · TailwindCSS · Zustand · Supabase (Postgres + Auth + RLS)**.

---

## 0. Como usar este pacote (leia primeiro)

Este bundle contém **referências de design feitas em HTML/React-via-Babel** — protótipos que mostram o **visual e o comportamento pretendidos**, e **não** código de produção para copiar e colar. A tarefa é **recriar estes designs no codebase-alvo** usando suas convenções (componentes, libs, design system). Como o projeto ainda não existe, a recomendação é **criar um app Next.js (App Router) + Supabase** e implementar os designs ali.

Há dois documentos que se complementam:

| Arquivo | O que é |
|---|---|
| `preview/LeCode Performance Review (standalone).html` | O **protótipo navegável** completo (abra no navegador). É a referência visual/comportamental. |
| `Plano Tecnico.html` (e `preview/Plano Tecnico (standalone).html`) | A **arquitetura de backend**: schema Supabase, RLS, RPCs, rotas, Zustand. **É a fonte de verdade das regras de negócio e segurança.** |
| `design/*` | O **código-fonte do protótipo** (React + Babel, sem build). Útil para extrair markup, tokens e lógica de UI. |

**Ordem sugerida de leitura para o agente:** este README → `Plano Tecnico.html` (regras + schema) → abrir o protótipo standalone → `design/store.jsx` (modelo de dados e cálculo de score) → `design/styles.css` (tokens).

### Fidelidade
**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamento e interações são finais. Recriar a UI fielmente usando Tailwind + componentes do codebase. Os tokens estão na seção 6.

---

## 1. Visão geral

Plataforma interna para avaliar os **terceirizados da LeCode** (devs e gestores de projeto) em **ciclos periódicos**. Cada contratado recebe, por ciclo:

- uma **autoavaliação** (peso **30%**), feita por ele mesmo;
- uma **avaliação do cliente** (peso **70%**), feita pelo representante do cliente onde está alocado.

**Score Final = self × 0.30 + cliente × 0.70**, calculado sobre **5 dimensões** (escala 1–5). O score orienta um **Guia de Decisões** (promoção, PDI, recuperação).

Regra de segurança central (**anti-viés**): avaliador e avaliado **não veem a avaliação um do outro antes do ciclo encerrar**. Isso é imposto no **banco (RLS)**, não só na UI.

### Perfis de acesso
| Perfil | role (DB) | O que faz |
|---|---|---|
| Gestor LeCode | `lecode_admin` | Cadastra contratados/clientes, vincula/desvincula, edita formulário, abre/encerra ciclos, vê todo o histórico e scores. |
| Representante Cliente | `client_rep` | Avalia os contratados alocados no seu cliente; vê histórico filtrado por ciclo. |
| Contratado LeCode | `contractor` | Faz a autoavaliação; vê seu histórico e evolução. |

---

## 2. Modelo de dados (resumo — detalhe completo no Plano Técnico)

Entidades: `profiles` (1:1 com `auth.users`, carrega `role`), `clients`, `contractors`, `allocations` (vínculo **temporal** contratado↔cliente), `cycles` (`open`/`closed`), `form_versions` + `form_questions` (formulário **versionado**, pesos), `reviews` (`type: self|client`, `status: draft|submitted`), `review_answers` (score 1–5 por pergunta).

O **dicionário de domínio** (5 dimensões × 5 perguntas, escala, decisões, pesos) está pronto e literal em **`design/store.jsx`** — use-o como fonte das constantes/seed. O cálculo de score e as visibilidades estão na mesma store (`finalScore`, `dimAvg`, `cycleProgress`, `canCloseCycle`).

---

## 3. Telas / Views

Rotas sugeridas (App Router) entre parênteses. Layout base: **sidebar fixa 248px** + **topbar sticky 60px** + conteúdo centralizado (`max-width: 1180px`).

### Autenticação (`/(auth)/...`)
- **Login** (`/login`) — split 1.05fr / 1fr. Aside escuro com logo, headline, **terminal animado** (digita comandos `lecode ...`) e grid sutil; painel direito com formulário. **Contas de demonstração** (no protótipo) — em produção, o perfil vem da sessão; remover o seletor e usar a role real.
- **Cadastro** (`/signup`) — nome, e-mail, senha + confirmação, medidor de força; **perfil inicial fixo = Contratado** (read-only). Elevação de perfil é ação de admin.
- **Recuperação** (`/recover`) — e-mail → tela de confirmação "link enviado".
- Validações: e-mail (regex), senha ≥ 8, confirmação coincide, nome+sobrenome. Erros inline no `blur`/submit. Mostrar/ocultar senha.

### Gestor LeCode (`/(app)/admin/...`)
- **Visão geral** (`/admin`) — 4 stats (count-up), progresso do ciclo por cliente, lista de decisões do último ciclo encerrado.
- **Ciclos** (`/admin/cycles`) — abrir ciclo (modal), cards de progresso, **encerrar** (só quando 100% concluído) com **double-check destrutivo**.
- **Contratados** (`/admin/contractors`, `/admin/contractors/[id]`) — tabela com último score + recomendação; detalhe com seletor de ciclo + comparação self×cliente (radar + barras) + histórico (admin vê tudo, inclusive ciclo aberto).
- **Clientes** (`/admin/clients`) — cards com equipe.
- **Formulário** (`/admin/form`) — editor das 5 dimensões/perguntas, pesos e escala; remover pergunta com double-check.

### Representante Cliente (`/(app)/client/...`)
- **Minha equipe** (`/client/team`) — contratados alocados; status da minha avaliação e da self (sem revelar conteúdo); botão Avaliar/Revisar.
- **Avaliar** (`/client/team/[contractorId]/evaluate`) — formulário de avaliação; **pré-preenche** se já enviado (editar enquanto aberto); double-check no envio/salvar.
- **Histórico** (`/client/history`) — por ciclo; a self e o score final só aparecem **após o ciclo encerrar**.

### Contratado LeCode (`/(app)/contractor/...`)
- **Início** (`/contractor`) — card de ação da autoavaliação, gráfico de evolução (sparkline), último score + recomendação, alocação atual.
- **Autoavaliação** (`/contractor/self-review`) — formulário; pré-preenche se já enviado; double-check.
- **Histórico** (`/contractor/history`) — por ciclo; a avaliação do cliente só aparece **após encerrar**.

### Componente compartilhado: Formulário de avaliação
Usado na self e na do cliente. Rail lateral de dimensões com progresso, 25 perguntas (5×5) com input de nota 1–5, 3 perguntas abertas opcionais, barra sticky com média parcial e botão de envio (vira "Salvar alterações" em edição). Markup completo em **`design/shared.jsx`**.

---

## 4. Interações & comportamento

- **Double-check (confirmações):** padrão reutilizável (`ConfirmProvider`/`useConfirm` em `design/components.jsx`) com `await confirm({...})` → Promise<boolean>. Tom `danger` (sólido vermelho) só em ações destrutivas/irreversíveis (encerrar ciclo, remover pergunta, desvincular). Mensagens já redigidas (PT/EN/ES) em `design/i18n.jsx`.
- **Editar enquanto aberto:** o formulário pré-carrega respostas já enviadas; botão alterna para "Salvar alterações". **No backend isso é a RLS de `update` com `cycles.status='open'`** (ver Plano Técnico §05). Após encerrar, trava.
- **Anti-viés:** a UI esconde a contraparte até o ciclo fechar — mas a barreira real é a RLS. Não dependa do front.
- **Animações estilo programação:** terminal de digitação no login, count-up nos números/scores, cursor piscando, entradas escalonadas, shimmer em barras. Tudo respeita `prefers-reduced-motion`. Código em `design/anim.jsx`.
- **i18n:** PT (padrão), EN, ES — dropdown com globo. **Tema** claro/escuro via toggle (sol/lua). Persistem em `localStorage`.

---

## 5. Estado & dados

- **Servidor (Next.js):** Server Components buscam dados **com o JWT do usuário** → a RLS filtra. A role é lida do banco no `layout` (não confiar no claim). Ver Plano Técnico §08.
- **Zustand (cliente):** apenas estado de UI efêmero — `useSession` (role hidratada do servidor), `useReviewDraft` (respostas em edição + autosave para review `draft`), `useUiPrefs` (idioma/tema/densidade). Ver Plano Técnico §09.
- **Segurança/autorização:** toda regra em **RLS + RPC** (`close_cycle`, `get_final_score`). Schema e políticas completas no Plano Técnico §03–§07. **Não reimplementar as regras só no front.**

> **Arranque pronto:** a pasta `lib/` + `stores/` + `middleware.ts` + `app/actions/` já trazem tipos do schema, clientes Supabase, helpers de acesso por domínio, guards de auth e as stores Zustand — alinhados às migrations. Ver `lib/README.md`.

---

## 6. Design tokens (de `design/styles.css`)

**Cor de marca:** verde LeCode **`#00b473`** (amostrado do logo). Derivações via `oklch(from var(--accent) ...)`.

**Tema escuro (padrão):**
| Token | Valor (oklch) | Uso |
|---|---|---|
| `--bg` | `oklch(0.16 0.012 168)` | fundo app |
| `--surface` | `oklch(0.198 0.014 168)` | cards |
| `--surface-2/3` | `0.178 / 0.24 …168` | superfícies aninhadas |
| `--border` | `oklch(0.27 0.015 168)` | bordas |
| `--ink` | `oklch(0.96 0.006 168)` | texto principal |
| `--ink-2/3` | `0.78 / 0.6 …168` | texto secundário/terciário |

**Tema claro:** `--bg oklch(0.984 0.004 170)`, `--surface #fff`, `--ink oklch(0.23 0.015 175)` (bloco `[data-theme]` no CSS).

**Escala de score (1–5):** vermelho→âmbar→verde — `--s1 oklch(0.6 0.17 27)` … `--s5 oklch(0.6 0.15 156)`, cada uma com variante `-soft`. No tema escuro o texto dos chips é clareado (ver overrides `[data-theme="dark"] .tier-*`).

**Tipografia:** títulos/UI **Space Grotesk**; monospace/labels técnicos **IBM Plex Mono**. Escala: h1 38px / h2 24–26px / corpo 14px / labels mono 10–11px uppercase. Hi-fi: pesos 400–700, `letter-spacing` levemente negativo nos títulos.

**Raios:** `--radius 12px`, `--radius-sm 8px`, `--radius-lg 18px`. **Sombras:** `--shadow-sm/shadow/shadow-lg` (ver CSS). **Botão primário** tem glow verde.

**Densidade:** `--pad` 20/28/36px via `[data-density]`.

> Ao portar para Tailwind: mapeie estes tokens para `theme.extend` (cores em CSS vars + `colors`), e use `data-theme`/`data-density` no `<html>` como já feito.

---

## 7. Assets

- `design/assets/lecode-logo.png` — logo angular verde da LeCode (transparente). Usar o asset de marca oficial no codebase quando disponível.
- Ícones: conjunto SVG line inline em `design/components.jsx` (`Icon`). Substituir por `lucide-react` (mesmo estilo) no codebase, se preferir.
- Fontes: Google Fonts (Space Grotesk, IBM Plex Mono).

---

## 8. Arquivos deste pacote

```
design_handoff_performance_review/
├─ README.md                         ← este arquivo
├─ CLAUDE.md                         ← contexto auto-carregado pelo Claude Code
├─ Plano Tecnico.html                ← arquitetura: schema, RLS, RPC, rotas, Zustand (LEIA)
├─ supabase/                         ← MIGRATIONS PRONTAS p/ rodar
│  ├─ README.md                      ← como aplicar + pós-migration
│  ├─ migrations/0001_schema.sql
│  ├─ migrations/0002_auth_and_scores.sql
│  ├─ migrations/0003_rls.sql        ← regras anti-viés (RLS)
│  ├─ migrations/0004_rpc.sql        ← close_cycle, submit_review, get_final_score…
│  └─ seed.sql                       ← formulário 5×5, clientes, ciclos
├─ preview/
│  ├─ LeCode Performance Review (standalone).html   ← protótipo navegável (offline)
│  └─ Plano Tecnico (standalone).html
└─ design/                           ← código-fonte do protótipo (React + Babel)
   ├─ LeCode Performance Review.html ← entrypoint (ordem dos scripts)
   ├─ styles.css                     ← TODOS os tokens + componentes
   ├─ store.jsx                      ← modelo de domínio, seed, cálculo de score  ★
   ├─ i18n.jsx                       ← dicionário PT/EN/ES + toggles idioma/tema
   ├─ components.jsx                 ← Icon, Avatar, Badge, ScoreChip, Radar, Modal, ConfirmProvider
   ├─ shared.jsx                     ← EvaluationForm + ReviewDetail (comparação)
   ├─ auth.jsx                       ← Login / Signup / Recover + validação
   ├─ screens-admin.jsx              ← telas do Gestor
   ├─ screens-client.jsx             ← telas do Representante
   ├─ screens-contractor.jsx         ← telas do Contratado
   ├─ app.jsx                        ← shell, roteamento, auth gating, tweaks
   ├─ anim.jsx                       ← terminal, count-up, caret
   └─ tweaks-panel.jsx               ← painel de tweaks (pode ser descartado em prod)
```

★ = comece por aqui para o modelo de dados e regras de score.

---

## 9. Prompt sugerido para o Claude Code

> "Este repositório precisa implementar a plataforma de Performance Review da LeCode. Leia `design_handoff_performance_review/README.md` e `Plano Tecnico.html`. Crie um app **Next.js (App Router) + TypeScript + Tailwind + Zustand** e configure **Supabase** com o schema, as **políticas RLS** e os **RPCs** descritos no Plano Técnico (as regras anti-viés e de edição-enquanto-aberto DEVEM ser impostas via RLS, não só no front). Recrie as telas do protótipo (`preview/...standalone.html`) com fidelidade visual usando os tokens da seção 6 do README. Comece pelas migrations do Supabase e por um seed espelhando `design/store.jsx`; depois implemente Auth (3 perfis), o formulário de avaliação compartilhado e as três jornadas. Não copie o HTML diretamente — reimplemente nos padrões do codebase."

---

## 10. Decisões em aberto (alinhar com o time)
Ver Plano Técnico §10: representante multi-cliente, troca de cliente no meio do ciclo, reabertura de ciclo, auditoria/notificações, vínculo de `form_version` por ciclo, e tratamento de rascunho vs enviado nas views de score.
