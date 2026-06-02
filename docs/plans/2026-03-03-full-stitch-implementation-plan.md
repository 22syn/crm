# Full Stitch DemoCRM Implementation Plan — All Pages

**Source:** [Stitch Project 12969395350507001707](https://stitch.withgoogle.com/projects/12969395350507001707)  
**Target:** hadaryaCRM (Vite + React + TypeScript + Supabase)  
**Date:** 2026-03-03

**Progress (2026-03-03):** Phases 1–7 largely complete. Auth, Customers, Dashboard, LeadDetail, Settings restyled. Breadcrumbs + hero typography across Leads, Deals, Contracts, Products, Suppliers, Automations, DesignRequests, QuoteApproval, NotFound, AdAgencyProjects. Empty states for Deals & Contracts. Sticky table header.

---

## 1. TLDR

Implement Stitch DemoCRM designs across **all** hadaryaCRM pages. Use `fetch_screen_code` / `fetch_screen_image` for screens with HTML or images. Apply the same design language (sidebar `#0f1025`, cards `#151938`, accent `#1337ec`) to pages without a 1:1 Stitch match.

---

## 2. Stitch Screen Reference (from `list_screens`)

| Stitch Screen | screenId | htmlCode | hadaryaCRM Page |
|---------------|----------|----------|-----------------|
| Hadarya CRM Dashboard | `e72be0805b2e40d99a9e336f038050de` | ✅ | `/dashboard` |
| CRM Notification and Inbox Center | `cbf66b3db343426b85c0a496b03804d9` | ✅ | *(new: Notifications)* or header bell |
| Hadarya CRM Login Screen | `8fa86c3da6c54564abea59437702de4c` | ✅ | `/auth` |
| CRM Contacts and Client Directory | `8ee0194a04074b0eb5d06316269d479a` | ✅ | `/customers` |
| Hadarya CRM Main Dashboard | `696f441b7cd44729bd6c115f06811a17` | — | `/dashboard` (image ref) |
| CRM Settings and Team Management | `171adfa5dfc54db0b882b6bce1c62efd` | — | `/settings` |
| Lead Details Profile Page | `dfc25fb08d22495fabebb4ac9cd76db9` | — | `/leads/:id` |
| Hadarya Lead Management Table View | `45f895d8beeb42c99a301de1442dee37` | — | `/leads` (table) |
| CRM Task Calendar View | `da78ef00e5ff4c13844ce0f45c11ae6c` | — | *(Ad Agency Tasks or future)* |
| Sales Analytics and Reports | `11ef464fd6b043c897a96db406c0cb33` | — | `/dashboard` or Reports |
| Add New Lead Modal Form | `ddd2e09899c84e959f262aa3c132365d` | — | Leads "Add lead" modal |
| Hadarya CRM Main Dashboard (alt) | `58f0ce43796c4afba8a70dc55283d475` | — | `/dashboard` (image ref) |

For screens **without** `htmlCode`, use `fetch_screen_image(projectId, screenId)` for visual reference.

---

## 3. hadaryaCRM Page Inventory

| Route | Page | Stitch 1:1 | Source |
|-------|------|------------|--------|
| `/auth` | Auth | Login Screen | `8fa86c3da6c54564abea59437702de4c` |
| `/dashboard` | Dashboard | Main Dashboard | `e72be0805b2e40d99a9e336f038050de` |
| `/leads` | Leads | Lead Kanban + Table | Kanban: shared pattern / Table: `45f895d8beeb42c99a301de1442dee37` |
| `/leads/:id` | LeadDetail | Lead Details Profile | `dfc25fb08d22495fabebb4ac9cd76db9` |
| `/deals` | Deals | (same as Leads) | Apply Leads design language |
| `/contracts` | Quotes | (same as Leads) | Apply Leads design language |
| `/contracts/approve/:id` | QuoteApproval | — | Design language from Settings / entity pages |
| `/customers` | Customers | Contacts Directory | `8ee0194a04074b0eb5d06316269d479a` |
| `/products` | Products | — | Design language from entity pages |
| `/suppliers` | Suppliers | — | Design language from entity pages |
| `/settings` | Settings | Settings & Team Management | `171adfa5dfc54db0b882b6bce1c62efd` |
| `/design-requests` | DesignRequests | — | Design language from entity pages |
| `/automations` | Automations | — | Design language from entity pages |
| `/ad-agency` | AdAgencyDashboard | — | Dashboard design language |
| `/ad-agency/clients` | AdAgencyClients | Contacts | `8ee0194a04074b0eb5d06316269d479a` |
| `/ad-agency/clients/:id` | AdAgencyClientDetail | — | Lead Detail design language |
| `/ad-agency/projects` | AdAgencyProjects | Lead Kanban | Kanban pattern |
| `/ad-agency/projects/:id` | AdAgencyProjectDetail | — | Lead Detail design language |
| `/ad-agency/tasks` | AdAgencyTasks | Task Calendar | `da78ef00e5ff4c13844ce0f45c11ae6c` |
| `/ad-agency/items` | AdAgencyItems | — | Table design language |
| `*` | NotFound | — | Design language (simple, branded) |

---

## 4. Implementation Phases

### Phase 1: Design System & Core Tokens (Already ~Done)

- [x] Tokens in `index.css`: sidebar `#0f1025`, card `#151938`, accent `#1337ec`
- [x] Dashboard: StatsCardsStitch, SalesPipelineChart, MonthlyRevenueChart, ActivityFeedStitch, TopPerformingAgents
- [x] Sidebar, EntityPageShell, EntityKanbanColumn, LeadCard, DealCard
- [ ] **Verify** tokens and components are consistent across all usages

---

### Phase 2: Pages with Stitch HTML Code (Direct Implementation)

Use `fetch_screen_code` output as reference; convert to React components.

| # | Page | screenId | Tasks |
|---|------|----------|-------|
| 2.1 | **Auth** | `8fa86c3da6c54564abea59437702de4c` | Fetch HTML; align layout, form styling, logo, colors |
| 2.2 | **Customers** | `8ee0194a04074b0eb5d06316269d479a` | Fetch HTML; align table structure, columns, actions |
| 2.3 | **Dashboard** | `e72be0805b2e40d99a9e336f038050de` | Refine to match (already close); verify layout and typography |

---

### Phase 3: Pages with Stitch Images Only (Visual Reference)

Use `fetch_screen_image` for layout and styling; no HTML to parse.

| # | Page | screenId | Tasks |
|---|------|----------|-------|
| 3.1 | **Settings** | `171adfa5dfc54db0b882b6bce1c62efd` | Fetch image; align sections, team table, layout |
| 3.2 | **LeadDetail** | `dfc25fb08d22495fabebb4ac9cd76db9` | Fetch image; align header, cards, timeline area |
| 3.3 | **Leads (table view)** | `45f895d8beeb42c99a301de1442dee37` | Fetch image; align table header, columns, filters |
| 3.4 | **Add Lead Modal** | `ddd2e09899c84e959f262aa3c132365d` | Fetch image; align form fields, modal layout |
| 3.5 | **Ad Agency Tasks** | `da78ef00e5ff4c13844ce0f45c11ae6c` | Fetch image; align calendar/task layout |

---

### Phase 4: Entity Pages (Same Design Language)

Apply Kanban + Table + Detail pattern from Leads/Deals.

| # | Page | Pattern | Tasks |
|---|------|---------|-------|
| 4.1 | **Deals** | Kanban + Table | Verify DealCard, EntityKanbanColumn, EntityPageShell match Leads |
| 4.2 | **Contracts (Quotes)** | Kanban + Table | Same as Deals; QuoteCard if different from DealCard |
| 4.3 | **Products** | EntityPageShell + Table | Tabs, filters, table; Stitch design language |
| 4.4 | **Suppliers** | EntityPageShell + Table | Same as Products |
| 4.5 | **DesignRequests** | EntityPageShell + Kanban/Table | Same pattern |
| 4.6 | **Automations** | Settings-like | Cards, list; Stitch design language |

---

### Phase 5: Ad Agency Module

| # | Page | Pattern | Tasks |
|---|------|---------|-------|
| 5.1 | **AdAgencyDashboard** | Dashboard | Stats cards, charts; same as main Dashboard |
| 5.2 | **AdAgencyClients** | Customers | Same as `/customers` design |
| 5.3 | **AdAgencyClientDetail** | LeadDetail | Same as Lead Detail |
| 5.4 | **AdAgencyProjects** | Leads Kanban | EntityKanbanColumn, ProjectCard |
| 5.5 | **AdAgencyProjectDetail** | LeadDetail | Tabs, cards, timeline |
| 5.6 | **AdAgencyTasks** | Task Calendar | Stitch screen `da78ef00e5ff4c13844ce0f45c11ae6c` |
| 5.7 | **AdAgencyItems** | Table | Same table design as Leads/Customers |

---

### Phase 6: Supporting Pages

| # | Page | Tasks |
|---|------|-------|
| 6.1 | **QuoteApproval** | Header, cards, approve/reject buttons; Stitch design language |
| 6.2 | **NotFound** | Simple branded 404; logo, message, back button |

---

### Phase 7: UX Improvements (from Stitch UX Research)

| # | Improvement | Scope | Priority |
|---|-------------|-------|----------|
| 7.1 | Table: Sticky Header | DataTable | P1 |
| 7.2 | Table: Column Visibility | Leads, Deals, Contracts, Customers | P1 |
| 7.3 | Lead Detail: Timeline / Interaction History | LeadDetail | P1 |
| 7.4 | Kanban: Column Collapse | EntityKanban | P1 |
| 7.5 | Filter Chips | EntityToolbar, LeadFilters | P2 |
| 7.6 | Empty States (Deals, Contracts) | Deals, Quotes | P2 |
| 7.7 | Table: Row Density | DataTable | P2 |
| 7.8 | Kanban: Compact Card Mode | LeadCard, DealCard | P2 |

---

### Phase 8: Verification & Documentation

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Smoke test: Dashboard, Leads, Deals, Customers, Settings, Auth
- [ ] Mobile viewport check (375px, 768px, 1024px)
- [ ] Update `hadaryaCRM-architecture.md`, `02-projects/hadaryaCRM`
- [ ] Delete this plan from `docs/plans/` after completion (per plan-lifecycle)

---

## 5. Execution Order

```
Phase 1 (verify) → Phase 2 (Auth, Customers, Dashboard refine)
→ Phase 3 (Settings, LeadDetail, Leads table, Add Lead modal, Ad Tasks)
→ Phase 4 (Deals, Contracts, Products, Suppliers, DesignRequests, Automations)
→ Phase 5 (Ad Agency all pages)
→ Phase 6 (QuoteApproval, NotFound)
→ Phase 7 (UX improvements — can run in parallel with 4–6)
→ Phase 8 (verification, docs)
```

---

## 6. Stitch MCP Usage

```ts
// List screens
list_screens(projectId: "12969395350507001707")

// Fetch HTML (when available)
fetch_screen_code(projectId: "12969395350507001707", screenId: "<hex>")

// Fetch image (for visual reference)
fetch_screen_image(projectId: "12969395350507001707", screenId: "<hex>")
```

---

## 7. Effort Estimate

| Phase | Est. |
|-------|------|
| 1. Verify design system | 0.5 h |
| 2. Pages with HTML | 2 h |
| 3. Pages with images | 2.5 h |
| 4. Entity pages | 2 h |
| 5. Ad Agency | 2.5 h |
| 6. Supporting pages | 0.5 h |
| 7. UX improvements | 3 h |
| 8. Verification & docs | 1 h |

**Total:** ~14 h
