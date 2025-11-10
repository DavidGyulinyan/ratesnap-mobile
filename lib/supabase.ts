import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

// Environment-aware storage
const createStorage = () => {
  // Browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: async (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: async (key: string, value: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: async (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      },
    };
  } else {
    // Development/Production fallback
    const store = new Map<string, string>();
    return {
      getItem: async (key: string) => store.get(key) || null,
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: async (key: string) => {
        store.delete(key);
      },
    };
  }
};

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://jprafkemftjqrzsrtuui.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcmFma2VtZnRqcXJ6c3J0dXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzE0NDQsImV4cCI6MjA3ODEwNzQ0NH0.sUFyszymQ-oQiGUgNY-qsKx8ND22l0Qjg4Ld8BMd77E';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
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