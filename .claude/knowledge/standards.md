# CRM — Standards & Conventions

## TypeScript

- Strict mode on. No `any` without a comment explaining why.
- Use `type` for union/intersection types, `interface` for object shapes that may be extended.
- All Supabase query results should use generated types from `src/integrations/supabase/types.ts`.
- Prefer explicit return types on exported functions.

## React patterns

- **Lazy-load all pages** — `React.lazy()` + add to the `Suspense` block in `App.tsx`.
- **Named exports** for components; default export only at page level.
- **No prop drilling beyond 2 levels** — use context or TanStack Query.
- **Hooks file per domain** — complex data logic goes in `src/hooks/`, not inline in components.
- **`use-mobile`** for responsive breakpoints — don't use CSS media queries in JS.

## Data fetching

- All server state via TanStack Query v5.
- Query keys must come from `src/lib/query-keys.ts` — no inline strings.
- Use `useMutation` for writes; always invalidate related queries on success.
- Error states: show a toast (sonner) + log to Sentry. Don't silently swallow errors.
- Loading states: use skeleton components or `Loader2` spinner, not blank screens.

## Supabase

- Use `supabase` client from `src/integrations/supabase/client.ts` — never instantiate a new client.
- RLS handles access control — don't add application-level permission checks as a substitute.
- Use `.ilike()` with `escapeIlike()` from `src/lib/escapeIlike.ts` for search queries (prevents injection).
- Migrations: timestamped files in `supabase/migrations/` — one concern per file.

## Styling

- Tailwind utility classes only — no custom CSS files except `src/index.css` (globals + CSS vars).
- Follow shadcn/ui conventions for component variants (`cva` + `cn` from `src/lib/utils.ts`).
- Dark mode: `dark:` prefix — always pair light/dark values.
- Don't modify files in `src/components/ui/` — use shadcn CLI to add/update them.
- Hebrew text: use `dir="rtl"` where needed; RTL layout is per-component, not global.

## Forms

- All forms use `react-hook-form` + `@hookform/resolvers` + `zod` for validation.
- Put zod schemas at the top of the file or in a co-located `schema.ts`.
- Error messages in Hebrew for user-facing forms; English for internal/admin forms.

## Testing

- Vitest for unit tests. Test files in `src/lib/__tests__/` or co-located `*.test.ts`.
- Test pure logic functions (utils, validators, sort/score functions).
- Don't test Supabase calls directly — mock the client at the module boundary.
- Run: `bun run test`

## File naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (prefix `use`)
- Utils/lib: `camelCase.ts`
- Pages: `PascalCase.tsx` (matches route)
- Test files: `*.test.ts` or `*.test.tsx`

## Git & branches

- Feature branches off `main`
- Use worktrees for large isolated work (e.g., `visual-redesign` → `.worktrees/visual-redesign/`)
- Run lint + test before merging: `bun run lint && bun run test`

## What NOT to do

- ❌ Use `role` from `AuthContext` — deprecated, use `canAccessModule()` / `isModuleAdmin()`
- ❌ Create a new table without RLS
- ❌ Reference `orders`, `order_items`, or `documents` tables — they were dropped
- ❌ Hardcode query key strings — use `query-keys.ts`
- ❌ Build a custom table/kanban for a list page — use `EntityPageShell`
- ❌ Modify `src/components/ui/` files manually — use shadcn CLI
- ❌ Use search strings directly in `.ilike()` — wrap with `escapeIlike()` first

## Scripts reference

```bash
bun run migrate:data        # tsx scripts/migrate-data.ts
bun run user:add            # node --env-file=.env.local scripts/add-user.js
bun run stitch:create-pages # tsx scripts/create-stitch-pages.ts
bun run stitch:run          # tsx scripts/run-stitch-prompts.ts
```
