# Supabase Dashboard Persistence Setup Guide

This guide will help you set up Supabase for persistent dashboard storage with authentication and Row Level Security (RLS).

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js and npm installed
- Expo/React Native development environment

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `ratesnap-mobile` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
5. Click "Create new project"

## Step 2: Run Database Migration

### Option A: Using Supabase CLI (Recommended)

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Find your project reference in the project settings URL)

4. **Run the migration**:
   ```bash
   supabase db push
   ```

### Option B: Manual SQL Execution

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `supabase/migrations/001_create_user_dashboards.sql`
4. Click **Run** to execute

## Step 3: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Configure your auth settings:
   - **Site URL**: `http://localhost:8081` (for development)
   - **Additional URLs**: Add your production URLs
3. **Enable email authentication** (it should be enabled by default)

## Step 4: Get Project Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://your-project.supabase.co`
   - **Project API keys** → **anon** → **public**

## Step 5: Environment Configuration

1. **Update your `.env` file**:
   ```env
   # Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

   # Feature Flags
   EXPO_PUBLIC_ENABLE_CUSTOM_DASHBOARD=true

   # Existing API Configuration
   EXPO_PUBLIC_API_URL=https://api.polygon.io/v1/
   EXPO_PUBLIC_API_KEY=your_api_key_here
   ```

2. **Update `app.json`** (optional, for additional configuration):
   ```json
   {
     "expo": {
       "extra": {
         "supabaseUrl": "https://your-project.supabase.co",
         "supabaseAnonKey": "your-anon-key-here"
       }
     }
   }
   ```

## Step 6: Verify Setup

1. **Start your development server**:
   ```bash
   npx expo start
   ```

2. **Test the dashboard**:
   - Navigate to `/dashboard`
   - Try signing up with a new account
   - Add demo widgets and save to Supabase
   - Refresh the app - your dashboard should persist

## Database Schema

The `user_dashboards` table includes:

- **id**: UUID primary key
- **user_id**: References auth.users (enforced by RLS)
- **name**: User-friendly dashboard name
- **layout**: JSONB array of widget configurations
- **is_default**: Boolean flag for default dashboard
- **created_at/updated_at**: Timestamp tracking

### Row Level Security (RLS)

RLS policies ensure users can only access their own dashboards:

- **SELECT**: Users can view their own dashboards only
- **INSERT**: Users can create dashboards for themselves
- **UPDATE**: Users can modify their own dashboards
- **DELETE**: Users can delete their own dashboards

## API Endpoints

The implementation provides these functions through `DashboardAPI`:

### Dashboard Operations

```typescript
// List user dashboards
const dashboards = await DashboardAPI.getUserDashboards();

// Get specific dashboard
const dashboard = await DashboardAPI.getDashboard(id);

// Create new dashboard
const newDashboard = await DashboardAPI.createDashboard(name, layout);

// Update dashboard
const updatedDashboard = await DashboardAPI.updateDashboard(id, name, layout);

// Delete dashboard
await DashboardAPI.deleteDashboard(id);

// Get default dashboard
const defaultDashboard = await DashboardAPI.getDefaultDashboard();

// Set default dashboard
const updatedDashboard = await DashboardAPI.setDefaultDashboard(id);
```

### Authentication Operations

```typescript
// Sign up new user
await AuthAPI.signUp(email, password);

// Sign in user
await AuthAPI.signIn(email, password);

// Sign out user
await AuthAPI.signOut();

// Get current user
const user = await AuthAPI.getCurrentUser();
```

## Error Handling

The implementation includes comprehensive error handling:

- **Authentication errors**: 401/403 responses are handled gracefully
- **Network errors**: Automatic retry and fallback mechanisms
- **Validation errors**: Form validation and user feedback
- **RLS violations**: Clear error messages for unauthorized access

## Security Considerations

1. **Environment Variables**: Never expose your service role key in client-side code
2. **RLS Policies**: Ensure RLS is enabled and properly configured
3. **Input Validation**: Client and server-side validation implemented
4. **Authentication**: Supabase handles password hashing and JWT tokens

## Troubleshooting

### Common Issues

1. **"User not authenticated"**:
   - Ensure you're signed in
   - Check if session is properly stored

2. **RLS Policy errors**:
   - Verify RLS is enabled on the table
   - Check policy definitions in Supabase dashboard

3. **Migration fails**:
   - Ensure you have proper permissions
   - Check for syntax errors in SQL

4. **Environment variables not loading**:
   - Restart your development server
   - Verify .env file is in project root

### Debug Mode

Enable debug logging:

```typescript
// In your code, you can enable verbose logging
const { data, error } = await supabase
  .from('user_dashboards')
  .select('*')
  .eq('user_id', user.id);

// Check console for detailed error information
console.log('Debug info:', { data, error });
```

## Production Deployment

1. **Update Site URLs** in Supabase Authentication settings
2. **Configure CORS** if using edge functions
3. **Environment Variables** in your hosting platform
4. **Database backups** and monitoring setup

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [React Native Debugging](https://reactnative.dev/docs/debugging)