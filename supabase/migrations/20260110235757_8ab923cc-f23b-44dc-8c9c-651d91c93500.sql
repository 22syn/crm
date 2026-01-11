-- Add archived_at column to quotes for archiving unlinked quotes
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone DEFAULT NULL;

-- Add unlinked_at column to track when a quote was unlinked from a lead
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS unlinked_at timestamp with time zone DEFAULT NULL;