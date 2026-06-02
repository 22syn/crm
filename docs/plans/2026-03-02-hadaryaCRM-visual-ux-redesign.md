# hadaryaCRM — Visual & UX Redesign (Approach C)

**Date:** 2026-03-02  
**Status:** Design approved — pending implementation plan  
**Approach:** Design system + Pencil-first core pages, then propagate to rest

---

## 1. Overview

Three-phase redesign combining:

- **Visual refresh** — updated layout, spacing, typography, colors
- **UX overhaul** — rethinking flows, hierarchy, navigation
- **Pencil-first** — design in .pen files, then implement in React

**Scope:** 21+ pages. Phase 1 establishes design system; Phase 2 designs 6 core pages in Pencil and implements them; Phase 3 applies system + patterns to remaining pages.

---

## 2. Phase 1: Design System

### 2.1 Deliverable

A single Pencil file: `designs/hadarya-design-system.pen`

Defines:

- **Color palette** — primary, secondary, accent, semantic (success, warning, destructive), sidebar
- **Typography scale** — display, hero, title, body, meta (aligned with current CSS vars)
- **Spacing tokens** — section (24px), block (16px), tight (8px)
- **Core components** — buttons (primary, secondary, ghost), inputs, cards, badges

### 2.2 Implementation

- Update `src/index.css` and `tailwind.config.ts` to match Pencil design tokens
- Override shadcn components where needed (Button, Input, Card, Badge)
- Keep existing fonts (Inter, Heebo) unless design mandates change
- Preserve dark mode parity

### 2.3 Current Baseline (to evolve, not replace)

- `--accent-action`: purple-magenta for CTAs
- Sidebar dark: `#0f1025`
- `--radius`: 0.375rem

---

## 3. Phase 2: Pencil-First Core Pages

### 3.1 Pages to Design in Pencil

| # | Page | Route | Rationale |
|---|------|-------|-----------|
| 1 | **Auth** | `/auth` | First impression, login/signup |
| 2 | **Dashboard** | `/dashboard` | Main hub, stats, activity |
| 3 | **Leads** | `/leads` | Core CRM list view |
| 4 | **Lead Detail** | `/leads/:id` | Core CRM detail, comments, actions |
| 5 | **Deals** | `/deals` | Pipeline view |
| 6 | **Contracts** | `/contracts` | Quotes list |

### 3.2 Pencil Files

- `designs/auth.pen`
- `designs/dashboard.pen`
- `designs/leads.pen`
- `designs/lead-detail.pen`
- `designs/deals.pen`
- `designs/contracts.pen`

### 3.3 UX Overhaul Focus

- **Navigation** — Sidebar hierarchy, grouping, icons
- **Page layout** — Header, breadcrumbs, content density, responsive
- **Forms/dialogs** — Lead create/edit, quote builder — consistent layout
- **Data display** — Tables, cards, kanban — clear hierarchy and spacing

### 3.4 Implementation Order

1. Design system → code
2. Auth
3. Dashboard
4. Leads + Lead Detail (shared components)
5. Deals
6. Contracts

---

## 4. Phase 3: Propagate to Remaining Pages

### 4.1 Pages (code-only, no new .pen files)

| Area | Pages |
|------|-------|
| Catalog | Products |
| Other | Customers, Suppliers, Design Requests, Automations, Settings |
| Ad Agency | Dashboard, Clients, Client Detail, Projects, Project Detail, Tasks, Items |
| System | Quote Approval, NotFound |

### 4.2 Process

- Apply design system (colors, typography, spacing)
- Reuse layout patterns from Phase 2 (page header, card layouts, table styles)
- Reuse components (stats cards, activity feed, dialogs)
- Match spacing and hierarchy; no full Pencil redesign

---

## 5. Deliverables & Success Criteria

| Phase | Deliverable | Done when |
|-------|-------------|-----------|
| 1 | Design system | `.pen` + CSS/Tailwind updated, shadcn overrides in place |
| 2 | Core pages | 6 .pen designs implemented in React |
| 3 | Rest of app | All pages use design system and Phase 2 patterns |

**Success:**

- Visual consistency across the app
- Clear, predictable navigation and flows
- Pencil as source of truth for core pages
- No regressions in functionality

---

## 6. Next Step

Invoke **writing-plans** to produce a detailed implementation plan (tasks, order, estimates).
