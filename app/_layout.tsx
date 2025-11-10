import * as React from "react";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession(); // MUST run before Navigation

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  return (
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            {user ? (
              <>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </>
            ) : (
              <>
                <Stack.Screen name="signin" options={{ presentation: 'modal', title: 'Sign In' }} />
                <Stack.Screen name="signup" options={{ presentation: 'modal', title: 'Sign Up' }} />
              </>
            )}
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
