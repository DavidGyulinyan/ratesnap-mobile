// Fallback utilities when Supabase is not configured
// This allows the dashboard to work in development without Supabase setup

import { Alert } from 'react-native';

export class SupabaseFallbackAPI {
  // Simulate sign in for development
  static async signIn(email: string, password: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful authentication
    const mockUser = {
      id: 'mock-user-id',
      email,
      created_at: new Date().toISOString(),
    };

    console.log('🔧 Mock sign in successful (Supabase not configured)');
    return {
      user: mockUser,
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      },
    };
  }

  // Simulate sign up for development
  static async signUp(email: string, password: string) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = {
      id: 'mock-user-id',
      email,
      created_at: new Date().toISOString(),
    };

    console.log('🔧 Mock sign up successful (Supabase not configured)');
    return {
      user: mockUser,
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      },
    };
  }

  // Simulate sign out
  static async signOut() {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('🔧 Mock sign out successful (Supabase not configured)');
  }

  // Get current user (mock)
  static async getCurrentUser() {
    return {
      id: 'mock-user-id',
      email: 'demo@example.com',
      created_at: new Date().toISOString(),
    };
  }

  // Dashboard operations (mock data)
  static async getUserDashboards() {
    return [
      {
        id: 'mock-dashboard-1',
        user_id: 'mock-user-id',
        name: 'Demo Dashboard',
        layout: [],
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  static async createDashboard(name: string, layout: any[]) {
    return {
      id: 'mock-dashboard-' + Date.now(),
      user_id: 'mock-user-id',
      name,
      layout,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  static async updateDashboard(dashboardId: string, name: string, layout: any[]) {
    return {
      id: dashboardId,
      user_id: 'mock-user-id',
      name,
      layout,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  static async deleteDashboard(dashboardId: string) {
    console.log('🔧 Mock delete dashboard:', dashboardId);
  }

  static async getDefaultDashboard() {
    const dashboards = await this.getUserDashboards();
    return dashboards.length > 0 ? dashboards[0] : null;
  }

  static async setDefaultDashboard(dashboardId: string) {
    return {
      id: dashboardId,
      user_id: 'mock-user-id',
      name: 'Demo Dashboard',
      layout: [],
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  return !!(supabaseUrl && supabaseAnonKey && 
           supabaseUrl !== 'your_supabase_project_url' && 
           supabaseAnonKey !== 'your_supabase_anon_key');
};

// Show configuration warning
export const showSupabaseConfigWarning = () => {
  if (!isSupabaseConfigured()) {
    Alert.alert(
      '⚠️ Supabase Not Configured',
      'Supabase environment variables are not set. Running in mock mode.\n\n' +
      'Features available:\n' +
      '• Add/remove widgets\n' +
      '• Dashboard layout (local only)\n\n' +
      'Features disabled:\n' +
      '• Authentication\n' +
      '• Cloud sync\n' +
      '• Multi-device access\n\n' +
      'See SUPABASE_SETUP.md for configuration instructions.',
      [{ text: 'OK' }]
    );
  }
};