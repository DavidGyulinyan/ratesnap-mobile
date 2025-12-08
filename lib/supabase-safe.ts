import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import { getAsyncStorage } from './storage';

// Create Supabase client with safe initialization
let supabaseClient: any = null;

export const getSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                        process.env.EXPO_PUBLIC_SUPABASE_URL || 
                        'https://jprafkemftjqrzsrtuui.supabase.co';
    
    const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                           process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                           'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcmFma2VtZnRqcXJ6c3J0dXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzE0NDQsImV4cCI6MjA3ODEwNzQ0NH0.sUFyszymQ-oQiGUgNY-qsKx8ND22l0Qjg4Ld8BMd77E';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return null;
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: getAsyncStorage(),
        autoRefreshToken: true,  // Enable auto-refresh for proper session management
        persistSession: true,    // Enable session persistence
        detectSessionInUrl: true, // Enable OAuth URL detection
        flowType: 'pkce',        // Use PKCE flow for better security
      },
    });

    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};

// Export the client directly for compatibility
export const supabase = getSupabaseClient();

// Setup auth state listener after client is created
if (supabase) {
  console.log('✅ Supabase client initialized successfully');
  
  setTimeout(() => {
    try {
      // Setup auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
        console.log('🔵 Auth state changed:', event, session ? 'Session active' : 'No session');
      });
      
      console.log('✅ Auth state listener setup successfully');
    } catch (error) {
      console.warn('Failed to set up auth state listener:', error);
    }
  }, 500);
} else {
  console.error('🔴 Failed to initialize Supabase client');
}

// Database types (keep the same)
export interface User {
  id: string;
  email: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedRate {
  id: string;
  user_id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  created_at: string;
  updated_at: string;
}

export interface RateAlert {
  id: string;
  user_id: string;
  from_currency: string;
  to_currency: string;
  target_rate: number;
  condition: 'above' | 'below';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}