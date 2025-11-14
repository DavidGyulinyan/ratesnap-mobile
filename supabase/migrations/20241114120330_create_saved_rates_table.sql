-- Migration: create_saved_rates_table
-- Created: 2024-11-14 12:03:30

-- Create saved_rates table
CREATE TABLE IF NOT EXISTS public.saved_rates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    from_currency varchar(10) NOT NULL,
    to_currency varchar(10) NOT NULL,
    rate numeric(10,6) NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.saved_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy 1: "Users can read their own saved rates"
CREATE POLICY "Users can read their own saved rates" ON public.saved_rates
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: "Users can insert their own saved rates"
CREATE POLICY "Users can insert their own saved rates" ON public.saved_rates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 3: "Users can update their own saved rates"
CREATE POLICY "Users can update their own saved rates" ON public.saved_rates
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy 4: "Users can delete their own saved rates"
CREATE POLICY "Users can delete their own saved rates" ON public.saved_rates
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_saved_rates_user_id ON public.saved_rates(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_rates_currencies ON public.saved_rates(from_currency, to_currency);