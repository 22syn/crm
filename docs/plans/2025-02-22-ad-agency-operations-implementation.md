# משרד פרסום (Ad Agency) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a complete "משרד פרסום" (ad agency) operations module with clients, projects, items catalog, budgets, and tasks.

**Architecture:** New `op_*` tables in Supabase with RLS via `has_crm_access`. React pages under `/ad-agency/*`, reusing EntityPageShell, DataTable, EntityKanban patterns from Deals/Leads. Standalone CRUD for items and clients; projects with Kanban and detail tabs (budget, items, tasks).

**Tech Stack:** React, TypeScript, Vite, Supabase, TanStack Query, shadcn/ui, existing entity-page components.

**Design Doc:** `docs/plans/2025-02-22-ad-agency-operations-design.md`

---

## Task 1: Database migration – all op_* tables

**Files:**
- Create: `supabase/migrations/20260222100000_ad_agency_tables.sql`

**Step 1: Create migration file**

Create one migration with all ad-agency tables:

```sql
-- Ad Agency: op_clients
CREATE TABLE public.op_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ad Agency: op_items (catalog)
CREATE TABLE public.op_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ad Agency: project and task enums
CREATE TYPE public.op_project_status AS ENUM (
  'draft',
  'active',
  'completed',
  'cancelled'
);

CREATE TYPE public.op_task_status AS ENUM (
  'todo',
  'in_progress',
  'done',
  'cancelled'
);

-- op_projects
CREATE TABLE public.op_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.op_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  budget_required NUMERIC DEFAULT 0,
  budget_approved NUMERIC DEFAULT 0,
  status public.op_project_status NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- op_project_items
CREATE TABLE public.op_project_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.op_projects(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.op_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- total_price computed: item.price * quantity (can add generated column or compute in app)

-- op_project_tasks
CREATE TABLE public.op_project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.op_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status public.op_task_status NOT NULL DEFAULT 'todo',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- op_task_subtasks
CREATE TABLE public.op_task_subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.op_project_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.op_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.op_project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.op_project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.op_task_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users op_projects" ON public.op_projects FOR ALL USING (has_crm_access(auth.uid()));
CREATE POLICY "CRM users op_project_items" ON public.op_project_items FOR ALL USING (has_crm_access(auth.uid()));
CREATE POLICY "CRM users op_project_tasks" ON public.op_project_tasks FOR ALL USING (has_crm_access(auth.uid()));
CREATE POLICY "CRM users op_task_subtasks" ON public.op_task_subtasks FOR ALL USING (has_crm_access(auth.uid()));

-- updated_at triggers
ALTER TABLE public.op_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.op_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can view op_clients" ON public.op_clients FOR SELECT USING (has_crm_access(auth.uid()));
CREATE POLICY "CRM users can insert op_clients" ON public.op_clients FOR INSERT WITH CHECK (has_crm_access(auth.uid()));
CREATE POLICY "CRM users can update op_clients" ON public.op_clients FOR UPDATE USING (has_crm_access(auth.uid()));
CREATE POLICY "Admins can delete op_clients" ON public.op_clients FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CRM users can view op_items" ON public.op_items FOR SELECT USING (has_crm_access(auth.uid()));
CREATE POLICY "CRM users can insert op_items" ON public.op_items FOR INSERT WITH CHECK (has_crm_access(auth.uid()));
CREATE POLICY "CRM users can update op_items" ON public.op_items FOR UPDATE USING (has_crm_access(auth.uid()));
CREATE POLICY "Admins can delete op_items" ON public.op_items FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_op_clients_updated_at BEFORE UPDATE ON public.op_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_op_items_updated_at BEFORE UPDATE ON public.op_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_op_projects_updated_at BEFORE UPDATE ON public.op_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_op_project_tasks_updated_at BEFORE UPDATE ON public.op_project_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

**Step 2: Run migration**

```bash
npx supabase db push
```

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(ad-agency): add all op_* tables migration"
```

---

## Task 3: Regenerate Supabase types

**Files:**
- Modify: `src/integrations/supabase/types.ts` (regenerated)

**Step 1: Run type generation**

```bash
cd /Users/kobihazout/.gemini/antigravity/projects/hadaryaCRM && npx supabase gen types typescript --project-id fbtnhhurjwizcrmcisci > src/integrations/supabase/types.ts
```

(Use your actual project ref if different.)

**Step 2: Verify types include op_* tables**

Open `src/integrations/supabase/types.ts` and confirm `op_clients`, `op_items`, `op_projects`, etc. exist.

**Step 3: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "chore: regenerate Supabase types for op_* tables"
```

---

## Task 4: Routes and sidebar

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/DashboardSidebar.tsx`

**Step 1: Add routes in App.tsx**

Add imports:

```ts
import AdAgencyDashboard from "./pages/ad-agency/AdAgencyDashboard";
import AdAgencyClients from "./pages/ad-agency/AdAgencyClients";
import AdAgencyClientDetail from "./pages/ad-agency/AdAgencyClientDetail";
import AdAgencyProjects from "./pages/ad-agency/AdAgencyProjects";
import AdAgencyProjectDetail from "./pages/ad-agency/AdAgencyProjectDetail";
import AdAgencyItems from "./pages/ad-agency/AdAgencyItems";
```

Add routes inside `<Routes>` (before `*`):

```tsx
<Route path="/ad-agency" element={<AdAgencyDashboard />} />
<Route path="/ad-agency/clients" element={<AdAgencyClients />} />
<Route path="/ad-agency/clients/:id" element={<AdAgencyClientDetail />} />
<Route path="/ad-agency/projects" element={<AdAgencyProjects />} />
<Route path="/ad-agency/projects/:id" element={<AdAgencyProjectDetail />} />
<Route path="/ad-agency/items" element={<AdAgencyItems />} />
```

**Step 2: Add sidebar menu in DashboardSidebar.tsx**

Add icon import: `Megaphone` (or `LayoutGrid`) from lucide-react.

Add new section after `menuItems`:

```tsx
const adAgencyItems = [
  { title: "דשבורד", url: "/ad-agency", icon: LayoutGrid },
  { title: "לקוחות", url: "/ad-agency/clients", icon: Users },
  { title: "פרויקטים", url: "/ad-agency/projects", icon: FileText },
  { title: "פריטים", url: "/ad-agency/items", icon: Package },
];
```

Add a new SidebarGroup with label "משרד פרסום" and map over `adAgencyItems`. Place it between Menu and Admin (visible to all CRM users).

**Step 3: Verify build**

```bash
npm run build
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/App.tsx src/components/layout/DashboardSidebar.tsx
git commit -m "feat(ad-agency): add routes and sidebar menu"
```

---

## Task 5: AdAgencyItems page (CRUD for items catalog)

**Files:**
- Create: `src/pages/ad-agency/AdAgencyItems.tsx`
- Create: `src/components/ad-agency/ItemDialog.tsx`

**Step 1: Create ItemDialog**

Simple dialog with form: `type` (text input), `price` (number). Props: `open`, `onOpenChange`, `item` (null for create), `onSubmit`.

Use `Dialog`, `Input`, `Label`, `Button` from shadcn. On submit call `onSubmit({ type, price })`.

**Step 2: Create AdAgencyItems page**

- Use `DashboardLayout`
- `useQuery` to fetch `op_items` from Supabase
- Table with columns: type, price, actions (edit, delete)
- "הוסף פריט" button opens ItemDialog (create mode)
- Edit opens ItemDialog with existing item
- Delete: confirm + `supabase.from("op_items").delete().eq("id", id)`
- Mutations with `useMutation` and `queryClient.invalidateQueries(["op_items"])`

**Step 3: Verify**

Navigate to `/ad-agency/items`, add/edit/delete an item. Data persists.

**Step 4: Commit**

```bash
git add src/pages/ad-agency/AdAgencyItems.tsx src/components/ad-agency/ItemDialog.tsx
git commit -m "feat(ad-agency): items catalog CRUD"
```

---

## Task 6: AdAgencyClients page and ClientDialog

**Files:**
- Create: `src/pages/ad-agency/AdAgencyClients.tsx`
- Create: `src/components/ad-agency/ClientDialog.tsx`
- Create: `src/components/ad-agency/ClientTable.tsx`

**Step 1: Create ClientDialog**

Form fields: name, email, phone, contact_name, contact_phone, address, notes. Use standard form pattern from SupplierDialog. `onSubmit` receives full client object.

**Step 2: Create ClientTable**

Table with columns: name, contact_name, contact_phone, email, actions. Receives `clients`, `onEdit`, `onDelete`. Link name to `/ad-agency/clients/:id`.

**Step 3: Create AdAgencyClients page**

- `useQuery` for `op_clients`
- Table + "הוסף לקוח" button
- Create/Update via ClientDialog
- Delete with confirmation

**Step 4: Commit**

```bash
git add src/pages/ad-agency/AdAgencyClients.tsx src/components/ad-agency/ClientDialog.tsx src/components/ad-agency/ClientTable.tsx
git commit -m "feat(ad-agency): clients CRUD"
```

---

## Task 7: AdAgencyClientDetail page

**Files:**
- Create: `src/pages/ad-agency/AdAgencyClientDetail.tsx`

**Step 1: Create page**

- `useParams` for `id`
- `useQuery` for client: `supabase.from("op_clients").select("*").eq("id", id).single()`
- `useQuery` for projects: `supabase.from("op_projects").select("*").eq("client_id", id)`
- Show client info (card) + list of projects (table or cards)
- "פרויקט חדש" button links to create project with client_id (or open project create dialog)
- Back link to `/ad-agency/clients`

**Step 2: Commit**

```bash
git add src/pages/ad-agency/AdAgencyClientDetail.tsx
git commit -m "feat(ad-agency): client detail with projects list"
```

---

## Task 8: AdAgencyProjects page (Table + Kanban)

**Files:**
- Create: `src/pages/ad-agency/AdAgencyProjects.tsx`
- Create: `src/components/ad-agency/ProjectTable.tsx`
- Create: `src/components/ad-agency/ProjectKanban.tsx`
- Create: `src/components/ad-agency/ProjectCard.tsx`
- Create: `src/components/ad-agency/ProjectDialog.tsx`

**Step 1: ProjectDialog**

Form: client_id (select from op_clients), title, budget_required, budget_approved, status, start_date, end_date, notes.

**Step 2: ProjectCard**

Compact card showing title, client name, budget, status. `onEdit`, `onStageChange` (for Kanban drag).

**Step 3: ProjectTable**

Columns: title, client, budget_required, budget_approved, status, dates. Actions: edit, link to detail.

**Step 4: ProjectKanban**

Use `EntityKanban` with columns: draft, active, completed, cancelled. Map `op_project_status` values.

**Step 5: AdAgencyProjects page**

- `useQuery` for projects with client: `.select("*, op_clients(name)")`
- EntityPageShell with Table + Kanban views
- ProjectDialog for create/edit
- `onStageChange` updates project status via mutation
- Filters: by client, status (optional)

**Step 6: Commit**

```bash
git add src/pages/ad-agency/AdAgencyProjects.tsx src/components/ad-agency/ProjectTable.tsx src/components/ad-agency/ProjectKanban.tsx src/components/ad-agency/ProjectCard.tsx src/components/ad-agency/ProjectDialog.tsx
git commit -m "feat(ad-agency): projects list, Kanban, create/edit"
```

---

## Task 9: AdAgencyProjectDetail – budget and project items

**Files:**
- Create: `src/pages/ad-agency/AdAgencyProjectDetail.tsx`
- Create: `src/components/ad-agency/ProjectDetailTabs.tsx`
- Create: `src/components/ad-agency/ProjectItemsSection.tsx`

**Step 1: ProjectItemsSection**

- Fetch `op_project_items` with `item_id` joined to `op_items` (type, price)
- Table: item type, quantity, unit price, total (price * quantity)
- "הוסף פריט" opens dialog: select item from op_items, set quantity. Insert into op_project_items.
- Remove item (delete from op_project_items)

**Step 2: ProjectDetailTabs**

Tabs: "תקציב" | "פריטים" | "משימות"
- Tab 1: Display/edit budget_required, budget_approved. Sum of project items for comparison.
- Tab 2: ProjectItemsSection
- Tab 3: ProjectTasksSection (Task 10)

**Step 3: AdAgencyProjectDetail page**

- `useParams` for id
- `useQuery` for project with client
- Breadcrumb: משרד פרסום > פרויקטים > [title]
- ProjectDetailTabs with project data

**Step 4: Commit**

```bash
git add src/pages/ad-agency/AdAgencyProjectDetail.tsx src/components/ad-agency/ProjectDetailTabs.tsx src/components/ad-agency/ProjectItemsSection.tsx
git commit -m "feat(ad-agency): project detail with budget and items"
```

---

## Task 10: Project tasks and subtasks

**Files:**
- Create: `src/components/ad-agency/ProjectTasksSection.tsx`
- Create: `src/components/ad-agency/TaskDialog.tsx`
- Create: `src/components/ad-agency/TaskSubtasks.tsx`

**Step 1: TaskDialog**

Form: title, status, assigned_to (select from profiles), start_date, end_date, notes.

**Step 2: TaskSubtasks**

For a task, list subtasks. Add subtask (title only), toggle done. Simple inline or small form.

**Step 3: ProjectTasksSection**

- `useQuery` for tasks: `op_project_tasks` where project_id
- `useQuery` for profiles (for assigned_to select)
- List of tasks with expand/collapse for subtasks
- Add task button -> TaskDialog
- Edit task -> TaskDialog
- TaskSubtasks inside each task row

**Step 4: Add ProjectTasksSection to ProjectDetailTabs**

Render ProjectTasksSection in the "משימות" tab.

**Step 5: Commit**

```bash
git add src/components/ad-agency/ProjectTasksSection.tsx src/components/ad-agency/TaskDialog.tsx src/components/ad-agency/TaskSubtasks.tsx
git commit -m "feat(ad-agency): project tasks and subtasks"
```

---

## Task 11: AdAgencyDashboard

**Files:**
- Create: `src/pages/ad-agency/AdAgencyDashboard.tsx`

**Step 1: Create dashboard**

- Cards: total budget required (sum op_projects.budget_required), total budget approved, active projects count
- List: recent/active projects (top 5–10)
- List: tasks due soon or overdue (op_project_tasks where end_date <= today + 7 days, status != done)
- Links to `/ad-agency/clients`, `/ad-agency/projects`

**Step 2: Commit**

```bash
git add src/pages/ad-agency/AdAgencyDashboard.tsx
git commit -m "feat(ad-agency): dashboard with budget summary and tasks"
```

---

## Task 12: Create project from client detail + navigation polish

**Files:**
- Modify: `src/pages/ad-agency/AdAgencyClientDetail.tsx`
- Create: `src/components/ad-agency/ProjectDialog.tsx` (if not yet supports client_id preselection)

**Step 1: Add "פרויקט חדש" flow**

On AdAgencyClientDetail, "פרויקט חדש" opens ProjectDialog with client_id preset. On success, redirect to project detail or refresh list.

**Step 2: Add breadcrumbs**

Use DashboardBreadcrumb or similar for: משרד פרסום > לקוחות > [client name], משרד פרסום > פרויקטים > [project title].

**Step 3: Commit**

```bash
git add src/pages/ad-agency/AdAgencyClientDetail.tsx src/components/ad-agency/
git commit -m "feat(ad-agency): create project from client, breadcrumbs"
```

---

## Execution Options

**Plan complete and saved to `docs/plans/2025-02-22-ad-agency-operations-implementation.md`.**

Two execution options:

1. **Subagent-Driven (this session)** – Dispatch a fresh subagent per task, review between tasks, fast iteration.

2. **Parallel Session (separate)** – Open a new session with executing-plans skill for batch execution with checkpoints.

**Which approach?**
