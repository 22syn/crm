-- Named table views: allow multiple saved views per user per page (renameable, switchable).
-- Existing single row per (user_id, page_key) becomes one view named 'default'.

ALTER TABLE public.user_table_preferences
  ADD COLUMN IF NOT EXISTS view_name text NOT NULL DEFAULT 'default';

-- Backfill existing rows (in case column was added without default)
UPDATE public.user_table_preferences
SET view_name = 'default'
WHERE view_name IS NULL;

ALTER TABLE public.user_table_preferences
  ALTER COLUMN view_name SET NOT NULL,
  DROP CONSTRAINT IF EXISTS user_table_preferences_user_id_page_key_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_table_preferences_user_page_view
  ON public.user_table_preferences(user_id, page_key, view_name);
