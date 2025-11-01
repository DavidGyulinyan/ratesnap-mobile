import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are not configured');
}

// Lazy-initialized storage adapter to avoid SSR issues
let storageAdapter: any = null;

const createStorageAdapter = () => {
  if (storageAdapter) return storageAdapter;
  
  try {
    console.log(`🌐 Environment: ${typeof window !== 'undefined' ? 'WEB' : 'NATIVE'}`);
    
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // Web environment: use localStorage
      console.log('📦 Using localStorage for web environment');
      storageAdapter = {
        getItem: (key: string) => {
          try {
            return Promise.resolve(localStorage.getItem(key));
          } catch (error) {
            console.warn('Error getting item from localStorage:', error);
            return Promise.resolve(null);
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
            return Promise.resolve();
          } catch (error) {
            console.warn('Error setting item in localStorage:', error);
            return Promise.resolve();
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key);
            return Promise.resolve();
          } catch (error) {
            console.warn('Error removing item from localStorage:', error);
            return Promise.resolve();
          }
        },
      };
    } else {
      // Native environment: try AsyncStorage, fallback to memory
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        console.log('📱 Using AsyncStorage for native environment');
        storageAdapter = {
          getItem: AsyncStorage.getItem,
          setItem: AsyncStorage.setItem,
          removeItem: AsyncStorage.removeItem,
        };
      } catch (error) {
        console.warn('⚠️ AsyncStorage not available, using in-memory storage');
        
        // Fallback to in-memory storage
        console.log('💾 Using in-memory storage fallback');
        const memoryStorage = new Map();
        storageAdapter = {
          getItem: (key: string) => Promise.resolve(memoryStorage.get(key) || null),
          setItem: (key: string, value: string) => {
            memoryStorage.set(key, value);
            return Promise.resolve();
          },
          removeItem: (key: string) => {
            memoryStorage.delete(key);
            return Promise.resolve();
          },
        };
      }
    }
    
    return storageAdapter;
  } catch (error) {
    console.warn('⚠️ Storage adapter initialization failed, using no-op storage');
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
  }
};

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    persistSession: false, // Disable session persistence for demo
    autoRefreshToken: false,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Database types based on our schema
export interface UserDashboard {
  id: string;
  user_id: string;
  name: string;
  layout: any[]; // Widget array
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Dashboard API functions
export class DashboardAPI {
  // List all dashboards for current user
  static async getUserDashboards(): Promise<UserDashboard[]> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_dashboards')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching dashboards:', error);
      throw error;
    }

    return data || [];
  }

  // Get specific dashboard by ID
  static async getDashboard(dashboardId: string): Promise<UserDashboard | null> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_dashboards')
      .select('*')
      .eq('id', dashboardId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching dashboard:', error);
      throw error;
    }

    return data;
  }

  // Create new dashboard
  static async createDashboard(name: string, layout: any[]): Promise<UserDashboard> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // If this is set as default, unset other defaults
    const { error: updateError } = await supabase
      .from('user_dashboards')
      .update({ is_default: false })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating existing dashboards:', updateError);
    }

    const { data, error } = await supabase
      .from('user_dashboards')
      .insert({
        user_id: user.id,
        name,
        layout,
        is_default: true, // New dashboards are default
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating dashboard:', error);
      throw error;
    }

    return data;
  }

  // Update existing dashboard
  static async updateDashboard(dashboardId: string, name: string, layout: any[]): Promise<UserDashboard> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_dashboards')
      .update({
        name,
        layout,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dashboardId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating dashboard:', error);
      throw error;
    }

    return data;
  }

  // Delete dashboard
  static async deleteDashboard(dashboardId: string): Promise<void> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_dashboards')
      .delete()
      .eq('id', dashboardId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting dashboard:', error);
      throw error;
    }
  }

  // Get default dashboard for user
  static async getDefaultDashboard(): Promise<UserDashboard | null> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_dashboards')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No default dashboard found
        return null;
      }
      console.error('Error fetching default dashboard:', error);
      throw error;
    }

    return data;
  }

  // Set dashboard as default
  static async setDefaultDashboard(dashboardId: string): Promise<UserDashboard> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Unset all other defaults
    const { error: updateError } = await supabase
      .from('user_dashboards')
      .update({ is_default: false })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating existing defaults:', updateError);
    }

    // Set new default
    const { data, error } = await supabase
      .from('user_dashboards')
      .update({ is_default: true })
      .eq('id', dashboardId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error setting default dashboard:', error);
      throw error;
    }

    return data;
  }
}

// Authentication helpers
export class AuthAPI {
  // Sign up new user
  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }

    return data;
  }

  // Sign in user
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }

    return data;
  }

  // Sign out user
  static async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      throw error;
    }

    return user;
  }

  // Get auth session
  static async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      throw error;
    }

    return session;
  }
}