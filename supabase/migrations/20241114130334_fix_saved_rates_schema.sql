-- Migration: fix_saved_rates_schema
-- Created: 2024-11-14 13:03:34
-- Purpose: Fix column names to match application code

-- First, check if the old column names exist and rename them
DO $$ 
BEGIN
    -- Rename base_currency to from_currency if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saved_rates' AND column_name = 'base_currency'
    ) THEN
        ALTER TABLE public.saved_rates RENAME COLUMN base_currency TO from_currency;
    END IF;

    -- Rename target_currency to to_currency if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saved_rates' AND column_name = 'target_currency'
    ) THEN
        ALTER TABLE public.saved_rates RENAME COLUMN target_currency TO to_currency;
    END IF;
END $$;

-- Ensure updated_at column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saved_rates' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.saved_rates ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
    END IF;
END $$;

-- Add missing RLS policies if they don't exist
DO $$
BEGIN
    -- Add UPDATE policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'saved_rates' 
        AND policyname = 'Users can update their own saved rates'
    ) THEN
        CREATE POLICY "Users can update their own saved rates" ON public.saved_rates
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Add DELETE policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'saved_rates' 
        AND policyname = 'Users can delete their own saved rates'
    ) THEN
        CREATE POLICY "Users can delete their own saved rates" ON public.saved_rates
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Update indexes to use new column names
DROP INDEX IF EXISTS idx_saved_rates_currencies;
CREATE INDEX IF NOT EXISTS idx_saved_rates_currencies ON public.saved_rates(from_currency, to_currency);