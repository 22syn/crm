# Tech Stack Evaluation — hadaryaCRM

**Date:** 2025-02-21  
**Scope:** Fitness for current needs — productivity, maintainability, scalability.

---

## Current Stack Summary

| Layer | Tech |
|-------|------|
| **Frontend** | React 18, TypeScript, Vite, React Router |
| **UI** | Tailwind CSS, shadcn/ui (Radix), Lucide icons |
| **Data** | Supabase (Postgres, Auth, Storage, Edge Functions) |
| **State** | TanStack Query, React Hook Form, Zod |
| **Ops** | Sentry, Supabase migrations, Maestro (config present) |
| **Misc** | Recharts, @dnd-kit (Kanban), date-fns, Sonner |

---

## 1. Frontend Layer

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| **Productivity** | Strong | Vite + SWC is fast; shadcn/Radix covers most UI needs; TanStack Query + React Hook Form + Zod are used consistently. |
| **Maintainability** | Good | TypeScript throughout, clear patterns, `@/` alias. Some page components (e.g. `Leads.tsx` ~880 lines) are large and could benefit from splitting. |
| **Scalability** | Adequate | No route-level lazy loading yet; bundle will grow with features. Acceptable for current scale. |

**Strengths:**
- TanStack Query used consistently across Leads, Quotes, Customers, Deals, DesignRequests, dashboard.
- Reusable hooks: `useTablePreferences`, `useCrmTeam`.
- Composable Radix primitives for UI.

**Risks:**
- `Leads.tsx` mixes many concerns; consider refactor later.
- No route-level code splitting (React.lazy); initial bundle may grow.

---

## 2. Backend / Data Layer (Supabase)

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| **Productivity** | Strong | Auth + DB + Storage + Edge Functions in one place; migrations; generated types. |
| **Maintainability** | Good | Migrations versioned; types from DB; RLS managed in migrations. |
| **Scalability** | Adequate | Postgres scales; Supabase limits are the main ceiling for very high load. |

**Strengths:**
- Single platform for auth, DB, storage, Edge Functions (e.g. `send-quote`).
- Migrations + type generation keep schema and frontend in sync.
- RLS used (e.g. `user_table_preferences` per user).

**Gaps:**
- Leads has 300ms debounce ✓. Customers and GlobalCommandPalette still refetch on every keystroke.
- Some sorting client-side on 50-row pages; server-side sort needed when data grows.

---

## 3. Tooling & Ops

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| **Productivity** | Good | ESLint, Sentry, Supabase MCP; scripts for seed/migrate. |
| **Maintainability** | Needs update | `maestro.config.json` still says Firebase; docs may be outdated. |
| **Scalability** | Good | Sentry, Supabase infra suitable for growth. |

**Strengths:**
- Sentry for errors; traces include Supabase URLs.
- Supabase MCP configured for migrations.
- Seed and migration scripts documented in `scripts/README.md`.

**Gaps:**
- `maestro.config.json` lists Firebase (Firestore, Cloud Functions, etc.) — project uses Supabase.
- No Vitest/Playwright in `package.json`; Maestro config mentions Playwright.

---

## 4. Cross-Cutting Concerns

| Concern | Status | Notes |
|---------|--------|-------|
| **State** | Good | TanStack Query for server state; React Hook Form for forms; minimal global store. |
| **Forms & validation** | Good | React Hook Form + Zod + @hookform/resolvers used consistently. |
| **Real-time** | Unused | Supabase real-time available but not used; fine for current flows. |

---

## Overall Verdict

| Dimension | Verdict |
|-----------|---------|
| **Productivity** | 8/10 — Modern stack, fast iteration. |
| **Maintainability** | 7/10 — Solid patterns; some large components and outdated docs. |
| **Scalability** | 7/10 — OK for CRM scale; watch search/sort and bundle as you grow. |

---

## Quick Wins (Prioritized)

1. **Search debounce (300ms)** — Leads already has it. Add debounce to Customers and GlobalCommandPalette.
2. **Fix maestro.config.json** — Update to Supabase (or remove Maestro reference if not used).
3. **Split Leads.tsx** — Extract subcomponents to reduce size and improve maintainability.

---

## Future (When Needed)

- Route-level lazy loading for code splitting.
- Server-side sorting for larger lists (hundreds+ rows).
- Supabase real-time for shared pipeline views (optional).
