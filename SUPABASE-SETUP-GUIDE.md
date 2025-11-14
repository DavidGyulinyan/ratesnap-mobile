# Supabase Database Setup Guide

## Issue Description
The error `PGRST205: Could not find the table 'public.saved_rates' in the schema cache` indicates that your Supabase database doesn't have the required tables for the RateSnap mobile app.

## Root Cause
Your app code expects these database tables to exist:
- `public.saved_rates`
- `public.math_calculator_history` 
- `public.multi_currency_converter_history`
- `public.picked_rates`
- `public.rate_alerts`

These tables are defined in `supabase/tables.sql` but haven't been executed in your Supabase database.

## Solution Options

### Option 1: Manual SQL Execution (Recommended)

1. **Go to your Supabase Dashboard:**
   - Visit [supabase.com](https://supabase.com)
   - Sign in to your account
   - Navigate to your project (jprafkemftjqrzsrtuui.supabase.co)

2. **Execute the SQL:**
   - Click on "SQL Editor" in the left sidebar
   - Copy the content from `supabase/tables.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify Tables:**
   - Go to "Table Editor"
   - You should see all the created tables: saved_rates, rate_alerts, etc.

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to your project directory
cd /path/to/your/ratesnap-mobile

# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref jprafkemftjqrzsrtuui

# Run migrations
supabase db reset
```

### Option 3: Environment Variable Check

Ensure your environment variables are set correctly:

```javascript
// Check in lib/supabase-safe.ts
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

## Required Tables Structure

### saved_rates
```sql
CREATE TABLE public.saved_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, from_currency, to_currency)
);
```

### math_calculator_history
```sql
CREATE TABLE public.math_calculator_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    calculation_expression TEXT NOT NULL,
    result DECIMAL(15, 6) NOT NULL,
    calculation_type VARCHAR(50) DEFAULT 'basic',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

## Troubleshooting

### If you get permission errors:
1. Check that you're using the correct project URL
2. Verify your API keys are valid
3. Ensure you have admin access to the Supabase project

### If tables still don't appear:
1. Clear your browser cache
2. Wait a few minutes (database propagation delay)
3. Try refreshing the Supabase dashboard

### Testing the fix:
1. After running the migration, restart your Expo development server
2. Test the app functionality
3. Check the browser console for errors

## Prevention
To avoid this issue in the future:
1. Always run database migrations before deploying
2. Use environment variables for database configuration
3. Test database connectivity in your CI/CD pipeline

## Quick Fix Commands
```bash
# Stop current Expo server
# Then restart with:
npx expo start --clear
```

## Support
If you continue to experience issues:
1. Check Supabase status: https://status.supabase.com/
2. Review Supabase logs in your project dashboard
3. Verify your internet connection and API credentials