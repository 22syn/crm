# CRM — Project Context

## What this is

A multi-tenant CRM demo SPA serving two organizations on one codebase:
- **CRM** (`leads` module) — furniture showroom CRM (Hebrew-language UI, lead pipeline, contracts, products)
- **הר סיני הפקות** (`ad_agency` module) — ad agency project management (clients, projects, tasks, items)

**Stack:** Vite 5 · React 18 · TypeScript · Supabase (PostgreSQL + Auth + Edge Functions) · TanStack Query v5 · React Router v6 · shadcn/ui + Radix UI · Tailwind CSS 3 · Sentry · Vercel

## Run it

```bash
bun run dev          # local dev server
bun run build        # production build
bun run test         # vitest
bun run lint         # eslint
```

**Required env vars** (copy `.env.example` → `.env.local`):
- `VITE_SUPABASE_URL` — https://fbtnhhurjwizcrmcisci.supabase.co
- `VITE_SUPABASE_PUBLISHABLE_KEY` — from Supabase dashboard
- `VITE_SUPABASE_PROJECT_ID` — `fbtnhhurjwizcrmcisci`
- `VITE_SHOPIFY_STOREFRONT_TOKEN` — optional, only for Products page

## Architecture

### Module system

Access is per-module, not global. Three modules: `leads`, `ad_agency`, `system`.

```ts
// Always use these — never use the deprecated `role` field
canAccessModule("leads")      // can user see the CRM?
isModuleAdmin("leads")        // can user edit/delete?
canAccessModule("ad_agency")  // can user see the ad agency section?
```

DB: `user_module_roles(user_id, module, role)` + `profiles.super_admin`.
Helpers: `has_module_access()`, `has_module_admin()`, `has_crm_access()`, `is_super_admin()`.

**Users:**
- `kobi@leadslords.com` — super admin (all modules)
- `ori@harsinai.co.il` — ad_agency user only (locked via migration)

### Routing

```
/                    → RedirectToDefault (leads→/dashboard, ad_agency→/ad-agency, system→/settings)
/auth                → Auth (public)
/dashboard           → Dashboard
/leads, /leads/:id   → Leads, LeadDetail
/deals               → Deals
/contracts           → Quotes (renamed; /quotes redirects here)
/contracts/approve/:id → QuoteApproval (public token-based)
/products            → Products (Shopify-backed)
/suppliers           → Suppliers
/customers           → Customers
/design-requests     → DesignRequests
/automations         → Automations (stub)
/settings            → Settings (member + module permission management)
/ad-agency/...       → full ad agency sub-app
```

### Entity pattern (shared shell)

Leads, Deals, Contracts, DesignRequests all use the same shell:
- `EntityPageShell` — toolbar + view toggle (table/kanban)
- `EntityKanban` + `EntityKanbanColumn` — drag-and-drop kanban
- `EntityToolbar` — filter/sort/view controls

When adding a new list-based page, extend this pattern rather than building a new one.

### Data fetching

TanStack Query v5 throughout. Keys centralized in `src/lib/query-keys.ts`.
`staleTime: 60_000`, `refetchOnWindowFocus: false`.
Mutations must call `queryClient.invalidateQueries()` after success.

### Auth flow

1. `AuthProvider` wraps the app — loads session, profiles.super_admin, module roles in parallel on auth state change
2. `ProtectedLayout` gates all routes
3. `GlobalCommandPalette` only renders when session exists

### Edge functions

- `website-lead` — public webhook (no JWT), creates leads from website form
- `send-quote` — public (no JWT), sends quote PDF via email

## Core Rules (never violate)

1. **Never use `role` from AuthContext** — it's deprecated. Use `canAccessModule()` / `isModuleAdmin()`.
2. **RLS is always on** — every new table must have `ENABLE ROW LEVEL SECURITY` + policies using `has_module_access()` or `has_module_admin()`.
3. **No orders/documents tables** — they were dropped. The app uses `quotes` + `quote_items`.
4. **Module isolation** — ad_agency pages must check `canAccessModule("ad_agency")`. Never mix module data.
5. **Use EntityPageShell** for new list pages — don't build custom table/kanban layouts from scratch.
6. **Query keys from `query-keys.ts`** — don't hardcode query key strings inline.
7. **Lint before done** — `bun run lint` must pass before marking any task complete.

## Deployment

- **Vercel** project: `democrm` (ID: `prj_lFTyxmM8gO9H0nF8DHm71fOlGSUV`, org: `team_0TjG4YuI36Nck2PCBHYyUIvb`)
- **Supabase** project: `fbtnhhurjwizcrmcisci`
- Migrations: `supabase/migrations/` — apply via Supabase CLI or dashboard
- Error monitoring: Sentry (initialized in `src/sentry.ts`, `VITE_SENTRY_DSN` env var)

## Active work

- **`visual-redesign` worktree** — `.worktrees/visual-redesign/` — visual overhaul branch (designs in `.pen` files)

## Reference

- [Architecture deep-dive](knowledge/architecture.md) — component patterns, ad_agency module, hooks
- [Database & schema](knowledge/database.md) — all tables, enums, RLS, migrations history
- [Standards & conventions](knowledge/standards.md) — coding rules, patterns to follow/avoid

## Folder map

```
CRM/
├── .claude/
│   ├── CLAUDE.md              ← this file
│   ├── memory.md              ← decisions and history across sessions
│   └── knowledge/
│       ├── architecture.md
│       ├── database.md
│       └── standards.md
├── src/
│   ├── App.tsx                ← routes + providers
│   ├── pages/                 ← one file per route
│   ├── components/            ← grouped by domain (leads/, deals/, ad-agency/, etc.)
│   │   ├── entity-page/       ← shared EntityPageShell, EntityKanban
│   │   ├── layout/            ← DashboardLayout, DashboardSidebar, ProtectedLayout
│   │   └── ui/                ← shadcn primitives (don't modify)
│   ├── contexts/              ← AuthContext, DashboardContext
│   ├── hooks/                 ← useLeads, useCrmTeam, useCompanySettings, etc.
│   ├── integrations/supabase/ ← client.ts + generated types.ts
│   ├── lib/                   ← utils, query-keys, escapeIlike, exportBudgetToExcel
│   └── utils/                 ← leadScore, leadSort, leadStages, sourceIcons
├── supabase/
│   ├── migrations/            ← SQL migrations (chronological)
│   └── functions/             ← Edge functions (website-lead, send-quote)
└── .worktrees/visual-redesign/ ← active redesign branch
```

**When adding a new file:** update the index and folder map above on the same day.
