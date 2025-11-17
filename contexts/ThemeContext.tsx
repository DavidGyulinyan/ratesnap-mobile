import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Appearance } from 'react-native';
import { getAsyncStorage } from '@/lib/storage';

type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'user_theme_preference';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Load theme preference from storage on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storage = getAsyncStorage();
        const stored = await storage.getItem(THEME_STORAGE_KEY);
        if (stored && ['system', 'light', 'dark'].includes(stored)) {
          setThemePreferenceState(stored as ThemePreference);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const updateSystemTheme = () => {
      const colorScheme = Appearance.getColorScheme();
      setSystemTheme(colorScheme === 'dark' ? 'dark' : 'light');
    };

    // Set initial theme
    updateSystemTheme();

    // Listen for changes
    const subscription = Appearance.addChangeListener(updateSystemTheme);

    return () => {
      subscription?.remove();
    };
  }, []);

  const setThemePreference = async (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    try {
      const storage = getAsyncStorage();
      await storage.setItem(THEME_STORAGE_KEY, preference);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const effectiveTheme = useMemo(() => {
    return themePreference === 'system' ? systemTheme : themePreference;
  }, [themePreference, systemTheme]);

  const contextValue = useMemo(() => ({
    themePreference,
    setThemePreference,
    effectiveTheme,
  }), [themePreference, setThemePreference, effectiveTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}