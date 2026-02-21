# Feature Implementation Plan: UX Analysis Recommendations

**Overall Progress:** `100%`

## TLDR

Execute the highest-impact recommendations from the CRM UX/UI analysis: debounce search, improve empty states, duplicate lead detection, inline-edit affordances, and language consistency first (P0–P1); then timeline/validation/bulk/icons (P2) and saved views/mobile (P3). No new features—only changes derived from the analysis.

## Relationship to other work

- **This plan** = the 13 steps below (from `ux-ui-analysis-crm.md`). All steps done (100%).
- **Not in this plan:** Assignee dropdown in table (single-lead assign), per-user “Save preferences” / “Reset to default” (one saved state per page), “Add 50 demo leads” button, and `plan-leads-ui-ux.md` (purple/geometry/motion — 100% done). Those were done in other conversations. Step 8 here is **bulk** assign; Step 12 is **named** saved views (e.g. “My pipeline”), which builds on the existing preferences.

## Critical Decisions

- **Scope:** Only items from `maestro/ux-ui-analysis-crm.md` priority matrix; no extra scope.
- **Order:** P0 → P1 → P2 → P3. Within each tier, order by dependency and user impact.
- **Lead detail:** Defer full-page `/leads/:id` (P2) until P0–P1 are done; improve LeadDialog empty states and timeline first.
- **Icons vs roadmap:** Replace source emojis with Lucide in this plan; align with `plan-crm-ux-roadmap.md` Step 10 where overlapping.

## Tasks

- [x] 🟩 **Step 1: Search debounce (P0)**
  - [x] 🟩 Add 300–400 ms debounce to leads search input before updating `search` state / query key.
  - [x] 🟩 Ensure filter summary or URL params (if any) still reflect applied search after debounce.

- [x] 🟩 **Step 2: Empty states for leads list (P0)**
  - [x] 🟩 When `leads.length === 0` and any filter active: show single message “No leads match your filters” with actions “Reset filters” and “Clear filters.”
  - [x] 🟩 When `leads.length === 0` and no filters: show “Add your first lead” with primary CTA; keep optional “Add 50 demo leads” for demo.
  - [x] 🟩 Apply same logic for both Table and Kanban views (shared empty-state component or inline in each).

- [x] 🟩 **Step 3: Duplicate lead detection (P1)**
  - [x] 🟩 On blur of phone and email in New Lead form, query existing leads by that phone/email (normalized).
  - [x] 🟩 If match found: show warning (Alert or inline message) and “View existing lead” link; block or warn on submit.
  - [x] 🟩 Only run check for create flow (not when editing existing lead).

- [x] 🟩 **Step 4: Inline edit affordance (P1)**
  - [x] 🟩 Add subtle edit affordance for editable table cells (e.g. pencil icon on hover or “Click to edit” tooltip).
  - [x] 🟩 For empty contact fields in table, show “Add phone” / “Add email” as clickable placeholders that open same inline input.

- [x] 🟩 **Step 5: Language consistency (P1)**
  - [x] 🟩 Decide single UI language (e.g. English) or add i18n toggle.
  - [x] 🟩 Align Dashboard and ActivityFeed labels with chosen language (replace Hebrew strings or wire to i18n).

- [x] 🟩 **Step 6: Timeline in LeadDialog (P2)**
  - [x] 🟩 In LeadComments, show relative time (e.g. `formatDistanceToNow`) with tooltip or secondary line for absolute date/time.
  - [x] 🟩 (Optional) Add section heading “Activity” above comments for future unification with status/meeting changes.

- [x] 🟩 **Step 7: Form validation and hints (P2)**
  - [x] 🟩 Real-time validation: email format and phone validity on blur; inline error messages.
  - [ ] 🟥 Phone auto-format as user types (e.g. +972-XX-XXX-XXXX).
  - [x] 🟩 Mark optional fields with “(optional)” in LeadDialog; consider data-quality hint when email is missing.

- [x] 🟩 **Step 8: Bulk actions bar and assign (P2)**
  - [x] 🟩 When leads selected, show floating/slim action bar above table (or keep sticky bar, ensure it’s clearly visible).
  - [x] 🟩 Add bulk “Assign to” (dropdown) alongside existing “Change status”; clear selection after success.

- [x] 🟩 **Step 9: Replace source emojis with Lucide (P2)**
  - [x] 🟩 Replace emoji source icons in LeadTable, LeadCard, LeadFilters, LeadDialog with Lucide icons (e.g. Instagram, Globe, Building, Leaf, Facebook).
  - [x] 🟩 Keep status colors as-is; only source representation changes.

- [x] 🟩 **Step 10: Table loading skeleton (P2)**
  - [x] 🟩 When `isLoading && !leads.length`, show table skeleton (or spinner) instead of empty table on first load.

- [x] 🟩 **Step 11: Touch-friendly row actions (P2)**
  - [x] 🟩 In LeadTable, keep at least one action always visible per row (e.g. “…” menu or Edit icon), not only on hover, so touch users can discover actions.

- [x] 🟩 **Step 12: Saved views / named filters (P3)**
  - [x] 🟩 Extend table preferences or new “views” store: allow saving named filter+sort combinations (e.g. “My pipeline,” “Unassigned”).
  - [x] 🟩 Expose in UI: dropdown or tabs to apply a saved view and restore filters/sort.

- [x] 🟩 **Step 13: Mobile (P3)**
  - [x] 🟩 Hamburger/sheet sidebar on mobile; mobile-optimized lead cards (stacked layout); touch targets ≥ 44px. Align with `plan-crm-ux-roadmap.md` Step 8.
