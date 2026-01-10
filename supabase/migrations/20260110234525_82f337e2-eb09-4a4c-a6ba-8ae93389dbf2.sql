-- Remove defaults first
ALTER TABLE public.leads 
  ALTER COLUMN source DROP DEFAULT,
  ALTER COLUMN status DROP DEFAULT;

-- Convert source and status to text temporarily
ALTER TABLE public.leads 
  ALTER COLUMN source TYPE text USING source::text,
  ALTER COLUMN status TYPE text USING status::text;

-- Map old statuses to new (handle all old values)
UPDATE public.leads SET status = 'in_process' WHERE status = 'contacted';
UPDATE public.leads SET status = 'in_process' WHERE status = 'qualified';
UPDATE public.leads SET status = 'waiting_for_approval' WHERE status = 'quoted';
UPDATE public.leads SET status = 'done' WHERE status = 'won';
UPDATE public.leads SET status = 'not_done' WHERE status = 'lost';

-- Map old sources to new
UPDATE public.leads SET source = 'organic' WHERE source NOT IN ('instagram', 'website', 'architects', 'organic', 'facebook');

-- Drop old enums
DROP TYPE IF EXISTS lead_source;
DROP TYPE IF EXISTS lead_status;

-- Create new enums
CREATE TYPE lead_source AS ENUM ('instagram', 'website', 'architects', 'organic', 'facebook');
CREATE TYPE lead_status AS ENUM ('new', 'in_process', 'meeting_scheduled', 'meeting_done', 'waiting_for_approval', 'done', 'not_done');

-- Convert back to enum
ALTER TABLE public.leads 
  ALTER COLUMN source TYPE lead_source USING source::lead_source,
  ALTER COLUMN status TYPE lead_status USING status::lead_status;

-- Set new defaults
ALTER TABLE public.leads 
  ALTER COLUMN source SET DEFAULT 'organic'::lead_source,
  ALTER COLUMN status SET DEFAULT 'new'::lead_status;