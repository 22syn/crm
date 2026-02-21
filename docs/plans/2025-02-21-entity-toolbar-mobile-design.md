# EntityToolbar Mobile Design

**Date:** 2025-02-21  
**Status:** Approved

---

## 1. Problem

EntityToolbar displays filters, views, sort, and actions in a single horizontal row with `overflow-x-auto`. On mobile, this creates a poor UX: horizontal scrolling, cramped controls, and unclear affordances.

## 2. Solution: Search + Filters Button → Sheet

### Approach

- **Desktop (≥ md):** Current layout unchanged — horizontal flex with all controls visible.
- **Mobile (< md):** Compact row with Search always visible + "Filters" button that opens a Sheet containing all other controls.

### Breakpoint

`md` (768px) — Tailwind `md:` or equivalent.

---

## 3. Mobile Toolbar Row

**Layout:** Single row, `flex items-center gap-2`.

| Slot | Content |
|------|---------|
| 1 | Search (flex-1) — from filter component |
| 2 | Filters button — icon (SlidersHorizontal) + optional badge for active filter count |

**Challenge:** `children` (LeadFilters, DealFilters, etc.) render Search + filters together. We need to split.

**Solution:** Filter components accept `variant?: "default" | "searchOnly" | "filtersOnly"`:

- `searchOnly` — renders only the Search input
- `filtersOnly` — renders Status, Source, Assignee, etc. (no Search)
- `default` — current behavior, full filters

EntityToolbar receives:

- `renderMobileSearch?: ReactNode` — Search for mobile row
- `renderMobileFilters?: ReactNode` — Filters for Sheet content

Pages pass:

- `renderMobileSearch={<LeadFilters variant="searchOnly" ... />}`
- `renderMobileFilters={<LeadFilters variant="filtersOnly" ... />}`

---

## 4. Sheet Content (Mobile)

**Structure — vertical stack, full width:**

1. Filters — `renderMobileFilters` (Status, Source, Assignee, etc.)
2. Divider
3. Views dropdown (if present)
4. Sort control (if present)
5. Divider
6. Save / Reset buttons (if present)
7. Clear filters button (if present)

Each block full width with appropriate spacing.

---

## 5. RTL

- Sheet opens from the correct side: `side={dir === "rtl" ? "left" : "right"}`
- Close button positioned with logical properties

---

## 6. Consistency Across Entity Pages

Apply same pattern to all:

| Page | Filter Component | Notes |
|------|------------------|-------|
| Leads | LeadFilters | Search + Status + Source + Assignee |
| Deals | DealFilters | Search + Stage |
| Quotes | QuoteFilters | Search + Status |
| DesignRequests | (if has filters) | Same pattern |

---

## 7. Out of Scope

- Animations/transitions beyond default Sheet behavior
- Desktop layout changes
- Filter logic changes
