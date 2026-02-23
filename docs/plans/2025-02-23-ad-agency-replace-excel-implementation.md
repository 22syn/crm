# Ad Agency Replace Excel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the ad agency module so users build budgets in the CRM and export to Excel. Replace the Excel budget sheet as the working document.

**Architecture:** Extend existing tables (op_items, op_project_items, op_projects) with new columns; add op_budget_sections lookup; client-side Excel export via exceljs. No new backend functions.

**Tech Stack:** React, Supabase, exceljs, TanStack Query

**Design doc:** `docs/plans/2025-02-23-ad-agency-replace-excel-design.md`

---

## Task 1: Migration — schema changes

**Files:**
- Create: `supabase/migrations/20260223150000_ad_agency_replace_excel.sql`

**Step 1: Create migration file** with all schema changes:

```sql
-- op_budget_sections
CREATE TABLE public.op_budget_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.op_budget_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users op_budget_sections" ON public.op_budget_sections FOR ALL USING (has_crm_access(auth.uid()));

INSERT INTO public.op_budget_sections (name, sort_order) VALUES
  ('1. צוות', 1),
  ('2. הוצאות הפקה', 2),
  ('3. ארט סטיילינג ומשתתפים', 3),
  ('4. פוסט פרודקשן', 4);

-- op_items: add section_id
ALTER TABLE public.op_items ADD COLUMN section_id UUID REFERENCES public.op_budget_sections(id) ON DELETE SET NULL;

-- op_project_items: add prep_days, extras
ALTER TABLE public.op_project_items ADD COLUMN prep_days NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.op_project_items ADD COLUMN extras NUMERIC NOT NULL DEFAULT 0;

-- op_projects: content + summary fields
ALTER TABLE public.op_projects ADD COLUMN description TEXT;
ALTER TABLE public.op_projects ADD COLUMN locations_schedule TEXT;
ALTER TABLE public.op_projects ADD COLUMN deliverables TEXT;
ALTER TABLE public.op_projects ADD COLUMN production_fee_percent NUMERIC NOT NULL DEFAULT 15;
ALTER TABLE public.op_projects ADD COLUMN insurance NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.op_projects ADD COLUMN discount NUMERIC NOT NULL DEFAULT 0;
```

**Step 2: Run migration**

```bash
cd /Users/kobihazout/.gemini/antigravity/projects/hadaryaCRM
npx supabase db reset
```

**Step 3: Regenerate types**

```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

**Step 4: Commit**

```bash
git add supabase/migrations/20260223150000_ad_agency_replace_excel.sql src/integrations/supabase/types.ts
git commit -m "feat(ad-agency): schema for replace Excel"
```

---

## Task 2: UI — Items: add section selector

**Files:**
- Modify: `src/pages/ad-agency/AdAgencyItems.tsx`
- Modify: `src/components/ad-agency/ItemDialog.tsx` or `ItemTable.tsx`

**Step 1: Fetch op_budget_sections in AdAgencyItems or ItemDialog**

Add query for sections, pass to ItemDialog. In ItemDialog, add select/dropdown for `section_id` when creating/editing an item.

**Step 2: Update insert/update to include section_id**

Ensure CRUD operations pass `section_id` to Supabase.

**Step 3: Optionally group items by section in ItemTable**

Order/sort by section.sort_order, section.name, then item.type.

**Step 4: Commit**

```bash
git add src/pages/ad-agency/AdAgencyItems.tsx src/components/ad-agency/ItemDialog.tsx src/components/ad-agency/ItemTable.tsx
git commit -m "feat(ad-agency): add section to items"
```

---

## Task 3: UI — ProjectItemsSection: prep_days, extras inputs + row formula

**Files:**
- Modify: `src/components/ad-agency/ProjectItemsSection.tsx`

**Step 1: Add prep_days, extras to table columns**

Add `<TableHead>ימי הכנות</TableHead>` and `<TableHead>תוספות</TableHead>`. Add cells with number inputs (or display + edit). Include in PendingItem and mutation payloads.

**Step 2: Update row total formula**

```ts
const rowTotal = (pricePerDay * quantity * (1 + (prepDays ?? 0))) + (extras ?? 0);
```

**Step 3: Update totalItems aggregation**

Use same formula for total.

**Step 4: Update add dialog**

When adding item, allow setting prep_days, extras (default 0).

**Step 5: Commit**

```bash
git add src/components/ad-agency/ProjectItemsSection.tsx
git commit -m "feat(ad-agency): add prep_days, extras to project items"
```

---

## Task 4: UI — Project detail: content fields (description, locations_schedule, deliverables)

**Files:**
- Modify: `src/pages/ad-agency/AdAgencyProjectDetail.tsx`
- Modify: `src/components/ad-agency/ProjectDetailTabs.tsx` or `ProjectDialog.tsx`

**Step 1: Add textarea/input fields for description, locations_schedule, deliverables**

In project detail or edit dialog, add labeled fields. Use `supabase.from("op_projects").update(...)` on change (or save button).

**Step 2: Ensure project fetch includes new fields**

Select `description, locations_schedule, deliverables` in project query.

**Step 3: Commit**

```bash
git add src/pages/ad-agency/AdAgencyProjectDetail.tsx src/components/ad-agency/ProjectDetailTabs.tsx
git commit -m "feat(ad-agency): add project content fields"
```

---

## Task 5: UI — Project detail: summary fields (production_fee_percent, insurance, discount)

**Files:**
- Modify: `src/components/ad-agency/ProjectDetailTabs.tsx` (Budget tab)

**Step 1: Add inputs for production_fee_percent, insurance, discount**

In Budget tab, add number inputs. Update project on change or save.

**Step 2: Show calculated totals**

Display: items total, + insurance, + production fee, − discount, = grand total.

**Step 3: Commit**

```bash
git add src/components/ad-agency/ProjectDetailTabs.tsx
git commit -m "feat(ad-agency): add summary fields and grand total"
```

---

## Task 6: Install exceljs

**Files:**
- Modify: `package.json`

**Step 1: Install**

```bash
npm install exceljs
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add exceljs for budget export"
```

---

## Task 7: Create exportBudgetToExcel utility

**Files:**
- Create: `src/lib/exportBudgetToExcel.ts`

**Step 1: Implement function**

```ts
import ExcelJS from "exceljs";

export interface BudgetExportData {
  project: { title: string; description?: string; locations_schedule?: string; deliverables?: string; notes?: string };
  client: { name: string; payment_terms?: string };
  items: Array<{
    sectionName: string;
    type: string;
    pricePerDay: number;
    quantity: number;
    prepDays: number;
    extras: number;
    rowTotal: number;
  }>;
  summary: { itemsTotal: number; insurance: number; productionFee: number; discount: number; grandTotal: number };
}

export async function exportBudgetToExcel(data: BudgetExportData): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("תקציב");

  // Header
  ws.getCell("A1").value = data.project.title;
  ws.getCell("A2").value = `לקוח: ${data.client.name}`;

  // Content
  let row = 4;
  if (data.project.description) { ws.getCell(`A${row}`).value = "תיאור העבודה:"; row++; ws.getCell(`A${row}`).value = data.project.description; row += 2; }
  if (data.project.locations_schedule) { ws.getCell(`A${row}`).value = "לוקיישנים ולוח זמנים:"; row++; ws.getCell(`A${row}`).value = data.project.locations_schedule; row += 2; }
  if (data.project.deliverables) { ws.getCell(`A${row}`).value = "תוצרים:"; row++; ws.getCell(`A${row}`).value = data.project.deliverables; row += 2; }
  if (data.project.notes) { ws.getCell(`A${row}`).value = "הערות:"; row++; ws.getCell(`A${row}`).value = data.project.notes; row += 2; }

  // Items table header
  row++;
  ws.getCell(`A${row}`).value = "סוג"; ws.getCell(`B${row}`).value = "מחיר ליום"; ws.getCell(`C${row}`).value = "כמות"; ws.getCell(`D${row}`).value = "ימי הכנות"; ws.getCell(`E${row}`).value = "תוספות"; ws.getCell(`F${row}`).value = "מחיר סופי";
  row++;

  for (const item of data.items) {
    ws.getCell(`A${row}`).value = item.sectionName ? `[${item.sectionName}] ${item.type}` : item.type;
    ws.getCell(`B${row}`).value = item.pricePerDay;
    ws.getCell(`C${row}`).value = item.quantity;
    ws.getCell(`D${row}`).value = item.prepDays;
    ws.getCell(`E${row}`).value = item.extras;
    ws.getCell(`F${row}`).value = item.rowTotal;
    row++;
  }

  // Summary
  row += 2;
  ws.getCell(`A${row}`).value = "סה״כ פריטים:"; ws.getCell(`F${row}`).value = data.summary.itemsTotal; row++;
  ws.getCell(`A${row}`).value = "ביטוח:"; ws.getCell(`F${row}`).value = data.summary.insurance; row++;
  ws.getCell(`A${row}`).value = "עמלת הפקה:"; ws.getCell(`F${row}`).value = data.summary.productionFee; row++;
  ws.getCell(`A${row}`).value = "הנחה:"; ws.getCell(`F${row}`).value = -data.summary.discount; row++;
  ws.getCell(`A${row}`).value = "סה״כ כללי:"; ws.getCell(`F${row}`).value = data.summary.grandTotal; row++;

  if (data.client.payment_terms) {
    row += 2;
    ws.getCell(`A${row}`).value = "תנאי תשלום:"; row++;
    ws.getCell(`A${row}`).value = data.client.payment_terms;
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `תקציב-${data.project.title.replace(/[/\\?%*:|"<>]/g, "-")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Step 2: Commit**

```bash
git add src/lib/exportBudgetToExcel.ts
git commit -m "feat(ad-agency): add exportBudgetToExcel utility"
```

---

## Task 8: Add Export button to project detail page

**Files:**
- Modify: `src/pages/ad-agency/AdAgencyProjectDetail.tsx`
- Modify: `src/components/ad-agency/ProjectDetailTabs.tsx` (Budget tab)

**Step 1: Fetch project + client + items + sections**

When Export clicked, ensure we have: project (with new fields), client (payment_terms), op_project_items with op_items (section, price), op_budget_sections.

**Step 2: Build BudgetExportData and call exportBudgetToExcel**

Compute itemsTotal, productionFee, insurance, discount, grandTotal. Map items with section names. Call `exportBudgetToExcel(data)`.

**Step 3: Add "ייצוא לאקסל" button**

Place in Budget tab header or project detail header. On click → run export.

**Step 4: Commit**

```bash
git add src/pages/ad-agency/AdAgencyProjectDetail.tsx src/components/ad-agency/ProjectDetailTabs.tsx
git commit -m "feat(ad-agency): add export to Excel button"
```

---

## Task 9: Update ProjectQuoteBuilder to use new row formula

**Files:**
- Modify: `src/components/ad-agency/ProjectQuoteBuilder.tsx`

**Step 1: Update quoteItems mapping**

Include prep_days, extras in query. Use row formula: `(pricePerDay * (1 + prepDays) * quantity) + extras` for total_price.

**Step 2: Commit**

```bash
git add src/components/ad-agency/ProjectQuoteBuilder.tsx
git commit -m "feat(ad-agency): use prep_days, extras in quote builder"
```

---

## Task 10: Update AdAgencyDashboard / ProjectDetailTabs totals

**Files:**
- Modify: `src/pages/ad-agency/AdAgencyDashboard.tsx`
- Modify: `src/components/ad-agency/ProjectDetailTabs.tsx`

**Step 1: Use new formula for item totals**

Where we compute `price * quantity * days`, switch to `(price * quantity * (1 + prep_days)) + extras`. Ensure queries fetch prep_days, extras.

**Step 2: Commit**

```bash
git add src/pages/ad-agency/AdAgencyDashboard.tsx src/components/ad-agency/ProjectDetailTabs.tsx
git commit -m "feat(ad-agency): use prep_days, extras in dashboard totals"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Migrations |
| 2 | Section on items |
| 3 | prep_days, extras on project items |
| 4–5 | Project content + summary fields |
| 6–8 | Excel export |
| 9–10 | Formula consistency across app |
