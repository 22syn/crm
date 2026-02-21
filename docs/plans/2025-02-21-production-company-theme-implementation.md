# Production Company Theme Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Demo CRM from furniture (Beige/Taupe) to production-company (Clean Creative) theme — cool palette, purple-magenta accent, modern agency feel.

**Architecture:** Replace all CSS variables in `src/index.css` — both `:root` and `.dark`. Update body gradient to cool hue. No new dependencies. Design doc: `docs/plans/2025-02-21-production-company-theme-design.md`.

**Tech Stack:** React, Tailwind CSS, shadcn/ui, Vite.

---

## Task 1: Update :root light palette — core colors

**Files:**
- Modify: `src/index.css` (lines 10–42)

**Step 1: Replace comment and core variables**

Change the comment and the block from line 11 through 42:

```css
    /* Demo Design System - Production Company (Clean Creative) */
    --background: 220 15% 98%;
    --foreground: 220 20% 15%;

    --card: 220 15% 99%;
    --card-foreground: 220 20% 15%;

    --popover: 220 15% 99%;
    --popover-foreground: 220 20% 15%;

    /* Primary - Cool dark */
    --primary: 220 20% 25%;
    --primary-foreground: 220 15% 98%;

    /* Secondary - Light cool gray */
    --secondary: 220 20% 95%;
    --secondary-foreground: 220 20% 25%;

    /* Muted */
    --muted: 220 15% 93%;
    --muted-foreground: 220 15% 45%;

    /* Accent - Light cool */
    --accent: 220 20% 90%;
    --accent-foreground: 220 20% 25%;

    --destructive: 0 65% 55%;
    --destructive-foreground: 220 15% 98%;

    --border: 220 15% 90%;
    --input: 220 15% 90%;
    --ring: 220 20% 35%;

    /* Action accent - Purple-magenta (primary CTAs) */
    --accent-action: 262 55% 50%;
    --accent-action-foreground: 0 0% 100%;
```

**Step 2: Verify build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(ui): production company theme - core palette"
```

---

## Task 2: Update :root sidebar variables

**Files:**
- Modify: `src/index.css` (lines 66–74)

**Step 1: Replace sidebar block**

Change:

```css
    /* Sidebar - Elegant Dark */
    --sidebar-background: 30 12% 22%;
    --sidebar-foreground: 40 15% 92%;
    --sidebar-primary: 35 20% 85%;
    --sidebar-primary-foreground: 30 12% 22%;
    --sidebar-accent: 30 10% 28%;
    --sidebar-accent-foreground: 40 15% 92%;
    --sidebar-border: 30 10% 30%;
    --sidebar-ring: 35 20% 85%;
```

to:

```css
    /* Sidebar - Cool dark */
    --sidebar-background: 220 15% 18%;
    --sidebar-foreground: 220 15% 92%;
    --sidebar-primary: 220 15% 85%;
    --sidebar-primary-foreground: 220 15% 18%;
    --sidebar-accent: 220 12% 25%;
    --sidebar-accent-foreground: 220 15% 92%;
    --sidebar-border: 220 12% 25%;
    --sidebar-ring: 220 15% 85%;
```

**Step 2: Verify build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(ui): production company theme - sidebar"
```

---

## Task 3: Update .dark palette

**Files:**
- Modify: `src/index.css` (lines 77–121)

**Step 1: Replace entire .dark block**

Change the `.dark` block to:

```css
  .dark {
    --background: 220 15% 10%;
    --foreground: 220 15% 92%;

    --card: 220 15% 14%;
    --card-foreground: 220 15% 92%;

    --popover: 220 15% 14%;
    --popover-foreground: 220 15% 92%;

    --primary: 220 15% 90%;
    --primary-foreground: 220 15% 10%;

    --secondary: 220 12% 22%;
    --secondary-foreground: 220 15% 92%;

    --muted: 220 12% 20%;
    --muted-foreground: 220 15% 60%;

    --accent: 220 12% 25%;
    --accent-foreground: 220 15% 92%;

    --destructive: 0 55% 45%;
    --destructive-foreground: 220 15% 92%;

    --border: 220 12% 25%;
    --input: 220 12% 25%;
    --ring: 220 15% 75%;

    --accent-action: 262 55% 60%;
    --accent-action-foreground: 0 0% 100%;
    --success: 142 65% 48%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 55%;
    --warning-foreground: 0 0% 10%;

    --sidebar-background: 220 15% 8%;
    --sidebar-foreground: 220 15% 92%;
    --sidebar-primary: 220 15% 85%;
    --sidebar-primary-foreground: 220 15% 8%;
    --sidebar-accent: 220 12% 18%;
    --sidebar-accent-foreground: 220 15% 92%;
    --sidebar-border: 220 12% 18%;
    --sidebar-ring: 220 15% 85%;
  }
```

**Step 2: Verify build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(ui): production company theme - dark mode"
```

---

## Task 4: Update body gradient

**Files:**
- Modify: `src/index.css` (line 133)

**Step 1: Replace gradient**

Change:

```css
    background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(40 18% 95%) 100%);
```

to:

```css
    background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(220 15% 94%) 100%);
```

**Step 2: Verify build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(ui): cool gradient for production theme"
```

---

## Task 5: Verify full build and lint

**Files:** None

**Step 1: Build**

Run: `npm run build`  
Expected: Build succeeds.

**Step 2: Lint**

Run: `npm run lint`  
Expected: No errors.

**Step 3: Commit (if any fixes)**

```bash
git add .
git commit -m "chore: lint after theme update"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2025-02-21-production-company-theme-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, and iterate quickly.

**2. Parallel Session (separate)** — Open a new session with @superpowers:executing-plans for batch execution with checkpoints.

**Which approach?**
