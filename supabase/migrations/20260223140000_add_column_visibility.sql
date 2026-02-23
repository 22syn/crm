-- Add column_visibility for per-user table column show/hide preferences
ALTER TABLE public.user_table_preferences
  ADD COLUMN IF NOT EXISTS column_visibility jsonb DEFAULT NULL;

COMMENT ON COLUMN public.user_table_preferences.column_visibility IS 'Array of column ids to show, e.g. ["name","status"]. NULL = show all columns.';
