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

## Tools for UI and web work

Registry of installed tools: `~/cabinet/knowledge/reference/capabilities.md`. shadcn/ui + Radix stays the default; UI text is Hebrew / RTL.

| Task | Use |
|---|---|
| HTML, CSS or client-side JS (forms, dialogs, scroll, layout) | skill `modern-web-guidance` first. `npx modern-web-guidance@latest legacy-scan src` reports old patterns (first run 2026-11-17: 16 minor items) |
| Product UI: data tables, forms, dashboards | `ui-ux-pro-max`. Not `design-taste-frontend`, that one is for marketing pages |
| Keyboard, focus or popover behaviour Radix does not cover | `ui-sdk` (beta 0.1.0-beta.1, installed 2026-11-17, untried): use on one new component first |
| Prove a UI change works | Playwright, with a screenshot |
| Any library or SDK question | Context7 |
