# Security Audit Follow-Up – hadaryaCRM

**Date:** 23 February 2025  
**Scope:** Verify prior remediations, identify remaining issues  
**Reference:** [Initial audit](security-audit-2025-02-23.md)

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| **Critical (P0)** | 1 | .env tracked in git (secrets exposure) |
| **High (P1)** | 3 | RLS sales policy, XSS in send-quote, NotFound without auth |
| **Medium (P2)** | 4 | Validation, rate limiting, CORS, LeadDialog ILIKE |
| **Low (P3)** | 2 | env hygiene, VITE_ exposure |

### Verified Remediations (Prior P0 – Confirmed Fixed)

- **Shopify token in env** ✓ – Uses `VITE_SHOPIFY_STOREFRONT_TOKEN` from env; no hardcoding
- **Passwords in scripts** ✓ – Scripts use env vars; no credentials in code
- **ILIKE injection** ✓ – `escapeIlike` used in Customers.tsx, GlobalCommandPalette.tsx, Leads.tsx

---

## Detailed Findings

### 1. ILIKE / Search Injection

**Status:** ✓ Mostly remediated

| Location | Uses escapeIlike | Notes |
|---------|------------------|-------|
| `Customers.tsx` | ✓ | `or(\`name.ilike.%${escaped}%\`, ...)` |
| `GlobalCommandPalette.tsx` | ✓ | `or(\`customer_name.ilike.%${escaped}%\`, ...)` |
| `Leads.tsx` | ✓ | `or(\`customer_name.ilike.%${escaped}%\`, ...)` |
| `LeadDialog.tsx` (L216) | △ | `.ilike("customer_phone", \`%${digits}%\`)` – `digits` from `normalizePhone()` (digits only), so no `%`, `_`, `\` risk |

**P2 Recommendation:** For consistency and defense-in-depth, wrap `digits` in `escapeIlike()` in LeadDialog.tsx, even though `normalizePhone` returns only 0–9 characters.

**Ad-agency:** All filtering is client-side (Customers, Projects, Items, Tasks). No ILIKE used. ✓

---

### 2. send-quote Edge Function – XSS & Validation

**Status:** ✗ P1 open (as in prior audit)

#### XSS – Unescaped HTML Injection

All user-provided fields are interpolated into HTML without escaping:

| Field | Location | Risk |
|-------|----------|------|
| `item.title` | itemsHtml (L92) | High – injected into `<td>` |
| `customerName` | L135 | High |
| `customerAddress` | L135 | Medium |
| `companyName` | L129, 169, 177 | Medium |
| `quoteNumber`, `quoteDate` | headerSubline | Low (usually controlled) |
| `paymentTerms`, `validUntil`, `notes` | L165–167 | High |

**Example exploit:** Malicious `item.title = "<script>alert(1)</script>"` or `customerName = "<img src=x onerror=alert(1)>"` will execute in recipient’s email client.

#### Remediation

Add an `escapeHtml` helper and use it for all user-controlled values before HTML interpolation:

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

Apply to: `item.title`, `customerName`, `customerAddress`, `companyName`, `paymentTerms`, `notes`, and any other user-supplied text before inserting into the template.

#### Validation Gaps

- No schema/type validation – `data` is trusted as `SendQuoteRequest`
- No length limits – `item.title`, `notes`, etc. could be very long
- No email format validation on `customerEmail`
- No bounds checks on numeric fields (quantity, unit_price, total_price)

**P2 Recommendation:** Add Zod (or similar) validation with max lengths and format checks before processing.

---

### 3. Auth Flow & Route Protection

**Status:** △ Mostly correct; one gap

#### AuthContext ✓

- Uses Supabase `onAuthStateChange`
- Fetches role from `user_roles` for logged-in users
- Exposes `session`, `user`, `role`, `loading`, `signOut`

#### DashboardLayout ✓

- Redirects to `/auth` when `!session`
- Shows “Access Pending” when `!role`
- Used by: Dashboard, Leads, LeadDetail, Quotes, QuoteApproval, Customers, Products, Suppliers, Settings, Automations, all ad-agency pages (via EntityPageShell or directly)

#### NotFound Page ✗ P1

- **File:** `src/pages/NotFound.tsx`
- **Issue:** Not wrapped in `DashboardLayout`; rendered as `<Route path="*" element={<NotFound />} />`
- **Impact:** `/any-random-path` (e.g. `/foo`, `/admin-panel`) returns the 404 page without auth. Anyone can see the app shell structure and any future logic on the 404 page.
- **Remediation:** Either wrap NotFound in `DashboardLayout`, or ensure 404 redirects unauthenticated users to `/auth` before rendering.

---

### 4. RLS Policies

**Status:** ✗ P1 – Sales sees all leads (prior finding still open)

#### `has_crm_access` Definition

```sql
SELECT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = _user_id
);
```

Any user with any role (admin, sales, etc.) is treated as having full CRM access.

#### leads Policy

```sql
CREATE POLICY "CRM users can view leads" ON public.leads
  FOR SELECT USING (public.has_crm_access(auth.uid()));
```

There is no filter on `assigned_to`. Sales users can see all leads, not only their own.

#### Other Tables

- `deals`, `quotes`, `contracts`, `op_projects`, `op_clients`, `op_items`, etc. all use `has_crm_access` only, without role-specific restrictions.

#### Remediation (from prior audit)

Add role-aware policies for leads:

```sql
-- Sales sees only assigned leads; admins see all
CREATE POLICY "Sales view own leads" ON public.leads FOR SELECT
USING (
  has_role(auth.uid(), 'admin') 
  OR (has_role(auth.uid(), 'sales') AND assigned_to = auth.uid())
);
```

Apply similar logic if deals, quotes, or other entities should be scoped by assignment.

---

### 5. Sensitive Data & Secrets

**Status:** ✗ **CRITICAL – .env is tracked in git**

| Item | Assessment |
|------|------------|
| `.env` | **Tracked in git** (`git ls-files .env` returns the file). Contains `SERVICE_ROLE_KEY`, Supabase keys, Shopify token. Anyone with repo access can extract secrets. **Immediate remediation required.** |
| `VITE_*` vars | Inlined into client bundle at build time. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Designed to be public; RLS protects data ✓ |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Storefront API tokens are typically public; acceptable for storefront usage. |
| `SERVICE_ROLE_KEY` | In `.env` only, not `VITE_*` – not exposed to client ✓ |

**Immediate actions:** (1) `git rm --cached .env` and commit to stop tracking; ensure `.env` is in `.gitignore`; (2) Rotate `SERVICE_ROLE_KEY`, Supabase anon key, and Shopify token if the repo was ever shared or pushed remotely; (3) Add `.env.example` with placeholder values only.

---

### 6. CSRF, CORS & API Security

#### CSRF

- Supabase uses JWT Bearer auth in headers, not cookies. CSRF risk is low.
- `send-quote` and `website-lead` use JSON bodies with Bearer/session auth where applicable.

#### CORS

- `send-quote`: `Access-Control-Allow-Origin: *` – any origin can call if it has a valid token.
- `website-lead`: `Access-Control-Allow-Origin: *` – public endpoint, expected.

**P2 Recommendation:** For `send-quote`, consider restricting `Access-Control-Allow-Origin` to known app origins if feasible.

#### website-lead Edge Function

- No auth (public lead capture form)
- Basic validation (name, email format, length limits)
- No rate limiting – vulnerable to spam/abuse

**P2 Recommendation:** Add rate limiting (e.g. by IP or per-origin) to reduce spam.

---

### 7. Other Checks

| Check | Result |
|-------|--------|
| `dangerouslySetInnerHTML` in React | `chart.tsx` – uses static theme/config only, no user input ✓ |
| Raw SQL / string concatenation | No raw SQL; Supabase client used correctly ✓ |
| Input validation on API/Edge | website-lead: partial; send-quote: minimal ✗ |

---

## Risk Matrix

| ID | Finding | Severity | Exploitability |
|----|---------|----------|----------------|
| 0 | **.env tracked in git – secrets exposure** | **Critical** | High if repo shared/pushed |
| 1 | XSS in send-quote HTML | High | Medium – requires CRM access to craft/send |
| 2 | NotFound accessible without auth | High | Low – info disclosure / UX |
| 3 | RLS: sales sees all leads | High | N/A – policy design |
| 4 | send-quote: no validation | Medium | Low |
| 5 | website-lead: no rate limiting | Medium | High – spam |
| 6 | CORS * on send-quote | Medium | Low |
| 7 | LeadDialog ILIKE (digits only) | Low | None – digits only |

---

## Remediation Roadmap

### P0 (Critical) – Immediate

0. **Untrack .env** – Run `git rm --cached .env`; commit; verify `.env` in `.gitignore`. Rotate all secrets if repo was ever pushed to a remote or shared.
1. **send-quote XSS** – Implement `escapeHtml()` for all user-controlled fields before HTML interpolation.

### P1 (High) – Within 1–2 sprints

2. **NotFound auth** – Wrap NotFound in `DashboardLayout` or redirect unauthenticated users to `/auth` for 404.
3. **RLS sales policy** – Add role-based leads policy (e.g. sales sees only `assigned_to = auth.uid()`).

### P2 (Medium) – Within 2–4 sprints

4. **send-quote validation** – Add schema validation (e.g. Zod) with length/format/bounds checks.
5. **website-lead rate limiting** – Add IP- or origin-based rate limiting.
6. **CORS** – Restrict `send-quote` origins if possible.
7. **LeadDialog** – Use `escapeIlike(digits)` for consistency.

### P3 (Low)

8. **env hygiene** – Document `.env.example`, confirm no secrets in git history.
9. **VITE_ exposure** – Acceptable for anon/Storefront tokens; document in security notes.

---

## Appendix: Files Audited

- `src/lib/escapeIlike.ts` – ILIKE escaping ✓
- `src/pages/Customers.tsx`, `Leads.tsx`, `GlobalCommandPalette.tsx`, `LeadDialog.tsx` – search/ILIKE
- `supabase/functions/send-quote/index.ts` – XSS, validation
- `supabase/functions/website-lead/index.ts` – validation, rate limiting
- `src/contexts/AuthContext.tsx` – auth state
- `src/components/layout/DashboardLayout.tsx` – route protection
- `src/App.tsx`, `src/pages/NotFound.tsx` – routing
- `supabase/migrations/*.sql` – RLS policies
- `src/lib/shopify.ts` – env usage
- `src/integrations/supabase/client.ts` – Supabase config
