-- Test users and at least one row in every table the checks look at, so that a
-- "sees 0 rows" result means the rule hid the data, not that there was nothing to see.
-- Runs as the database owner with no JWT claims (like setup scripts and the signup trigger).
--
-- User ids are fixed: 00000000-0000-4000-a000-0000000000NN.

INSERT INTO auth.users (id, aud, role, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-a000-000000000001', 'authenticated', 'authenticated', 't-super@crm.test',       '{"full_name":"Test Super Admin"}'),
  ('00000000-0000-4000-a000-000000000002', 'authenticated', 'authenticated', 't-leads-admin@crm.test', '{"full_name":"Test Leads Admin"}'),
  ('00000000-0000-4000-a000-000000000003', 'authenticated', 'authenticated', 't-leads-user@crm.test',  '{"full_name":"Test Leads User"}'),
  ('00000000-0000-4000-a000-000000000004', 'authenticated', 'authenticated', 't-ad-admin@crm.test',    '{"full_name":"Test Ad Admin"}'),
  ('00000000-0000-4000-a000-000000000005', 'authenticated', 'authenticated', 't-ad-user@crm.test',     '{"full_name":"Test Ad User"}'),
  ('00000000-0000-4000-a000-000000000006', 'authenticated', 'authenticated', 't-sys-admin@crm.test',   '{"full_name":"Test System Admin"}'),
  ('00000000-0000-4000-a000-000000000007', 'authenticated', 'authenticated', 't-sys-user@crm.test',    '{"full_name":"Test System User"}'),
  ('00000000-0000-4000-a000-000000000008', 'authenticated', 'authenticated', 't-noroles@crm.test',     '{"full_name":"Test No Roles"}');

-- Profiles come from the on_auth_user_created trigger; only super_admin needs setting.
UPDATE public.profiles SET super_admin = true
WHERE user_id = '00000000-0000-4000-a000-000000000001';

INSERT INTO public.user_module_roles (user_id, module, role) VALUES
  ('00000000-0000-4000-a000-000000000002', 'leads',     'admin'),
  ('00000000-0000-4000-a000-000000000003', 'leads',     'user'),
  ('00000000-0000-4000-a000-000000000004', 'ad_agency', 'admin'),
  ('00000000-0000-4000-a000-000000000005', 'ad_agency', 'user'),
  ('00000000-0000-4000-a000-000000000006', 'system',    'admin'),
  ('00000000-0000-4000-a000-000000000007', 'system',    'user');

INSERT INTO rls_test.personas (name, user_id, db_role) VALUES
  ('anon',        NULL,                                   'anon'),
  ('super',       '00000000-0000-4000-a000-000000000001', 'authenticated'),
  ('leads-admin', '00000000-0000-4000-a000-000000000002', 'authenticated'),
  ('leads-user',  '00000000-0000-4000-a000-000000000003', 'authenticated'),
  ('ad-admin',    '00000000-0000-4000-a000-000000000004', 'authenticated'),
  ('ad-user',     '00000000-0000-4000-a000-000000000005', 'authenticated'),
  ('sys-admin',   '00000000-0000-4000-a000-000000000006', 'authenticated'),
  ('sys-user',    '00000000-0000-4000-a000-000000000007', 'authenticated'),
  ('noroles',     '00000000-0000-4000-a000-000000000008', 'authenticated'),
  ('service',     NULL,                                   'service_role');

-- Leads module data. Fixed ids end in ...0000000000NN under prefix 10000000.
INSERT INTO public.leads (id, customer_name, customer_phone)
VALUES ('10000000-0000-4000-a000-000000000001', 'Test Lead', '050-0000000');

INSERT INTO public.lead_comments (id, lead_id, user_id, body)
VALUES ('10000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000001',
        '00000000-0000-4000-a000-000000000003', 'seed comment');

INSERT INTO public.customers (id, name, email, phone)
VALUES ('10000000-0000-4000-a000-000000000003', 'Test Customer', 'customer@crm.test', '050-0000001');

INSERT INTO public.deals (id, title) VALUES ('10000000-0000-4000-a000-000000000004', 'Test Deal');

INSERT INTO public.quotes (id, quote_number, customer_name)
VALUES ('10000000-0000-4000-a000-000000000005', 'Q-TEST-1', 'Test Customer');

INSERT INTO public.quote_items (id, quote_id, title, unit_price, total_price)
VALUES ('10000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000005', 'Sofa', 100, 100);

INSERT INTO public.contracts (id, quote_id, contract_number)
VALUES ('10000000-0000-4000-a000-000000000007', '10000000-0000-4000-a000-000000000005', 'C-TEST-1');

INSERT INTO public.design_requests (id, quote_id, quote_item_id)
VALUES ('10000000-0000-4000-a000-000000000008', '10000000-0000-4000-a000-000000000005',
        '10000000-0000-4000-a000-000000000006');

INSERT INTO public.products (title) VALUES ('Test Product');
INSERT INTO public.suppliers (name, contact_name, phone, category)
VALUES ('Test Supplier', 'Contact', '050-0000002', 'sofas');
INSERT INTO public.user_table_preferences (user_id, page_key)
VALUES ('00000000-0000-4000-a000-000000000003', 'leads');

-- Ad agency module data. Prefix 20000000.
INSERT INTO public.op_clients (id, name) VALUES ('20000000-0000-4000-a000-000000000001', 'Test Client');
INSERT INTO public.op_items (id, type) VALUES ('20000000-0000-4000-a000-000000000002', 'equipment');

INSERT INTO public.op_projects (id, client_id, title)
VALUES ('20000000-0000-4000-a000-000000000003', '20000000-0000-4000-a000-000000000001', 'Test Project');

INSERT INTO public.op_project_tasks (id, project_id, title)
VALUES ('20000000-0000-4000-a000-000000000004', '20000000-0000-4000-a000-000000000003', 'Test Task');

INSERT INTO public.op_project_items (id, project_id, item_id)
VALUES ('20000000-0000-4000-a000-000000000005', '20000000-0000-4000-a000-000000000003',
        '20000000-0000-4000-a000-000000000002');

INSERT INTO public.op_task_subtasks (id, task_id, title)
VALUES ('20000000-0000-4000-a000-000000000006', '20000000-0000-4000-a000-000000000004', 'Test Subtask');

INSERT INTO public.op_budget_sections (id, name, sort_order)
VALUES ('20000000-0000-4000-a000-000000000007', 'Test Section', 999);

-- Storage: one existing design file.
INSERT INTO storage.objects (bucket_id, name, owner)
VALUES ('designs', 'seed/design.png', '00000000-0000-4000-a000-000000000003');
