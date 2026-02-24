# Implementation Status — Comprehensive Improvements Plan

**Last updated:** 2026-02-24

---

## Done

### Phase 1: Critical Security & Code Fixes
| Task | Description | Status |
|------|-------------|--------|
| 1 | Remove .env from git tracking | Done |
| 2 | Fix NaN from production fee input | Done |
| 3 | Escape HTML in send-quote email (XSS) | Done |
| 4 | escapeIlike in LeadDialog phone search | Done |
| 5 | Fix misleading client.ts comment | Done |

### Phase 2: Architecture & Route Protection
| Task | Description | Status |
|------|-------------|--------|
| 6 | ProtectedLayout + centralize route protection | Done |
| 7 | QueryClient defaults (staleTime, refetchOnWindowFocus) | Done |

### Phase 2.5: Modular Permissions
| Task | Description | Status |
|------|-------------|--------|
| A1 | Migration: profiles.super_admin, user_module_roles | Done |
| A2 | Helper functions: is_super_admin, has_module_access, has_module_admin | Done |
| A3 | RLS: leads module | Done |
| A4 | RLS: ad_agency, system modules | Done |
| A6 | AuthContext: moduleRoles, canAccessModule, isModuleAdmin | Done |
| A7 | DashboardSidebar: filter by module access | Done |
| A8 | Settings: restrict by system admin + sync user_module_roles on add/remove | Done |
| A9 | Pages: replace role checks with isModuleAdmin(module) | Done |

** migrations applied to remote DB**

---

## Not Done (deferred / optional)

### Phase 2.5
| Task | Description | Notes |
|------|-------------|-------|
| A5 | Drop user_roles | Defer until all code uses user_module_roles. Settings still inserts both. |
| A10 | scripts/add-user.js, send-quote: use user_module_roles | add-user uses user_roles; send-quote uses has_crm_access (DB function, already updated) |
| A11 | Regenerate Supabase types | Run when ready: `npx supabase gen types typescript --project-id <REF> > src/integrations/supabase/types.ts` |
| A12 | RLS: leads user = only assigned_to | Optional refinement |

### Phase 3: Code Simplicity
| Task | Description |
|------|-------------|
| 8 | Centralize ad-agency status constants |
| 9 | Extract rowTotal helper |
| 10 | Remove unused renderExtra from EntityToolbar |

### Phase 4: Performance
| Task | Description |
|------|-------------|
| 11 | Lazy-load exportBudgetToExcel |

### Phase 5: Frontend
| Task | Description |
|------|-------------|
| 12 | Add background grain |
| 13 | Update accent color |

### Phase 6
| Task | Description |
|------|-------------|
| 14 | Regenerate types + remove unsafe casts |

---

## Verification

- [x] `npm run build` passes
- [x] Migrations applied to remote DB
- [x] escapeHtml in send-quote
- [x] escapeIlike in LeadDialog, Customers, Leads, GlobalCommandPalette
- [x] Settings add/remove syncs user_module_roles

---

## Critical Fix Applied

**Settings team add:** Previously, new users added via Settings only got `user_roles`. AuthContext reads from `user_module_roles`, so they saw "Access Pending". Fixed by having addRoleMutation also insert into `user_module_roles`, and removeRoleMutation delete from both tables.
