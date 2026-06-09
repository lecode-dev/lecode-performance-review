# CLAUDE.md — Plataforma LeCode · Performance Review

## O que é este projeto
Plataforma interna da **LeCode** (empresa de terceirização de engenheiros e gestores de projeto) para **avaliação de desempenho** dos contratados em **ciclos periódicos**. Cada contratado recebe, por ciclo, uma **autoavaliação** (peso 30%) e uma **avaliação do cliente** onde está alocado (peso 70%). **Score Final = self × 0.30 + cliente × 0.70**, sobre 5 dimensões (escala 1–5), orientando um Guia de Decisões (promoção/PDI/recuperação).

## Stack
TypeScript · **Next.js (App Router)** · React · **TailwindCSS** · **Zustand** · **Supabase** (Postgres + Auth + RLS).

## ⚠️ Leia antes de codar
A especificação completa está em **`design_handoff_performance_review/`**:

1. **`design_handoff_performance_review/README.md`** — briefing autossuficiente: perfis, telas + rotas, tokens de design, comportamento.
2. **`design_handoff_performance_review/Plano Tecnico.html`** — **fonte de verdade do backend**: schema SQL, políticas RLS, RPCs, rotas, Zustand. Abra no navegador.
3. **`design_handoff_performance_review/preview/*.html`** — protótipos navegáveis (referência visual offline).
4. **`design_handoff_performance_review/design/store.jsx`** — modelo de domínio, seed e cálculo de score (★ comece por aqui).

## Regras inegociáveis
- **Autorização vem do banco, não do front.** A `role` (`lecode_admin` | `client_rep` | `contractor`) vive em `profiles.role`, atribuída por admin — **nunca** escolhida pelo usuário. O cadastro força `contractor`.
- **Regras anti-viés são impostas via RLS**, não só na UI: o cliente só vê a autoavaliação, e o contratado só vê a avaliação do cliente, **após o ciclo encerrar**.
- **Editar enquanto aberto:** avaliações podem ser revisadas enquanto `cycles.status = 'open'` (RLS de `update`); travam após encerrar.
- **Score e visibilidades** nunca confiam no cliente — use views/RPC com checagem (`close_cycle`, `get_final_score`).
- O HTML em `design/` é **referência**, não código de produção — reimplemente nos padrões deste codebase.

## Ordem de implementação sugerida
1. **Aplicar as migrations prontas** em `design_handoff_performance_review/supabase/` (schema + RLS + RPC + seed) — ver o README dessa pasta.
2. **Copiar a camada de arranque** (`lib/`, `stores/`, `middleware.ts`, `app/actions/`) — tipos, clientes Supabase, helpers de acesso, guards de auth e Zustand já alinhados às migrations (ver `lib/README.md`).
3. **Aproveitar o esqueleto do App Router** (`app/(auth)/*`, `app/(app)/*`) — guards e data-fetching já fiados; falta só a UI (cada `page.tsx` tem um `TODO(ui)`). Ver `app/README.md`.
4. Auth + 3 perfis (layout já valida role no servidor).
5. Recriar os componentes de UI a partir de `design/*` (Tailwind) e plugar nos dados já buscados.
6. Formulário compartilhado + double-check; depois as três jornadas completas.

## Design
Hi-fi. Marca **verde `#00b473`**, tipografia **Space Grotesk** (UI) + **IBM Plex Mono** (labels técnicos), tema claro/escuro, i18n PT/EN/ES. Tokens completos no §6 do README do handoff — mapeie para `theme.extend` do Tailwind via CSS vars + `data-theme`/`data-density` no `<html>`.

## Decisões em aberto
Ver §10 do Plano Técnico (representante multi-cliente, troca de cliente no meio do ciclo, reabertura, auditoria/notificações, versão de formulário por ciclo). Alinhar com o time antes de assumir.
