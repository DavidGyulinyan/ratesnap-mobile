-- Create rate_alerts table for currency rate notifications
-- Migration: 002_create_rate_alerts
-- Created: 2025-11-01

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create rate_alerts table
CREATE TABLE rate_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pair TEXT NOT NULL CHECK (pair ~ '^[A-Z]{3}_[A-Z]{3}$'), -- Format: USD_EUR
    target_rate NUMERIC(10, 6) NOT NULL CHECK (target_rate > 0),
    direction TEXT NOT NULL CHECK (direction IN ('>=', '<=', 'above', 'below')),
    active BOOLEAN DEFAULT true NOT NULL,
    notified BOOLEAN DEFAULT false NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_rate_alerts_user_id ON rate_alerts(user_id);
CREATE INDEX idx_rate_alerts_pair ON rate_alerts(pair);
CREATE INDEX idx_rate_alerts_active ON rate_alerts(active) WHERE active = true;
CREATE INDEX idx_rate_alerts_notified ON rate_alerts(notified) WHERE notified = false;

-- Create unique constraint to prevent duplicate active alerts for same user/pair
CREATE UNIQUE INDEX idx_rate_alerts_user_pair_active 
ON rate_alerts(user_id, pair) 
WHERE active = true AND notified = false;

-- Add RLS (Row Level Security) policies
ALTER TABLE rate_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own alerts
CREATE POLICY "Users can view own rate alerts" ON rate_alerts
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own alerts
CREATE POLICY "Users can insert own rate alerts" ON rate_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own alerts
CREATE POLICY "Users can update own rate alerts" ON rate_alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own alerts
CREATE POLICY "Users can delete own rate alerts" ON rate_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_rate_alerts_updated_at 
    BEFORE UPDATE ON rate_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to validate currency pair format
CREATE OR REPLACE FUNCTION validate_currency_pair(pair_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN pair_text ~ '^[A-Z]{3}_[A-Z]{3}$';
END;
$$ LANGUAGE plpgsql;

-- Add function to get current rate for a pair
CREATE OR REPLACE FUNCTION get_current_rate(pair_text TEXT)
RETURNS NUMERIC AS $$
DECLARE
    current_rate NUMERIC;
BEGIN
    -- This function would integrate with your rates API
    -- For now, returning a mock rate based on pair
    CASE pair_text
        WHEN 'USD_EUR' THEN current_rate := 0.85;
        WHEN 'USD_GBP' THEN current_rate := 0.73;
        WHEN 'USD_JPY' THEN current_rate := 110.0;
        WHEN 'USD_CAD' THEN current_rate := 1.25;
        WHEN 'USD_AUD' THEN current_rate := 1.35;
        WHEN 'EUR_GBP' THEN current_rate := 0.86;
        ELSE current_rate := 1.0;
    END CASE;
    
    RETURN current_rate;
END;
$$ LANGUAGE plpgsql;

-- Add function to check alert triggers
CREATE OR REPLACE FUNCTION check_alert_triggers()
RETURNS TABLE (
    alert_id UUID,
    user_id UUID,
    pair TEXT,
    target_rate NUMERIC,
    direction TEXT,
    current_rate NUMERIC,
    triggered BOOLEAN
) AS $$
BEGIN
    -- Return alerts that should be triggered
    RETURN QUERY
    SELECT 
        ra.id,
        ra.user_id,
        ra.pair,
        ra.target_rate,
        ra.direction,
        get_current_rate(ra.pair) as current_rate,
        CASE 
            WHEN ra.direction = '>=' AND get_current_rate(ra.pair) >= ra.target_rate THEN true
            WHEN ra.direction = '<=' AND get_current_rate(ra.pair) <= ra.target_rate THEN true
            WHEN ra.direction = 'above' AND get_current_rate(ra.pair) > ra.target_rate THEN true
            WHEN ra.direction = 'below' AND get_current_rate(ra.pair) < ra.target_rate THEN true
            ELSE false
        END as triggered
    FROM rate_alerts ra
    WHERE ra.active = true 
    AND ra.notified = false
    AND (
        (ra.direction = '>=' AND get_current_rate(ra.pair) >= ra.target_rate) OR
        (ra.direction = '<=' AND get_current_rate(ra.pair) <= ra.target_rate) OR
        (ra.direction = 'above' AND get_current_rate(ra.pair) > ra.target_rate) OR
        (ra.direction = 'below' AND get_current_rate(ra.pair) < ra.target_rate)
    );
END;
$$ LANGUAGE plpgsql;

-- Add notification preferences table for future expansion
CREATE TABLE notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    in_app_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add RLS policies for notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Add trigger for notification_preferences updated_at
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get user's notification preferences
CREATE OR REPLACE FUNCTION get_notification_preferences(user_uuid UUID)
RETURNS notification_preferences AS $$
DECLARE
    prefs notification_preferences;
BEGIN
    SELECT * INTO prefs 
    FROM notification_preferences 
    WHERE user_id = user_uuid;
    
    -- If no preferences exist, create default ones
    IF prefs IS NULL THEN
        INSERT INTO notification_preferences (user_id) VALUES (user_uuid)
        RETURNING * INTO prefs;
    END IF;
    
    RETURN prefs;
END;
$$ LANGUAGE plpgsql;

-- Create notifications table to track sent notifications
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES rate_alerts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in_app', 'email', 'push')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    data JSONB -- Additional notification data
);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Add indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_alert_id ON notifications(alert_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Add table for alert notification history
CREATE TABLE alert_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alert_id UUID REFERENCES rate_alerts(id) ON DELETE CASCADE,
    triggered_rate NUMERIC(10, 6) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    notification_types TEXT[] DEFAULT ARRAY['in_app'] -- Types of notifications sent
);

-- Add RLS policies for alert_notifications
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alert notifications" ON alert_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rate_alerts ra 
            WHERE ra.id = alert_notifications.alert_id 
            AND ra.user_id = auth.uid()
        )
    );

-- Add indexes for alert_notifications
CREATE INDEX idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX idx_alert_notifications_sent_at ON alert_notifications(sent_at);

-- Insert some sample data for testing (only if not in production)
-- This would typically be done through the application
/*
INSERT INTO rate_alerts (user_id, pair, target_rate, direction, active)
SELECT 
    auth.uid(),
    'USD_EUR',
    0.90,
    '>=',
    true
WHERE auth.uid() IS NOT NULL;
*/

-- Comments for documentation
COMMENT ON TABLE rate_alerts IS 'Stores currency rate alerts for users';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification types';
COMMENT ON TABLE notifications IS 'Sent notifications to users';
COMMENT ON TABLE alert_notifications IS 'History of triggered alert notifications';

COMMENT ON COLUMN rate_alerts.direction IS 'Comparison operator: >= (greater than or equal), <= (less than or equal), above (greater than), below (less than)';
COMMENT ON COLUMN rate_alerts.triggered_at IS 'When the alert was last triggered';
COMMENT ON COLUMN rate_alerts.notified IS 'Whether the user has been notified about this trigger';