# Dashboard System Documentation

## Overview

The RateSnap Dashboard is a customizable, widget-based interface for currency tracking and conversion. It features authentication, real-time data, customizable layouts, rate alerts, and export/import capabilities.

## Architecture

### Core Components

1. **Dashboard Shell** (`components/DashboardShell.tsx`)
   - Main dashboard layout container
   - Handles navigation and global state
   - Integrates with theme system

2. **Widget System**
   - **WidgetContainer** (`components/WidgetContainer.tsx`): Individual widget wrapper
   - **WidgetLibrary** (`components/WidgetLibrary.tsx`): Add new widgets
   - **Widget Types**: currency-converter, calculator, chart, rate-alert, comparison

3. **State Management**
   - **DashboardStore** (`stores/dashboardStore.ts`): Zustand store for widget state
   - **AuthGate** (`components/AuthGate.tsx`): Authentication wrapper
   - **ThemeProvider** (`contexts/ThemeContext.tsx`): Theme management

4. **Data Layer**
   - **Supabase Integration** (`lib/supabase.ts`): Database and auth
   - **Export/Import** (`utils/dashboardExportImport.ts`): Layout backup/restore

## Adding New Widgets

### Step 1: Create Widget Component

```typescript
// widgets/NewWidget.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { WidgetContainer } from '@/components/WidgetContainer';

interface NewWidgetProps {
  config: {
    title: string;
    // ... other props
  };
}

export function NewWidget({ config }: NewWidgetProps) {
  return (
    <WidgetContainer
      widget={{
        id: config.id,
        type: 'new-widget',
        x: config.x,
        y: config.y,
        w: config.w,
        h: config.h,
        props: config,
      }}
      isSelected={config.isSelected}
      isDraggable={true}
      isResizable={true}
    >
      {/* Your widget content */}
      <View>
        <Text>{config.title}</Text>
        {/* Widget-specific UI */}
      </View>
    </WidgetContainer>
  );
}
```

### Step 2: Register Widget Type

Add to `components/WidgetLibrary.tsx`:

```typescript
const WIDGET_TYPES = [
  // ... existing types
  {
    type: 'new-widget',
    title: 'New Widget',
    description: 'Description of new widget',
    icon: '🆕',
    defaultProps: {
      title: 'New Widget',
      // ... default configuration
    },
    render: (props) => <NewWidget config={props} />,
  },
];
```

### Step 3: Update Widget Grid

Add rendering logic to `components/DashboardGrid.tsx`:

```typescript
// Add in the render function
{widget.type === 'new-widget' && <NewWidget config={widget} />}
```

### Step 4: Add to Presets

Update `styles/theme.ts`:

```typescript
export const DashboardPresets = [
  // ... existing presets
  {
    id: 'new-preset',
    name: 'New Preset',
    // ...
    widgets: [
      // ... include your new widget
      {
        type: 'new-widget',
        position: { x: 0, y: 0, w: 6, h: 4 },
        props: {
          title: 'Default Title',
          // ... other defaults
        },
      },
    ],
  },
];
```

## Database Migrations

### Schema Overview

```sql
-- User dashboards table
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

-- Rate alerts table
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
```

### Running Migrations

1. **Local Development**:
   ```bash
   supabase db reset
   ```

2. **Production Deployment**:
   ```bash
   supabase db push
   ```

3. **Creating New Migration**:
   ```bash
   supabase migration new your_migration_name
   ```

## Alert Checker System

### How It Works

The alert checker (`functions/alert-checker.ts`) runs as a Supabase Edge Function, monitoring rate changes and triggering notifications.

### Setup Process

1. **Deploy Edge Function**:
   ```bash
   supabase functions deploy alert-checker
   ```

2. **Set up Scheduled Trigger**:
   ```sql
   -- Add to supabase/migrations/migration_name.sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   
   SELECT cron.schedule(
     'check-rate-alerts',
     '*/5 * * * *', -- Every 5 minutes
     $$
     SELECT net.http_post(
       url := 'https://your-project.supabase.co/functions/v1/alert-checker',
       headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
     );
     $$
   );
   ```

3. **Environment Variables**:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   EXPO_PUBLIC_API_URL=https://api.polygon.io/v1/
   EXPO_PUBLIC_API_KEY=your_api_key
   ```

### Alert Logic

```typescript
// Simplified alert checking logic
async function checkRateAlerts() {
  const alerts = await getActiveAlerts();
  
  for (const alert of alerts) {
    const currentRate = await fetchCurrentRate(alert.currency_pair);
    
    const conditionMet = alert.condition === 'below' 
      ? currentRate <= alert.target_rate
      : currentRate >= alert.target_rate;
      
    if (conditionMet && shouldTrigger(alert)) {
      await triggerAlert(alert, currentRate);
    }
  }
}
```

## Environment Variables

### Required Variables

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# API Keys
EXPO_PUBLIC_API_URL=https://api.polygon.io/v1/
EXPO_PUBLIC_API_KEY=your_polygon_api_key

# Dashboard Feature Flag
EXPO_PUBLIC_ENABLE_CUSTOM_DASHBOARD=true

# Optional: News API
EXPO_PUBLIC_NEWS_API_KEY=your_news_api_key

# Optional: Email Service
SENDGRID_API_KEY=your_sendgrid_key
```

### Development Setup

1. **Copy Environment Template**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in Required Values**:
   ```bash
   # .env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   # ... other variables
   ```

## Authentication Flow

### Implementation

```typescript
// components/AuthGate.tsx
import { AuthAPI } from '@/lib/supabase';

export function AuthGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  const checkAuthStatus = async () => {
    try {
      const user = await AuthAPI.getCurrentUser();
      setIsAuthenticated(!!user);
    } catch {
      setIsAuthenticated(false);
    }
  };
  
  if (!isAuthenticated) {
    return <AuthPrompt />; // Show sign-in UI
  }
  
  return <>{children}</>;
}
```

### Protected Routes

```typescript
// app/dashboard.tsx
export default function DashboardPage() {
  if (!isCustomDashboardEnabled()) {
    return <Redirect href="/" />;
  }

  return (
    <AuthGate>
      <DashboardShell />
    </AuthGate>
  );
}
```

## Export/Import System

### Export Format

```typescript
interface DashboardExport {
  version: string;           // "1.0.0"
  exported_at: string;       // ISO timestamp
  name: string;              // Dashboard name
  widgets: Widget[];         // Widget configuration
  metadata?: {               // Optional metadata
    preset_used?: string;
    theme_preference?: string;
    notes?: string;
  };
}
```

### Usage Examples

```typescript
// Export current dashboard
import { createDashboardExport, exportToFile } from '@/utils/dashboardExportImport';

const exportData = createDashboardExport(
  'My Dashboard', 
  useDashboardStore.getState().widgets,
  { preset_used: 'personal' }
);

exportToFile(exportData);

// Import dashboard
import { importFromJSON } from '@/utils/dashboardExportImport';

try {
  const imported = importFromJSON(jsonString);
  // Handle imported widgets
} catch (error) {
  console.error('Import failed:', error);
}
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/dashboardStore.test.ts

# Run tests in watch mode
npm run test:watch
```

### E2E Testing

The E2E tests (`tests/dashboardE2E.test.ts`) cover:
- Export/Import functionality
- Widget operations (add, remove, resize)
- Authentication flows
- Performance with large datasets

### Test Coverage

```typescript
// Example test
describe('Widget Management', () => {
  it('should add widget with correct configuration', () => {
    const newWidget = {
      type: 'currency-converter',
      x: 0,
      y: 0,
      w: 4,
      h: 3,
      props: { title: 'Test Converter' },
    };
    
    store.addWidget(newWidget);
    expect(store.addWidget).toHaveBeenCalledWith(newWidget);
  });
});
```

## Deployment

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Edge functions deployed
- [ ] Authentication providers configured
- [ ] API rate limits tested
- [ ] Error handling tested

### Production Deployment

```bash
# 1. Build and deploy
npm run build
eas build --platform all

# 2. Deploy Supabase functions
supabase functions deploy --no-verify-jwt

# 3. Apply migrations
supabase db push

# 4. Verify deployment
npm run test:integration
```

## Monitoring and Logging

### Key Metrics to Monitor

1. **Authentication**: Sign-in success rate, session duration
2. **Dashboard Usage**: Widget interactions, layout saves
3. **API Performance**: Response times, rate limits
4. **Alert System**: Trigger accuracy, notification delivery

### Logging Strategy

```typescript
// Example: Dashboard interaction logging
export function logDashboardInteraction(action: string, data: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    analytics.track(action, data);
  } else {
    console.log(`[Dashboard] ${action}:`, data);
  }
}
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**:
   ```bash
   # Check Supabase configuration
   supabase projects list
   supabase status
   ```

2. **Widget Rendering Issues**:
   ```typescript
   // Verify widget registration
   console.log('Available widgets:', WIDGET_TYPES.map(w => w.type));
   ```

3. **Export/Import Problems**:
   ```typescript
   // Validate export format
   const isValid = validateDashboardExport(exportData);
   if (!isValid) console.error('Invalid export format');
   ```

4. **Database Connection Issues**:
   ```bash
   # Check connection
   supabase db ping
   ```

### Debug Mode

Enable debug logging:

```typescript
// In development
if (__DEV__) {
  console.log('[Dashboard Debug]', {
    store: useDashboardStore.getState(),
    auth: await AuthAPI.getCurrentUser(),
  });
}
```

## Performance Optimization

### Widget Performance

- Lazy load heavy widgets
- Memoize complex calculations
- Use FlatList for large widget collections
- Implement virtual scrolling for big dashboards

### State Management

```typescript
// Optimize store updates
const updateWidget = useCallback((id: string, updates: Partial<Widget>) => {
  updateWidget(id, updates);
}, []); // Memoize to prevent unnecessary re-renders
```

### Bundle Size

```typescript
// Dynamically import widgets
const WidgetComponent = useMemo(() => {
  return lazy(() => import(`@/widgets/${widget.type}`));
}, [widget.type]);
```

## Security Considerations

### Data Protection

1. **RLS Policies**: Ensure all database access is user-scoped
2. **Input Validation**: Sanitize all widget configurations
3. **Authentication**: Verify user session on all protected actions
4. **API Security**: Rate limit API calls, validate inputs

### RLS Policy Example

```sql
-- User can only access their own dashboards
CREATE POLICY "Users can view own dashboards"
ON user_dashboards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own dashboards"
ON user_dashboards FOR ALL
USING (auth.uid() = user_id);
```

## Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/new-widget`
2. Implement changes following this documentation
3. Add tests for new functionality
4. Update documentation
5. Submit pull request with clear description

### Code Style

- Use TypeScript for all new code
- Follow React Native best practices
- Write comprehensive tests
- Document complex functions
- Use meaningful variable names

---

## API Reference

### Dashboard Store Methods

```typescript
interface DashboardStore {
  widgets: Widget[];
  selectedWidgetId: string | null;
  
  // CRUD operations
  addWidget(widget: Omit<Widget, 'id'>): void;
  removeWidget(id: string): void;
  updateWidget(id: string, updates: Partial<Widget>): void;
  selectWidget(id: string | null): void;
  
  // Persistence
  saveLayout(): string;
  loadLayout(layoutJson: string): void;
  clearLayout(): void;
}
```

### Widget Configuration

```typescript
interface Widget {
  id: string;                    // Unique identifier
  type: string;                  // Widget type
  x: number;                     // Grid column (0-11)
  y: number;                     // Grid row (0+)
  w: number;                     // Width in grid units (1-12)
  h: number;                     // Height in grid units (1+)
  props: Record<string, any>;    // Widget-specific configuration
}
```

This documentation provides a comprehensive guide for developers working on the dashboard system. For specific implementation details, refer to the source code and inline comments.