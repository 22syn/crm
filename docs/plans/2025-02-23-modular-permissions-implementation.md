# Modular Permissions — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace global admin/sales with per-module permissions (leads, ad_agency, system), each with admin/user roles, plus Super-Admin.

**Architecture:** New `user_module_roles` table + `profiles.super_admin`. Migration from `user_roles`. RLS updated per module. AuthContext exposes `moduleRoles`, `canAccessModule`, `isModuleAdmin`. Sidebar and pages filter by module access.

**Tech Stack:** React, TypeScript, Supabase (Postgres RLS, Auth)

**Design Doc:** `docs/plans/2025-02-23-modular-permissions-design.md`

---

## Phase 1: Database Migration

### Task 1: Add super_admin to profiles and create user_module_roles

**Files:**
- Create: `supabase/migrations/20260224000000_modular_permissions.sql`

**Step 1: Create migration file**

```sql
-- Add super_admin to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS super_admin BOOLEAN NOT NULL DEFAULT false;

-- Create user_module_roles table
CREATE TABLE IF NOT EXISTS public.user_module_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('leads', 'ad_agency', 'system')),
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, module)
);

ALTER TABLE public.user_module_roles ENABLE ROW LEVEL SECURITY;

-- Migrate data from user_roles (admin->admin, sales->user)
INSERT INTO public.user_module_roles (user_id, module, role)
SELECT user_id, 'leads', CASE WHEN role::text = 'admin' THEN 'admin' ELSE 'user' END
FROM public.user_roles
ON CONFLICT (user_id, module) DO NOTHING;

INSERT INTO public.user_module_roles (user_id, module, role)
SELECT user_id, 'ad_agency', CASE WHEN role::text = 'admin' THEN 'admin' ELSE 'user' END
FROM public.user_roles
ON CONFLICT (user_id, module) DO NOTHING;

-- Old admins get system admin
INSERT INTO public.user_module_roles (user_id, module, role)
SELECT user_id, 'system', 'admin'
FROM public.user_roles
WHERE role = 'admin'
ON CONFLICT (user_id, module) DO NOTHING;

-- First admin becomes super_admin (or set via manual UPDATE after migration)
-- UPDATE public.profiles SET super_admin = true WHERE user_id IN (SELECT user_id FROM user_roles WHERE role = 'admin' LIMIT 1);
```

**Step 2: Run migration**

```bash
supabase db push
```

Or apply via Supabase Dashboard SQL Editor if local push not used.

**Step 3: Commit**

```bash
git add supabase/migrations/20260224000000_modular_permissions.sql
git commit -m "feat(db): add user_module_roles and profiles.super_admin"
```

---

### Task 2: Create helper functions and update has_crm_access

**Files:**
- Modify: `supabase/migrations/20260224000000_modular_permissions.sql` (append)

**Step 1: Add helper functions to migration**

Append to the migration file (or create `20260224000001_modular_permissions_helpers.sql`):

```sql
-- Helper: is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT super_admin FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    false
  )
$$;

-- Helper: has any access to module
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id UUID, _module TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT is_super_admin(_user_id)
  OR EXISTS (
    SELECT 1 FROM public.user_module_roles
    WHERE user_id = _user_id AND module = _module
  )
$$;

-- Helper: is admin of module
CREATE OR REPLACE FUNCTION public.has_module_admin(_user_id UUID, _module TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT is_super_admin(_user_id)
  OR EXISTS (
    SELECT 1 FROM public.user_module_roles
    WHERE user_id = _user_id AND module = _module AND role = 'admin'
  )
$$;

-- Update has_crm_access: true if has any module access
CREATE OR REPLACE FUNCTION public.has_crm_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT is_super_admin(_user_id)
  OR EXISTS (SELECT 1 FROM public.user_module_roles WHERE user_id = _user_id)
$$;
```

**Step 2: Run migration**

```bash
supabase db push
```

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add is_super_admin, has_module_access, has_module_admin"
```

---

### Task 3: Update RLS policies for leads module

**Files:**
- Create: `supabase/migrations/20260224000002_modular_permissions_rls.sql`

**Step 1: Create RLS migration**

Leads, deals, quotes, customers, products, design_requests:
- SELECT: super_admin OR has_module_admin(leads) OR (has_module_access(leads) AND (assigned_to = auth.uid() OR assigned_to IS NULL for leads))
- For simplicity in first iteration: keep SELECT as has_crm_access (any module). Refine later for leads-user = assigned_to only.
- DELETE: is_super_admin OR has_module_admin('leads')

```sql
-- Leads
DROP POLICY IF EXISTS "CRM users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

CREATE POLICY "Leads module access view" ON public.leads FOR SELECT
USING (has_module_access(auth.uid(), 'leads'));

CREATE POLICY "Leads module admin delete" ON public.leads FOR DELETE
USING (has_module_admin(auth.uid(), 'leads'));

-- Keep INSERT/UPDATE as-is for now (has_crm_access) - will refine for assigned_to in later task
-- Customers
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;
CREATE POLICY "Leads module admin delete customers" ON public.customers FOR DELETE
USING (has_module_admin(auth.uid(), 'leads'));

-- Products
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Leads module admin products" ON public.products FOR ALL
USING (has_crm_access(auth.uid()));
WITH CHECK (has_module_admin(auth.uid(), 'leads'));
-- Split into INSERT/UPDATE/DELETE as needed - check existing policies
```

**Note:** This is a simplified first pass. Full policy replacement will require reviewing each table's current policies. The plan assumes a follow-up task to do full RLS replacement. For Task 3, focus on adding the new policies and dropping redundant ones while keeping has_crm_access for backward compat during transition.

**Step 2: Run migration**

**Step 3: Commit**

---

### Task 4: Update RLS for ad_agency and system modules

**Files:**
- Modify: `supabase/migrations/20260224000002_modular_permissions_rls.sql` or create new

Update op_clients, op_projects, op_tasks, op_items to use has_module_access('ad_agency') and has_module_admin('ad_agency') for DELETE.

Update user_module_roles, profiles (for role management) to allow only super_admin or system admin.

---

### Task 5: Drop user_roles (run AFTER Phase 2 - all code uses user_module_roles)

**Files:**
- Create: `supabase/migrations/20260224000003_drop_user_roles.sql`

```sql
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

DROP TABLE IF EXISTS public.user_roles;
-- Keep app_role enum if still referenced; otherwise DROP TYPE
```

**Step 2: Run migration**

**Step 3: Commit**

---

## Phase 2: AuthContext and Frontend

### Task 6: Update AuthContext to use user_module_roles

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

**Step 1: Define new types**

```ts
export type Module = 'leads' | 'ad_agency' | 'system';
export type ModuleRole = 'admin' | 'user';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  moduleRoles: Partial<Record<Module, ModuleRole>>;
  superAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  canAccessModule: (module: Module) => boolean;
  isModuleAdmin: (module: Module) => boolean;
}
```

**Step 2: Fetch profiles.super_admin and user_module_roles**

Replace user_roles fetch with:
- profiles: select super_admin
- user_module_roles: select module, role

**Step 3: Implement canAccessModule and isModuleAdmin**

**Step 4: Keep role for backward compat temporarily**

Expose `role` derived from moduleRoles (e.g. if system admin or superAdmin -> 'admin', else first module role) for components that still use it, until all are updated.

**Step 5: Verify**

Run app, log in, check AuthContext provides new values.

**Step 6: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat(auth): use user_module_roles and super_admin"
```

---

### Task 7: Update DashboardSidebar

**Files:**
- Modify: `src/components/layout/DashboardSidebar.tsx`

**Step 1: Replace role === 'admin' checks**

- Menu items (leads): show if `canAccessModule('leads')`
- Ad agency items: show if `canAccessModule('ad_agency')`
- Admin section (Settings, Customers, etc.): show if `superAdmin` OR `isModuleAdmin('system')` OR `canAccessModule('leads')` for Customers/Products (they're in leads module)

**Step 2: Map items to modules**

- primaryItems + menuItems → leads
- adAgencyItems → ad_agency
- adminItems: Customers, Products → leads module. Settings, Suppliers, Automations → system module.

**Step 3: Commit**

```bash
git add src/components/layout/DashboardSidebar.tsx
git commit -m "feat(sidebar): filter by module access"
```

---

### Task 8: Update Settings page

**Files:**
- Modify: `src/pages/Settings.tsx`

**Step 1: Restrict access**

Replace `role !== "admin"` with `!superAdmin && !isModuleAdmin('system')`.

**Step 2: Update team management**

Settings should manage user_module_roles (and super_admin for super-admins). Add UI to assign module + role per user. Requires new mutations for user_module_roles.

**Step 3: Commit**

---

### Task 9: Update pages that check role

**Files:**
- Modify: `src/pages/Dashboard.tsx`, `src/pages/Leads.tsx`, `src/pages/Suppliers.tsx`, `src/pages/ad-agency/*.tsx`, etc.

**Step 1: Replace role checks**

- `role === 'sales'` → `!isModuleAdmin('leads')` (for "only my pipeline" behavior)
- `role === 'admin'` → `isModuleAdmin(module)` or `superAdmin`

**Step 2: Verify each page**

- Dashboard: assignedTo filter for leads-user
- Leads, Deals, Contracts, Design Requests: access + delete buttons
- Ad agency pages: isAdmin = isModuleAdmin('ad_agency')
- Suppliers: canAccessModule('system') or isModuleAdmin('system')

**Step 3: Commit**

---

### Task 10: Update add-user script and send-quote

**Files:**
- Modify: `scripts/add-user.js`
- Modify: `supabase/functions/send-quote/index.ts`

**Step 1: add-user.js**

Insert into user_module_roles instead of user_roles. Accept USER_MODULES=leads:admin,ad_agency:user or similar. Default: leads:user, ad_agency:user.

**Step 2: send-quote**

Replace user_roles check with has_crm_access equivalent (check user_module_roles or super_admin).

**Step 3: Commit**

---

### Task 11: Regenerate Supabase types

**Files:**
- Modify: `src/integrations/supabase/types.ts`

**Step 1: Run**

```bash
npx supabase gen types typescript --project-id fbtnhhurjwizcrmcisci > src/integrations/supabase/types.ts
```

Or use Supabase CLI local if configured.

**Step 2: Commit**

---

## Phase 3: Leads user = assigned_to only (optional refinement)

### Task 12: RLS for leads user - only assigned_to

Update leads, deals, quotes RLS SELECT to restrict leads-user to rows where assigned_to = auth.uid(). Admin and super_admin see all.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2025-02-23-modular-permissions-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** – Dispatch fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session** – Open new session with executing-plans, batch execution with checkpoints.

**Which approach?**
