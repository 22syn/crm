# UI/UX Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Elevate Hadarya CRM UI/UX to a "Luxury / Refined" aesthetic—typography, colors, motion, depth—without generic AI aesthetics.

**Architecture:** Extend existing design system (CSS variables in index.css, Tailwind config). Add semantic colors and accent-action for primary CTAs. Introduce display font, keyframes for staggered reveals. Touch components incrementally. DRY—replace hardcoded teal with design tokens.

**Tech Stack:** React, Tailwind CSS, shadcn/ui, Vite. No new dependencies.

---

## Phase 1: Typography & Colors (Foundation)

### Task 1: Add display font and typography variables

**Files:**
- Modify: `src/index.css` (lines 1–51)

**Step 1: Add font import**

Replace the existing `@import` with:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Heebo:wght@300;400;500;600;700&display=swap');
```

**Step 2: Add typography variables**

Inside `:root` (after `--text-meta`), add:

```css
    --text-hero: 1.75rem;    /* 28px - page titles */
```

Update `--text-display` from `1.5rem` to `1.75rem`.

**Step 3: Add display font for headings**

In the `h1,h2,h3...` block (around line 119), change to:

```css
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: 'DM Serif Display', 'Heebo', sans-serif;
    font-weight: 500;
  }
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds, no errors.

**Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat(ui): add DM Serif Display font and typography hierarchy"
```

---

### Task 2: Add accent-action and semantic colors to CSS variables

**Files:**
- Modify: `src/index.css` (inside `:root`, after `--ring`)

**Step 1: Add new variables**

After `--ring: 30 15% 35%;` add:

```css
    /* Action accent - Teal (primary CTAs) */
    --accent-action: 168 45% 38%;
    --accent-action-foreground: 0 0% 100%;
    /* Semantic */
    --success: 142 65% 42%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 10%;
```

**Step 2: Add dark mode equivalents**

Inside `.dark`, after `--ring`, add:

```css
    --accent-action: 168 45% 45%;
    --accent-action-foreground: 0 0% 100%;
    --success: 142 65% 48%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 55%;
    --warning-foreground: 0 0% 10%;
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat(ui): add accent-action and semantic color variables"
```

---

### Task 3: Expose accent-action in Tailwind config

**Files:**
- Modify: `tailwind.config.ts` (inside `colors`)

**Step 1: Add accent-action and semantic colors**

After `card: { ... }`, add:

```ts
        "accent-action": {
          DEFAULT: "hsl(var(--accent-action))",
          foreground: "hsl(var(--accent-action-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(ui): expose accent-action and semantic colors in Tailwind"
```

---

### Task 4: Add accent-action button variant

**Files:**
- Modify: `src/components/ui/button.tsx`

**Step 1: Add variant**

In `buttonVariants`, under `variants.variant`, add:

```ts
        accent: "bg-accent-action text-accent-action-foreground hover:bg-accent-action/90",
```

**Step 2: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat(ui): add accent button variant"
```

---

### Task 5: Replace hardcoded teal in Leads.tsx

**Files:**
- Modify: `src/pages/Leads.tsx:607`

**Step 1: Replace class**

Change:

```tsx
className="rounded-sm bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-500"
```

to:

```tsx
className="rounded-sm"
variant="accent"
```

And ensure the Button has `variant="accent"` prop. Inspect the Button—it currently has no variant, so use:

```tsx
<Button
  variant="accent"
  className="rounded-sm"
  onClick={() => { setEditingLead(null); setDialogOpen(true); }}
>
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/pages/Leads.tsx
git commit -m "refactor(ui): use accent variant for New Lead button"
```

---

### Task 6: Replace hardcoded teal in LeadsEmptyState.tsx

**Files:**
- Modify: `src/components/leads/LeadsEmptyState.tsx:60-63`

**Step 1: Replace**

Change the "Add your first lead" Button from:

```tsx
className="rounded-sm bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-500"
```

to:

```tsx
variant="accent"
className="rounded-sm"
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/leads/LeadsEmptyState.tsx
git commit -m "refactor(ui): use accent variant in LeadsEmptyState"
```

---

### Task 7: Update LeadCard quote amount color

**Files:**
- Modify: `src/components/leads/LeadCard.tsx:125-127`

**Step 1: Replace**

Change:

```tsx
<div className="flex items-center gap-2 text-xs font-medium text-teal-600 dark:text-teal-400">
```

to:

```tsx
<div className="flex items-center gap-2 text-xs font-medium text-accent-action">
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/leads/LeadCard.tsx
git commit -m "refactor(ui): use accent-action for quote amount in LeadCard"
```

---

## Phase 2: Backgrounds & Visual Depth

### Task 8: Add subtle gradient and grain to body background

**Files:**
- Modify: `src/index.css` (body styles)

**Step 1: Add gradient background**

In the `body` block, replace:

```css
  body {
    @apply bg-background text-foreground;
    font-family: 'Heebo', sans-serif;
  }
```

with:

```css
  body {
    @apply text-foreground;
    font-family: 'Heebo', sans-serif;
    background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(40 18% 95%) 100%);
    min-height: 100vh;
  }
```

For dark mode, add inside `.dark` (or a `body.dark` rule if using next-themes):

```css
  .dark body {
    background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(30 12% 8%) 100%);
  }
```

**Note:** If the app does not use a `.dark` class on html/body, skip dark body gradient for now to avoid scope creep.

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(ui): add subtle gradient to body background"
```

---

### Task 9: Add card-enter and slide-in-right keyframes

**Files:**
- Modify: `tailwind.config.ts` (inside keyframes)

**Step 1: Add keyframes**

After `"lead-reveal"`, add:

```ts
        "card-enter": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
```

**Step 2: Add animation utilities**

In `animation`, add:

```ts
        "card-enter": "card-enter 0.35s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
```

**Step 3: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(ui): add card-enter and slide-in-right animations"
```

---

### Task 10: Apply staggered reveal to StatsCards

**Files:**
- Modify: `src/components/dashboard/StatsCards.tsx`

**Step 1: Add animation to StatCard**

In the `content` JSX (or the Card wrapper), add `animate-card-enter` and `style={{ animationDelay: `${index * 50}ms` }}` to each card. The parent maps over `statCards`, so use index:

```tsx
{statCards.map((stat, index) => (
  <div key={stat.title} className="animate-card-enter opacity-0" style={{ animationDelay: `${index * 50}ms` }}>
    <StatCard key={stat.title} {...stat} href={stat.href} trend={stat.trend} />
  </div>
))}
```

Ensure the grid wrapper allows this. Update the map in the return:

```tsx
<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
  {statCards.map((stat, index) => (
    <div key={stat.title} className="animate-card-enter opacity-0" style={{ animationDelay: `${index * 50}ms` }}>
      {stat.href ? (
        <Link to={stat.href} className="block">
          <Card className="transition-colors hover:bg-muted/50 cursor-pointer h-full">...</Card>
        </Link>
      ) : (
        <Card>...</Card>
      )}
    </div>
  ))}
</div>
```

**Step 2: Wrap StatCard in animated div**

`content` is defined inside StatCard, so the animation wrapper must wrap the StatCard component. Update the map:

```tsx
{statCards.map((stat, index) => (
  <div
    key={stat.title}
    className="animate-card-enter opacity-0"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <StatCard {...stat} href={stat.href} trend={stat.trend} />
  </div>
))}
```

**Step 3: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/dashboard/StatsCards.tsx
git commit -m "feat(ui): staggered card-enter animation for StatsCards"
```

---

### Task 11: Enhance Auth page background and card

**Files:**
- Modify: `src/pages/Auth.tsx`

**Step 1: Update container**

Change the outer div from:

```tsx
<div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
```

to:

```tsx
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/40 to-background p-4">
```

**Step 2: Add shadow to Card**

Change:

```tsx
<Card className="w-full max-w-md">
```

to:

```tsx
<Card className="w-full max-w-md shadow-lg">
```

**Step 3: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/pages/Auth.tsx
git commit -m "feat(ui): enhance Auth page background and card shadow"
```

---

### Task 12: Add hover shadow to LeadCard

**Files:**
- Modify: `src/components/leads/LeadCard.tsx`

**Step 1: Update Card className**

The Card already has `hover:shadow-lg`. Ensure it has a base shadow for consistency. Change to:

```tsx
className="w-full min-w-0 flex-shrink-0 overflow-hidden rounded-sm cursor-grab active:cursor-grabbing transition-shadow duration-200 ease-out hover:shadow-lg shadow-sm focus-within:ring-2 ..."
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/leads/LeadCard.tsx
git commit -m "feat(ui): add base shadow to LeadCard"
```

---

### Task 13: Add hover shadow to DealCard

**Files:**
- Modify: `src/components/deals/DealCard.tsx`

**Step 1: Update Card className**

Change from `hover:shadow-md` to include base shadow:

```tsx
className="w-full flex-shrink-0 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/deals/DealCard.tsx
git commit -m "feat(ui): add base shadow to DealCard"
```

---

## Phase 3: UX Polish

### Task 14: Improve LeadsEmptyState visual hierarchy

**Files:**
- Modify: `src/components/leads/LeadsEmptyState.tsx`

**Step 1: Add icon and improve typography**

For the "Add your first lead" state: add `Plus` (already imported) above the text. For the "No leads match" state: add `FilterX` (already imported).

```tsx
// "Add your first lead" state:
<div className="rounded-sm border border-dashed bg-muted/30 py-12 px-6 text-center">
  <Plus className="h-12 w-12 mx-auto text-muted-foreground/60 mb-4" />
  <p className="text-title font-medium text-foreground">Add your first lead</p>
  ...
</div>

// "No leads match" state - add before the first <p>:
<FilterX className="h-12 w-12 mx-auto text-muted-foreground/60 mb-4" />
<p className="text-body font-medium text-foreground">No leads match your filters</p>
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/leads/LeadsEmptyState.tsx
git commit -m "feat(ui): add icons and improve empty state hierarchy"
```

---

### Task 15: Add stagger to Dashboard sections

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Step 1: Add animation classes**

Wrap the main sections in animated divs. For the grid with OrdersChart and LeadsBySourceChart:

```tsx
<div className="grid gap-4 md:grid-cols-2 animate-card-enter opacity-0" style={{ animationDelay: '200ms' }}>
```

For the ActivityFeed + QuickActions grid:

```tsx
<div className="grid gap-4 md:grid-cols-2 animate-card-enter opacity-0" style={{ animationDelay: '300ms' }}>
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(ui): staggered animation for Dashboard sections"
```

---

### Task 16: Improve Sidebar active state and spacing

**Files:**
- Modify: `src/components/ui/sidebar.tsx` (SidebarMenuButton) or `src/components/layout/DashboardSidebar.tsx`

**Step 1: Inspect SidebarMenuButton**

The sidebar uses `SidebarMenuButton asChild isActive={...}`. The active state styling is likely in the sidebar UI component. Check `src/components/ui/sidebar.tsx` for `data-active` or similar.

**Step 2: Add spacing between groups**

In DashboardSidebar, add `mt-4` or `space-y-4` to `SidebarGroup` for "Admin" to create visual separation. Example:

```tsx
{role === "admin" && (
  <SidebarGroup className="mt-4">
```

**Step 3: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/layout/DashboardSidebar.tsx
git commit -m "feat(ui): improve sidebar group spacing"
```

---

## Phase 4: Final Verification

### Task 17: Run full build and lint

**Files:** None

**Step 1: Build**

Run: `npm run build`
Expected: Build succeeds.

**Step 2: Lint**

Run: `npm run lint`
Expected: No errors (fix any introduced issues).

**Step 3: Commit (if fixes applied)**

```bash
git add .
git commit -m "chore: fix lint issues after UI improvements"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2025-02-21-ui-ux-improvements.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, and iterate quickly.

**2. Parallel Session (separate)** — Open a new session with @superpowers:executing-plans for batch execution with checkpoints.

Which approach?
