# Stitch DemoCRM Design — Implementation Plan

**Source:** [Stitch Project 12969395350507001707](https://stitch.withgoogle.com/projects/12969395350507001707)  
**Target:** hadaryaCRM (Vite + React + TypeScript + Supabase)  
**Date:** 2026-03-03

**Overall Progress:** `~70%`

---

## TLDR

**עיצוב בלבד — אין דפים חדשים.** לעדכן את המראה של הדפים הקיימים בהתאם לעיצובים ב‑Stitch. בדפים שאין להם עיצוב 1:1 ב‑Stitch — להחיל את השפה העיצובית מהדפים שכבר מעוצבים (למשל Dashboard, Leads).

---

## Stitch Design Capture Summary

**Captured via:** Browser MCP navigation to Stitch project URL (Stitch MCP `fetch_screen_code`/`fetch_screen_image` require screen IDs and may need auth).

**Stitch DemoCRM Architecture (from project sidebar):**

| # | Stitch Module | Description |
|---|---------------|-------------|
| 1 | Main Dashboard | High-level data visualizations and performance KPIs |
| 2 | Lead Management (Kanban) | Visual deal-tracking board |
| 3 | Lead Management (Table) | Detailed, searchable database of potential deals |
| 4 | Lead Details Profile | Deep-dive interaction history for individual leads |
| 5 | Task Calendar | Scheduling interface for sales appointments and tasks |
| 6 | Sales Analytics | Reporting and performance monitoring for managers |
| 7 | Settings & Team Management | User and permission controls |
| 8 | Contacts & Clients Directory | Long-term customer relationship management |
| 9 | Notification Center | Centralized inbox for alerts and team communication |

**Design requirements (from Stitch):**
- Dark mode as default/primary theme
- Mobile-responsive view for all pages

---

## Mapping: Stitch ↔ hadaryaCRM (דפים קיימים בלבד)

| עיצוב Stitch | דף hadaryaCRM | הערה |
|--------------|---------------|------|
| Main Dashboard | `/dashboard` | יש עיצוב Stitch (StatsCardsStitch וכו') |
| Lead Management | `/leads`, `/leads/:id` | יש עיצוב Stitch |
| Deals (משתמע) | `/deals` | להתבסס על Leads |
| Settings | `/settings` | יש/משתמע ב‑Stitch |
| Contacts & Clients | `/customers` | יש ב‑Stitch |
| — | `/contracts`, `/products`, `/suppliers`, `/design-requests`, `/automations`, Ad Agency | **אין 1:1** — להחיל שפה עיצובית מהדפים הקיימים |

---

## Critical Decisions

1. **אין דפים חדשים** — רק עיצוב מחדש של דפים קיימים.
2. **מקור עיצוב** — Stitch (ארכיטקטורה + שפה ויזואלית). אין export של מסכים בודדים; משתמשים ב‑StatsCardsStitch, ActivityFeedStitch וכו' כ־reference.
3. **דפים בלי 1:1 ב‑Stitch** — Products, Suppliers, Design Requests, Automations, Contracts, Ad Agency: להחיל את השפה העיצובית מהדפים שכבר מעוצבים (Dashboard, Leads, Deals).
4. **Dark mode** — Sidebar `#0f1025`, כרטיסים `#151938`, accent `#1337ec`.
5. **Mobile** — לתקן breakpoints ו‑layout בדפים קיימים.

---

## Tasks

### Phase 1: Design System (שפה עיצובית מ-Stitch)

- [x] 🟩 **Step 1: Tokens ו־Dark mode**
  - [x] 🟩 `src/index.css`: Sidebar 237 42% 10% (#0f1025), accent-action #1337ec
  - [x] 🟩 StatsCardsStitch, ActivityFeedStitch, SalesPipelineChart, MonthlyRevenueChart, TopPerformingAgents — כרטיסים כהה #151938

- [x] 🟩 **Step 2: Mobile-responsive**
  - [x] 🟩 Dashboard grid, entity pages — קיים

---

### Phase 2: דפים עם עיצוב Stitch (1:1 או קרוב)

- [x] 🟩 **Step 3: Dashboard** — כרטיסים Stitch, charts, activity
- [x] 🟩 **Step 4: Leads + Lead Detail** — LeadCard, EntityKanbanColumn, Tabs accent
- [x] 🟩 **Step 5: Deals** — DealCard, EntityKanbanColumn
- [x] 🟩 **Step 6: Customers** — יורש רכיבים משותפים
- [x] 🟩 **Step 7: Settings** — יורש רכיבים משותפים

---

### Phase 3: דפים בלי 1:1 — להחיל שפה מהקיימים

- [x] 🟩 **Step 8: Products, Suppliers, Design Requests, Automations, Contracts**
  - [x] 🟩 EntityPageShell, Tabs, EntityKanbanColumn — כבר מעודכנים
- [ ] 🟨 **Step 9: Ad Agency** — אותו Entity pattern (אם יש Kanban)
- [ ] 🟥 **Step 10: Auth, Quote Approval, NotFound** — עקביות ויזואלית (אופציונלי)

---

### Phase 4: Verification & Documentation

- [ ] 🟥 **Step 11: Verification**
  - [ ] 🟥 `npm run build`, `npm run lint`
  - [ ] 🟥 Smoke test דפים מרכזיים + mobile viewport

- [ ] 🟥 **Step 12: Documentation**
  - [ ] 🟥 עדכון `hadaryaCRM-architecture.md`, `02-projects/hadaryaCRM`

---

## Stitch MCP Notes

- **user-stitch** MCP provides `fetch_screen_code` and `fetch_screen_image` with args: `projectId`, `screenId`.
- Project ID: `12969395350507001707`
- Screen IDs are unknown; Stitch project UI did not expose individual screen IDs. If you gain access to screen IDs (e.g. from Stitch API or project export), use:
  ```txt
  fetch_screen_code(projectId: "12969395350507001707", screenId: "<screen-id>")
  ```
- Stitch MCP calls failed with gcloud auth / Xcode license error in capture session — environment setup may be needed for future use.

---

## Execution Summary

| Phase | Steps | Est. |
|-------|-------|------|
| 1. Design System | 1–2 | ~1 h |
| 2. דפים עם Stitch | 3–7 | ~2–3 h |
| 3. דפים בלי 1:1 | 8–10 | ~2–3 h |
| 4. Verification & Docs | 11–12 | ~0.5 h |

**Total:** ~5.5–7.5 hours  
**ללא דפים חדשים**
