import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { getTheme } from '@/styles/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ThemeToggle() {
  const systemColorScheme = useColorScheme();
  const { theme, toggleTheme } = useThemeContext();
  const colors = getTheme(theme);

  const isDark = theme === 'dark';

  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      onPress={toggleTheme}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <Text style={{ fontSize: 16, marginRight: 8 }}>
        {isDark ? '🌙' : '☀️'}
      </Text>
      <Text style={{ 
        color: colors.text, 
        fontSize: 14, 
        fontWeight: '500' 
      }}>
        {isDark ? 'Dark' : 'Light'}
      </Text>
    </TouchableOpacity>
  );
}