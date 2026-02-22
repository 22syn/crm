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

-- op_project_items (price per item = item.price per day × quantity × days)
CREATE TABLE public.op_project_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.op_projects(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.op_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  days NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
