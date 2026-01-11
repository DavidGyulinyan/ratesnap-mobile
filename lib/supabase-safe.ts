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

    // Check if we're in a server-side rendering environment
    const isServerSide = typeof window === 'undefined';

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: getAsyncStorage(),
        autoRefreshToken: !isServerSide,  // Disable auto-refresh during SSR
        persistSession: !isServerSide,    // Disable session persistence during SSR
        detectSessionInUrl: !isServerSide, // Disable URL detection during SSR
        flowType: isServerSide ? 'implicit' : 'pkce', // Use implicit flow for SSR
      },
    });

    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};


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