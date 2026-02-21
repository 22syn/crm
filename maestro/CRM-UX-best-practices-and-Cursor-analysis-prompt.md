# CRM Lead-Management UX/UI: Best Practices Summary & Cursor Analysis Prompt

---

## PART 1 — CRM Lead-Management UX/UI Best Practices Summary

### Core UX principles for lead-management CRMs

- **Minimize manual data entry** — Sync activities (email, calls, calendar), auto-log where possible, and keep forms short. Friction here is the #1 cause of low adoption.
- **Context and hierarchy first** — Put the most-used information (contact, stage, next action) front and center; use progressive disclosure for detail.
- **Speed to action** — Responding to leads in under 5 minutes dramatically increases conversion; design for “read → respond → tag → move” in under 2 minutes.
- **Single source of truth** — One timeline, one lead record, consistent stage definitions; avoid scattered data and duplicate workflows.
- **Role-appropriate views** — Reps need a “cockpit” (today’s tasks, hot leads); managers need pipeline and team metrics; executives need forecasts and KPIs.
- **Real-time over historical** — Dashboards and lists should reflect current pipeline and deal state; highlight what needs action now.
- **Mobile is first-class** — Sales reps work on the go; mobile isn’t a stripped-down add-on. Touch targets (e.g. 44px), offline-ready, and quick actions matter.

### Common and effective UI patterns

**Navigation & layout**

- Clear primary nav (Leads, Deals, Customers, Dashboard) with secondary context (e.g. breadcrumbs, “Back to list”).
- Consistent patterns when switching views (e.g. Kanban vs list): same filter/saved-view controls, not different UIs (tabs vs dropdowns) for the same concept.
- Sidebar or top bar for global filters, saved views, and quick search.

**Lead intake & forms**

- Forgiving input (flexible date/phone formats), clear primary CTAs, lazy registration where possible.
- Short forms (e.g. 6–9 fields per step); multi-step or progressive for long flows.
- Inline or post-submit validation; preserve input on validation errors; error summary at top + inline messages with `aria-describedby`.

**Pipeline & stages**

- Kanban for visual pipeline: drag-and-drop stage changes, columns = stages, collapsible columns, bulk actions.
- List view for detail-heavy work: sortable columns, next step, last activity, key fields visible.
- Stage progression: manual move and/or automation (e.g. on meeting completed, email replied); rules should be transparent.

**Lead/contact detail**

- Unified activity timeline (notes, calls, emails, tasks, stage changes) in one chronological view, filterable by type.
- Quick-edit for key fields; full edit in drawer/modal or dedicated page.
- Clear “next action” and task due dates; one-click to complete or reschedule.

**Lists, search & filters**

- Full-text search with fast, relevant results; filters that match how reps work (source, stage, owner, date range).
- Multiple values per filter (OR within a dimension); “Applied filters” summary with one-click clear or per-filter remove.
- Saved views and default view per role or user; persist sort and visible columns.

**Tasks, reminders & follow-ups**

- Tasks visible on dashboard (e.g. overdue, today, next 7 days) and in lead/contact context.
- Reminders configurable (when and channel); optional desktop/email/SMS.
- Create task from lead/contact with pre-filled context and due date; quick complete/reschedule from list or card.

**Dashboards & reporting**

- F-pattern layout: primary KPIs top-left; clear visual hierarchy (size, color, spacing).
- One clear sentence per chart; chart type matched to data (e.g. line for trends, bar for comparison).
- Real-time pipeline and deal data; role-based widgets (rep vs manager vs exec).
- Progressive disclosure: summary first, drill-down on click; avoid clutter; aim for &lt;100ms perceived latency.

**Notifications & workflows**

- Real-time alerts for high-value events (new lead, lead inactive X days, key stage change).
- Workflows that create tasks and reminders on stage/behavior; sequences that pause on reply or meeting.
- Notifications configurable by user (channel and frequency); avoid alert fatigue.

**Mobile vs desktop**

- Responsive or adaptive: single-column and bottom nav on mobile; multi-column and full nav on desktop.
- Same core flows on both (view lead, update stage, log note, create task); large touch targets and FABs on mobile.
- Sync and offline where possible; performance and clarity over feature parity.

### Typical mistakes and anti-patterns

- **Heavy manual data entry** — Requiring reps to type what could be synced or inferred (e.g. BCC-to-log email) leads to incomplete data and low adoption.
- **Inconsistent navigation** — Different controls for the same concept when switching Kanban vs list (e.g. tabs in one, dropdown in the other) confuses users.
- **No visible “applied filters”** — Users lose context and can’t quickly remove or adjust filters.
- **Deal/lead data deleted or buried on loss** — Lost deals should be retained (e.g. “Closed – Lost”) for analysis and process improvement.
- **Designing for executives only** — Ignoring rep workflows (calls, tasks, quick stage move) leads to workarounds and spreadsheets.
- **Generic or delayed follow-up** — No personalization, no automation, or slow alerts; undermines “speed to lead” and nurturing.
- **Weak qualification** — No scoring, no stages, or no clear BANT/ANUM-style criteria; wasted effort on bad-fit leads.
- **Desktop-only or “mobile as afterthought”** — Small tap targets, nested menus, slow loads on mobile hurt field reps.
- **Form overload** — Long forms, validation on every keystroke, or losing input on submit error.
- **Dashboard overload** — Too many KPIs, no hierarchy, no drill-down; red used for non-urgent items.

---

## PART 2 — Cursor Analysis Prompt (Ready to Paste)

Copy everything below the line into Cursor AI to analyze your CRM against the best practices above.

---

You are an AI assistant with access to this CRM codebase. You can read the repository (components, pages, routes, hooks, and related logic) and reason about the current UX and UI implementation. You do not already know CRM lead-management best practices, so they are summarized for you below. Your task is to analyze this CRM’s implementation against those practices and produce a structured report.

### Best practices to use as your reference

**Core UX principles**

- Minimize manual data entry; sync and auto-log activities where possible.
- Put the most-used information (contact, stage, next action) first; use progressive disclosure.
- Design for speed: “read → respond → tag → move” in under 2 minutes.
- Single source of truth: one timeline, one lead record, consistent stages.
- Role-appropriate views: rep “cockpit” vs manager pipeline vs exec KPIs.
- Prefer real-time pipeline and deal state; highlight what needs action now.
- Treat mobile as first-class: touch-friendly, performant, key flows supported.

**UI patterns**

- **Navigation:** Clear primary nav; consistent controls when switching Kanban vs list (same filters/views); breadcrumbs or back-to-list.
- **Lead intake/forms:** Short forms; forgiving input; clear primary actions; validation on submit with error summary + inline messages; preserve input on error.
- **Pipeline:** Kanban with drag-and-drop stages; list view with sort and key columns; both support same filters/views.
- **Lead/contact detail:** Unified activity timeline (notes, calls, emails, tasks); quick-edit; visible next action and tasks.
- **Lists/filters/search:** Search + filters (multi-value where appropriate); visible “applied filters” with easy clear; saved views; configurable columns/sort.
- **Tasks/reminders:** Tasks on dashboard (e.g. overdue, today, next 7 days) and in lead context; create from lead with context; configurable reminders.
- **Dashboards:** F-pattern; primary KPIs top-left; one sentence per chart; real-time data; role-based; drill-down; avoid clutter; fast load.
- **Notifications/workflows:** Alerts for new/inactive leads and key events; workflows that create tasks/reminders; user-configurable notifications.

**Anti-patterns to flag**

- Heavy manual entry; inconsistent Kanban vs list UI; no applied-filters overview; deleting or hiding lost deals; forms that are long, validate on every keystroke, or lose input on error; dashboards with no hierarchy or misuse of red; mobile as an afterthought.

### What you must do

1. **Inspect the codebase and UI**  
   Identify and review the code and flows that implement:
   - Lead intake and editing (forms, validation, create/update).
   - Pipeline and stage management (Kanban, list, stage transitions, drag-and-drop).
   - Lead lists, filters, search, sorting, and saved views.
   - Tasks, reminders, and follow-ups (where they appear, how they’re created and completed).
   - Dashboards and overview screens (layout, KPIs, charts, real-time vs static).

2. **Compare to the best practices above**  
   For each area:
   - **Strengths:** What already aligns with the principles and patterns (list specific components/files and behaviors).
   - **Issues and gaps:** Usability problems, missing patterns, or anti-patterns (with references to components/pages and user flows).
   - **Friction points:** Where key flows are slow or confusing (e.g. adding a lead, changing stage, scheduling a follow-up, finding overdue tasks).

3. **Recommend specific, actionable improvements**  
   Propose changes that are implementable in this codebase, such as:
   - Layout, hierarchy, labeling, and navigation.
   - Forms: validation timing, error handling, field count, and preservation of input.
   - Tables, filters, sorting: applied-filters display, multi-value filters, saved views, column visibility.
   - Dashboards: KPI placement, chart types, real-time data, drill-down, and visual hierarchy.
   - Quick wins that would meaningfully improve lead-management efficiency.

### Required structure for your answer

1. **Executive summary**  
   Short overview: how well the CRM aligns with best practices, top strengths, top 3–5 issues, and highest-impact recommendations.

2. **Strengths vs best practices**  
   Bulleted list by area (lead intake, pipeline, lists/filters, tasks, dashboard, etc.) with component/page references where relevant.

3. **Issues and gaps**  
   Bulleted list of usability issues, missing patterns, and anti-patterns, with file/component names and user-flow context.

4. **Recommended UX/UI changes (prioritized)**  
   Group by priority (e.g. High / Medium / Lower). For each item: what to change, where in the codebase or UI, and brief rationale tied to the best practices above.

5. **Optional: future iterations or A/B tests**  
   Suggestions for later improvements or experiments (e.g. Kanban vs list default, dashboard personalization, notification timing).

Answer in the second person where appropriate (e.g. “You have…”, “Your lead form…”). Be concrete: cite file paths, component names, and user actions so a developer can act on your analysis.

---

*End of Cursor analysis prompt*
