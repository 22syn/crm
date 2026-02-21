# Cursor plugins review – demoCRM

Summary of plugins available in this workspace and how to use them to enhance the project.

---

## 1. **Supabase** (MCP + skills)

- **Status:** Enabled in `.cursor/settings.json`.
- **MCP:** `plugin-supabase-supabase` (may require `mcp_auth` in Cursor).
- **Skills:** `supabase-postgres-best-practices` – Postgres performance, RLS, indexes, schema design.

**Use in demoCRM:**

- Run migrations and index changes through the Postgres best-practices skill.
- When adding RLS or new tables, ask: “Review this migration with Supabase Postgres best practices.”
- Use the Supabase MCP (after auth) for schema/docs if the plugin exposes them.

---

## 2. **Sentry** (MCP + skills)

- **Status:** MCP server present; may need auth via `mcp_auth` for Sentry MCP tools.
- **Skills:** `sentry-setup-tracing`, `sentry-setup-logging`, `sentry-setup-metrics`, `sentry-ios-swift-setup`, `sentry-setup-ai-monitoring`, `sentry-code-review`.

**Use in demoCRM:**

- **Error monitoring:** Implemented. Uses `@sentry/react`; init in `src/sentry.ts`, ErrorBoundary in `src/main.tsx`. Set `VITE_SENTRY_DSN` in `.env` (from Sentry project settings → Client Keys). If unset, Sentry is no-op. Optional: add `@sentry/vite-plugin` and `SENTRY_AUTH_TOKEN` for source map uploads.
- **Performance:** Later, use `sentry-setup-tracing` to add `browserTracingIntegration()` and `tracesSampleRate`.
- **PRs:** Use `sentry-code-review` to address Sentry feedback on GitHub PRs.

---

## 3. **Context7** (Compound Engineering)

- **MCP:** `plugin-compound-engineering-context7`.
- **Tools:** `resolve-library-id`, `query-docs` – up-to-date docs and code examples for libraries.

**Use in demoCRM:**

- Before implementing a feature with a library, call `resolve-library-id` for that library (e.g. `react`, `supabase`, `recharts`, `@tanstack/react-query`), then `query-docs` with a specific question.
- Example: “How to invalidate queries after mutation in TanStack Query v5?” → resolve id for `@tanstack/react-query`, then query-docs.

---

## 4. **Notion** (MCP + skills)

- **MCP:** `plugin-notion-workspace-notion` (auth may be required).
- **Skills:** create-task, create-page, database-query, search, tasks-build, tasks-plan, spec-to-implementation, knowledge-capture.

**Use in demoCRM:**

- Keep product/UX specs in Notion; use `tasks-build` or `tasks-plan` to turn them into implementation steps.
- Use `create-task` for CRM-related work items; use `spec-to-implementation` to break a spec into tasks.
- Sync decisions with `knowledge-capture` (e.g. “CRM empty states” or “lead duplicate detection”).

---

## 5. **Cursor IDE Browser** (MCP)

- **MCP:** `cursor-ide-browser`.
- **Tools:** `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_fill`, `browser_take_screenshot`, etc.

**Use in demoCRM:**

- E2E-style checks: start dev server, navigate to `/leads`, snapshot, click “Add lead”, fill form, screenshot.
- Visual regression: take screenshots of Dashboard, Leads table, LeadDialog and compare over time.
- Debug UI: use snapshot to inspect DOM when a user reports a layout or interaction bug.

---

## 6. **Git + GitHub** (MCP)

- **MCP:** `user-git`, `user-github`.
- **Skills (Cursor Team Kit):** fix-ci, get-pr-comments, new-branch-and-pr, review-and-ship, loop-on-ci, fix-merge-conflicts.

**Use in demoCRM:**

- Use Git MCP for branch/commit/status; use GitHub MCP for PRs and issues.
- Before merging: use `get-pr-comments` and `review-and-ship` (or `requesting-code-review` from Superpowers).
- When CI fails: use `fix-ci` or `loop-on-ci`; for conflicts use `fix-merge-conflicts`.

---

## 7. **Superpowers** (skills)

- **Skills:** brainstorming, writing-plans, systematic-debugging, test-driven-development, verification-before-completion, receiving-code-review, using-git-worktrees, finishing-a-development-branch.

**Use in demoCRM:**

- New feature or UX change → `brainstorming` then `writing-plans`.
- Bug or flaky test → `systematic-debugging`.
- Before claiming “done” → `verification-before-completion` (run build/tests, confirm output).
- After implementation → `requesting-code-review` or `receiving-code-review` when handling feedback.

---

## 8. **Compound Engineering** (skills)

- **Skills:** frontend-design, brainstorming, git-worktree, skill-creator, document-review, dspy-ruby, etc.

**Use in demoCRM:**

- UI/UX work → `frontend-design` for non-generic, production-grade UI.
- Refining a plan doc → `document-review`.
- Isolated feature work → `git-worktree`.

---

## Quick reference

| Goal                         | Plugin / skill to use                    |
|-----------------------------|------------------------------------------|
| DB migrations, indexes, RLS | Supabase + supabase-postgres-best-practices |
| Errors in production        | Sentry (implemented)                     |
| Latest library docs         | Context7 (`resolve-library-id` → `query-docs`) |
| Specs → tasks               | Notion (tasks-plan, spec-to-implementation) |
| E2E / screenshots           | Cursor IDE Browser                       |
| PR review / CI              | GitHub + cursor-team-kit / Superpowers   |
| New feature design          | Superpowers brainstorming + writing-plans |
| UI polish                   | Compound frontend-design                 |
