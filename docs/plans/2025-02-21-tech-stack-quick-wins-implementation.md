# Tech Stack Quick Wins — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the three quick wins from the tech stack evaluation to improve productivity and maintainability.

**Architecture:** Minimal, focused changes. Add debounce where server search fires on keystroke; align maestro config with actual stack; optionally extract Leads subcomponents.

**Tech Stack:** React, TypeScript, TanStack Query, Supabase, Maestro config.

---

## Task 1: Add search debounce to Customers page

**Files:**
- Modify: `src/pages/Customers.tsx` (lines 61-76, 79, 296)

**Step 1: Add debounced search state**

Customers currently uses `searchQuery` directly in `useQuery`'s `queryKey`, causing a Supabase request on every keystroke. Mirror the Leads pattern: `searchInput` (immediate) and `search` (debounced, used in query).

```tsx
// Add after line 61 (searchQuery state)
const [searchInput, setSearchInput] = useState("");
const [search, setSearch] = useState("");

// Add useEffect for debounce (300ms)
useEffect(() => {
  const t = setTimeout(() => {
    setSearch(searchInput);
    setPage(0);
  }, 300);
  return () => clearTimeout(t);
}, [searchInput]);

// Replace handleSearchChange
const handleSearchChange = (val: string) => setSearchInput(val);
```

**Step 2: Use `search` in queryKey, not searchQuery**

Change `queryKey: ["customers", page, searchQuery]` to `queryKey: ["customers", page, search]`.

Change the query filter from `searchQuery` to `search`.

**Step 3: Update Input binding**

Change the search Input's `value={searchQuery}` to `value={searchInput}` and `onChange` to use `handleSearchChange`.

**Step 4: Verify**

Run `npm run dev`, go to `/customers`, type in search — network tab should show requests only after 300ms idle.

**Step 5: Commit**

```bash
git add src/pages/Customers.tsx
git commit -m "fix: add 300ms debounce to Customers search"
```

---

## Task 2: Add search debounce to GlobalCommandPalette

**Files:**
- Modify: `src/components/GlobalCommandPalette.tsx` (lines 39-67)

**Step 1: Add debounced search for query**

Keep `search` for the input value. Add `debouncedSearch` state and a useEffect that debounces `search` by 300ms into `debouncedSearch`.

**Step 2: Use debouncedSearch in useQuery**

Change `queryKey: ["global-search-leads", search]` to `queryKey: ["global-search-leads", debouncedSearch]`.

Change `enabled` to `open && debouncedSearch.length >= 2` (or keep `search.length >= 2` for UX — show "Searching..." earlier).

Use `debouncedSearch` in the queryFn filter.

**Step 3: Verify**

Open palette (Cmd+K), type quickly — requests should fire 300ms after typing stops.

**Step 4: Commit**

```bash
git add src/components/GlobalCommandPalette.tsx
git commit -m "fix: add 300ms debounce to GlobalCommandPalette search"
```

---

## Task 3: Update maestro.config.json to Supabase

**Files:**
- Modify: `maestro/maestro.config.json`

**Step 1: Replace Firebase with Supabase in techStack**

Current backend section says Firebase. Replace with Supabase to match actual stack:

```json
"backend": {
  "platform": "Supabase",
  "services": ["Postgres", "Auth", "Storage", "Edge Functions"],
  "additional": []
},
"infrastructure": {
  "hosting": "Vercel",
  "database": "Supabase",
  "additional": []
},
"monitoring": {
  "errorTracking": "Sentry",
  "analytics": null,
  "additional": []
}
```

Update `frontend.styling` to "Tailwind CSS v3" (or remove v4 if incorrect). Remove `animations: "Framer Motion"` if not used. Remove `shared.packages` if `@cms/shared` is not in the project.

**Step 2: Verify**

Check `maestro.config.json` is valid JSON.

**Step 3: Commit**

```bash
git add maestro/maestro.config.json
git commit -m "chore: update maestro config to Supabase"
```

---

## Task 4 (Optional): Split Leads.tsx into smaller components

**Goal:** Reduce `Leads.tsx` (~880 lines) by extracting logical blocks.

**Suggested extractions:**
- `LeadsToolbar` — filters, view toggle, bulk actions bar
- `LeadsBulkActionsBar` — sticky bar when selection active
- `LeadTableSection` / `LeadKanbanSection` — table vs kanban content

Defer if not blocking; lower priority than Tasks 1–3.

---

## Execution Handoff

Plan saved to `docs/plans/2025-02-21-tech-stack-quick-wins-implementation.md`.

**Options:**

1. **Subagent-Driven (this session)** — I run tasks one by one with subagents, you review between tasks.
2. **You implement** — Use this plan as a checklist and implement manually.
3. **Defer Task 4** — Implement Tasks 1–3 only; split Leads.tsx later if needed.

Which approach do you prefer?
