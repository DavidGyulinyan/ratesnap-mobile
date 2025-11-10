-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create saved_rates table
CREATE TABLE IF NOT EXISTS public.saved_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, from_currency, to_currency)
);

-- Create rate_alerts table
CREATE TABLE IF NOT EXISTS public.rate_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    target_rate DECIMAL(10, 6) NOT NULL,
    condition VARCHAR(10) CHECK (condition IN ('above', 'below')) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies for saved_rates
ALTER TABLE public.saved_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved rates" ON public.saved_rates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved rates" ON public.saved_rates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved rates" ON public.saved_rates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved rates" ON public.saved_rates
    FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for rate_alerts
ALTER TABLE public.rate_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate alerts" ON public.rate_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rate alerts" ON public.rate_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rate alerts" ON public.rate_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rate alerts" ON public.rate_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_rates_user_id ON public.saved_rates(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_rates_currencies ON public.saved_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_rate_alerts_user_id ON public.rate_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_alerts_active ON public.rate_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rate_alerts_currencies ON public.rate_alerts(from_currency, to_currency);

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_saved_rates_updated_at BEFORE UPDATE ON public.saved_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_alerts_updated_at BEFORE UPDATE ON public.rate_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();