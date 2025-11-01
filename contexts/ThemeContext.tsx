import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeName, getTheme } from '@/styles/theme';

interface ThemeContextType {
  theme: ThemeName;
  colors: ReturnType<typeof getTheme>;
  toggleTheme: () => void;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // Default to system theme, but we can persist user preference later
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  });

  const colors = getTheme(theme);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    // TODO: Persist to AsyncStorage for user preference
  };

  // Update theme when system theme changes (if user hasn't manually set a preference)
  useEffect(() => {
    const newSystemTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
    if (theme !== newSystemTheme) {
      // Only auto-update if we haven't explicitly set a preference
      // setThemeState(newSystemTheme);
    }
  }, [systemColorScheme]);

  const contextValue: ThemeContextType = {
    theme,
    colors,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}