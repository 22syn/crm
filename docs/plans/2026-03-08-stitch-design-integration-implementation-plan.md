# Stitch Design Integration — Implementation Plan

**Source:** [docs/brainstorms/2026-03-08-stitch-design-integration-brainstorm.md](../brainstorms/2026-03-08-stitch-design-integration-brainstorm.md)  
**Date:** 2026-03-08

---

## Goal

Integrate Stitch designs into hadaryaCRM with unified design system: all 46 screens (23 pages × Desktop/Mobile) as visual reference, Light/Dark via Tailwind, responsive layouts, Ad Agency RTL. Stitch = reference only; React components aligned manually.

---

## Phase 1: Design Tokens

- [x] **1.1** Map `stitch-prompts.json` colors to `index.css` — sidebar `#0f1025`, card `#151938`, accent `#1337ec`. Ensure light-mode equivalents match spec (neutral slate, no blue).  
  → Verify: Toggle theme; sidebar/cards/accent correct in both modes.

- [x] **1.2** Simplify typography to INTER (Stitch design system) — Update `index.css` font import; set `fontFamily.sans` to Inter only in `tailwind.config.ts`.  
  → Verify: Body text renders Inter; no Heebo/DM Serif unless explicitly needed.

---

## Phase 2: Shared Components

- [x] **2.1** Align Sidebar — Use tokens (`--sidebar-background`, `--sidebar-accent`). Ensure active item uses accent, collapsible behavior.  
  → Verify: Sidebar matches Stitch screenshot; theme toggle updates colors.

- [x] **2.2** Align Header + Mobile Header — Search placeholder, theme toggle, notifications, avatar. Same layout as Stitch.  
  → Verify: Desktop header visible at `md:`, mobile header at `md:hidden`.

- [x] **2.3** Align DataTable (variant stitch) — Rounded card, uppercase column labels, sticky header (bg-card), status pills, pagination.  
  → Verify: Leads/Customers/Suppliers tables look consistent.

- [x] **2.4** Align Kanban (variant stitch-dark) — Columns use `bg-card` tokens, dot + label + count, card style. Ensure both `stitch-dark` and light mode via tokens.  
  → Verify: Leads/Deals Kanban match Stitch; theme switch updates.

- [x] **2.5** Align EntityPageShell — Tabs (Pipeline/Table/Report), toolbar, empty state. Breadcrumb in DashboardLayout (Dashboard > Section > Page).  
  → Verify: Entity pages (Leads, Deals, etc.) share same shell.

---

## Phase 3: Stitch Generation

- [x] **3.1** Update `run-stitch-prompts.ts` — Change prompt to Dark-only (remove "both light and dark"). Add `--skip-existing`: call `list_screens`, build set of existing (name, device), skip those.  
  → Verify: `npm run stitch:run -- --all --skip-existing` skips existing screens.

- [x] **3.2** Run Stitch generation — `npm run stitch:run -- --all --skip-existing`. Capture `stitch-results.json`.  
  → Verify: 45 screens (Add Lead Modal Mobile skipped per user).

- [x] **3.3** Document screen ID mapping — Map each (route, device) to Stitch screen ID for reference during alignment.  
  → Verify: `docs/stitch-screen-mapping.json` exists.

---

## Phase 4: Page-by-Page Alignment

- [x] **4.1** Auth + Dashboard — Auth split layout (form left, brand right), Dashboard stats/charts/activity feed use semantic tokens.  
  → Verify: Auth, Dashboard match Stitch design system.

- [x] **4.2** Leads (Kanban + Table + Detail) — Kanban/Table via shared components; Detail has tabs (Overview, Quotes, Activity), back button.  
  → Verify: Pipeline, Table, Lead Detail match Stitch.

- [x] **4.3** Deals, Contracts, Quotes, Design Requests — Shared EntityKanban, EntityPageShell, EntityToolbar.  
  → Verify: All entity Kanbans/tables consistent.

- [x] **4.4** Customers, Products, Suppliers, Settings — DataTable variant=stitch, Card rounded-xl.  
  → Verify: Table layout, filters, pagination match.

- [x] **4.5** Ad Agency (6 pages) — Same shared components + RTL.  
  → Verify: `dir="rtl"` on Ad Agency layout; layout mirrors Stitch.

- [x] **4.6** 404, Add Lead Modal — 404 card style; Add Lead Modal via LeadDialog (rounded-xl). Add Lead Modal Mobile skipped (401).  
  → Verify: Match Stitch specs.

---

## Phase 5: RTL (Ad Agency)

- [x] **5.1** Add RTL layout wrapper — Wrap Ad Agency routes with `dir="rtl"` (or `dir={locale}` if i18n). Ensure sidebar, header, tables, Kanban render correctly.  
  → Verify: `/ad-agency` and sub-routes render RTL; no layout breaks.

- [x] **5.2** Test RTL components — Sidebar nav, tables, Kanban columns, modals.  
  → Verify: No overflow, icons flipped where needed.

---

## Phase 6: Verification

- [ ] **6.1** Theme toggle — Light/Dark switch updates all pages.  
  → Verify: `npm run dev`, toggle theme, check Dashboard, Leads, Settings.

- [ ] **6.2** Responsive — Desktop (≥768px) and mobile (<768px) layouts match Stitch.  
  → Verify: Resize viewport; sidebar drawer on mobile; tables scroll or stack.

- [ ] **6.3** Design system consistency — Same sidebar, header, card style, buttons, status pills across pages.  
  → Verify: Spot-check Leads, Deals, Customers, Ad Agency; no visual drift.

---

## Done When

- [x] All design tokens mapped; Light + Dark work via Tailwind
- [x] Shared components (Sidebar, Header, DataTable, Kanban, EntityPageShell) aligned to Stitch
- [x] 45 Stitch screens generated (Add Lead Modal Mobile skipped); mapping documented
- [x] All pages visually aligned to Stitch design system (semantic tokens, rounded-xl, tabs, empty states)
- [x] Ad Agency RTL works
- [ ] Theme toggle and responsive behavior verified (manual spot-check)

---

## Notes

- **Fonts:** Remove Heebo/DM Serif from default stack unless specific use case (e.g. hero). Stitch uses INTER.
- **Script:** `run-stitch-prompts.ts` uses spawn to stitch-mcp; skip-if-exists requires `list_screens` tool call before each `generate_screen_from_text`. MCP may need to be invoked differently (e.g. via `call_mcp_tool` in a separate script) if spawn doesn't support multiple tools.
- **Stitch MCP:** Use `user-stitch-democrm` server; project ID `12969395350507001707`.
