-- RLS: Switch to has_module_access / has_module_admin for module-scoped permissions.

-- === LEADS MODULE ===

-- leads
DROP POLICY IF EXISTS "CRM users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
CREATE POLICY "Leads module view" ON public.leads FOR SELECT USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module insert" ON public.leads FOR INSERT WITH CHECK (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module update" ON public.leads FOR UPDATE USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin delete" ON public.leads FOR DELETE USING (has_module_admin(auth.uid(), 'leads'));

-- deals
DROP POLICY IF EXISTS "CRM users can view deals" ON public.deals;
DROP POLICY IF EXISTS "CRM users can insert deals" ON public.deals;
DROP POLICY IF EXISTS "CRM users can update deals" ON public.deals;
DROP POLICY IF EXISTS "Admins can delete deals" ON public.deals;
CREATE POLICY "Leads module view deals" ON public.deals FOR SELECT USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module insert deals" ON public.deals FOR INSERT WITH CHECK (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module update deals" ON public.deals FOR UPDATE USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin delete deals" ON public.deals FOR DELETE USING (has_module_admin(auth.uid(), 'leads'));

-- quotes
DROP POLICY IF EXISTS "CRM users can view quotes" ON public.quotes;
DROP POLICY IF EXISTS "CRM users can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "CRM users can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can delete quotes" ON public.quotes;
CREATE POLICY "Leads module view quotes" ON public.quotes FOR SELECT USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module insert quotes" ON public.quotes FOR INSERT WITH CHECK (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module update quotes" ON public.quotes FOR UPDATE USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin delete quotes" ON public.quotes FOR DELETE USING (has_module_admin(auth.uid(), 'leads'));

-- quote_items
DROP POLICY IF EXISTS "CRM users can view quote_items" ON public.quote_items;
DROP POLICY IF EXISTS "CRM users can insert quote_items" ON public.quote_items;
DROP POLICY IF EXISTS "CRM users can update quote_items" ON public.quote_items;
DROP POLICY IF EXISTS "Admins can delete quote_items" ON public.quote_items;
CREATE POLICY "Leads module view quote_items" ON public.quote_items FOR SELECT USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module insert quote_items" ON public.quote_items FOR INSERT WITH CHECK (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module update quote_items" ON public.quote_items FOR UPDATE USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin delete quote_items" ON public.quote_items FOR DELETE USING (has_module_admin(auth.uid(), 'leads'));

-- customers
DROP POLICY IF EXISTS "CRM users can view customers" ON public.customers;
DROP POLICY IF EXISTS "CRM users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "CRM users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Leads module admin delete customers" ON public.customers;
CREATE POLICY "Leads module view customers" ON public.customers FOR SELECT USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module insert customers" ON public.customers FOR INSERT WITH CHECK (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module update customers" ON public.customers FOR UPDATE USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin delete customers" ON public.customers FOR DELETE USING (has_module_admin(auth.uid(), 'leads'));

-- products (admin-only mutate in leads module)
DROP POLICY IF EXISTS "CRM users can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Leads module view products" ON public.products FOR SELECT USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin products" ON public.products FOR INSERT WITH CHECK (has_module_admin(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin products update" ON public.products FOR UPDATE USING (has_module_admin(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin products delete" ON public.products FOR DELETE USING (has_module_admin(auth.uid(), 'leads'));

-- product_segments
DROP POLICY IF EXISTS "CRM users can view product_segments" ON public.product_segments;
DROP POLICY IF EXISTS "Admins can insert product_segments" ON public.product_segments;
DROP POLICY IF EXISTS "Admins can update product_segments" ON public.product_segments;
DROP POLICY IF EXISTS "Admins can delete product_segments" ON public.product_segments;
CREATE POLICY "Leads module view product_segments" ON public.product_segments FOR SELECT USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin insert product_segments" ON public.product_segments FOR INSERT WITH CHECK (has_module_admin(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin update product_segments" ON public.product_segments FOR UPDATE USING (has_module_admin(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin delete product_segments" ON public.product_segments FOR DELETE USING (has_module_admin(auth.uid(), 'leads'));

-- design_requests
DROP POLICY IF EXISTS "CRM users can view design_requests" ON public.design_requests;
DROP POLICY IF EXISTS "CRM users can insert design_requests" ON public.design_requests;
DROP POLICY IF EXISTS "CRM users can update design_requests" ON public.design_requests;
DROP POLICY IF EXISTS "Admins can delete design_requests" ON public.design_requests;
CREATE POLICY "Leads module view design_requests" ON public.design_requests FOR SELECT USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module insert design_requests" ON public.design_requests FOR INSERT WITH CHECK (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module update design_requests" ON public.design_requests FOR UPDATE USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin delete design_requests" ON public.design_requests FOR DELETE USING (has_module_admin(auth.uid(), 'leads'));

-- lead_comments
DROP POLICY IF EXISTS "CRM users can view lead_comments" ON public.lead_comments;
DROP POLICY IF EXISTS "CRM users can insert lead_comments" ON public.lead_comments;
CREATE POLICY "Leads module view lead_comments" ON public.lead_comments FOR SELECT USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module insert lead_comments" ON public.lead_comments FOR INSERT WITH CHECK (has_module_access(auth.uid(), 'leads'));
-- "CRM users can delete own lead_comments" stays: auth.uid() = user_id (user can delete own)

-- contracts
DROP POLICY IF EXISTS "CRM users can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "CRM users can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "CRM users can update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can delete contracts" ON public.contracts;
CREATE POLICY "Leads module view contracts" ON public.contracts FOR SELECT USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module insert contracts" ON public.contracts FOR INSERT WITH CHECK (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module update contracts" ON public.contracts FOR UPDATE USING (has_module_access(auth.uid(), 'leads'));
CREATE POLICY "Leads module admin delete contracts" ON public.contracts FOR DELETE USING (has_module_admin(auth.uid(), 'leads'));

-- === AD AGENCY MODULE ===

-- op_clients
DROP POLICY IF EXISTS "CRM users can view op_clients" ON public.op_clients;
DROP POLICY IF EXISTS "CRM users can insert op_clients" ON public.op_clients;
DROP POLICY IF EXISTS "CRM users can update op_clients" ON public.op_clients;
DROP POLICY IF EXISTS "Admins can delete op_clients" ON public.op_clients;
CREATE POLICY "Ad agency view op_clients" ON public.op_clients FOR SELECT USING (has_module_access(auth.uid(), 'ad_agency'));
CREATE POLICY "Ad agency insert op_clients" ON public.op_clients FOR INSERT WITH CHECK (has_module_access(auth.uid(), 'ad_agency'));
CREATE POLICY "Ad agency update op_clients" ON public.op_clients FOR UPDATE USING (has_module_access(auth.uid(), 'ad_agency'));
CREATE POLICY "Ad agency admin delete op_clients" ON public.op_clients FOR DELETE USING (has_module_admin(auth.uid(), 'ad_agency'));

-- op_items
DROP POLICY IF EXISTS "CRM users can view op_items" ON public.op_items;
DROP POLICY IF EXISTS "CRM users can insert op_items" ON public.op_items;
DROP POLICY IF EXISTS "CRM users can update op_items" ON public.op_items;
DROP POLICY IF EXISTS "Admins can delete op_items" ON public.op_items;
CREATE POLICY "Ad agency view op_items" ON public.op_items FOR SELECT USING (has_module_access(auth.uid(), 'ad_agency'));
CREATE POLICY "Ad agency insert op_items" ON public.op_items FOR INSERT WITH CHECK (has_module_access(auth.uid(), 'ad_agency'));
CREATE POLICY "Ad agency update op_items" ON public.op_items FOR UPDATE USING (has_module_access(auth.uid(), 'ad_agency'));
CREATE POLICY "Ad agency admin delete op_items" ON public.op_items FOR DELETE USING (has_module_admin(auth.uid(), 'ad_agency'));

-- op_projects, op_project_items, op_project_tasks, op_task_subtasks (FOR ALL)
DROP POLICY IF EXISTS "CRM users op_projects" ON public.op_projects;
DROP POLICY IF EXISTS "CRM users op_project_items" ON public.op_project_items;
DROP POLICY IF EXISTS "CRM users op_project_tasks" ON public.op_project_tasks;
DROP POLICY IF EXISTS "CRM users op_task_subtasks" ON public.op_task_subtasks;
CREATE POLICY "Ad agency op_projects" ON public.op_projects FOR ALL USING (has_module_access(auth.uid(), 'ad_agency')) WITH CHECK (has_module_access(auth.uid(), 'ad_agency'));
CREATE POLICY "Ad agency op_project_items" ON public.op_project_items FOR ALL USING (has_module_access(auth.uid(), 'ad_agency')) WITH CHECK (has_module_access(auth.uid(), 'ad_agency'));
CREATE POLICY "Ad agency op_project_tasks" ON public.op_project_tasks FOR ALL USING (has_module_access(auth.uid(), 'ad_agency')) WITH CHECK (has_module_access(auth.uid(), 'ad_agency'));
CREATE POLICY "Ad agency op_task_subtasks" ON public.op_task_subtasks FOR ALL USING (has_module_access(auth.uid(), 'ad_agency')) WITH CHECK (has_module_access(auth.uid(), 'ad_agency'));

-- op_budget_sections
DROP POLICY IF EXISTS "CRM users op_budget_sections" ON public.op_budget_sections;
CREATE POLICY "Ad agency op_budget_sections" ON public.op_budget_sections FOR ALL USING (has_module_access(auth.uid(), 'ad_agency')) WITH CHECK (has_module_access(auth.uid(), 'ad_agency'));

-- === SYSTEM MODULE ===

-- suppliers (system admin only)
DROP POLICY IF EXISTS "CRM users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "CRM users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "CRM users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;
CREATE POLICY "System admin suppliers" ON public.suppliers FOR SELECT USING (has_module_admin(auth.uid(), 'system'));
CREATE POLICY "System admin suppliers insert" ON public.suppliers FOR INSERT WITH CHECK (has_module_admin(auth.uid(), 'system'));
CREATE POLICY "System admin suppliers update" ON public.suppliers FOR UPDATE USING (has_module_admin(auth.uid(), 'system'));
CREATE POLICY "System admin suppliers delete" ON public.suppliers FOR DELETE USING (has_module_admin(auth.uid(), 'system'));
