# Feature Implementation Plan: Demo CRM UX/UI Roadmap

**Overall Progress:** `25%`

## TLDR

Implement prioritized UX/UI improvements across navigation, dashboard, lead workflow, forms, and design consistency—grounded in the comprehensive CRM analysis. Phases align with frontend-specialist rules (no purple, clear geometry, one differentiator).

## Critical Decisions

- **Scope:** Phased implementation—Phase 1 (critical user adoption), Phase 2 (workflow efficiency), Phase 3 (scale & polish). No extra scope beyond analysis.
- **Design alignment:** All UI changes must respect frontend-specialist: no purple, sharp or very rounded geometry (avoid 4–8px), GPU-friendly motion, `prefers-reduced-motion`.
- **Language:** Standardize on one primary language or proper i18n—no mixed Hebrew/English friction.
- **Icon set:** Replace emoji icons with unified library (e.g., Lucide) across the app.

## Tasks

### Phase 1: Critical User Adoption (Weeks 1–4)

- [x] 🟩 **Step 1: Navigation & IA fixes**
  - [x] 🟩 Move Dashboard to top of navigation (above Admin section)
  - [x] 🟩 Add breadcrumb trails for deep navigation (e.g., Leads > Quotes > Approve)
  - [x] 🟩 Add floating action button for "New Lead" accessible from any page
  - [ ] 🟥 Optional: recently viewed items (last 5 leads/quotes)—skipped; GlobalCommandPalette already has recent leads via Cmd+K

- [x] 🟩 **Step 2: Lead scoring & prioritization**
  - [x] 🟩 Define lead scoring model (recency, source, stage progression, meeting soon)
  - [x] 🟩 Add visual priority indicators on lead cards (Hot/Warm/Cold badges with Lucide icons)
  - [x] 🟩 Add deal value to Kanban pipeline cards (quote total with ₪ when quote exists)
  - [x] 🟩 Add age/staleness indicators for leads untouched in X days (Xd badge when aging/stale)

- [x] 🟩 **Step 3: Role-based dashboard**
  - [x] 🟩 Implement role-based dashboard views (sales sees "My Pipeline", admin sees full data)
  - [x] 🟩 Make KPIs clickable—drill-down to filtered data (/leads?noMeeting=1, /leads, /quotes, /deals)
  - [x] 🟩 Add time range selector (This Week / Month / Quarter)
  - [x] 🟩 Add trend arrows and % change vs previous period (Deals This Period card)

- [ ] 🟥 **Step 4: Duplicate lead detection**
  - [ ] 🟥 Search existing leads by phone/email on blur in New Lead form
  - [ ] 🟥 Show warning if duplicate found before submit

- [ ] 🟥 **Step 5: Intelligent lead routing**
  - [ ] 🟥 Auto-assign new leads based on workload and specialization
  - [ ] 🟥 Reduce "Unassigned" lead count

### Phase 2: Workflow Efficiency (Weeks 5–8)

- [ ] 🟥 **Step 6: Form validation & UX**
  - [ ] 🟥 Real-time validation (email format, phone validity)
  - [ ] 🟥 Phone auto-format as user types (+972-XX-XXX-XXXX)
  - [ ] 🟥 Inline error messages (don't wait for submit)

- [ ] 🟥 **Step 7: Bulk actions & table UX**
  - [ ] 🟥 Bulk actions in Leads table (reassign, change status)
  - [ ] 🟥 Chart interactivity (hover tooltips, click-to-filter, export)

- [ ] 🟥 **Step 8: Mobile responsiveness**
  - [ ] 🟥 Hamburger menu / slide-out sidebar on mobile
  - [ ] 🟥 Mobile-optimized lead cards (stacked layout)
  - [ ] 🟥 Touch targets ≥44x44px

- [ ] 🟥 **Step 9: Import/Export**
  - [ ] 🟥 Import module in navigation (CSV, Excel)
  - [ ] 🟥 Field mapping wizard for imports

### Phase 3: Scale & Polish (Weeks 9–12)

- [ ] 🟥 **Step 10: Design consistency**
  - [ ] 🟥 Standardize language or add i18n + toggle
  - [ ] 🟥 Unify icon set—replace emojis with Lucide/Heroicons
  - [ ] 🟥 Define button hierarchy (primary/secondary/tertiary)
  - [ ] 🟥 Fix RTL/LTR consistency

- [ ] 🟥 **Step 11: Integrations & automation**
  - [ ] 🟥 Calendar sync (Google/Outlook)
  - [ ] 🟥 Email tracking (opens/clicks)
  - [ ] 🟥 Workflow automation builder (conditional logic)

- [ ] 🟥 **Step 12: Onboarding & performance**
  - [ ] 🟥 Interactive onboarding tour (5 steps)
  - [ ] 🟥 Contextual help (tooltips, question mark icons)
  - [ ] 🟥 Loading states (skeleton screens)
  - [ ] 🟥 Search debouncing (300ms)
