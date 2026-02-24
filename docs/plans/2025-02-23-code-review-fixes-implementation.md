# Code Review Fixes (ad-agency-operations) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address all Critical and Important issues from the ad-agency-operations code review before merge.

**Architecture:** Five independent fixes across frontend (React), Supabase Edge Function (Deno), and shared types. No schema changes. Each fix is isolated and can be committed separately.

**Tech Stack:** React, TypeScript, Supabase (Edge Functions), Vite

---

## Task 1: Fix NaN from production fee input

**Files:**
- Modify: `src/components/ad-agency/ProjectDetailTabs.tsx:248-251`

**Step 1: Implement the fix**

`parseFloat("")` returns `NaN`, and `??` only handles `null`/`undefined`. Replace:

```tsx
onBlur={(e) => {
  const v = parseFloat(e.target.value) ?? 15;
  if (v !== productionFeePct) projectUpdateMutation.mutate({ production_fee_percent: v });
}}
```

With:

```tsx
onBlur={(e) => {
  const v = parseFloat(e.target.value);
  if (!Number.isNaN(v) && v !== productionFeePct) {
    projectUpdateMutation.mutate({ production_fee_percent: v });
  }
}}
```

**Step 2: Manual verification**

1. Run dev server: `npm run dev`
2. Open a project detail, edit "עמלת הפקה (%)", clear the field completely, blur.
3. Confirm no mutation runs (no network request with `production_fee_percent: NaN`).
4. Enter valid value (e.g. 15), blur. Confirm update succeeds.

**Step 3: Commit**

```bash
git add src/components/ad-agency/ProjectDetailTabs.tsx
git commit -m "fix: prevent NaN from production fee input on blur"
```

---

## Task 2: Escape HTML in send-quote email to prevent XSS

**Files:**
- Modify: `supabase/functions/send-quote/index.ts`

**Step 1: Add escapeHtml helper and escape all user-controlled fields**

Add after the `corsHeaders` constant (around line 11):

```ts
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

**Step 2: Apply escapeHtml to all interpolated user data**

Replace `itemsHtml` construction (lines 90-97):

```ts
const itemsHtml = data.items.map(item => `
  <tr>
    <td style="...">${escapeHtml(item.title)}</td>
    ...
  </tr>
`).join('');
```

Update these interpolations in `emailHtml`:
- `${headerSubline}` → `escapeHtml(headerSubline)` (line 127)
- `${companyName}` → `escapeHtml(companyName)` (lines 129, 176)
- `${data.customerName}` → `escapeHtml(data.customerName)` (line 135)
- `${data.customerAddress}` → `escapeHtml(data.customerAddress)` (line 135, conditional part)
- `${data.paymentTerms}` → `escapeHtml(data.paymentTerms)` (line 165)
- `${data.notes}` → `escapeHtml(data.notes)` (line 167)

For `headerSubline`, ensure it's a string: `escapeHtml(String(headerSubline ?? ""))`.

For `data.customerAddress` in the conditional: `data.customerAddress ? ` · ${escapeHtml(data.customerAddress)}` : ""`.

**Step 3: Verify**

Run: `npm run build` (or equivalent) to ensure no TypeScript errors.
Optional: Send a test quote with `<script>alert(1)</script>` in a field; confirm it is escaped in the email HTML source.

**Step 4: Commit**

```bash
git add supabase/functions/send-quote/index.ts
git commit -m "fix: escape user-controlled HTML in send-quote email to prevent XSS"
```

---

## Task 3: Regenerate Supabase types and remove unsafe casts

**Files:**
- Modify: `src/integrations/supabase/types.ts` (regenerate)
- Modify: `src/components/ad-agency/ClientDialog.tsx`
- Modify: `src/components/ad-agency/ItemTable.tsx`

**Step 1: Regenerate types**

Ensure Supabase CLI is available and project is linked. Run:

```bash
npx supabase gen types typescript --project-id <PROJECT_REF> > src/integrations/supabase/types.ts
```

Or if using local:

```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

If local DB is not running, use `--project-id` with your project ref from `supabase/config.toml` or dashboard.

**Step 2: Remove or fix type casts**

- In `ClientDialog.tsx`: If `payment_terms` exists in generated types, remove the cast `(client as { payment_terms?: string | null })`.
- In `ItemTable.tsx`: If `section_id` exists on `OpItem` in generated types, remove the cast `(item as OpItem & { section_id?: string | null })`.

If types still lack these columns, add proper type augmentation in a `supabase/database.types.d.ts` or extend the generated interface instead of using `as` in component code.

**Step 3: Run type-check**

```bash
npm run build
```

Expected: No type errors.

**Step 4: Commit**

```bash
git add src/integrations/supabase/types.ts src/components/ad-agency/ClientDialog.tsx src/components/ad-agency/ItemTable.tsx
git commit -m "chore: regenerate Supabase types and remove unsafe casts"
```

---

## Task 4: Use escapeIlike in LeadDialog phone search

**Files:**
- Modify: `src/components/leads/LeadDialog.tsx`

**Step 1: Add import**

Add to imports (near other `@/lib` imports):

```ts
import { escapeIlike } from "@/lib/escapeIlike";
```

**Step 2: Wrap digits in escapeIlike**

Change line 216 from:

```ts
.ilike("customer_phone", `%${digits}%`)
```

To:

```ts
.ilike("customer_phone", `%${escapeIlike(digits)}%`)
```

**Step 3: Verify**

```bash
npm run build
```

Expected: Build passes. Manually test lead duplicate check by phone (optional).

**Step 4: Commit**

```bash
git add src/components/leads/LeadDialog.tsx
git commit -m "fix: escape ILIKE wildcards in LeadDialog phone search"
```

---

## Task 5: Fix misleading client.ts comment

**Files:**
- Modify: `src/integrations/supabase/client.ts:1`

**Step 1: Update comment**

Replace:

```ts
// This file is automatically generated. Do not edit it directly.
```

With:

```ts
// Supabase client configuration. Uses env vars VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
```

**Step 2: Verify**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/integrations/supabase/client.ts
git commit -m "docs: fix misleading auto-generated comment in client.ts"
```

---

## Checklist (final verification)

- [ ] All 5 tasks committed
- [ ] `npm run build` passes
- [ ] No new linter errors
- [ ] Critical: NaN fix and XSS fix both verified
