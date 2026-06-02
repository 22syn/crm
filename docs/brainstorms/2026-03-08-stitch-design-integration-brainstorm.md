# Brainstorm: Stitch Design Integration — HadaryaCRM

**Date:** 2026-03-08  
**Status:** Draft  
**Context:** Integrate Stitch designs into hadaryaCRM with full design system consistency, all pages, dark/light mode, and responsive (mobile + desktop).

---

## What We're Building

1. **Unified design system** — All 46 Stitch screens (23 pages × Desktop/Mobile) follow the same design system (colors, fonts, shared components).
2. **Light + Dark mode** — Implemented via Tailwind + CSS variables in the app. Stitch screens serve as layout reference in Dark theme.
3. **Responsive** — Desktop and Mobile layouts for every page, aligned with Stitch-generated designs.
4. **Implementation** — Stitch as visual reference only. React components (existing shadcn-based) are aligned to match. No HTML-to-React conversion.
5. **Typography** — Align to Stitch design system (INTER for DemoCRM).
6. **RTL** — Ad Agency section only. Layout and components support `dir="rtl"` where needed.

---

## Key Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Design system source | **B** — Regenerate all Stitch screens from `stitch-prompts.json` (single source of truth) |
| 2 | Light/Dark in Stitch | **B** — Generate 46 screens in Dark mode only. Light mode = CSS/Tailwind in code |
| 3 | Implementation approach | **A** — Reference only. Stitch = visual source; React components aligned manually |
| 4 | Typography | Align to Stitch design system (DemoCRM uses INTER) |
| 5 | RTL | Ad Agency section only — in scope |
| 6 | Regeneration scope | **C** — Keep existing; generate new; skip pages that already have screens |

---

## Why This Approach

- **stitch-prompts.json** already defines the design system. Regenerating ensures consistency.
- **Light mode in code** — Stitch is for layout/structure. Colors vary by theme; Tailwind handles both. No need for 92 screens.
- **Reference only** — Stitch HTML is not modular. Existing hadaryaCRM components (Kanban, DataTable, Sidebar) are solid; alignment is faster than conversion.

---

## Proposed Approaches (Execution Order)

### Approach 1: Design-System-First (Recommended)

1. **Refine design tokens** — Ensure `index.css` + `tailwind.config.ts` match `stitch-prompts.json` (sidebar `#0f1025`, card `#151938`, accent `#1337ec`, light equivalents).
2. **Update shared components** — Sidebar, Header, DataTable, Kanban cards, etc. Align to tokens.
3. **Generate Stitch screens** — Run `npm run stitch:run -- --all` (or phased). 46 screens, Dark theme.
4. **Page-by-page alignment** — Use Stitch screens as reference. Adjust layout, spacing, content per page.

**Pros:** Tokens first = consistency everywhere. Components updated once, all pages inherit.  
**Cons:** Design tokens phase takes upfront time.  
**Best for:** Clean, maintainable outcome.

---

### Approach 2: Stitch-First

1. **Generate all 46 Stitch screens** — From stitch-prompts.json. No code changes yet.
2. **Audit outputs** — Review screenshots. Identify gaps, inconsistencies.
3. **Update design system** — Extract patterns from Stitch. Align `index.css`, tailwind, components.
4. **Align pages** — One by one, using Stitch as reference.

**Pros:** Visual reference ready from day one.  
**Cons:** May discover token mismatches late; Stitch outputs might need regeneration.  
**Best for:** When Stitch generation is quick and iteration is acceptable.

---

### Approach 3: Incremental (Canonical Page)

1. **Pick canonical page** — Dashboard (has sidebar, cards, charts, activity feed).
2. **Generate Dashboard Desktop + Mobile** in Stitch.
3. **Align Dashboard in React** — Full design system extraction: tokens, components, layout.
4. **Generate remaining 44 screens** — Using same design system.
5. **Roll out** — Apply Dashboard patterns to other pages. Reuse aligned components.

**Pros:** Fast feedback; learn from one page before scaling.  
**Cons:** Risk of rework if canonical page isn’t representative.  
**Best for:** When you want early validation.

---

## Recommendation: Approach 1 (Design-System-First)

Reasons:
1. **Original goal** — "צריך לוודא קודם כל שלכל הדפים ב stitch יש design system" — design system first.
2. **stitch-prompts.json** already defines tokens. Mapping to CSS is straightforward.
3. **Components exist** — Sidebar, Kanban, DataTable already have `stitch-dark` variants. Extending tokens and aligning is incremental.
4. **Stitch generation** — With tokens locked, Stitch prompts will produce consistent outputs.

---

## Open Questions

*(None — all resolved.)*

---

## Resolved Questions

*(Moved here as they are answered.)*

- **Design system source:** Regenerate from stitch-prompts.json ✓
- **Light/Dark:** 46 screens in Dark; Light in Tailwind ✓
- **Implementation:** Reference only; no HTML conversion ✓
- **Typography:** Align to Stitch design system (DemoCRM uses INTER) ✓
- **RTL:** Ad Agency only — in scope for this phase ✓
- **Regeneration scope:** Keep existing; generate new; skip pages that already have screens (C) ✓

---

## Next Steps

1. Run `/workflows:plan` to create implementation plan.
2. Plan will cover: token mapping, component updates, Stitch regeneration script (with skip-if-exists), page alignment checklist, RTL for Ad Agency.
