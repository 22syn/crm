# Filter Toolbar Improvements — Design

**Date:** 2025-02-21  
**Status:** Approved  
**Component:** EntityToolbar, LeadFilters, DealFilters, Leads, Deals

---

## 1. Context

The filter/search/sort area is built on **EntityToolbar** (`src/components/entity-page/EntityToolbar.tsx`), which wraps entity-specific filters and optional Save/Reset/Saved views. Leads also pass `renderExtra` for Quick views (My pipeline, Unassigned).

**Current order:** `[Filters] → [Save] → [Reset] → [Saved views] → [renderExtra: Quick views]`

**Sort by** lives inside LeadTable and LeadKanban, on a separate row above the content.

**Goals:** Better visual hierarchy, unified Views (Quick + Saved), Sort integrated into toolbar, clearer "Clear filters", responsive behavior.

---

## 2. Layout & Visual Structure

### Desktop — single row with groups

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🔍 Search] │ [Status▼] [Source▼] [Assignee▼] │ [Views▼] │ [Sort▼] │ [Save] [Reset] │ [✕ Clear] │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Groups (visual separators):**
1. **Filters** — Search + Status + Source + Assignee (Leads) or Search + Stage (Deals)
2. **Views** — Single dropdown: Quick (My pipeline, Unassigned) + Saved views
3. **Sort** — Sort-by Select (Leads only for now; Deals/Quotes don't have sort in toolbar)
4. **Preferences** — Save, Reset
5. **Clear** — X + "Clear filters" text when `hasFilters`; resets filters only (not saved prefs)

Separators: `border-r border-muted/50` or `pl-3` / `pr-3` between groups. Avoid heavy visual weight.

### Deals

Same structure minus Assignee filter and Quick views (Views = Saved views only). No Sort in toolbar (DealTable has column sort; if we add toolbar sort later, same slot).

---

## 3. EntityToolbar API Changes

### New/updated props

```ts
interface EntityToolbarProps {
  children: ReactNode;           // Filters (LeadFilters, DealFilters)

  // Save / Reset
  onSaveView?: () => void;
  savePending?: boolean;
  onReset?: () => void;
  resetPending?: boolean;

  // Saved views
  savedViews?: SavedView[];
  onApplyView?: (filters: Record<string, string>) => void;
  onRenameView?: (id: string, name: string) => Promise<void>;
  onDeleteView?: (id: string) => void | Promise<void>;

  // Quick views (Leads only) — merged into Views dropdown
  quickViews?: { value: string; label: string; onSelect: () => void }[];

  // Sort slot — rendered between Views and Save/Reset
  renderSort?: ReactNode;

  // Clear filters — when provided, shows X + "Clear filters" when active
  hasFilters?: boolean;
  onClearFilters?: () => void;

  // Deprecated: renderExtra — replaced by quickViews + renderSort
  renderExtra?: ReactNode;  // Keep for backward compat during migration, then remove
}
```

### Views dropdown structure

When `quickViews` or `savedViews` exist, render a single dropdown "Views" (or "תצוגות" if RTL):

- **Quick section** (if `quickViews.length > 0`): My pipeline, Unassigned, etc.
- **Separator** (DropdownMenuSeparator) if both sections exist
- **Saved section**: User's saved views (Default, custom names) with Manage submenu

Label: "Views" or "Views (n)" if savedViews.length > 0.

### Clear filters

When `hasFilters && onClearFilters`, show a button: `[X] Clear filters` (or icon-only on very narrow screens). Calls `onClearFilters` — resets filters to empty/default, does NOT reset saved preferences.

---

## 4. Sort Integration

### Leads

- **State lift:** Sort state (`sortField`, `sortDirection` or `sortOption`) moves from LeadTable/LeadKanban to Leads.tsx.
- **LeadTable / LeadKanban:** Receive `sortOption` and `onSortChange` as props; no local sort state.
- **Toolbar:** `renderSort` passes the Sort Select (from `src/utils/leadSort.ts` SORT_OPTIONS).
- **Kanban:** Sort row removed from LeadKanban; Sort lives in toolbar only.
- **Table:** Sort row removed from LeadTable; Sort in toolbar. Column headers still support click-to-sort (they update the same state).

### Other entities (Deals, Quotes, Designs)

No change for now. Sort remains in-table/kanban where it exists. EntityToolbar's `renderSort` is optional.

---

## 5. Responsive (Mobile)

**Breakpoint:** `sm` (640px) or `md` (768px).

- **Wide:** Full row as above.
- **Narrow:** 
  - Row 1: Search (flex-1) + "Filters" button
  - "Filters" opens a **Sheet** (Drawer) with: Status, Source, Assignee, Views, Sort, Save, Reset, Clear
  - All controls in the sheet use full width; closing applies filters

**Implementation:** EntityToolbar can accept `responsive?: "sheet"` and render:
- Desktop: current flex layout
- Mobile: Search + Filters button → Sheet content = same slots but vertical stack

Alternatively, keep toolbar as-is and add a wrapper `EntityToolbarResponsive` that switches layout. Start with desktop-only; add mobile Sheet in a follow-up if needed.

---

## 6. Files & Components

| File | Change |
|------|--------|
| `EntityToolbar.tsx` | Add `quickViews`, `renderSort`, `hasFilters`, `onClearFilters`; merge Quick+Saved into one Views dropdown; add group separators; add Clear button |
| `LeadFilters.tsx` | Add `onClearFilters` callback prop; parent passes `hasFilters` and handler. Remove internal clear button if EntityToolbar handles it — or keep X in LeadFilters and have EntityToolbar's Clear call the same logic. Actually: EntityToolbar gets `hasFilters` and `onClearFilters` from parent; Clear is in toolbar. LeadFilters keeps its X for filter-only clear when used standalone? No — we want one Clear. LeadFilters can expose `clearFilters` via callback; Leads aggregates and passes to EntityToolbar. |
| `Leads.tsx` | Build `leadsToolbar` with: `quickViews=[{value:"my", label:"My pipeline", onSelect:...}, {value:"unassigned", ...}]`, `renderSort=<SortSelect ...>`, `hasFilters`, `onClearFilters`. Lift sort state; pass to LeadTable/LeadKanban. Remove `renderExtra`. |
| `LeadTable.tsx` | Accept `sortOption`, `onSortOptionChange`; remove internal sort state and sort row. |
| `LeadKanban.tsx` | Same: `sortOption`, `onSortOptionChange`; remove sort row. |
| `DealFilters.tsx` | No API change; Deals doesn't use quickViews or renderSort yet. Add `hasFilters`/`onClearFilters` to Deal toolbar when used. |
| `Deals.tsx` | Pass `hasFilters` and `onClearFilters` to EntityToolbar. No quickViews, no renderSort. |

---

## 7. Migration Steps

1. **EntityToolbar** — Add new props (quickViews, renderSort, hasFilters, onClearFilters). Implement Views merge, Clear button, group separators.
2. **Leads** — Lift sort state. Pass sort to LeadTable/LeadKanban. Replace renderExtra with quickViews + renderSort. Add hasFilters/onClearFilters.
3. **LeadTable** — Refactor to controlled sort.
4. **LeadKanban** — Refactor to controlled sort.
5. **Deals** — Add hasFilters/onClearFilters to toolbar.
6. **Remove** — renderExtra from EntityToolbar once Leads migrated.

---

## 8. RTL

EntityToolbar and group separators must respect `dir="rtl"`. Use logical properties (`ms-`, `me-`) or ensure flex order works in RTL. Leads/Deals already use RTL via layout.

---

## 9. Out of Scope (Phase 2)

- Mobile Sheet for filters (can add later)
- Sort in Deals/Quotes toolbar
- Named quick views beyond "My pipeline", "Unassigned"
