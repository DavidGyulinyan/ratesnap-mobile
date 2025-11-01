# Rate Alert System - Scheduled Checker Setup

This document explains how to set up and run the automated rate alert checking system for the currency converter application.

## Overview

The rate alert system automatically monitors currency rates and sends notifications when alerts are triggered. The system consists of:

1. **Database Tables**: `rate_alerts`, `notifications`, `notification_preferences`
2. **Alert Checker Function**: `functions/alert-checker.ts`
3. **Notifications System**: In-app, email, and push notifications
4. **Client Widget**: RateAlert component for managing alerts

## Deployment Options

### Option 1: Supabase Edge Function + Scheduled Cron (Recommended)

#### Step 1: Deploy Edge Function

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Deploy the edge function
supabase functions deploy alert-checker
```

#### Step 2: Set up Scheduled Cron

Use Supabase's built-in cron service or external scheduler:

**Supabase Dashboard Method:**
1. Go to Project Dashboard → Database → Extensions
2. Enable the `pg_cron` extension if not already enabled
3. Run the following SQL to set up the cron job:

```sql
-- Run alert checker every 15 minutes
SELECT cron.schedule(
  'rate-alert-checker',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/alert-checker',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

**Alternative External Scheduler:**

Set up a cron job with your preferred scheduler (GitHub Actions, AWS EventBridge, etc.):

```bash
# Example: GitHub Actions workflow (create .github/workflows/alert-checker.yml)
name: Rate Alert Checker
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:  # Allow manual triggering

jobs:
  check-alerts:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Alert Checker
        run: |
          curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/alert-checker \
            -H "Authorization: Bearer YOUR_ANON_KEY" \
            -H "Content-Type: application/json"
```

### Option 2: Manual/API Endpoint Method

If scheduled execution isn't available, use the manual API endpoint:

#### API Endpoint

```
POST /functions/v1/alert-checker
```

#### Example Usage:

**Manual trigger:**
```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/alert-checker \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "checked": 15,
  "triggered": 2,
  "errors": [],
  "timestamp": "2025-11-01T19:00:00.000Z"
}
```

#### Integration Points:

**Development:**
- Use `npm run check-alerts` (if script added to package.json)
- Call via browser: `https://localhost:54321/functions/v1/alert-checker`

**Production:**
- Set up external cron service to call the endpoint
- Monitor execution logs for errors

## Environment Variables

Ensure these environment variables are set:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Email Service (SendGrid, Mailgun, etc.)
SENDGRID_API_KEY=your-sendgrid-api-key

# Optional: Push Notifications (Firebase)
FIREBASE_SERVICE_ACCOUNT_KEY=your-firebase-key
```

## Database Schema

The system uses these tables (created by migration `002_create_rate_alerts.sql`):

### rate_alerts
- `id` - Primary key
- `user_id` - References auth.users
- `pair` - Currency pair (e.g., "USD_EUR")
- `target_rate` - The target exchange rate
- `direction` - Comparison operator (>=, <=, above, below)
- `active` - Whether the alert is active
- `notified` - Whether user has been notified
- `triggered_at` - When the alert was last triggered

### notifications
- `id` - Primary key
- `user_id` - References auth.users
- `alert_id` - References rate_alerts
- `type` - Notification type (in_app, email, push)
- `title` - Notification title
- `message` - Notification message
- `sent_at` - When notification was sent
- `read_at` - When user read the notification

### notification_preferences
- `id` - Primary key
- `user_id` - References auth.users
- `in_app_notifications` - Enable/disable in-app notifications
- `email_notifications` - Enable/disable email notifications
- `push_notifications` - Enable/disable push notifications

## Client Integration

### React Native Widget

The `RateAlert.tsx` widget can be added to any dashboard:

```tsx
import { RateAlert } from '@/widgets/RateAlert';

function DashboardScreen() {
  return (
    <DashboardShell>
      <RateAlert 
        widgetId="my-alert-widget"
        onWidgetChange={(props) => {
          // Handle widget configuration changes
          console.log('Alert widget updated:', props);
        }}
      />
    </DashboardShell>
  );
}
```

### Dashboard Grid Integration

Add to widget library:

```tsx
// components/WidgetLibrary.tsx
{
  id: 'rate-alert',
  type: 'rate-alert',
  name: 'Rate Alerts',
  description: 'Manage currency rate alerts',
  icon: '🔔',
  defaultWidth: 6,
  defaultHeight: 8,
  category: 'alerts',
}
```

## Testing

### Unit Tests

```bash
npm test -- RateAlertSystem.test.ts
```

### Manual Testing

1. Create test alerts using the widget
2. Manually trigger the checker:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/alert-checker
```

3. Check notifications table for results:

```sql
SELECT * FROM notifications WHERE type = 'in_app' ORDER BY sent_at DESC;
```

### Mock Data

For testing without real API calls, the system includes mock rate data:

```typescript
const mockRates = {
  'USD_EUR': 0.85,
  'USD_GBP': 0.73,
  'USD_JPY': 110.0,
  // ... more pairs
};
```

## Monitoring & Troubleshooting

### Logs

Check function logs in Supabase Dashboard:
1. Go to Project Dashboard → Edge Functions → alert-checker
2. View execution logs for debugging

### Common Issues

1. **No alerts triggering**
   - Check if `active = true` and `notified = false`
   - Verify rate comparison logic
   - Check current rates match expected values

2. **Notifications not sending**
   - Check `notification_preferences` table
   - Verify user authentication
   - Check notification service configuration

3. **Function timeout**
   - Reduce check frequency
   - Optimize database queries
   - Consider pagination for large datasets

### Performance Monitoring

Monitor these metrics:
- Alert check execution time
- Number of alerts checked per execution
- Number of alerts triggered
- Notification delivery success rate

## Security Considerations

1. **Row Level Security (RLS)**
   - Users can only access their own alerts
   - Server function uses service role for cross-user operations

2. **Rate Limiting**
   - Implement rate limiting on the API endpoint
   - Monitor for abuse (excessive alert creation)

3. **Data Validation**
   - Validate currency pair format
   - Sanitize user inputs
   - Limit alert frequency per user

## Scalability

### Large Scale Deployment

For high-volume usage:

1. **Database Optimization**
   - Add more specific indexes
   - Consider table partitioning by date
   - Use connection pooling

2. **Caching**
   - Cache current rates to reduce API calls
   - Cache alert results to avoid duplicate processing

3. **Queue System**
   - Use background jobs for notifications
   - Implement retry logic for failed notifications

4. **Microservices**
   - Separate alert checking from notification sending
   - Use message queues for better reliability

## Support

For issues or questions:
1. Check the test suite for expected behavior
2. Review logs for detailed error messages
3. Refer to the Supabase documentation for Edge Functions
4. Check the notification service documentation for email/push integration