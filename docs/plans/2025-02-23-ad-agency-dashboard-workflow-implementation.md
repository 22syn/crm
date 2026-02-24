# Ad Agency Dashboard, Workflow & Quotes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade ad agency dashboard with financial metrics, replace "last projects" with active/draft lists, add new project statuses, automatic quote from project items (like leads), and payment terms per client.

**Architecture:** Migration for schema changes (status enum, payment_terms, project_id in quotes); hybrid client-side aggregation for dashboard metrics; reuse quotes/QuotePreview/send-quote for project quotes; new ProjectQuoteBuilder component.

**Tech Stack:** React, TanStack Query, Supabase, TypeScript, existing UI components.

**Design Doc:** `docs/plans/2025-02-23-ad-agency-dashboard-and-workflow-design.md`

---

## Task 1: Migration — Project statuses, payment_terms, project_id in quotes

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_ad_agency_workflow.sql`

**Step 1: Create migration file**

Create migration that:
1. Alters `op_project_status` enum: add `waiting_for_approval`, `planning`, `execution`, `collection`; map existing `active` to `execution`
2. Adds `payment_terms TEXT` to `op_clients`
3. Adds `project_id UUID REFERENCES op_projects(id)` to `quotes`

```sql
-- 1. New project statuses (Postgres: cannot remove enum values easily; add new ones, migrate data)
-- First add new values to enum
ALTER TYPE public.op_project_status ADD VALUE IF NOT EXISTS 'waiting_for_approval';
ALTER TYPE public.op_project_status ADD VALUE IF NOT EXISTS 'planning';
ALTER TYPE public.op_project_status ADD VALUE IF NOT EXISTS 'execution';
ALTER TYPE public.op_project_status ADD VALUE IF NOT EXISTS 'collection';

-- Map active -> execution
UPDATE public.op_projects SET status = 'execution'::public.op_project_status WHERE status = 'active';

-- 2. Payment terms for clients
ALTER TABLE public.op_clients ADD COLUMN IF NOT EXISTS payment_terms TEXT;

-- 3. project_id for quotes (links ad-agency project to quote)
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.op_projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON public.quotes(project_id);
```

**Step 2: Run migration**

```bash
npx supabase db push
# Or: npx supabase migration up
```

**Step 3: Regenerate types**

```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

**Step 4: Commit**

```bash
git add supabase/migrations/ src/integrations/supabase/types.ts
git commit -m "feat(ad-agency): migration - workflow statuses, payment_terms, quotes.project_id"
```

---

## Task 2: Dashboard — Company summary cards

**Files:**
- Modify: `src/pages/ad-agency/AdAgencyDashboard.tsx`

**Step 1: Add query for project items**

Load `op_projects` with `op_project_items` joined to `op_items` (or two queries: projects + project_items with items). Compute per-project `items_total` and aggregates.

**Step 2: Replace 3 cards with 4**

- Remove: תקציב נדרש, תקציב אושר, פרויקטים פעילים
- Add: סה״כ הוצאות, צפי הכנסה, סה״כ רווח, אחוז רווח

**Step 3: Compute and display**

- `totalExpenses` = sum of (item.price × quantity × days) for all projects
- `totalRevenue` = sum of budget_approved
- `totalProfit` = totalRevenue - totalExpenses
- `profitPct` = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null (show "—")

**Step 4: Commit**

```bash
git add src/pages/ad-agency/AdAgencyDashboard.tsx
git commit -m "feat(ad-agency): dashboard company summary cards"
```

---

## Task 3: Dashboard — Active and draft project lists

**Files:**
- Modify: `src/pages/ad-agency/AdAgencyDashboard.tsx`

**Step 1: Replace "פרויקטים אחרונים"**

Split into two cards:
- **פרויקטים פעילים** — `status IN ('planning','execution','collection')`, limit 5-10
- **פרויקטים בטיוטה** — `status = 'draft'`, limit 5-10

**Step 2: Filter projects query**

Either filter in frontend from full projects list, or add separate queries filtered by status.

**Step 3: Display with link**

Each item: `<Link to={/ad-agency/projects/${p.id}}>{p.title}</Link>`, optional client name.

**Step 4: Commit**

```bash
git add src/pages/ad-agency/AdAgencyDashboard.tsx
git commit -m "feat(ad-agency): dashboard active and draft project lists"
```

---

## Task 4: Dashboard — Per-project metrics in lists (optional compact view)

**Files:**
- Modify: `src/pages/ad-agency/AdAgencyDashboard.tsx`

**Step 1: Add per-project expense/revenue/profit% to list items**

For each project in active/draft lists, show: עלות, צפי הכנסה, אחוז רווח (if revenue > 0). Use the same computed `items_total` from Task 2.

**Step 2: Commit**

```bash
git add src/pages/ad-agency/AdAgencyDashboard.tsx
git commit -m "feat(ad-agency): per-project metrics in dashboard lists"
```

---

## Task 5: Project detail — Summary card and remove budget_required

**Files:**
- Modify: `src/components/ad-agency/ProjectDetailTabs.tsx`
- Modify: `src/components/ad-agency/ProjectItemsSection.tsx` (expose total or compute in parent)

**Step 1: Add summary card in ProjectDetailTabs**

Above or beside budget tab: card with:
- עלות הוצאות (from ProjectItemsSection total)
- צפי הכנסה (budget_approved)
- אחוז רווח

**Step 2: Remove budget_required from budget tab**

Keep only budget_approved (or relabel to "צפי הכנסה"). Remove budget_required input and mutation.

**Step 3: Commit**

```bash
git add src/components/ad-agency/ProjectDetailTabs.tsx
git commit -m "feat(ad-agency): project summary card, remove budget_required"
```

---

## Task 6: Client — Payment terms field

**Files:**
- Modify: `src/components/ad-agency/ClientDialog.tsx`
- Modify: `src/pages/ad-agency/AdAgencyClientDetail.tsx` (if client details shown there)

**Step 1: Add payment_terms to ClientDialog**

- Add `payment_terms` to form state and to insert/update payload
- Add Label + Input (or Textarea) for "תנאי תשלום"

**Step 2: Add to AdAgencyClientDetail**

Display payment_terms on client detail page if not already in a details card.

**Step 3: Commit**

```bash
git add src/components/ad-agency/ClientDialog.tsx src/pages/ad-agency/AdAgencyClientDetail.tsx
git commit -m "feat(ad-agency): payment_terms for clients"
```

---

## Task 7: Project Kanban — New status columns

**Files:**
- Modify: `src/components/ad-agency/ProjectKanban.tsx` (or equivalent Kanban)
- Check: `src/pages/ad-agency/AdAgencyProjects.tsx`

**Step 1: Update Kanban columns**

Replace old statuses with: draft, waiting_for_approval, planning, execution, collection, completed, cancelled. Add columns for new statuses. Keep cancelled as separate or combined.

**Step 2: Update ProjectDialog / status dropdown**

Ensure create/edit project allows selecting new statuses.

**Step 3: Commit**

```bash
git add src/components/ad-agency/ProjectKanban.tsx src/components/ad-agency/ProjectDialog.tsx
git commit -m "feat(ad-agency): Kanban columns for new workflow statuses"
```

---

## Task 8: ProjectQuoteBuilder component

**Files:**
- Create: `src/components/ad-agency/ProjectQuoteBuilder.tsx`

**Step 1: Create component**

- Props: `open`, `onOpenChange`, `project` (with client, project_items + items)
- Load project + op_project_items + op_items if not passed
- Build quote items: each op_project_item → { title: type + " X ימים", quantity, unit_price, total_price }
- Subtotal = sum of totals; discount, tax, total (like QuoteBuilder)
- Customer info from op_clients (name, email, phone, address, payment_terms)

**Step 2: Save to quotes**

- Insert into `quotes`: project_id, customer_*, status: draft/sent, subtotal, discount, tax, total, valid_until
- Insert into `quote_items`: quote_id, title, quantity, unit_price, total_price (no shopify fields)

**Step 3: Open QuotePreview**

Use existing QuotePreview with items + customerName, etc. Add paymentTerms prop to QuotePreview if needed.

**Step 4: Commit**

```bash
git add src/components/ad-agency/ProjectQuoteBuilder.tsx
git commit -m "feat(ad-agency): ProjectQuoteBuilder for auto quote from project"
```

---

## Task 9: QuotePreview — Payment terms support

**Files:**
- Modify: `src/components/quotes/QuotePreview.tsx`

**Step 1: Add optional paymentTerms prop**

Display in the quote body (e.g. after customer address or in totals section): "תנאי תשלום: {paymentTerms}".

**Step 2: Commit**

```bash
git add src/components/quotes/QuotePreview.tsx
git commit -m "feat(quotes): QuotePreview payment terms"
```

---

## Task 10: AdAgencyProjectDetail — "בנה הצעת מחיר" button

**Files:**
- Modify: `src/pages/ad-agency/AdAgencyProjectDetail.tsx`

**Step 1: Add state for ProjectQuoteBuilder**

`const [quoteBuilderOpen, setQuoteBuilderOpen] = useState(false)`

**Step 2: Add button**

"בנה הצעת מחיר" — visible when status is draft (or always). Opens ProjectQuoteBuilder.

**Step 3: Wire ProjectQuoteBuilder**

Pass project (with client), on success invalidate queries, close dialog.

**Step 4: Commit**

```bash
git add src/pages/ad-agency/AdAgencyProjectDetail.tsx
git commit -m "feat(ad-agency): Build quote button in project detail"
```

---

## Task 11: Quote approval — Update project on approve

**Files:**
- Modify: `src/pages/QuoteApproval.tsx` (or wherever quote approval happens)
- Check: `supabase/functions/` if approval is done server-side

**Step 1: On quote approve, if project_id set**

- Update `op_projects`: status = 'planning', budget_approved = quote.total
- Invalidate op_projects / op_project queries

**Step 2: Commit**

```bash
git add src/pages/QuoteApproval.tsx
git commit -m "feat(ad-agency): update project on quote approval"
```

---

## Task 12: Send-quote — Support project quotes

**Files:**
- Modify: `supabase/functions/send-quote/index.ts` (if it needs project context)
- Check: Does send-quote work with quote_items that have no shopify fields? Ensure no errors.

**Step 1: Verify send-quote handles project quotes**

Quote has project_id; quote_items have title, quantity, unit_price, total_price. Ensure PDF generation or email doesn't assume shopify fields.

**Step 2: Adjust if needed**

If send-quote uses shopify-specific data, add fallback for project quotes (use title, etc.).

**Step 3: Commit**

```bash
git add supabase/functions/send-quote/index.ts
git commit -m "feat(send-quote): support project-based quotes"
```

---

## Task 13: Project table/dialog — Status options

**Files:**
- Modify: `src/components/ad-agency/ProjectTable.tsx`
- Modify: `src/components/ad-agency/ProjectDialog.tsx`

**Step 1: Update status select options**

Replace old statuses with: טיוטה, ממתין לאישור, תכנון, ביצוע, גבייה, הושלם, בוטל.

**Step 2: Commit**

```bash
git add src/components/ad-agency/ProjectTable.tsx src/components/ad-agency/ProjectDialog.tsx
git commit -m "feat(ad-agency): status options in table and dialog"
```

---

## Verification

1. Run `npm run build` — no TS errors
2. Run app, go to `/ad-agency` — 4 summary cards, active/draft lists
3. Open project detail — summary card, Build quote button
4. Create quote from project — saves, preview shows
5. Client dialog — payment terms field
6. Kanban — new status columns, drag works

---

**Plan complete and saved to `docs/plans/2025-02-23-ad-agency-dashboard-workflow-implementation.md`.**

**Two execution options:**

1. **Subagent-Driven (this session)** — Dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Parallel Session (separate)** — Open a new session with executing-plans, batch execution with checkpoints

**Which approach do you prefer?**
