import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase-safe';
import { Session, User, AuthError } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error?: AuthError }>;
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: AuthError }>;
  signInWithApple: () => Promise<{ error?: AuthError }>;
  resetPassword: (email: string) => Promise<{ error?: AuthError }>;
  resendConfirmationEmail: (email: string) => Promise<{ error?: AuthError }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Supabase client not available');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error: any) => {
      console.warn('Failed to get initial session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event: any, session: Session | null) => {
        console.log('Auth state changed:', event, session ? 'User authenticated' : 'No user');
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          console.log('User authenticated:', session.user.email);
        } else {
          console.log('User signed out');
        }
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.warn('Failed to set up auth state listener:', error);
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: { message: 'Authentication service not available' } as AuthError };
    }

    try {
      setLoading(true);
      console.log('Starting sign up process for email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }

      console.log('Sign up successful, user data:', data.user ? 'User created' : 'Confirmation pending');
      return {};
    } catch (error) {
      console.error('Sign up catch error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: { message: 'Authentication service not available' } as AuthError };
    }

    try {
      setLoading(true);
      console.log('Starting sign in process for email:', email);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);

        // Handle email confirmation error specifically
        if (error.message.includes('Email not confirmed') ||
            error.message.includes('email_not_confirmed') ||
            error.message.includes('not confirmed')) {
          return {
            error: {
              message: 'Please check your email and click the confirmation link before signing in. Didn\'t receive the email?',
              name: 'EmailNotConfirmedError'
            } as AuthError
          };
        }

        return { error };
      }

      console.log('Sign in successful');
      return {};
    } catch (error) {
      console.error('Sign in catch error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Authentication service not available for sign out');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting sign out process');
      
      await supabase.auth.signOut();
      
      console.log('Sign out successful');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: { message: 'Authentication service not available' } as AuthError };
    }

    try {
      setLoading(true);
      console.log('Starting Google sign in');
      
      // Use the correct redirect URI format
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: "ratesnap-mobile",
        path: "auth/callback"
      });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        console.log('Google sign-in error:', error.message);
        return { error };
      }

      console.log('Google sign in initiated successfully');
      return {};
    } catch (error) {
      console.error('Google sign in catch error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: { message: 'Authentication service not available' } as AuthError };
    }

    try {
      setLoading(true);
      console.log('Starting Apple sign in');
      
      // Use the correct redirect URI format
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: "ratesnap-mobile",
        path: "auth/callback"
      });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
        },
      });

      if (error) {
        console.log('Apple sign-in error:', error.message);
        return { error };
      }

      console.log('Apple sign in initiated successfully');
      return {};
    } catch (error) {
      console.error('Apple sign in catch error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: { message: 'Authentication service not available' } as AuthError };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { error };
      }

      return {};
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: { message: 'Authentication service not available' } as AuthError };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        return { error };
      }

      return {};
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
    resendConfirmationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
