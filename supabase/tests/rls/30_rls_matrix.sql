-- The access matrix. Each line is one rule; most "cannot" checks have a matching "can"
-- check for someone who should be allowed, so a check cannot pass just because the action
-- is broken for everyone.
--
-- Rules come from the 2026-11-07..09 security review (PRs 9, 10, 11, 14). Full write-up:
-- cabinet knowledge/reference/crm-security-audit.md.

\set QUIET on

-- 0. Seed sanity: every table checked below really has data. -------------------------------
DO $$
DECLARE t text; n bigint;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'leads', 'deals', 'quotes', 'quote_items', 'customers', 'contracts', 'design_requests',
    'lead_comments', 'company_settings', 'op_clients', 'op_items', 'op_projects',
    'op_project_tasks', 'op_project_items', 'op_task_subtasks', 'op_budget_sections'
  ] LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n;
    PERFORM rls_test.record(NULL, 'seed has rows in ' || t, n > 0, format('%s row(s)', n));
  END LOOP;
  SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = 'designs';
  PERFORM rls_test.record(NULL, 'seed has a designs file', n > 0, format('%s row(s)', n));
END $$;

-- 1. User with no module roles (e.g. a stranger who signed up). ----------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'leads', 'deals', 'quotes', 'quote_items', 'customers', 'contracts', 'design_requests',
    'lead_comments', 'company_settings', 'op_clients', 'op_items', 'op_projects',
    'op_project_tasks', 'op_project_items', 'op_task_subtasks', 'op_budget_sections',
    'user_module_roles'
  ] LOOP
    PERFORM rls_test.expect_rows('noroles', 'sees no ' || t,
      format('SELECT * FROM public.%I', t), 0);
  END LOOP;
END $$;

SELECT rls_test.expect_rows('noroles', 'sees only own profile',
  $q$SELECT * FROM profiles$q$, 1);
SELECT rls_test.expect_rows('noroles', 'the visible profile is their own',
  $q$SELECT * FROM profiles WHERE user_id = auth.uid()$q$, 1);

-- PR 9 + PR 11: super_admin self-grant is blocked at the API (column grant) ...
SELECT rls_test.expect_error('noroles', 'cannot set own super_admin',
  $q$UPDATE profiles SET super_admin = true WHERE user_id = auth.uid()$q$, '42501');
-- ... and by the trigger even when table privileges are out of the way.
SELECT rls_test.expect_error('noroles', 'super_admin trigger blocks self-grant',
  $q$UPDATE profiles SET super_admin = true WHERE user_id = auth.uid()$q$, '42501',
  'Only super admins%', 'postgres');

-- PR 11: email is not editable; display fields still are.
SELECT rls_test.expect_error('noroles', 'cannot change own profile email',
  $q$UPDATE profiles SET email = 't-sys-admin@crm.test' WHERE user_id = auth.uid()$q$, '42501');
SELECT rls_test.expect_rows('noroles', 'can change own full_name',
  $q$UPDATE profiles SET full_name = 'Renamed' WHERE user_id = auth.uid()$q$, 1);

SELECT rls_test.expect_error('noroles', 'cannot grant self a module role',
  $q$INSERT INTO user_module_roles (user_id, module, role) VALUES (auth.uid(), 'leads', 'admin')$q$,
  '42501');

-- PR 14: design files are leads-only.
SELECT rls_test.expect_rows('noroles', 'cannot list design files',
  $q$SELECT * FROM storage.objects WHERE bucket_id = 'designs'$q$, 0);
SELECT rls_test.expect_error('noroles', 'cannot upload to designs',
  $q$INSERT INTO storage.objects (bucket_id, name) VALUES ('designs', 'x/evil.png')$q$, '42501');

-- 2. Ad agency user (like Ori). ------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['leads', 'deals', 'quotes', 'quote_items', 'customers', 'contracts',
                           'lead_comments'] LOOP
    PERFORM rls_test.expect_rows('ad-user', 'sees no ' || t,
      format('SELECT * FROM public.%I', t), 0);
  END LOOP;
END $$;

-- PR 10: leads follow the leads module only.
SELECT rls_test.expect_error('ad-user', 'cannot create a lead',
  $q$INSERT INTO leads (customer_name, customer_phone) VALUES ('x', '1')$q$, '42501');

-- PR 14: company settings per module.
SELECT rls_test.expect_rows('ad-user', 'reads exactly one company_settings row',
  $q$SELECT * FROM company_settings$q$, 1);
SELECT rls_test.expect_rows('ad-user', 'that row is the ad_agency one',
  $q$SELECT * FROM company_settings WHERE module = 'ad_agency'$q$, 1);

-- PR 14: profiles only of people sharing a module, plus super admins.
SELECT rls_test.expect_rows('ad-user', 'sees ad_agency colleagues and super admins',
  $q$SELECT * FROM profiles WHERE email IN ('t-ad-user@crm.test', 't-ad-admin@crm.test', 't-super@crm.test')$q$, 3);
SELECT rls_test.expect_rows('ad-user', 'sees no profiles from other modules',
  $q$SELECT * FROM profiles WHERE NOT super_admin
     AND email NOT IN ('t-ad-user@crm.test', 't-ad-admin@crm.test')$q$, 0);

-- Positive controls: the ad agency screens still work.
SELECT rls_test.expect_some_rows('ad-user', 'sees projects',
  $q$SELECT * FROM op_projects$q$);
SELECT rls_test.expect_rows('ad-user', 'can edit a project',
  $q$UPDATE op_projects SET title = 'Edited' WHERE id = '20000000-0000-4000-a000-000000000003'$q$, 1);

-- PR 10 + PR 14: only ad agency admins delete projects and project contents ...
SELECT rls_test.expect_rows('ad-user', 'cannot delete a project',
  $q$DELETE FROM op_projects WHERE id = '20000000-0000-4000-a000-000000000003'$q$, 0);
SELECT rls_test.expect_rows('ad-user', 'cannot delete a project item',
  $q$DELETE FROM op_project_items WHERE id = '20000000-0000-4000-a000-000000000005'$q$, 0);
SELECT rls_test.expect_rows('ad-user', 'cannot delete a subtask',
  $q$DELETE FROM op_task_subtasks WHERE id = '20000000-0000-4000-a000-000000000006'$q$, 0);
SELECT rls_test.expect_rows('ad-user', 'cannot delete a budget section',
  $q$DELETE FROM op_budget_sections WHERE id = '20000000-0000-4000-a000-000000000007'$q$, 0);
-- ... but any ad agency user may delete a task.
SELECT rls_test.expect_rows('ad-user', 'can delete a task',
  $q$DELETE FROM op_project_tasks WHERE id = '20000000-0000-4000-a000-000000000004'$q$, 1);

-- 3. Ad agency admin. ----------------------------------------------------------------------
SELECT rls_test.expect_rows('ad-admin', 'can delete a project',
  $q$DELETE FROM op_projects WHERE id = '20000000-0000-4000-a000-000000000003'$q$, 1);
SELECT rls_test.expect_rows('ad-admin', 'can delete a project item',
  $q$DELETE FROM op_project_items WHERE id = '20000000-0000-4000-a000-000000000005'$q$, 1);
SELECT rls_test.expect_rows('ad-admin', 'can delete a subtask',
  $q$DELETE FROM op_task_subtasks WHERE id = '20000000-0000-4000-a000-000000000006'$q$, 1);
SELECT rls_test.expect_rows('ad-admin', 'can delete a budget section',
  $q$DELETE FROM op_budget_sections WHERE id = '20000000-0000-4000-a000-000000000007'$q$, 1);
SELECT rls_test.expect_rows('ad-admin', 'can delete a task',
  $q$DELETE FROM op_project_tasks WHERE id = '20000000-0000-4000-a000-000000000004'$q$, 1);

-- 4. Leads user. ---------------------------------------------------------------------------
SELECT rls_test.expect_some_rows('leads-user', 'sees leads', $q$SELECT * FROM leads$q$);
SELECT rls_test.expect_rows('leads-user', 'sees no ad agency projects',
  $q$SELECT * FROM op_projects$q$, 0);
SELECT rls_test.expect_rows('leads-user', 'reads only the leads company_settings row',
  $q$SELECT * FROM company_settings WHERE module <> 'leads'$q$, 0);

-- PR 14: comments are always posted under your own name.
SELECT rls_test.expect_error('leads-user', 'cannot post a comment as someone else',
  $q$INSERT INTO lead_comments (lead_id, user_id, body)
     VALUES ('10000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002', 'x')$q$,
  '42501');
SELECT rls_test.expect_rows('leads-user', 'can post a comment as self',
  $q$INSERT INTO lead_comments (lead_id, user_id, body)
     VALUES ('10000000-0000-4000-a000-000000000001', auth.uid(), 'x')$q$, 1);

SELECT rls_test.expect_rows('leads-user', 'can upload to designs',
  $q$INSERT INTO storage.objects (bucket_id, name) VALUES ('designs', 'x/ok.png')$q$, 1);
SELECT rls_test.expect_rows('leads-user', 'cannot delete a design file',
  $q$DELETE FROM storage.objects WHERE bucket_id = 'designs'$q$, 0);
SELECT rls_test.expect_rows('leads-admin', 'can delete a design file',
  $q$DELETE FROM storage.objects WHERE bucket_id = 'designs'$q$, 1);

-- 5. System module. ------------------------------------------------------------------------
SELECT rls_test.expect_error('sys-user', 'system user cannot grant module roles',
  $q$INSERT INTO user_module_roles (user_id, module, role)
     VALUES ('00000000-0000-4000-a000-000000000008', 'leads', 'user')$q$, '42501');
SELECT rls_test.expect_rows('sys-admin', 'system admin can grant module roles',
  $q$INSERT INTO user_module_roles (user_id, module, role)
     VALUES ('00000000-0000-4000-a000-000000000008', 'leads', 'user')$q$, 1);
SELECT rls_test.expect_rows('sys-admin', 'system admin reads every company_settings row',
  $q$SELECT * FROM company_settings WHERE module IN ('leads', 'ad_agency')$q$, 2);
SELECT rls_test.expect_error('sys-admin', 'system admin cannot set own super_admin',
  $q$UPDATE profiles SET super_admin = true WHERE user_id = auth.uid()$q$, '42501');

-- 6. Super admin. --------------------------------------------------------------------------
-- The trigger still lets a super admin grant super admin. Run as owner with the super
-- admin's claims: the column grant blocks every browser caller, so this checks the trigger
-- on its own (the positive twin of "super_admin trigger blocks self-grant").
DO $$
DECLARE r record;
BEGIN
  r := rls_test.try_as('super',
    $q$UPDATE profiles SET super_admin = true WHERE user_id = '00000000-0000-4000-a000-000000000008'$q$,
    'postgres');
  PERFORM rls_test.record('super', 'trigger lets a super admin grant super_admin',
    r.err_state IS NULL AND r.row_count = 1, rls_test.describe(r));
END $$;
SELECT rls_test.expect_some_rows('super', 'sees leads', $q$SELECT * FROM leads$q$);
SELECT rls_test.expect_some_rows('super', 'sees projects', $q$SELECT * FROM op_projects$q$);

-- 7. Anonymous visitor: nothing, and no errors. ---------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1 LOOP
    PERFORM rls_test.expect_rows('anon', 'sees no ' || t,
      format('SELECT * FROM public.%I', t), 0);
  END LOOP;
END $$;
SELECT rls_test.expect_rows('anon', 'sees no storage objects',
  $q$SELECT * FROM storage.objects$q$, 0);
SELECT rls_test.expect_rows('anon', 'get_public_branding returns the leads branding',
  $q$SELECT * FROM get_public_branding('leads')$q$, 1);

-- 8. user_id_by_email is for the service role (edge functions) only. -----------------------
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    PERFORM rls_test.record(r, 'cannot execute user_id_by_email',
      NOT has_function_privilege(r, 'public.user_id_by_email(text)', 'EXECUTE'), 'has EXECUTE');
  END LOOP;
  PERFORM rls_test.record('service_role', 'can execute user_id_by_email',
    has_function_privilege('service_role', 'public.user_id_by_email(text)', 'EXECUTE'), 'no EXECUTE');
  PERFORM rls_test.record('anon', 'cannot execute can_view_profile',
    NOT has_function_privilege('anon', 'public.can_view_profile(uuid, uuid)', 'EXECUTE'), 'has EXECUTE');
END $$;
SELECT rls_test.expect_error('noroles', 'calling user_id_by_email is denied',
  $q$SELECT user_id_by_email('t-super@crm.test')$q$, '42501');
SELECT rls_test.expect_rows('service', 'service role can look up a user by email',
  $q$SELECT * FROM user_id_by_email('t-super@crm.test') u WHERE u IS NOT NULL$q$, 1);

\set QUIET off
SELECT rls_test.report();
