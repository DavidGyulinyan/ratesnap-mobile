-- Add notified column to rate_alerts table
-- This migration adds the notified field to track when alerts have been triggered

ALTER TABLE public.rate_alerts
ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;

-- Add comment to document the column
COMMENT ON COLUMN public.rate_alerts.notified IS 'Indicates if the alert has been triggered and user notified';

-- Update existing rows to have notified = false (they should be false by default, but this ensures it)
UPDATE public.rate_alerts
SET notified = false
WHERE notified IS NULL;