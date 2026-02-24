-- Ad Agency Workflow (part 2): map active -> execution
-- Must run in separate migration because new enum value not visible in same transaction

UPDATE public.op_projects SET status = 'execution'::public.op_project_status WHERE status = 'active';
