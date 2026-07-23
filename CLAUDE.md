# CLAUDE.md — crm

## Purpose

Custom CRM for Xsheva — manages leads, deals, quotes, and ad-agency workflow.
Single-page React app backed by Supabase. Product docs live in Obsidian
`02-projects/hadaryaCRM` (rules, architecture, plans).

## Stack

- **Frontend:** Vite + React 18 + TypeScript.
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives), lucide-react, recharts,
  `next-themes`, sonner.
- **Data:** Supabase (`@supabase/supabase-js`), TanStack Query, `pg`.
- **Forms/validation:** react-hook-form + zod (`@hookform/resolvers`).
- **Routing:** react-router-dom. **Errors:** Sentry. **Tests:** Vitest + Testing Library.
- Deployed on Vercel (`vercel.json`, `.vercel/`).

## Structure

- `src/pages/` — route-level views. `src/components/` — UI + shadcn components.
- `src/integrations/supabase/` — `client.ts` and generated `types.ts`.
- `src/contexts/`, `src/hooks/`, `src/lib/`, `src/data/`, `src/utils/`, `src/sentry.ts`.
- `supabase/` — `migrations/`, `functions/` (edge functions), `config.toml`.
- `scripts/` — data migration & seeding (`migrate-data.ts`, `run-seed-migration.js`, stitch tools).
- `index.html`, `vite.config.ts`, `tailwind.config.ts`, `components.json` (shadcn).

## Run / dev

```sh
npm i
npm run dev        # vite dev server
npm run build      # vite build
npm run lint       # eslint
npm run preview    # preview built app
npm run test       # vitest run

# data/admin utilities:
npm run migrate:data     # tsx scripts/migrate-data.ts
npm run seed:run         # run seed migration
npm run user:add         # add a user (uses .env.local)
```

## Conventions / notes

- Environment config in `.env.local` (see `.env.example`); Supabase keys required.
- Supabase is the backend — schema changes go through `supabase/migrations/`.
- Package name in `package.json` is `vite_react_shadcn_ts` (scaffold origin); the project is the Xsheva CRM.
