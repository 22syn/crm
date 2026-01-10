-- Add new fields to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS meeting_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS whatsapp_link text;

-- Add new values to lead_source enum
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'instagram';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'campaign';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'architects';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'facebook';