-- Create user_dashboards table
CREATE TABLE IF NOT EXISTS user_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    layout JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_dashboards_user_id ON user_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboards_is_default ON user_dashboards(is_default);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_dashboards_updated_at 
    BEFORE UPDATE ON user_dashboards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_dashboards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy: Users can only see their own dashboards
CREATE POLICY "Users can view own dashboards" ON user_dashboards
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own dashboards
CREATE POLICY "Users can insert own dashboards" ON user_dashboards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own dashboards
CREATE POLICY "Users can update own dashboards" ON user_dashboards
    FOR UPDATE USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own dashboards
CREATE POLICY "Users can delete own dashboards" ON user_dashboards
    FOR DELETE USING (auth.uid() = user_id);

-- Create unique constraint: one default dashboard per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_dashboards_default_per_user 
ON user_dashboards (user_id) 
WHERE is_default = true;

-- Add comments for documentation
COMMENT ON TABLE user_dashboards IS 'Stores user dashboard layouts and configurations';
COMMENT ON COLUMN user_dashboards.layout IS 'JSON array of widget configurations with positions and properties';
COMMENT ON COLUMN user_dashboards.is_default IS 'Indicates if this is the user default dashboard';
COMMENT ON COLUMN user_dashboards.name IS 'User-friendly name for the dashboard layout';