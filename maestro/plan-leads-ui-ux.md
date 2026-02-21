# Feature Implementation Plan: Leads Page UI/UX Alignment with Frontend Specialist

**Overall Progress:** `100%`

## TLDR

Align the Leads pipeline page with the frontend-specialist rules: remove purple, commit to a clear geometry (sharp or very rounded), add light motion and depth, and introduce one clear differentiator so the layout doesn’t read as “generic CRM template.”

## Critical Decisions

- **Purple removal:** Replace purple status (e.g. “In Process”) with an allowed accent (e.g. amber, teal, or distinct blue) so we comply with the specialist’s purple ban.
- **Geometry:** Pick one extreme—either sharp (0–2px) for a technical/premium feel or very rounded (16–24px) for a friendlier feel—and apply consistently to cards, buttons, and inputs; avoid the 4–8px “safe” zone.
- **Motion scope:** Add hover/focus micro-interactions and optional entrance/reveal; use GPU-friendly properties and respect `prefers-reduced-motion`; no heavy animation scope beyond what’s needed for “alive” feel.
- **One differentiator:** Limit to one bold layout or color move (e.g. sidebar behavior or a single strong accent) to avoid scope creep while improving memorability.

## Tasks

- [x] 🟩 **Step 1: Remove purple from status system**
  - [x] 🟩 Locate status color definitions (Kanban columns, dots, pills) in codebase
  - [x] 🟩 Replace purple/violet/indigo for “In Process” (and any other status) with an allowed accent (e.g. amber or teal)
  - [x] 🟩 Ensure no purple remains in Leads pipeline UI

- [x] 🟩 **Step 2: Commit to geometry (sharp or very rounded)**
  - [x] 🟩 Choose one: sharp (0–2px) or very rounded (16–24px) for Leads surface
  - [x] 🟩 Update Lead cards, column containers, and primary buttons to use the chosen radius consistently
  - [x] 🟩 Align filter dropdowns, search input, and any new controls with the same geometry

- [x] 🟩 **Step 3: Add micro-interactions and optional reveal**
  - [x] 🟩 Card hover: subtle scale and/or shadow change (transform + opacity only)
  - [x] 🟩 Visible focus states for keyboard (cards, buttons, filters)
  - [x] 🟩 Optional: light stagger/entrance for pipeline columns or cards on load
  - [x] 🟩 Add `prefers-reduced-motion` handling for all motion

- [x] 🟩 **Step 4: One layout or color differentiator**
  - [x] 🟩 Decide single differentiator (teal accent on primary CTA)
  - [x] 🟩 Implement only that differentiator on Leads (New Lead button)
  - [x] 🟩 Verify the page no longer reads as “generic CRM template” in spirit

- [x] 🟩 **Step 5: Verify and document**
  - [x] 🟩 Run `npm run lint && npx tsc --noEmit`
  - [x] 🟩 Quick pass: no purple, consistent geometry, motion and reduced-motion work, one clear differentiator
