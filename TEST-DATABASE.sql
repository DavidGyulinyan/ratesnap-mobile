-- Quick Database Test Script
-- Run this in your Supabase SQL Editor to verify table structure

-- 1. Check if table exists
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'saved_rates' 
ORDER BY ordinal_position;

-- 2. Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'saved_rates';

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'saved_rates';

-- 4. Check if there are any records (should be empty initially)
SELECT COUNT(*) as total_records FROM saved_rates;

-- 5. Test inserting a record (replace YOUR_USER_ID with actual user ID)
-- INSERT INTO saved_rates (user_id, from_currency, to_currency, rate) 
-- VALUES ('YOUR_USER_ID', 'USD', 'EUR', 0.85);

-- 6. Clean up test record if you inserted one
-- DELETE FROM saved_rates WHERE from_currency = 'USD' AND to_currency = 'EUR';