-- Per-user table view filter preferences (e.g. Leads, Deals)
CREATE TABLE public.user_table_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_key text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, page_key)
);

CREATE INDEX idx_user_table_preferences_user_page ON public.user_table_preferences(user_id, page_key);

ALTER TABLE public.user_table_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own table preferences"
ON public.user_table_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own table preferences"
ON public.user_table_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own table preferences"
ON public.user_table_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own table preferences"
ON public.user_table_preferences FOR DELETE
USING (auth.uid() = user_id);
