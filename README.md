# LeCode · Performance Review

Internal platform for evaluating LeCode contractors (developers and project managers) across periodic review cycles.

Built with **Next.js 16 · TypeScript · Tailwind CSS · Zustand · Supabase**.

---

## Overview

Each contractor receives two evaluations per cycle:

- **Self-review** (30% weight) — filled out by the contractor
- **Client review** (70% weight) — filled out by the client representative

**Final Score = self × 0.30 + client × 0.70**, calculated across 5 dimensions on a 1–5 scale. The score drives a Decision Guide (promotion, PDP, recovery plan).

Anti-bias rule: reviewers and reviewees cannot see each other's evaluations until the cycle closes. This is enforced at the database level via RLS, not just in the UI.

### Roles

| Role | DB value | Access |
|---|---|---|
| LeCode Manager | `lecode_admin` | Manages contractors/clients, form, cycles, views all scores |
| Client Representative | `client_rep` | Evaluates allocated contractors, views their cycle history |
| LeCode Contractor | `contractor` | Submits self-review, views own history and evolution |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI + shadcn/ui |
| Icons | Lucide React |
| State (client) | Zustand 5 |
| Backend / Auth / DB | Supabase (Postgres + Auth + RLS) |

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- Supabase CLI (for running migrations)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/lecode-dev/lecode-performance-review.git
cd lecode-performance-review
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp design_handoff_performance_review/.env.example .env.local
```

Open `.env.local` and add your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

You can find these in your Supabase dashboard under **Settings → API**.

### 4. Run database migrations

Link your local project to Supabase and apply the migrations:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This will apply the following migrations in order:

| File | What it does |
|---|---|
| `0001_schema.sql` | Core tables: profiles, clients, contractors, cycles, reviews |
| `0002_rls.sql` | Row-Level Security policies (anti-bias rules) |
| `0003_seed.sql` | Default form (5 dimensions × 5 questions) and sample data |
| `0004_rpc.sql` | Stored procedures: `close_cycle`, `submit_review`, `get_final_score` |

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
├── app/
│   ├── (auth)/             # Login, signup, password recovery
│   ├── (app)/
│   │   ├── admin/          # LeCode Manager views
│   │   ├── client/         # Client Representative views
│   │   └── contractor/     # Contractor views
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/             # AppShell, Sidebar
│   ├── lecode/             # Domain-specific components
│   ├── review/             # ReviewForm, ScoreCard, StatusBadge
│   └── ui/                 # Base shadcn/ui components
├── lib/
│   ├── supabase/           # Browser + server clients
│   ├── domain.ts           # Score calculation, constants
│   └── i18n.tsx            # PT / EN / ES translations
├── stores/                 # Zustand stores (session, review draft, UI prefs)
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # SQL migrations
└── middleware.ts           # Auth guard + role-based routing
```

---

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Authentication

Sign up creates a `contractor` profile by default. Role elevation to `client_rep` or `lecode_admin` must be done by an admin directly in the database or via the admin panel.

Supabase handles email/password auth. Password recovery is built in via the `/recover` route.

---

## Security Notes

- All authorization rules are enforced via **Supabase RLS policies** — the frontend visibility rules are a UX layer only.
- Never commit `.env.local` or expose your `SUPABASE_SERVICE_ROLE_KEY` to the client.
- The `supabase/.temp/` directory is git-ignored as it contains local project references.
