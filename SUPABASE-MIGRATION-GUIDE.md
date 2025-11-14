# Supabase Migration Guide

## Migration Status: ✅ Created
I have successfully created the migration file for the `saved_rates` table at:
`supabase/migrations/20241114120330_create_saved_rates_table.sql`

## Next Steps to Complete the Migration

### Option 1: Using Supabase CLI (Recommended)

1. **Login to Supabase CLI:**
   ```bash
   npx supabase@latest login
   ```
   - This will open your browser for authentication
   - Follow the prompts to authorize the CLI

2. **Link your project:**
   ```bash
   npx supabase@latest link --project-ref jprafkemftjqrzsrtuui
   ```

3. **Apply the migration:**
   ```bash
   npx supabase@latest db push
   ```

### Option 2: Manual SQL Execution (Quick Fix)

1. **Go to your Supabase Dashboard:**
   - Visit [supabase.com](https://supabase.com)
   - Navigate to your project: `jprafkemftjqrzsrtuui.supabase.co`

2. **Execute the SQL:**
   - Click on "SQL Editor" in the left sidebar
   - Copy the content from the migration file: `supabase/migrations/20241114120330_create_saved_rates_table.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

### Option 3: Full Database Setup (Complete Solution)

Execute the complete database setup:

1. **Go to Supabase Dashboard → SQL Editor**
2. **Copy and execute the entire content from:** `supabase/tables.sql`
   - This includes all required tables: `saved_rates`, `multi_currency_converter_history`, etc.
   - This will resolve ALL database warnings

## Migration Details

The created migration includes:

✅ **Table Structure:**
- `id`: uuid primary key, default gen_random_uuid()
- `user_id`: uuid, references auth.users(id) on delete cascade
- `base_currency`: text, not null
- `target_currency`: text, not null  
- `rate`: numeric, not null
- `created_at`: timestamptz, default now()

✅ **Row Level Security (RLS):** Enabled

✅ **RLS Policies:**
1. "Users can read their own saved rates" - SELECT using (auth.uid() = user_id)
2. "Users can insert their own saved rates" - INSERT with check (auth.uid() = user_id)

✅ **Performance Indexes:** Created for user_id and currency pairs

## Verification Steps

After applying the migration:

1. **Restart your Expo development server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart:
   npx expo start --clear
   ```

2. **Check logs for:**
   - ❌ No more "Database table 'saved_rates' not found" warnings
   - ✅ Successful database operations

3. **Test the functionality:**
   - Try saving rates in your app
   - Verify the database connection works

## Troubleshooting

### If you get permission errors:
1. Check that you're using the correct project URL
2. Verify your API keys are valid  
3. Ensure you have admin access to the Supabase project

### If CLI commands fail:
1. Try the manual SQL execution method (Option 2)
2. Or use the complete setup from `supabase/tables.sql` (Option 3)

## Expected Result

After successful migration:
- ✅ No database warnings in Expo logs
- ✅ Saved rates functionality will work
- ✅ User data will be properly secured with RLS
- ✅ All currency conversion features will be fully functional