# Filter Toolbar Improvements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the filter/search/sort toolbar: unified Views (Quick + Saved), Sort in toolbar, visual grouping, Clear filters button. Built on EntityToolbar.

**Architecture:** Extend EntityToolbar with quickViews, renderSort, hasFilters/onClearFilters. Merge Quick + Saved views into one dropdown. Lift sort state from LeadTable/LeadKanban to Leads page. Add group separators and Clear button.

**Tech Stack:** React, TypeScript, Tailwind, shadcn/ui. No new dependencies.

**Design ref:** `docs/plans/2025-02-21-filter-toolbar-design.md`

---

## Task 1: Extend EntityToolbar props and types

**Files:**
- Modify: `src/components/entity-page/EntityToolbar.tsx`

**Step 1: Add new props to interface**

In `EntityToolbarProps`, add:

```ts
export interface QuickViewItem {
  value: string;
  label: string;
  onSelect: () => void;
}

export interface EntityToolbarProps {
  // ... existing
  /** Quick views (e.g. My pipeline, Unassigned) — merged with Saved views in one dropdown */
  quickViews?: QuickViewItem[];
  /** Sort control slot — rendered between Views and Save/Reset */
  renderSort?: ReactNode;
  /** When true, shows Clear filters button */
  hasFilters?: boolean;
  /** Called when Clear filters clicked */
  onClearFilters?: () => void;
}
```

**Step 2: Verify build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/entity-page/EntityToolbar.tsx
git commit -m "feat(toolbar): add quickViews, renderSort, hasFilters, onClearFilters props"
```

---

## Task 2: Implement unified Views dropdown in EntityToolbar

**Files:**
- Modify: `src/components/entity-page/EntityToolbar.tsx`

**Step 1: Update component to accept and use quickViews**

Add `quickViews = []` to destructured props. When `quickViews.length > 0` OR `showSavedViews`, render a single "Views" dropdown. Structure:

- If `quickViews.length > 0`: render DropdownMenuItem for each (label, onSelect: item.onSelect)
- If both: add DropdownMenuSeparator
- If `showSavedViews`: render existing saved views section (with Manage submenu)

Button label: `Views` or `Views (${savedViews.length})` when savedViews.length > 0.

**Step 2: Render renderSort between Views and Save/Reset**

When `renderSort` is provided, render it wrapped in a group div (with separator). Place after Views dropdown, before Save button.

**Step 3: Add group separators**

Wrap each logical group in a div with `flex items-center gap-2` and add `border-r border-muted/50 pr-2 mr-2` (or pl-2 ml-2 for RTL) between groups. Groups: 1) children (filters), 2) Views, 3) Sort, 4) Save/Reset, 5) Clear.

**Step 4: Verify build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/components/entity-page/EntityToolbar.tsx
git commit -m "feat(toolbar): unified Views dropdown, renderSort slot, group separators"
```

---

## Task 3: Add Clear filters button to EntityToolbar

**Files:**
- Modify: `src/components/entity-page/EntityToolbar.tsx`

**Step 1: Add Clear button**

When `hasFilters && onClearFilters`, render a button with X icon and "Clear filters" text. Use `Button variant="ghost" size="sm"`. Import `X` from lucide-react if not present.

**Step 2: Verify build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/entity-page/EntityToolbar.tsx
git commit -m "feat(toolbar): add Clear filters button"
```

---

## Task 4: Lift sort state to Leads and add renderSort

**Files:**
- Modify: `src/pages/Leads.tsx`

**Step 1: Add sort state**

Add state: `const [sortOption, setSortOption] = useState<SortOption>("created_at_asc");`  
Import `SortOption` and `SORT_OPTIONS`, `toSortOption`, `parseSortOption` from `@/utils/leadSort`.

**Step 2: Add Sort Select to toolbar**

Create `sortSelect` JSX:

```tsx
<Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
  <SelectTrigger className="w-[220px] h-8 rounded-sm shrink-0">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {SORT_OPTIONS.map((opt) => (
      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Step 3: Update leadsToolbar**

Replace `renderExtra` with:
- `quickViews={[{ value: "my", label: "My pipeline", onSelect: () => { setAssigneeFilter(user?.id ?? "all"); setPage(0); }}, { value: "unassigned", label: "Unassigned", onSelect: () => { setAssigneeFilter("unassigned"); setPage(0); }}]}`
- `renderSort={sortSelect}`
- `hasFilters={hasActiveFilters}` (use existing `hasActiveFilters` or equivalent)
- `onClearFilters={handleClearFilters}` (use existing `handleClearFilters`)

Remove `renderExtra` prop and its Select.

**Step 4: Defer wiring to LeadTable/LeadKanban**

Do NOT pass sort props to LeadKanban/LeadTable in this task. Task 5 and 6 will add the props to those components; Task 7 will wire them from Leads.

**Step 5: Verify build**

Run: `npm run build`  
Expected: Build may fail until LeadTable/LeadKanban accept new props (handled in next tasks).

**Step 6: Commit**

```bash
git add src/pages/Leads.tsx
git commit -m "feat(leads): lift sort state, use quickViews and renderSort in toolbar"
```

---

## Task 5: Refactor LeadKanban to controlled sort

**Files:**
- Modify: `src/components/leads/LeadKanban.tsx`

**Step 1: Add props**

Add to `LeadKanbanProps`:
```ts
sortOption: SortOption;
onSortOptionChange: (value: SortOption) => void;
```

**Step 2: Remove local sort state**

Remove `const [sortOption, setSortOption] = useState<SortOption>("created_at_asc");`

**Step 3: Remove sort row from JSX**

Delete the div containing "Sort by:" and the Select. The sort UI is now in the toolbar.

**Step 4: Use props**

Use `sortOption` and `onSortOptionChange` from props in `getLeadsByStatus` (it uses parseSortOption(sortOption) internally; keep that, just get sortOption from props).

**Step 5: Verify build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add src/components/leads/LeadKanban.tsx
git commit -m "refactor(leads): LeadKanban controlled sort from toolbar"
```

---

## Task 6: Refactor LeadTable to controlled sort

**Files:**
- Modify: `src/components/leads/LeadTable.tsx`

**Step 1: Add props**

Add to `LeadTableProps`:
```ts
sortOption: SortOption;
onSortOptionChange: (value: SortOption) => void;
```

**Step 2: Remove local sort state**

Remove `const [sortField, setSortField]` and `const [sortDirection, setSortDirection]`. Derive from sortOption using `parseSortOption(sortOption)`.

**Step 3: Remove sort row**

Delete the div with "Sort by:" and Select above the table.

**Step 4: Update handleSort**

When column header clicked, call `onSortOptionChange(toSortOption(field, newDirection))` instead of setState. Compute newDirection: if sortField===field flip, else "asc".

**Step 5: Update component signature**

Add sortOption, onSortOptionChange to destructured props. Ensure sortedLeads uses parseSortOption(sortOption) for field/direction.

**Step 6: Verify build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 7: Commit**

```bash
git add src/components/leads/LeadTable.tsx
git commit -m "refactor(leads): LeadTable controlled sort from toolbar"
```

---

## Task 7: Wire Leads to pass sort and clear to children

**Files:**
- Modify: `src/pages/Leads.tsx`

**Step 1: Pass sort props to LeadKanban**

In renderKanban, add `sortOption={sortOption}` and `onSortOptionChange={(v) => setSortOption(v as SortOption)}` to LeadKanban.

**Step 2: Pass sort props to LeadTable**

In renderTable, add same props to LeadTable.

**Step 3: Verify hasActiveFilters and handleClearFilters**

Ensure `hasActiveFilters` reflects: search || statusFilter.length > 0 || sourceFilter !== "all" || assigneeFilter !== "all".  
`handleClearFilters` should clear filters (search, status, source, assignee) and reset page. Use existing logic if present.

**Step 4: Verify build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/pages/Leads.tsx
git commit -m "feat(leads): wire sort and clear to LeadKanban and LeadTable"
```

---

## Task 8: Add hasFilters/onClearFilters to Deals

**Files:**
- Modify: `src/pages/Deals.tsx`

**Step 1: Add clear handler**

Create `handleClearFilters` that sets `setSearch("")` and `setStageFilter("all")`.

**Step 2: Compute hasFilters**

`const hasFilters = search.trim() !== "" || stageFilter !== "all";`

**Step 3: Pass to EntityToolbar**

Add `hasFilters={hasFilters}` and `onClearFilters={handleClearFilters}` to the EntityToolbar usage in Deals.

**Step 4: Verify build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/pages/Deals.tsx
git commit -m "feat(deals): add Clear filters to toolbar"
```

---

## Task 9: Update entity-page exports if QuickViewItem added

**Files:**
- Modify: `src/components/entity-page/index.ts`

**Step 1: Export QuickViewItem**

Add `QuickViewItem` to the EntityToolbar type exports if needed for consumers.

**Step 2: Verify build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/entity-page/index.ts
git commit -m "chore: export QuickViewItem type"
```

---

## Task 10: Remove LeadFilters internal Clear (if redundant)

**Files:**
- Modify: `src/components/leads/LeadFilters.tsx`

**Step 1: Check**

LeadFilters has an X button when `hasFilters` that calls `clearFilters`. EntityToolbar now has a Clear button. Both call the same logical "clear filters" action. Options:
a) Keep both — toolbar Clear and LeadFilters X both clear. Slightly redundant but OK.
b) Remove LeadFilters X — only toolbar Clear. Cleaner.

**Step 2: Remove LeadFilters clear button**

Remove the `{hasFilters && <Button variant="ghost" size="icon" onClick={clearFilters}>...` block from LeadFilters. Parent (Leads) passes `onClearFilters` to EntityToolbar which handles Clear. LeadFilters no longer needs to show X.

**Step 3: Verify**

Leads computes hasFilters from its state; EntityToolbar shows Clear when hasFilters. LeadFilters still receives search/filter props and clears via parent callbacks—but the actual "clear" is triggered by EntityToolbar's onClearFilters. So LeadFilters doesn't need to render Clear. Good.

**Step 4: Commit**

```bash
git add src/components/leads/LeadFilters.tsx
git commit -m "refactor(leads): remove redundant Clear from LeadFilters"
```

---

## Task 11: Final verification

**Files:** None

**Step 1: Full build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 2: Lint**

Run: `npm run lint`  
Expected: No errors.

**Step 3: Manual smoke test**

- Leads: Filters, Sort, Save, Reset, Views (Quick + Saved), Clear filters.
- Deals: Filters, Save, Reset, Saved views, Clear filters.
- RTL: Check dir="rtl" on Leads/Deals layout.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2025-02-21-filter-toolbar-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, and iterate quickly.

2. **Parallel Session (separate)** — Open a new session with @superpowers:executing-plans for batch execution with checkpoints.

Which approach?
