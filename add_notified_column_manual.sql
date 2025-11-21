-- Manual SQL script to add notified column to rate_alerts table
-- Run this directly in your Supabase SQL editor or database console

-- Add the notified column if it doesn't exist
ALTER TABLE rate_alerts
ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN rate_alerts.notified IS 'Indicates if the alert has been triggered and user notified';

-- Ensure all existing records have notified = false
UPDATE rate_alerts
SET notified = false
WHERE notified IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'rate_alerts' AND column_name = 'notified';