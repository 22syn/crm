-- Allow all CRM users to list team members (for assignee dropdown and comments)
CREATE POLICY "CRM users can view all user roles for team list"
ON public.user_roles FOR SELECT
USING (public.has_crm_access(auth.uid()));

CREATE POLICY "CRM users can view all profiles for team list"
ON public.profiles FOR SELECT
USING (public.has_crm_access(auth.uid()));

-- Lead comments for team communication on each lead
CREATE TABLE public.lead_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_comments_lead_id ON public.lead_comments(lead_id);
CREATE INDEX idx_lead_comments_created_at ON public.lead_comments(created_at DESC);

ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can view lead_comments"
ON public.lead_comments FOR SELECT
USING (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can insert lead_comments"
ON public.lead_comments FOR INSERT
WITH CHECK (has_crm_access(auth.uid()));

CREATE POLICY "CRM users can delete own lead_comments"
ON public.lead_comments FOR DELETE
USING (auth.uid() = user_id);
