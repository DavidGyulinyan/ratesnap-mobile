# Migration Runbook - Dashboard System v1.0.0

## Overview

This runbook provides step-by-step instructions for migrating from previous versions to Dashboard System v1.0.0. Follow these procedures carefully to ensure data integrity and smooth operation.

## Pre-Migration Checklist

### Environment Requirements
- [ ] Node.js 18+ installed
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Expo CLI installed (`npm install -g @expo/cli`)
- [ ] Git repository access
- [ ] Production database backup completed

### Access Requirements
- [ ] Supabase project admin access
- [ ] Production deployment pipeline access
- [ ] Domain/DNS management access
- [ ] Certificate management access
- [ ] Error monitoring dashboard access

### Database Backup
```bash
# Create full database backup
supabase db dump --data-only > pre_migration_backup_$(date +%Y%m%d_%H%M%S).sql

# Create schema backup
supabase db dump --schema-only > pre_migration_schema_$(date +%Y%m%d_%H%M%S).sql

# Verify backup integrity
wc -l pre_migration_backup_*.sql
```

## Migration Phases

### Phase 1: Database Migration

#### Step 1: Create Migration Files
```bash
# Generate new migration
supabase migration new dashboard_v1_migration

# Edit migration file (supabase/migrations/YYYYMMDDHHMMSS_dashboard_v1_migration.sql)
```

#### Step 2: Apply Database Changes
```bash
# Apply migration locally first
supabase db reset

# Test migration in staging
supabase db push --linked

# Verify schema changes
supabase db diff
```

#### Step 3: Database Schema Updates
```sql
-- Add to migration file: dashboard_v1_migration.sql

-- Create user_dashboards table
CREATE TABLE user_dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layout JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, is_default) WHERE is_default = TRUE
);

-- Create rate_alerts table
CREATE TABLE rate_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  currency_pair TEXT NOT NULL,
  target_rate DECIMAL(10,6) NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
  is_active BOOLEAN DEFAULT TRUE,
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_dashboards_user_id ON user_dashboards(user_id);
CREATE INDEX idx_user_dashboards_updated_at ON user_dashboards(updated_at DESC);
CREATE INDEX idx_rate_alerts_user_id ON rate_alerts(user_id);
CREATE INDEX idx_rate_alerts_active ON rate_alerts(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE user_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own dashboards"
ON user_dashboards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dashboards"
ON user_dashboards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboards"
ON user_dashboards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboards"
ON user_dashboards FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own rate alerts"
ON rate_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rate alerts"
ON rate_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rate alerts"
ON rate_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rate alerts"
ON rate_alerts FOR DELETE
USING (auth.uid() = user_id);

-- Update function for updated_at timestamps
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

CREATE TRIGGER update_rate_alerts_updated_at
BEFORE UPDATE ON rate_alerts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

#### Step 4: Verify Migration Success
```bash
# Check migration status
supabase migration list

# Verify new tables exist
supabase db query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

# Verify RLS policies
supabase db query "SELECT schemaname, tablename, policyname FROM pg_policies;"
```

### Phase 2: Application Code Migration

#### Step 1: Update Dependencies
```bash
# Update package.json with new dependencies
npm install @supabase/supabase-js zustand react-grid-layout @types/react-grid-layout
npm install @react-native-async-storage/async-storage

# Update existing dependencies
npm update
```

#### Step 2: Environment Variables Setup
```bash
# Add to .env.example
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_ENABLE_CUSTOM_DASHBOARD=true

# Update production .env (keep existing variables)
```

#### Step 3: Code Changes Integration
```bash
# Copy new dashboard files
cp -r new-dashboard-files/* ./
# Update existing files with migration changes

# Install new dependencies
npm install

# Run tests to ensure nothing is broken
npm test
```

#### Step 4: Feature Flag Configuration
```bash
# Update app.json or app.config.js
{
  "expo": {
    "extra": {
      "enableCustomDashboard": process.env.EXPO_PUBLIC_ENABLE_CUSTOM_DASHBOARD === 'true'
    }
  }
}
```

### Phase 3: Edge Functions Deployment

#### Step 1: Deploy Alert Checker Function
```bash
# Deploy edge function
supabase functions deploy alert-checker

# Test function locally
supabase functions serve alert-checker

# Verify function deployment
curl -X POST https://your-project.supabase.co/functions/v1/alert-checker \
  -H "Authorization: Bearer $(supabase status | grep 'API URL' | cut -d: -f2 | xargs)"
```

#### Step 2: Set up Scheduled Tasks
```sql
-- Add to migration or run separately
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule alert checker to run every 5 minutes
SELECT cron.schedule(
  'check-rate-alerts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/alert-checker',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);
```

#### Step 3: Verify Function Configuration
```bash
# Check scheduled jobs
SELECT * FROM cron.job;

# Test function manually
supabase functions invoke alert-checker --data '{"test": true}'
```

### Phase 4: Authentication Setup

#### Step 1: Configure Auth Providers
```bash
# Enable email authentication in Supabase dashboard
# Configure OAuth providers if needed
# Set up email templates for verification
```

#### Step 2: Update Auth Callbacks
```sql
-- Add redirect URLs for production domain
-- Configure proper session settings
```

### Phase 5: Data Migration (If Applicable)

#### Step 1: Export Existing Data
```bash
# Export any existing dashboard data
# This step only applies if migrating from a previous version with data
```

#### Step 2: Transform and Import Data
```typescript
// Data transformation script
import { supabase } from './lib/supabase';

// Transform old format to new format
const transformOldData = (oldData) => {
  return {
    name: oldData.dashboardName || 'Migrated Dashboard',
    layout: transformLayout(oldData.widgets),
    is_default: true
  };
};

// Import transformed data
const migrateUserData = async (userId: string, oldData: any) => {
  const transformedData = transformOldData(oldData);
  
  const { data, error } = await supabase
    .from('user_dashboards')
    .insert({
      user_id: userId,
      ...transformedData
    });
    
  if (error) throw error;
  return data;
};
```

### Phase 6: Testing and Validation

#### Step 1: Staging Environment Testing
```bash
# Deploy to staging environment
eas build --platform all --profile staging

# Run E2E tests
npm run test:e2e

# Manual testing checklist:
# - [ ] User registration/sign-in works
# - [ ] Dashboard loads correctly
# - [ ] Widgets can be added/removed/resized
# - [ ] Layout saves and loads
# - [ ] Export/import functionality works
# - [ ] Rate alerts can be created
# - [ ] Theme toggle works
# - [ ] Preset loading works
```

#### Step 2: Performance Testing
```bash
# Load testing for concurrent users
# API response time testing
# Database query performance testing

# Metrics to verify:
# - Dashboard load time < 2 seconds
# - Widget operations < 500ms
# - Database queries < 100ms average
```

#### Step 3: Security Testing
```bash
# Authentication flow testing
# Authorization testing (RLS policies)
# Input validation testing
# SQL injection prevention testing
```

## Deployment Steps

### Step 1: Pre-Deployment Verification
```bash
# Final checklist:
# - [ ] All tests passing
# - [ ] Database migrations applied
# - [ ] Edge functions deployed
# - [ ] Environment variables configured
# - [ ] SSL certificates valid
# - [ ] Monitoring and alerting configured
# - [ ] Backup systems in place
# - [ ] Rollback plan ready
```

### Step 2: Production Deployment
```bash
# Create production build
eas build --platform all --profile production

# Deploy to app stores (if mobile)
eas submit --platform all

# Update production environment
# Deploy to hosting platform
# Update DNS if necessary
```

### Step 3: Post-Deployment Verification
```bash
# Verify production deployment
curl -I https://your-domain.com/health

# Check application logs
# Verify database connections
# Test critical user flows
```

## Rollback Procedures

### Emergency Rollback
```bash
# If critical issues are found immediately after deployment:

# 1. Revert to previous version
# - Redeploy previous app build
# - Revert database changes if necessary

# 2. Restore database from backup
psql -h db-host -U postgres -d postgres < pre_migration_backup_*.sql

# 3. Verify rollback
# - Test key functionality
# - Check error rates
# - Monitor user feedback
```

### Partial Rollback
```bash
# If only specific features are problematic:
# - Disable feature flags
# - Hide problematic widgets
# - Disable problematic functions
```

## Monitoring and Validation

### Post-Migration Monitoring
```bash
# Key metrics to monitor:
# - Application uptime
# - Error rates
# - Response times
# - Database performance
# - User authentication success rate
# - Dashboard usage metrics
```

### Health Check Endpoints
```typescript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});
```

### Automated Monitoring
```bash
# Set up alerts for:
# - High error rates
# - Slow response times
# - Database connection issues
# - Authentication failures
# - Critical function failures
```

## Communication Plan

### Stakeholder Notifications
- [ ] Development team notified of migration start
- [ ] Operations team ready for monitoring
- [ ] Customer support team briefed on changes
- [ ] Users notified of potential downtime
- [ ] Status page updated if applicable

### Communication Timeline
- **T-24 hours**: Pre-migration announcement
- **T-1 hour**: Final deployment notification
- **T+0**: Migration start
- **T+30 minutes**: Mid-migration status update
- **T+1 hour**: Migration completion notification
- **T+24 hours**: Post-migration follow-up

## Troubleshooting Guide

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Check database connectivity
supabase status

# Verify credentials
supabase projects list

# Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

#### Authentication Problems
```javascript
// Debug auth issues
console.log('Auth configuration:', {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
});
```

#### Widget Loading Issues
```bash
# Check widget registration
# Verify component imports
# Check for console errors
```

#### Performance Issues
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check database connections
SELECT count(*) FROM pg_stat_activity;
```

### Emergency Contacts
- **Technical Lead**: [contact info]
- **Database Admin**: [contact info]
- **Operations**: [contact info]
- **Customer Support**: [contact info]

## Success Criteria

### Technical Success
- [ ] All tests passing
- [ ] Zero critical errors in logs
- [ ] Database performance within thresholds
- [ ] API response times within targets
- [ ] Authentication flow working correctly

### Business Success
- [ ] Users can access dashboard
- [ ] Widget functionality working as expected
- [ ] No data loss
- [ ] Export/import working correctly
- [ ] User feedback positive

### Operational Success
- [ ] Monitoring systems functioning
- [ ] Alert systems working
- [ ] Backup systems verified
- [ ] Documentation updated
- [ ] Support team trained

---

## Quick Reference Commands

```bash
# Migration commands
supabase db push                # Apply migrations
supabase migration list         # Check migration status
supabase db reset              # Reset local database

# Function deployment
supabase functions deploy alert-checker
supabase functions serve alert-checker

# Build and deployment
eas build --platform all --profile production
eas submit --platform all

# Monitoring
supabase status                # Check Supabase status
npm run test:e2e              # Run E2E tests
npm run test:coverage         # Check test coverage
```

*Last updated: 2025-11-01*
*Version: 1.0.0*