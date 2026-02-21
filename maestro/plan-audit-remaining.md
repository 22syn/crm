# Implementation Plan: Remaining UX Audit Recommendations

**Source:** Demo CRM Full UX/UI Audit Report (February 18, 2026)  
**Scope:** Items not covered by `plan-ux-analysis-implementation.md` (13 steps completed)  
**Date:** February 18, 2026

---

## TLDR

Address the remaining recommendations from the full audit in three phases: (1) Quick wins—language unification, pipeline labels, navigation fixes; (2) Structural—Lead detail page, Kanban/Table polish; (3) Features—Tasks module, clickable KPIs. Defer full i18n and major IA rework.

---

## Relationship to Other Work

- **`plan-ux-analysis-implementation.md`** — 13 steps done: debounce, empty states, duplicate detection, inline edit, bulk actions, saved views, etc.
- **This plan** — Items from the full audit not yet implemented.
- **Out of scope (this plan):** Full i18n framework, moving Designs to Admin nav (IA change), Notifications bell/panel.

---

## Phase 1: Quick Wins (P1)

Low effort, high clarity. No schema changes.

### Step 1: Rename Pipeline Stage Labels

**Problem:** Labels use numeric prefixes ("0 - New", "2.5 - Meeting Done") — cryptic and unprofessional.

**Action:** Introduce a single source of truth for labels; keep DB values unchanged.

- Create `src/utils/leadStages.ts` (or extend existing config) with display labels:
  - `new` → "New"
  - `in_process` → "In Process"
  - `meeting_scheduled` → "Meeting Scheduled"
  - `meeting_done` → "Meeting Done"
  - `waiting_for_approval` → "Waiting for Approval"
  - `done` → "Won"
  - `not_done` → "Lost"
- Replace all hardcoded labels in: `Leads.tsx`, `LeadKanban.tsx`, `LeadFilters.tsx`, `LeadDialog.tsx`, `StatusPill.tsx`.
- Optionally style "Lost" column in Kanban with muted/gray to indicate terminal state.

**Files:** New `leadStages.ts`; update 5 components.

---

### Step 2: Complete Language Unification to English

**Problem:** Deals, Designs, Automations, Settings, Quick Actions, and chart titles still use Hebrew.

**Action:** Translate all remaining Hebrew strings to English.

| Location | Hebrew | English |
|----------|--------|---------|
| Dashboard Quick Actions | ליד חדש, הצעת מחיר חדשה, לידים לטיפול | New Lead, New Quote, Leads to Follow Up |
| Dashboard charts | עסקאות לפי חודש, לידים לפי מקור | Deals by Month, Leads by Source |
| Deals page | עסקה חדשה, column headers | New Deal, [headers in English] |
| Designs / Automations / Settings | Any Hebrew labels | English equivalents |

**Files:** `Dashboard.tsx`, `Deals.tsx`, `DesignRequests.tsx`, `Automations.tsx`, `Settings.tsx`, `LeadsBySourceChart.tsx`, `OrdersChart.tsx` (or equivalents).

---

### Step 3: Fix Breadcrumb and FAB Consistency

**Problem:** Breadcrumb "Leads" is disabled/not clickable; FAB behavior inconsistent across pages.

**Action:**
- Make breadcrumb "Leads" (and others) clickable → navigate to `/leads` (or list view).
- Ensure FAB on `/leads` opens "New Lead"; on other pages wire to primary CTA or hide if redundant.

**Files:** `DashboardBreadcrumb.tsx`, `FloatingActionButton.tsx`, layout/page wiring.

---

## Phase 2: Structural Improvements (P2)

Moderate effort. Some schema/routing changes.

### Step 4: Lead Detail Page (`/leads/:id`)

**Problem:** No dedicated route; all editing in a narrow modal. Can't bookmark, share, or open in new tab.

**Action:**
- Add route `/leads/:id` with full-page layout.
- Header: lead name, created date, lead ID (or short hash).
- Sections: summary panel (fields), activity timeline (existing LeadComments), quotes (Create Quote / Link Existing).
- Inline edit for key fields; keep modal as fallback for quick edits from table.
- Wire Kanban card name and table row click → navigate to `/leads/:id`.
- Modal "View" or "Open" → navigate to detail page.

**Dependencies:** None.  
**Files:** New `LeadDetail.tsx`, `App.tsx` (route), `LeadCard.tsx`, `LeadTable.tsx`, `LeadDialog.tsx` (optionally reduce to quick-edit or redirect).

---

### Step 5: Kanban Column Improvements

**Problem:** Cards clipped; no lead count or totals; column widths too narrow.

**Action:**
- Widen columns (min-width or flexible) so source, email, phone are not truncated mid-word; add tooltip for full text if needed.
- Add lead count per column header, e.g. "Meeting Scheduled — 14 leads".
- Optional: show total quote value per column if data available.
- Add empty-state message inside columns with 0 leads.
- Make card names clickable → `/leads/:id`.

**Files:** `LeadKanban.tsx`, `KanbanColumn.tsx`, `LeadCard.tsx`.

---

### Step 6: Table Polish

**Problem:** Customer column too narrow; no Lead age/Last activity; Quote column shows "—"; no pagination counter.

**Action:**
- Increase min-width for Customer column so full names visible.
- Add sortable "Days since created" or "Last activity" column; default sort oldest-first to surface stale leads.
- Quote column: show "QT-006 ₪3,744" when quote exists, else "None" (muted).
- Add "Showing 1–25 of 158 leads" below table (or near pagination).

**Files:** `LeadTable.tsx`, `Leads.tsx` (pagination state).

---

### Step 7: Dashboard Clickable KPIs

**Problem:** "Without Meeting: 127" and other KPIs are dead ends.

**Action:**
- Make "Without Meeting" clickable → `/leads?filter=no-meeting` (or equivalent query).
- Add similar links for Active Leads, Open Quotes, Active Deals as appropriate.
- Add empty-state inside deals chart: "No deals yet. Create your first deal →" with button.

**Files:** `Dashboard.tsx`, `StatsCards.tsx`, `OrdersChart.tsx` (or deals chart component).

---

## Phase 3: Features (P3)

Higher effort. New schema and UI.

### Step 8: Tasks / Follow-up Module

**Problem:** No way to log a call, create a follow-up task, or schedule a reminder. Activity only supports comments.

**Action:**
- **Schema:** New `tasks` table (or `lead_activities` with type): `lead_id`, `type` (call, email, meeting, task), `due_date`, `completed_at`, `owner_id`, `notes`, `created_at`.
- **UI:** "Next action" on lead (date + type + owner). "My tasks today" widget on Dashboard.
- **Lead detail:** Timeline shows tasks; "Log call" / "Schedule follow-up" actions.

**Dependencies:** Step 4 (Lead detail) recommended first for timeline integration.  
**Files:** New migration, `Tasks` page or widget, `LeadDetail` integration, Dashboard widget.

---

### Step 9: Modal / Drawer Enhancement (Alternative to Step 4)

**Problem:** Modal is narrow; activity section hard to reach.

**Action (if full detail page deferred):**
- Expand Edit modal into a right-side drawer (slide-over) with wider width.
- Add lead name and created date in drawer header.
- Ensure activity section is scrollable and visible.

**Note:** Prefer Step 4 (full page) over this for long-term UX. Use this only if detail page is postponed.

---

## Deferred / Out of Scope

| Item | Reason |
|------|--------|
| Move Designs to Admin nav | IA change; requires product decision |
| Full i18n framework | Larger project; language unification done via hardcoded English for now |
| Notifications bell + panel | Audit noted ARIA regions exist; wiring is separate work |
| Notes as append-only log | Requires schema change; lower priority than Tasks |
| Drag undo toast | Nice-to-have; not in critical path |
| Phone auto-format | Remaining subtask in prior plan; can be added to Step 1 polish |

---

## Suggested Execution Order

1. **Step 1** — Pipeline labels (fast, visible)
2. **Step 2** — Language unification (fast, high impact)
3. **Step 3** — Breadcrumb + FAB (quick)
4. **Step 4** — Lead detail page (structural, unlocks card click-through)
5. **Step 5** — Kanban polish
6. **Step 6** — Table polish
7. **Step 7** — Dashboard clickable KPIs
8. **Step 8** — Tasks module (after detail page)

---

## Checklist Summary

- [x] Step 1: Rename pipeline stage labels
- [x] Step 2: Complete language unification
- [x] Step 3: Fix breadcrumb and FAB
- [x] Step 4: Lead detail page
- [x] Step 5: Kanban column improvements
- [x] Step 6: Table polish
- [x] Step 7: Dashboard clickable KPIs
- [ ] Step 8: Tasks / Follow-up module (optional Phase 3)
- [ ] Step 9: Modal→drawer (only if Step 4 deferred)
