# hadaryaCRM Visual & UX Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Approach C redesign — design system in Pencil, 6 core pages designed in Pencil and implemented in React, then propagate to remaining pages.

**Architecture:** Phase 1 = design system (.pen → CSS vars + Tailwind). Phase 2 = 6 core pages (Pencil designs → React). Phase 3 = apply design system + patterns to remaining pages (code-only).

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, shadcn/ui, Pencil MCP.

---

## Phase 1: Design System

### Task 1: Create designs folder and design system .pen

**Files:**
- Create: `hadaryaCRM/designs/` (directory)
- Create: `hadaryaCRM/designs/hadarya-design-system.pen` (via Pencil MCP)

**Step 1: Create designs directory**

Run: `mkdir -p hadaryaCRM/designs`
Expected: Directory exists.

**Step 2: Open new .pen file for design system**

Use Pencil MCP: `open_document` with `filePathOrNew: "hadaryaCRM/designs/hadarya-design-system.pen"` or create via Cursor if path must be relative to workspace.

**Step 3: Add design system content via batch_design**

Use Pencil MCP `get_guidelines` with `topic: "design-system"` first.
Use `batch_design` to create:
- Color swatches (primary, secondary, accent-action, semantic, sidebar)
- Typography scale samples (display, title, body, meta)
- Spacing examples
- Button variants (primary, secondary, ghost)
- Input, Card, Badge components

**Step 4: Commit**

```bash
git add designs/
git commit -m "chore: add designs folder and hadarya-design-system.pen"
```

---

### Task 2: Document design tokens from .pen

**Files:**
- Modify: `docs/plans/2026-03-02-hadaryaCRM-redesign-implementation-plan.md` (this file — add token table)
- Create: `docs/DESIGN_TOKENS.md` (reference)

**Step 1: Extract tokens from design system via batch_get**

Use Pencil MCP `batch_get` on `designs/hadarya-design-system.pen` to read color, typography, spacing values.
Use `get_variables` if design has variables defined.

**Step 2: Write DESIGN_TOKENS.md**

Document: `--primary`, `--secondary`, `--accent-action`, `--sidebar-*`, typography scale, spacing. Map Pencil values → CSS var names.

**Step 3: Commit**

```bash
git add docs/DESIGN_TOKENS.md
git commit -m "docs: add design tokens reference from Pencil design system"
```

---

### Task 3: Update index.css with design system tokens

**Files:**
- Modify: `src/index.css`

**Step 1: Update :root variables**

Replace or adjust `--primary`, `--secondary`, `--accent-action`, `--background`, `--foreground`, typography (`--text-display`, `--text-title`, `--text-body`, `--text-meta`), spacing (`--space-section`, `--space-block`, `--space-tight`) to match DESIGN_TOKENS.md.

**Step 2: Update .dark variables**

Ensure dark mode tokens align with design system.

**Step 3: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/index.css
git commit -m "style: update CSS vars to match design system"
```

---

### Task 4: Update tailwind.config.ts for design tokens

**Files:**
- Modify: `tailwind.config.ts`

**Step 1: Align theme.extend with new tokens**

Ensure `fontSize`, `spacing`, `colors` reference correct CSS vars. Add any new tokens from DESIGN_TOKENS.md.

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "style: align Tailwind theme with design system"
```

---

### Task 5: Override shadcn Button, Input, Card for design system

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/card.tsx`

**Step 1: Update button variants**

Match primary, secondary, ghost, destructive to design system colors. Use `accent-action` for primary CTA if specified.

**Step 2: Update input styles**

Border radius, focus ring, padding to match design.

**Step 3: Update card styles**

Background, border, radius to match design.

**Step 4: Verify**

Run: `npm run dev` — visually check a page using these components.
Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/card.tsx
git commit -m "style: override shadcn Button, Input, Card for design system"
```

---

## Phase 2: Core Pages (Pencil → React)

### Task 6: Design Auth page in Pencil

**Files:**
- Create: `designs/auth.pen`

**Step 1: Get web-app guidelines**

Use Pencil MCP `get_guidelines` with `topic: "web-app"`.

**Step 2: Create auth.pen layout via batch_design**

- Login/signup form layout
- Logo area, fields (email, password), submit button, link to toggle login/signup
- Center-aligned, responsive

**Step 3: Get screenshot for verification**

Use `get_screenshot` on main frame. Confirm layout looks correct.

**Step 4: Commit**

```bash
git add designs/auth.pen
git commit -m "design: add auth page layout in Pencil"
```

---

### Task 7: Implement Auth page from Pencil design

**Files:**
- Modify: `src/pages/Auth.tsx`

**Step 1: Read auth design via batch_get**

Use `batch_get` on `designs/auth.pen` with `nodeIds` or patterns to extract structure.

**Step 2: Implement layout**

Match structure, spacing, typography, colors from design. Use design system components (Button, Input). Preserve existing auth logic (Supabase).

**Step 3: Verify**

Run: `npm run dev` — test login/signup flow.
Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/pages/Auth.tsx
git commit -m "feat: implement Auth page from Pencil design"
```

---

### Task 8: Design Dashboard page in Pencil

**Files:**
- Create: `designs/dashboard.pen`

**Step 1: Create dashboard layout via batch_design**

- Header/title
- Stats cards row (4 cards)
- Charts section (e.g. revenue, pipeline)
- Activity feed or table
- Use design system components (refs) where possible

**Step 2: Get screenshot**

Verify layout, hierarchy, spacing.

**Step 3: Commit**

```bash
git add designs/dashboard.pen
git commit -m "design: add dashboard layout in Pencil"
```

---

### Task 9: Implement Dashboard page from Pencil design

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Possibly: `src/components/dashboard/*.tsx` (StatsCardsStitch, MonthlyRevenueChart, etc.)

**Step 1: Read dashboard design**

`batch_get` on `designs/dashboard.pen`.

**Step 2: Implement layout and components**

Match grid, stats cards, charts area, activity feed. Reuse existing dashboard components where structure allows.

**Step 3: Verify**

Run: `npm run dev` — check Dashboard route.
Run: `npm run build`

**Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx src/components/dashboard/
git commit -m "feat: implement Dashboard from Pencil design"
```

---

### Task 10: Design Leads + Lead Detail in Pencil

**Files:**
- Create: `designs/leads.pen`
- Create: `designs/lead-detail.pen`

**Step 1: Design leads list page**

Filters, table/card layout, add button, lead cards or rows.

**Step 2: Design lead detail page**

Header, fields layout, comments section, actions. Shared components with leads list where applicable.

**Step 3: Screenshots + commit**

```bash
git add designs/leads.pen designs/lead-detail.pen
git commit -m "design: add Leads and Lead Detail layouts in Pencil"
```

---

### Task 11: Implement Leads and Lead Detail from Pencil

**Files:**
- Modify: `src/pages/Leads.tsx`
- Modify: `src/pages/LeadDetail.tsx`
- Possibly: `src/components/leads/LeadCard.tsx`, `LeadTable.tsx`, `LeadDialog.tsx`

**Step 1: Implement Leads page**

Layout, filters, table/cards from design.

**Step 2: Implement Lead Detail page**

Layout, form/detail view, comments. Preserve data fetching and mutations.

**Step 3: Verify**

Run: `npm run dev` — test leads list and detail.
Run: `npm run build`

**Step 4: Commit**

```bash
git add src/pages/Leads.tsx src/pages/LeadDetail.tsx src/components/leads/
git commit -m "feat: implement Leads and Lead Detail from Pencil designs"
```

---

### Task 12: Design Deals page in Pencil

**Files:**
- Create: `designs/deals.pen`

**Step 1: Design deals layout**

Pipeline/kanban or table view, deal cards, stage columns. Match UX patterns from leads if applicable.

**Step 2: Screenshot + commit**

```bash
git add designs/deals.pen
git commit -m "design: add Deals layout in Pencil"
```

---

### Task 13: Implement Deals page from Pencil

**Files:**
- Modify: `src/pages/Deals.tsx`
- Possibly: `src/components/deals/DealCard.tsx`, `DealTable.tsx`

**Step 1: Implement from design**

**Step 2: Verify + commit**

```bash
git add src/pages/Deals.tsx src/components/deals/
git commit -m "feat: implement Deals page from Pencil design"
```

---

### Task 14: Design Contracts page in Pencil

**Files:**
- Create: `designs/contracts.pen`

**Step 1: Design contracts/quotes list**

Table or cards, filters, create button. Consistent with deals/leads patterns.

**Step 2: Screenshot + commit**

```bash
git add designs/contracts.pen
git commit -m "design: add Contracts layout in Pencil"
```

---

### Task 15: Implement Contracts page from Pencil

**Files:**
- Modify: `src/pages/Quotes.tsx` (or Contracts route component — check App.tsx: contracts → Quotes)
- Possibly: `src/components/quotes/*.tsx`

**Step 1: Implement from design**

**Step 2: Verify + commit**

```bash
git add src/pages/Quotes.tsx src/components/quotes/
git commit -m "feat: implement Contracts page from Pencil design"
```

---

## Phase 3: Propagate to Remaining Pages

### Task 16: Apply design system to Products, Customers, Suppliers

**Files:**
- Modify: `src/pages/Products.tsx`
- Modify: `src/pages/Customers.tsx`
- Modify: `src/pages/Suppliers.tsx`

**Step 1: Apply layout patterns**

Use same page header, card styles, table styles as Phase 2. Apply design tokens (spacing, typography).

**Step 2: Verify + commit**

```bash
git add src/pages/Products.tsx src/pages/Customers.tsx src/pages/Suppliers.tsx
git commit -m "style: apply design system to Products, Customers, Suppliers"
```

---

### Task 17: Apply design system to Design Requests, Automations, Settings

**Files:**
- Modify: `src/pages/DesignRequests.tsx`
- Modify: `src/pages/Automations.tsx`
- Modify: `src/pages/Settings.tsx`

**Step 1: Apply layout patterns**

Same as Task 16.

**Step 2: Verify + commit**

```bash
git add src/pages/DesignRequests.tsx src/pages/Automations.tsx src/pages/Settings.tsx
git commit -m "style: apply design system to Design Requests, Automations, Settings"
```

---

### Task 18: Apply design system to Ad Agency pages

**Files:**
- Modify: `src/pages/ad-agency/AdAgencyDashboard.tsx`
- Modify: `src/pages/ad-agency/AdAgencyClients.tsx`
- Modify: `src/pages/ad-agency/AdAgencyClientDetail.tsx`
- Modify: `src/pages/ad-agency/AdAgencyProjects.tsx`
- Modify: `src/pages/ad-agency/AdAgencyProjectDetail.tsx`
- Modify: `src/pages/ad-agency/AdAgencyTasks.tsx`
- Modify: `src/pages/ad-agency/AdAgencyItems.tsx`

**Step 1: Apply design system**

Layout, spacing, typography. Reuse patterns from Dashboard, Leads, Deals.

**Step 2: Preserve RTL if Ad Agency uses it**

Check `DashboardLayout` for `isAdAgency` and `mainDir="rtl"` — keep that logic.

**Step 3: Verify + commit**

```bash
git add src/pages/ad-agency/
git commit -m "style: apply design system to Ad Agency pages"
```

---

### Task 19: Apply design system to Quote Approval, NotFound, Sidebar

**Files:**
- Modify: `src/pages/QuoteApproval.tsx`
- Modify: `src/pages/NotFound.tsx`
- Modify: `src/components/layout/DashboardSidebar.tsx` (if navigation overhaul is in scope)
- Modify: `src/components/layout/DashboardHeader.tsx`

**Step 1: Apply design system**

**Step 2: Verify full app**

Run: `npm run dev` — smoke-test main routes.
Run: `npm run build`
Run: `npm run lint` (if available)

**Step 3: Commit**

```bash
git add src/pages/QuoteApproval.tsx src/pages/NotFound.tsx src/components/layout/
git commit -m "style: apply design system to Quote Approval, NotFound, layout"
```

---

### Task 20: Final verification and docs update

**Files:**
- Modify: `docs/plans/2026-03-02-hadaryaCRM-visual-ux-redesign.md` (status → complete)
- Update: Maestro `02-projects/hadaryaCRM` brief if docs live there
- Delete or archive: `docs/plans/2026-03-02-hadaryaCRM-redesign-implementation-plan.md` (per plan lifecycle — or move to reference)

**Step 1: Run full verification**

```bash
npm run build
npm run lint
```

**Step 2: Update design doc status**

Mark Phase 1, 2, 3 complete.

**Step 3: Update project docs**

Per Maestro plan-lifecycle: update documentation, delete plan file from docs/plans if persistence not needed.

**Step 4: Commit**

```bash
git add docs/
git commit -m "docs: mark redesign complete, update project docs"
```

---

## Execution Summary

| Phase | Tasks | Est. |
|-------|-------|------|
| 1. Design System | 1–5 | ~1–2 hours |
| 2. Core Pages | 6–15 | ~4–8 hours |
| 3. Propagate | 16–20 | ~2–4 hours |

**Pencil MCP tools used:** `open_document`, `batch_design`, `batch_get`, `get_guidelines`, `get_screenshot`, `get_variables`

---

Plan complete and saved to `docs/plans/2026-03-02-hadaryaCRM-redesign-implementation-plan.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** — Dispatch fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints.

**Which approach?**
