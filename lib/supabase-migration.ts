import { getSupabaseClient } from './supabase-safe';

export async function runDatabaseMigration(): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, message: 'Supabase client not available' };
    }

    // Check if tables already exist
    const { data: existingTables, error: checkError } = await supabase
      .rpc('get_table_info', { table_name: 'saved_rates' });

    if (!checkError && existingTables) {
      return { success: true, message: 'Tables already exist' };
    }

    // If you have access to service role key, you can run the migration directly
    // This requires the service role key to be configured
    const migrationSQL = `
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

      -- Create multi_currency_converter_history table
      CREATE TABLE IF NOT EXISTS public.multi_currency_converter_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          from_currency VARCHAR(10) NOT NULL,
          amount DECIMAL(15, 4) NOT NULL,
          target_currencies JSONB NOT NULL,
          conversion_results JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );

      -- Create math_calculator_history table
      CREATE TABLE IF NOT EXISTS public.math_calculator_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          calculation_expression TEXT NOT NULL,
          result DECIMAL(15, 6) NOT NULL,
          calculation_type VARCHAR(50) DEFAULT 'basic',
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );

      -- Create picked_rates table
      CREATE TABLE IF NOT EXISTS public.picked_rates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          from_currency VARCHAR(10) NOT NULL,
          to_currency VARCHAR(10) NOT NULL,
          rate DECIMAL(10, 6) NOT NULL,
          interaction_type VARCHAR(20) CHECK (interaction_type IN ('viewed', 'copied', 'converted', 'calculated')) DEFAULT 'viewed',
          context JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );

      -- Add RLS policies for new tables
      ALTER TABLE public.multi_currency_converter_history ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.math_calculator_history ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.picked_rates ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Users can view own converter history" ON public.multi_currency_converter_history
          FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert own converter history" ON public.multi_currency_converter_history
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can delete own converter history" ON public.multi_currency_converter_history
          FOR DELETE USING (auth.uid() = user_id);

      CREATE POLICY "Users can view own calculator history" ON public.math_calculator_history
          FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert own calculator history" ON public.math_calculator_history
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can delete own calculator history" ON public.math_calculator_history
          FOR DELETE USING (auth.uid() = user_id);

      CREATE POLICY "Users can view own picked rates" ON public.picked_rates
          FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert own picked rates" ON public.picked_rates
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update own picked rates" ON public.picked_rates
          FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete own picked rates" ON public.picked_rates
          FOR DELETE USING (auth.uid() = user_id);

      -- Create indexes for new tables
      CREATE INDEX IF NOT EXISTS idx_converter_history_user_id ON public.multi_currency_converter_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_converter_history_created_at ON public.multi_currency_converter_history(created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_calculator_history_user_id ON public.math_calculator_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_calculator_history_created_at ON public.math_calculator_history(created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_picked_rates_user_id ON public.picked_rates(user_id);
      CREATE INDEX IF NOT EXISTS idx_picked_rates_created_at ON public.picked_rates(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_picked_rates_currencies ON public.picked_rates(from_currency, to_currency);
    `;

    // Note: This migration requires service role key privileges
    // You may need to run this SQL directly in your Supabase SQL Editor
    
    return { 
      success: false, 
      message: 'Migration script created. Please run the SQL manually in Supabase SQL Editor. See SUPABASE-SETUP-GUIDE.md for instructions.' 
    };

  } catch (error) {
    console.error('Migration error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown migration error' 
    };
  }
}

// Check database connection and table existence
export async function checkDatabaseTables(): Promise<{ tablesExist: boolean; message: string }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { tablesExist: false, message: 'Supabase client not available' };
    }

    // Try to query the tables to see if they exist
    const { error: savedRatesError } = await supabase
      .from('saved_rates')
      .select('id')
      .limit(1);

    if (savedRatesError && savedRatesError.code === 'PGRST205') {
      return { tablesExist: false, message: 'Tables do not exist. Run migration script.' };
    }

    return { tablesExist: true, message: 'Database tables are available' };
  } catch (error) {
    return { 
      tablesExist: false, 
      message: error instanceof Error ? error.message : 'Error checking tables' 
    };
  }
}