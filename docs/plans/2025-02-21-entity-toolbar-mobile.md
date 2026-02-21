# EntityToolbar Mobile Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve EntityToolbar mobile UX by showing Search + Filters button, with all other filters/views/sort in a Sheet.

**Architecture:** Add `variant` prop to LeadFilters, DealFilters, QuoteFilters. Add `renderMobileSearch`/`renderMobileFilters` to EntityToolbar. Below `md` breakpoint, show compact row + Sheet. Use existing Sheet component from shadcn.

**Tech Stack:** React, Tailwind CSS, shadcn Sheet, lucide-react (SlidersHorizontal).

---

## Task 1: Add variant prop to LeadFilters

**Files:**
- Modify: `src/components/leads/LeadFilters.tsx`

**Step 1: Add variant to interface**

In `LeadFiltersProps`, add:
```ts
variant?: "default" | "searchOnly" | "filtersOnly";
```

**Step 2: Implement variant logic**

- `searchOnly`: render only the Search input (the first div with Search icon + Input)
- `filtersOnly`: render the Popover (Status) + Source Select + Assignee Select, no Search
- `default` or undefined: current behavior (all)

Extract the Search block into a conditional. Extract the filters block (Popover + two Selects) into a conditional.

**Step 3: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/leads/LeadFilters.tsx
git commit -m "feat(filters): add variant prop to LeadFilters for mobile split"
```

---

## Task 2: Add variant prop to DealFilters

**Files:**
- Modify: `src/components/deals/DealFilters.tsx`

**Step 1: Add variant to interface**

In `DealFiltersProps`, add:
```ts
variant?: "default" | "searchOnly" | "filtersOnly";
```

**Step 2: Implement variant logic**

- `searchOnly`: only Search input
- `filtersOnly`: only Stage Select (+ Clear button if hasFilters)
- `default`: current behavior

**Step 3: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/deals/DealFilters.tsx
git commit -m "feat(filters): add variant prop to DealFilters for mobile split"
```

---

## Task 3: Add variant prop to QuoteFilters

**Files:**
- Modify: `src/components/quotes/QuoteFilters.tsx`

**Step 1: Add variant to interface**

In `QuoteFiltersProps`, add:
```ts
variant?: "default" | "searchOnly" | "filtersOnly";
```

**Step 2: Implement variant logic**

- `searchOnly`: only Search input
- `filtersOnly`: only Status Select (+ Clear button if hasFilters)
- `default`: current behavior

**Step 3: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/quotes/QuoteFilters.tsx
git commit -m "feat(filters): add variant prop to QuoteFilters for mobile split"
```

---

## Task 4: Add mobile layout and Sheet to EntityToolbar

**Files:**
- Modify: `src/components/entity-page/EntityToolbar.tsx`

**Step 1: Add imports**

```ts
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
```

**Step 2: Add props to EntityToolbarProps**

```ts
/** Mobile: Search slot (e.g. LeadFilters variant="searchOnly") */
renderMobileSearch?: ReactNode;
/** Mobile: Filters slot for Sheet (e.g. LeadFilters variant="filtersOnly") */
renderMobileFilters?: ReactNode;
```

**Step 3: Add mobile detection**

Use `useMediaQuery` or a simple approach: wrap mobile layout in `div className="md:hidden"` and desktop in `div className="hidden md:block"`. No hook needed — pure CSS breakpoint.

**Step 4: Render mobile layout when props provided**

When `renderMobileSearch` and `renderMobileFilters` are both provided:
- Mobile (`< md`): Row = `renderMobileSearch` (flex-1) + Sheet trigger button. Sheet content = `renderMobileFilters` + Views + Sort + Save/Reset + Clear (same structure as design doc).
- Desktop (`>= md`): Current layout with `children`.

When not provided: always use `children` (desktop layout), no mobile-specific UI. This keeps DesignRequests and any page that doesn't pass these props unchanged.

**Step 5: Sheet structure**

- Trigger: Button with SlidersHorizontal, text "Filters", optional badge for active count (use `hasFilters` if available)
- Content: `side` — consider RTL: check `document.documentElement.dir` or a `dir` prop. Default `side="right"` for LTR.
- Inside Sheet: vertical stack — `renderMobileFilters`, Divider, Views block, Sort block, Divider, Save/Reset, Clear

**Step 6: RTL handling**

Pass `side={typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "left" : "right"}` to SheetContent. Or use a small `useDir()` hook if one exists. Prefer CSS logical properties where possible.

**Step 7: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 8: Commit**

```bash
git add src/components/entity-page/EntityToolbar.tsx
git commit -m "feat(EntityToolbar): add mobile layout with Sheet for filters"
```

---

## Task 5: Wire Leads page to mobile slots

**Files:**
- Modify: `src/pages/Leads.tsx`

**Step 1: Add renderMobileSearch and renderMobileFilters**

Pass to EntityToolbar:
```tsx
renderMobileSearch={
  <LeadFilters
    variant="searchOnly"
    search={searchInput}
    onSearchChange={handleSearchChange}
    statusFilter={statusFilter}
    onStatusFilterChange={handleStatusFilterChange}
    sourceFilter={sourceFilter}
    onSourceFilterChange={handleSourceFilterChange}
    assigneeFilter={assigneeFilter}
    onAssigneeFilterChange={handleAssigneeFilterChange}
    teamMembers={teamMembers}
  />
}
renderMobileFilters={
  <LeadFilters
    variant="filtersOnly"
    search={searchInput}
    onSearchChange={handleSearchChange}
    statusFilter={statusFilter}
    onStatusFilterChange={handleStatusFilterChange}
    sourceFilter={sourceFilter}
    onSourceFilterChange={handleSourceFilterChange}
    assigneeFilter={assigneeFilter}
    onAssigneeFilterChange={handleAssigneeFilterChange}
    teamMembers={teamMembers}
  />
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/pages/Leads.tsx
git commit -m "feat(Leads): wire EntityToolbar mobile slots for Search + Sheet"
```

---

## Task 6: Wire Deals page to mobile slots

**Files:**
- Modify: `src/pages/Deals.tsx`

**Step 1: Add renderMobileSearch and renderMobileFilters**

Pass to EntityToolbar with DealFilters and same props (search, stageFilter, etc.).

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/pages/Deals.tsx
git commit -m "feat(Deals): wire EntityToolbar mobile slots for Search + Sheet"
```

---

## Task 7: Wire Quotes page to mobile slots

**Files:**
- Modify: `src/pages/Quotes.tsx`

**Step 1: Add renderMobileSearch and renderMobileFilters**

Pass to EntityToolbar with QuoteFilters (search, statusFilter, archivedCount, etc.).

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/pages/Quotes.tsx
git commit -m "feat(Quotes): wire EntityToolbar mobile slots for Search + Sheet"
```

---

## Task 8: Manual verification

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test mobile**

- Resize browser to < 768px or use DevTools device mode
- Leads: verify Search visible, Filters button opens Sheet with Status/Source/Assignee/Views/Sort/Save/Reset
- Deals: same pattern with Search + Stage
- Quotes: same pattern with Search + Status
- DesignRequests: verify unchanged (no mobile slots, so desktop layout)

**Step 3: Test RTL (if applicable)**

Set `dir="rtl"` on html, verify Sheet opens from left side.

---

## Out of Scope

- DesignRequests toolbar (Tabs) — no filter overload; keep current layout
- Animated badge for active filter count (can add later)
- E2E tests (add if project has Playwright/Cypress)
