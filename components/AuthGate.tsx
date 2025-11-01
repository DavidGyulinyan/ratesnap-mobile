import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { AuthAPI } from '@/lib/supabase';
import { useRouter } from 'expo-router';

interface AuthGateProps {
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}

export function AuthGate({ children, fallbackComponent }: AuthGateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await AuthAPI.getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.log('User not authenticated:', error instanceof Error ? error.message : 'Unknown error');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    // For now, just show a placeholder alert since auth routes don't exist yet
    console.log('Navigate to sign in');
  };

  const handleSignUp = () => {
    // For now, just show a placeholder alert since auth routes don't exist yet
    console.log('Navigate to sign up');
  };

  if (isLoading) {
    return (
      <ThemedView style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ marginTop: 16 }}>
          Checking authentication...
        </ThemedText>
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <ThemedView style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 32 
      }}>
        {/* Header */}
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔐</Text>
        
        <ThemedText style={{ 
          fontSize: 24, 
          fontWeight: 'bold', 
          textAlign: 'center', 
          marginBottom: 8 
        }}>
          Sign in to access your dashboard
        </ThemedText>
        
        <ThemedText style={{ 
          fontSize: 16, 
          textAlign: 'center', 
          color: '#8E8E93',
          marginBottom: 32,
          lineHeight: 24 
        }}>
          Create an account to save your dashboard layouts and get personalized currency insights
        </ThemedText>

        {/* Sign In Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 12,
            marginBottom: 16,
            width: '100%',
            alignItems: 'center'
          }}
          onPress={handleSignIn}
        >
          <Text style={{ 
            color: 'white', 
            fontSize: 16, 
            fontWeight: '600' 
          }}>
            Sign In
          </Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <TouchableOpacity onPress={handleSignUp}>
          <ThemedText style={{ 
            fontSize: 16,
            color: '#007AFF' 
          }}>
            Don't have an account? Sign up
          </ThemedText>
        </TouchableOpacity>

        {/* Features List */}
        <View style={{ marginTop: 48, width: '100%' }}>
          <ThemedText style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginBottom: 16 
          }}>
            ✨ Dashboard Features:
          </ThemedText>
          
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, marginRight: 12 }}>💱</Text>
              <ThemedText>Currency conversion with real-time rates</ThemedText>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, marginRight: 12 }}>📊</Text>
              <ThemedText>Interactive charts and historical data</ThemedText>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, marginRight: 12 }}>🧮</Text>
              <ThemedText>Built-in calculator for quick calculations</ThemedText>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, marginRight: 12 }}>🔔</Text>
              <ThemedText>Rate alerts and notifications</ThemedText>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, marginRight: 12 }}>💾</Text>
              <ThemedText>Save and sync your custom layouts</ThemedText>
            </View>
          </View>
        </View>
      </ThemedView>
    );
  }

  return <>{children}</>;
}