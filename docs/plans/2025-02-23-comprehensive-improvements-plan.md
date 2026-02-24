# Comprehensive Improvements + Modular Permissions — Unified Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** (1) Address all findings from code review, security, architecture, simplicity, performance, and frontend. (2) Implement modular permissions (Super-Admin, per-module admin/user for לידים, משרד פרסום, הגדרות מערכת).

**Architecture:** Phased delivery: security fixes first, then architecture (ProtectedLayout, QueryClient), then modular permissions (DB migration, RLS, AuthContext, Sidebar, Settings), then refactors and polish.

**Tech Stack:** React, TypeScript, Vite, TanStack Query, Supabase (Edge Functions, Postgres, RLS)

**Sources:**
- Code review (46f1ac86), security-sentinel (12768a08, 31921a1c), code-simplicity-reviewer (740492a9), frontend-design (166f2c21)
- Modular permissions (31921a1c): `docs/plans/2025-02-23-modular-permissions-design.md`, `docs/plans/2025-02-23-modular-permissions-implementation.md`

**Note:** GlobalCommandPalette already loads only when authenticated (AuthAwareCommandPalette in App.tsx) — no task needed.

---

## Phase 1: Critical Security & Code Fixes

### Task 1: Remove .env from git tracking

**Files:**
- Modify: git index (remove `.env`)
- Verify: `.gitignore` (already contains `.env`)

**Step 1: Stop tracking .env**

```bash
git rm --cached .env
```

Expected: `rm '.env'` — file removed from index, remains on disk.

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "fix: stop tracking .env (rotate keys if repo was pushed)"
```

**Step 3: Rotate secrets (manual)**

If repo was ever pushed or shared: rotate `SERVICE_ROLE_KEY`, Supabase keys, and any tokens in .env. Document in README or `.env.example`.

---

### Task 2: Fix NaN from production fee input

**Files:**
- Modify: `src/components/ad-agency/ProjectDetailTabs.tsx:248-251`

**Step 1: Implement the fix**

Replace:

```tsx
onBlur={(e) => {
  const v = parseFloat(e.target.value) ?? 15;
  if (v !== productionFeePct) projectUpdateMutation.mutate({ production_fee_percent: v });
}}
```

With:

```tsx
onBlur={(e) => {
  const v = parseFloat(e.target.value);
  if (!Number.isNaN(v) && v !== productionFeePct) {
    projectUpdateMutation.mutate({ production_fee_percent: v });
  }
}}
```

**Step 2: Verify**

1. `npm run build` — passes
2. Manually: open project detail, clear "עמלת הפקה (%)", blur. No mutation. Enter 15, blur. Update succeeds.

**Step 3: Commit**

```bash
git add src/components/ad-agency/ProjectDetailTabs.tsx
git commit -m "fix: prevent NaN from production fee input on blur"
```

---

### Task 3: Escape HTML in send-quote email (XSS)

**Files:**
- Modify: `supabase/functions/send-quote/index.ts`

**Step 1: Add escapeHtml helper**

After `corsHeaders` (around line 11), add:

```ts
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

**Step 2: Escape itemsHtml (lines 90-97)**

Replace:

```ts
const itemsHtml = data.items.map(item => `
  <tr>
    <td style="...">${item.title}</td>
```

With:

```ts
const itemsHtml = data.items.map(item => `
  <tr>
    <td style="padding: 12px 8px; border-top: 1px solid #2A2A2A; color: #B7B7B7; font-size: 11px; line-height: 1.6;">${escapeHtml(item.title)}</td>
    <td style="padding: 12px 8px; border-top: 1px solid #2A2A2A; text-align: center; color: #B7B7B7; font-size: 11px;">${item.quantity}</td>
    <td style="padding: 12px 8px; border-top: 1px solid #2A2A2A; text-align: right; color: #FFFFFF; font-size: 12px; font-weight: 500;"><span dir="ltr">${formatPrice(item.unit_price)}</span></td>
    <td style="padding: 12px 8px; border-top: 1px solid #2A2A2A; text-align: right; color: #FFFFFF; font-size: 12px; font-weight: 500;"><span dir="ltr">${formatPrice(item.total_price)}</span></td>
  </tr>
`).join('');
```

**Step 3: Escape all user-controlled fields in emailHtml**

Apply these exact replacements in `emailHtml`:

| Line | Replace | With |
|------|---------|------|
| 127 | `${headerSubline}` | `${escapeHtml(String(headerSubline ?? ""))}` |
| 129 | `${companyName}` | `${escapeHtml(companyName)}` |
| 135 | customer + address | `${escapeHtml(data.customerName)}${data.customerAddress ? \` · \${escapeHtml(data.customerAddress)}\` : ""}` |
| 165 | `${data.paymentTerms}` | `${escapeHtml(data.paymentTerms ?? "")}` |
| 167 | `${data.notes}` | `${escapeHtml(data.notes ?? "")}` |
| 176 | footer `${companyName}` | `${escapeHtml(companyName)}` |

Example for line 135:
```ts
<p class="body">${escapeHtml(data.customerName)}${data.customerAddress ? ` · ${escapeHtml(data.customerAddress)}` : ""}</p>
```

**Step 4: Verify**

```bash
npm run build
```

Optional: send test quote with `<script>alert(1)</script>` in a field; confirm escaped in email source.

**Step 5: Commit**

```bash
git add supabase/functions/send-quote/index.ts
git commit -m "fix: escape user-controlled HTML in send-quote email to prevent XSS"
```

---

### Task 4: Use escapeIlike in LeadDialog phone search

**Files:**
- Modify: `src/components/leads/LeadDialog.tsx`

**Step 1: Add import**

```ts
import { escapeIlike } from "@/lib/escapeIlike";
```

**Step 2: Wrap digits in escapeIlike**

Find the `.ilike("customer_phone", ...)` call and change:

```ts
.ilike("customer_phone", `%${digits}%`)
```

To:

```ts
.ilike("customer_phone", `%${escapeIlike(digits)}%`)
```

**Step 3: Verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/components/leads/LeadDialog.tsx
git commit -m "fix: escape ILIKE wildcards in LeadDialog phone search"
```

---

### Task 5: Fix misleading client.ts comment

**Files:**
- Modify: `src/integrations/supabase/client.ts`

**Step 1: Update comment**

Replace the auto-generated claim with:

```ts
// Supabase client. Uses VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
```

**Step 2: Commit**

```bash
git add src/integrations/supabase/client.ts
git commit -m "docs: fix misleading auto-generated comment in client.ts"
```

---

## Phase 2: Architecture & Route Protection

### Task 6: Add layout route for protected pages

**Files:**
- Create: `src/components/layout/ProtectedLayout.tsx`
- Modify: `src/App.tsx`

**Step 1: Create ProtectedLayout**

Create `src/components/layout/ProtectedLayout.tsx`:

```tsx
import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";

export function ProtectedLayout() {
  const { session, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900 p-4">
        <p className="text-zinc-600 dark:text-zinc-400">Access Pending</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
```

**Step 2: Refactor App.tsx routes**

Wrap all protected routes under a layout:

```tsx
<Route element={<ProtectedLayout />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/leads" element={<Leads />} />
  {/* ... all other protected routes ... */}
</Route>
<Route path="/auth" element={<Auth />} />
<Route path="*" element={<NotFound />} />
```

Move NotFound inside `ProtectedLayout` so unauthenticated users hitting `/foo` are redirected to `/auth`. Or keep NotFound outside and have it check auth and redirect—per security review.

**Step 3: Remove DashboardLayout from individual pages**

Each page that currently wraps with `DashboardLayout` should be simplified to just render content; ProtectedLayout provides the shell. Audit: `Leads.tsx`, `Dashboard.tsx`, etc. Remove the `DashboardLayout` wrapper from each.

**Step 4: Verify**

`npm run build` and manually: visit `/dashboard` unauthenticated → redirect to `/auth`. Visit `/foo` unauthenticated → redirect or 404 per your choice.

**Step 5: Commit**

```bash
git add src/components/layout/ProtectedLayout.tsx src/App.tsx src/pages/*.tsx
git commit -m "feat: centralize route protection via ProtectedLayout"
```

---

### Task 7: Configure QueryClient defaults

**Files:**
- Modify: `src/App.tsx:33`

**Step 1: Add default options**

Replace:

```tsx
const queryClient = new QueryClient();
```

With:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "perf: configure QueryClient staleTime and refetch defaults"
```

---

## Phase 2.5: Modular Permissions

**Design:** `docs/plans/2025-02-23-modular-permissions-design.md`  
**Detailed steps:** `docs/plans/2025-02-23-modular-permissions-implementation.md`

### Summary

| Task | Description |
|------|-------------|
| **A1** | Migration: `profiles.super_admin`, `user_module_roles`, migrate from `user_roles` |
| **A2** | Migration: `is_super_admin`, `has_module_access`, `has_module_admin`, update `has_crm_access` |
| **A3** | RLS: leads module (SELECT/DELETE by module) |
| **A4** | RLS: ad_agency, system modules |
| **A5** | Migration: drop `user_roles` (after Phase 2.5 frontend done) |
| **A6** | AuthContext: `moduleRoles`, `superAdmin`, `canAccessModule`, `isModuleAdmin` |
| **A7** | DashboardSidebar: filter items by `canAccessModule` |
| **A8** | Settings: restrict by system admin, add module-role management UI |
| **A9** | Pages: replace `role` checks with `isModuleAdmin(module)` |
| **A10** | scripts/add-user.js, send-quote: use `user_module_roles` |
| **A11** | Regenerate Supabase types after migrations |
| **A12** | (Optional) RLS: leads user = only `assigned_to` |

**ProtectedLayout (Task 6):** When implementing, use `role` for "Access Pending" initially. After A6, update to: `hasAnyModuleAccess` (user has at least one module) or keep `role` derived from moduleRoles for compat.

**Order:** Run A1–A4 (DB), then A6–A10 (frontend), then A5 (drop user_roles), then A11.

---

## Phase 3: Code Simplicity & Constants

### Task 8: Centralize ad-agency status constants

**Files:**
- Create: `src/lib/adAgencyStatuses.ts`
- Modify: `src/components/ad-agency/ProjectDialog.tsx`, `ProjectFilters.tsx`, `ProjectTable.tsx`, `ProjectCard.tsx`, `AdAgencyClientDetail.tsx`, `TaskFilters.tsx`, `TaskTable.tsx`, `ProjectTasksSection.tsx`, `AdAgencyTasks.tsx`

**Step 1: Create constants file**

Create `src/lib/adAgencyStatuses.ts`:

```ts
export const PROJECT_STATUS_OPTIONS = [
  { value: "draft", label: "טיוטה" },
  { value: "waiting_for_approval", label: "ממתין לאישור" },
  { value: "planning", label: "תכנון" },
  { value: "execution", label: "ביצוע" },
  { value: "collection", label: "גבייה" },
  { value: "completed", label: "הושלם" },
  { value: "cancelled", label: "בוטל" },
] as const;

export const PROJECT_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  PROJECT_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  waiting_for_approval: "bg-amber-100 text-amber-800",
  planning: "bg-blue-100 text-blue-800",
  execution: "bg-emerald-100 text-emerald-800",
  collection: "bg-orange-100 text-orange-800",
  completed: "bg-zinc-200 text-zinc-700",
  cancelled: "bg-red-100 text-red-800",
};

export const TASK_STATUS_OPTIONS = [
  { value: "todo", label: "לעשות" },
  { value: "in_progress", label: "בביצוע" },
  { value: "review", label: "סקירה" },
  { value: "done", label: "הושלם" },
] as const;

export const TASK_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  TASK_STATUS_OPTIONS.map((o) => [o.value, o.label])
);
```

**Step 2: Update all consumers**

In each file, remove local `STATUS_OPTIONS`, `STATUS_LABELS`, `STATUS_COLORS`, `TASK_STATUS_OPTIONS`, etc. and import from `@/lib/adAgencyStatuses`.

**Step 3: Commit**

```bash
git add src/lib/adAgencyStatuses.ts src/components/ad-agency/*.tsx
git commit -m "refactor: centralize ad-agency status constants"
```

---

### Task 9: Extract rowTotal helper

**Files:**
- Create: `src/lib/projectItemPrice.ts`
- Modify: `src/pages/ad-agency/AdAgencyDashboard.tsx`, `src/pages/ad-agency/AdAgencyProjectDetail.tsx`, `src/components/ad-agency/ProjectDetailTabs.tsx`, `src/components/ad-agency/ProjectItemsSection.tsx`, `src/components/ad-agency/ProjectQuoteBuilder.tsx`

**Step 1: Create helper**

Create `src/lib/projectItemPrice.ts`:

```ts
export function rowTotal(
  price: number,
  qty: number,
  days: number = 1,
  prepDays: number = 0,
  extras: number = 0
): number {
  return price * qty * days * (1 + prepDays) + extras;
}
```

**Step 2: Replace inline formula**

In each consumer, replace the formula `price * qty * (days ?? 1) * (1 + (prepDays ?? 0)) + (extras ?? 0)` with `rowTotal(price, qty, days ?? 1, prepDays ?? 0, extras ?? 0)`.

**Step 3: Commit**

```bash
git add src/lib/projectItemPrice.ts src/pages/ad-agency/*.tsx src/components/ad-agency/*.tsx
git commit -m "refactor: extract rowTotal helper for project item pricing"
```

---

### Task 10: Remove unused renderExtra from EntityToolbar

**Files:**
- Modify: `src/components/entity-page/EntityToolbar.tsx`

**Step 1: Remove renderExtra prop and usage**

Delete the `renderExtra` prop from the component signature and remove any `{renderExtra?.()}` or similar usage inside the component.

**Step 2: Verify**

```bash
npm run build
rg "renderExtra" src/
```

Expected: no matches after removal.

**Step 3: Commit**

```bash
git add src/components/entity-page/EntityToolbar.tsx
git commit -m "refactor: remove unused renderExtra from EntityToolbar"
```

---

## Phase 4: Performance

### Task 11: Lazy-load exportBudgetToExcel

**Files:**
- Modify: `src/pages/ad-agency/AdAgencyProjectDetail.tsx`

**Step 1: Replace static import with dynamic import**

Find the export button handler. Replace:

```ts
import { exportBudgetToExcel } from "@/lib/exportBudgetToExcel";
// ...
const handleExportExcel = async () => {
  await exportBudgetToExcel({ ... });
};
```

With:

```ts
const handleExportExcel = async () => {
  const { exportBudgetToExcel } = await import("@/lib/exportBudgetToExcel");
  await exportBudgetToExcel({ ... });
};
```

Remove the top-level `import { exportBudgetToExcel }` if no longer needed.

**Step 2: Verify**

`npm run build` and check `dist/` chunk sizes. Project detail chunk should shrink (ExcelJS no longer in main bundle).

**Step 3: Commit**

```bash
git add src/pages/ad-agency/AdAgencyProjectDetail.tsx
git commit -m "perf: lazy-load exportBudgetToExcel to reduce project detail chunk"
```

---

## Phase 5: Frontend Quick Wins (Optional)

### Task 12: Add background grain to body

**Files:**
- Modify: `src/index.css`

**Step 1: Add noise overlay**

Add a subtle SVG grain filter and apply to body (or main content wrapper). Example:

```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  z-index: 9999;
}
```

Adjust opacity (e.g. 0.02–0.05) for subtle effect.

**Step 2: Commit**

```bash
git add src/index.css
git commit -m "style: add subtle background grain"
```

---

### Task 13: Update accent color (non-purple)

**Files:**
- Modify: `src/index.css` (or wherever `--accent-action` is defined)

**Step 1: Change accent hue**

Replace purple accent (e.g. `262 55% 50%`) with a brand-specific choice, e.g. teal `175 60% 45%` or coral `12 75% 55%`.

**Step 2: Commit**

```bash
git add src/index.css
git commit -m "style: update accent color for brand differentiation"
```

---

## Phase 6: Regenerate Supabase Types (when migrations applied)

### Task 14: Regenerate types and remove casts

**Files:**
- Modify: `src/integrations/supabase/types.ts`
- Modify: `src/components/ad-agency/ClientDialog.tsx`, `ItemTable.tsx`

**Step 1: Regenerate types**

```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

Or `--project-id <REF>` if using remote.

**Step 2: Remove unsafe casts**

- `ClientDialog.tsx`: remove `(client as { payment_terms?: string | null })` if `payment_terms` is in types
- `ItemTable.tsx`: remove `(item as OpItem & { section_id?: string | null })` if `section_id` is in types

**Step 3: Commit**

```bash
git add src/integrations/supabase/types.ts src/components/ad-agency/ClientDialog.tsx src/components/ad-agency/ItemTable.tsx
git commit -m "chore: regenerate Supabase types and remove unsafe casts"
```

---

## Verification Checklist

- [ ] Phase 1 (Tasks 1–5): Security and critical code fixes
- [ ] Phase 2 (Tasks 6–7): Route protection, QueryClient
- [ ] Phase 2.5 (Tasks A1–A12): Modular permissions (DB, RLS, AuthContext, Sidebar, Settings)
- [ ] Phase 3 (Tasks 8–10): Constants, helpers, dead code removal
- [ ] Phase 4 (Task 11): Lazy-load export
- [ ] Phase 5 (Tasks 12–13): Optional frontend polish
- [ ] Phase 6 (Task 14): Types (when migrations applied)
- [ ] `npm run build` passes
- [ ] No new linter errors

---

## Execution Order

```
Phase 1 (1–5) → Phase 2 (6–7) → Phase 2.5 (A1–A12) → Phase 3 (8–10) → Phase 4 (11) → Phase 5 (12–13) → Phase 6 (14)
```

---

## Execution Handoff

Plan saved to `docs/plans/2025-02-23-comprehensive-improvements-plan.md`.

**Unified with:** Transcript 31921a1c (auth screen fix ✓, modular permissions design ✓).

Two execution options:

1. **Subagent-driven (this session)** – Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel session (separate)** – Open a new session with executing-plans, batch execution with checkpoints.

Which approach?
