# App Router — esqueleto de rotas

Arquivos `layout.tsx` / `page.tsx` com **guards de perfil e data-fetching já fiados**. A UI é o que falta: cada `page.tsx` termina com um `TODO(ui)` apontando o componente do protótipo a recriar (em `../design/*`).

## Árvore

```
app/
├─ layout.tsx                      root (fontes, globals, data-theme/density)
├─ page.tsx                        '/' → login ou home do perfil
├─ globals.css                     (criar) Tailwind base + tokens de design/styles.css
├─ auth/callback/route.ts          troca code por sessão (magic-link/OAuth)
│
├─ (auth)/                         público
│  ├─ login/page.tsx               LoginForm (sem seletor de perfil!)
│  ├─ signup/page.tsx              SignupForm (perfil inicial = contractor)
│  └─ recover/page.tsx             RecoverForm
│
└─ (app)/                          autenticado
   ├─ layout.tsx                   getSessionProfile → AppShell(session)
   ├─ admin/                       guard: requireRole('lecode_admin')
   │  ├─ page.tsx                  visão geral (ciclo ativo, progresso, decisões)
   │  ├─ cycles/page.tsx           abrir/encerrar ciclo (Server Actions + confirm)
   │  ├─ contractors/page.tsx      lista + último score
   │  ├─ contractors/[id]/page.tsx detalhe + histórico + ReviewDetail
   │  ├─ clients/page.tsx          clientes
   │  └─ form/page.tsx             editor do formulário
   ├─ client/                      guard: requireRole('client_rep')
   │  ├─ team/page.tsx             minha equipe (RLS filtra alocados)
   │  ├─ team/[contractorId]/evaluate/page.tsx   avaliar (pré-preenche; editar enquanto aberto)
   │  └─ history/page.tsx          histórico por ciclo (self só após encerrar)
   └─ contractor/                  guard: requireRole('contractor')
      ├─ page.tsx                  início (CTA autoavaliação + evolução)
      ├─ self-review/page.tsx      autoavaliação (editar enquanto aberto)
      └─ history/page.tsx          histórico (review do cliente só após encerrar)
```

## Como completar
1. Crie os componentes em `components/` recriando o protótipo (`design/*.jsx`) com Tailwind — começar por `AppShell`, `EvaluationForm`, `ReviewDetail`, `ScoreChip`, `Radar`, `ConfirmDialog`, `auth/*`.
2. Troque cada bloco `<pre>{JSON.stringify(...)}</pre>` pela UI, passando os dados já buscados.
3. Mutações: botões em Client Components chamam as Server Actions de `app/actions/reviews.ts` (`useTransition` + double-check antes).
4. i18n: reaproveite os dicionários PT/EN/ES de `design/i18n.jsx`.

## Por que os guards são "só UX"
`requireRole` redireciona cedo para uma boa experiência, mas **a barreira real é a RLS**: mesmo que alguém force `/admin`, os helpers de `lib/data/*` só retornam o que o JWT daquele usuário pode ver. Nunca dependa do guard para proteger dados.
