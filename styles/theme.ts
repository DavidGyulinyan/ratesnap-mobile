// Enhanced Theme System for RateSnap Dashboard
import { Platform } from 'react-native';

// Theme definitions
export type ThemeName = 'light' | 'dark';

// Base theme colors
export const ThemeColors = {
  light: {
    // Primary colors
    primary: '#007AFF',
    primaryDark: '#0051D5',
    secondary: '#34C759',
    accent: '#FF9500',
    
    // Background colors
    background: '#FFFFFF',
    surface: '#F2F2F7',
    surfaceElevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Text colors
    text: '#000000',
    textSecondary: '#8E8E93',
    textMuted: '#C7C7CC',
    textOnPrimary: '#FFFFFF',
    
    // Border colors
    border: '#E5E5EA',
    borderLight: '#F2F2F7',
    
    // Interactive colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
    
    // Widget specific colors
    widgetBackground: '#FFFFFF',
    widgetBorder: '#E5E5EA',
    widgetShadow: 'rgba(0, 0, 0, 0.1)',
    
    // Chart colors
    chartPrimary: '#007AFF',
    chartSecondary: '#34C759',
    chartTertiary: '#FF9500',
    chartQuaternary: '#FF3B30',
    
    // Button colors
    buttonPrimary: '#007AFF',
    buttonSecondary: '#F2F2F7',
    buttonGhost: 'transparent',
    
    // Empty state colors
    emptyStateIcon: '#D1D1D6',
    emptyStateText: '#8E8E93',
    
    // Animation colors
    animationColor: '#007AFF',
  },
  dark: {
    // Primary colors
    primary: '#0A84FF',
    primaryDark: '#0051D5',
    secondary: '#30D158',
    accent: '#FF9F0A',
    
    // Background colors
    background: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    overlay: 'rgba(255, 255, 255, 0.1)',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textMuted: '#48484A',
    textOnPrimary: '#FFFFFF',
    
    // Border colors
    border: '#48484A',
    borderLight: '#38383A',
    
    // Interactive colors
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF',
    
    // Widget specific colors
    widgetBackground: '#2C2C2E',
    widgetBorder: '#48484A',
    widgetShadow: 'rgba(0, 0, 0, 0.3)',
    
    // Chart colors
    chartPrimary: '#0A84FF',
    chartSecondary: '#30D158',
    chartTertiary: '#FF9F0A',
    chartQuaternary: '#FF453A',
    
    // Button colors
    buttonPrimary: '#0A84FF',
    buttonSecondary: '#48484A',
    buttonGhost: 'transparent',
    
    // Empty state colors
    emptyStateIcon: '#48484A',
    emptyStateText: '#8E8E93',
    
    // Animation colors
    animationColor: '#0A84FF',
  },
};

// Typography system
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 26,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
};

// Spacing system
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius system
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadow system
export const Shadows = {
  light: {
    small: {
      shadowColor: ThemeColors.light.widgetShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: ThemeColors.light.widgetShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: ThemeColors.light.widgetShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  dark: {
    small: {
      shadowColor: ThemeColors.dark.widgetShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: ThemeColors.dark.widgetShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: ThemeColors.dark.widgetShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Animation configurations
export const Animations = {
  fast: {
    duration: 200,
    easing: 'ease-out',
  },
  normal: {
    duration: 300,
    easing: 'ease-in-out',
  },
  slow: {
    duration: 500,
    easing: 'ease-in-out',
  },
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 0.8,
  },
};

// Dashboard presets definition
export interface DashboardPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'business' | 'personal' | 'trading';
  widgets: Array<{
    type: string;
    position: { x: number; y: number; w: number; h: number };
    props?: Record<string, any>;
  }>;
}

export const DashboardPresets: DashboardPreset[] = [
  {
    id: 'business-traveler',
    name: 'Business Traveler',
    description: 'Essential tools for frequent travelers',
    icon: '💼',
    category: 'business',
    widgets: [
      {
        type: 'currency-converter',
        position: { x: 0, y: 0, w: 6, h: 3 },
        props: {
          sourceCurrency: 'USD',
          targetCurrency: 'EUR',
        },
      },
      {
        type: 'historical-chart',
        position: { x: 6, y: 0, w: 6, h: 4 },
        props: {
          baseCurrency: 'USD',
          comparisonCurrencies: ['EUR', 'GBP', 'JPY'],
          chartType: 'line',
        },
      },
      {
        type: 'calculator',
        position: { x: 0, y: 3, w: 4, h: 3 },
        props: {},
      },
      {
        type: 'news-feed',
        position: { x: 4, y: 3, w: 8, h: 4 },
        props: {
          keywords: ['travel', 'currency', 'business', 'economy'],
          maxItems: 8,
        },
      },
    ],
  },
  {
    id: 'trader',
    name: 'Trader',
    description: 'Advanced tools for currency traders',
    icon: '📈',
    category: 'trading',
    widgets: [
      {
        type: 'currency-converter',
        position: { x: 0, y: 0, w: 4, h: 3 },
        props: {
          sourceCurrency: 'USD',
          targetCurrency: 'EUR',
        },
      },
      {
        type: 'historical-chart',
        position: { x: 4, y: 0, w: 8, h: 5 },
        props: {
          baseCurrency: 'USD',
          comparisonCurrencies: ['EUR', 'GBP', 'JPY', 'CAD'],
          chartType: 'candlestick',
          timeframe: '1D',
        },
      },
      {
        type: 'comparison',
        position: { x: 0, y: 3, w: 6, h: 3 },
        props: {
          primaryCurrency: 'USD',
          comparisonCurrencies: ['EUR', 'GBP', 'JPY'],
        },
      },
      {
        type: 'news-feed',
        position: { x: 6, y: 3, w: 6, h: 4 },
        props: {
          keywords: ['forex', 'trading', 'central bank', 'interest rate'],
          maxItems: 12,
        },
      },
    ],
  },
  {
    id: 'personal',
    name: 'Personal',
    description: 'Simple tools for personal use',
    icon: '👤',
    category: 'personal',
    widgets: [
      {
        type: 'currency-converter',
        position: { x: 0, y: 0, w: 12, h: 4 },
        props: {
          sourceCurrency: 'USD',
          targetCurrency: 'EUR',
        },
      },
      {
        type: 'historical-chart',
        position: { x: 0, y: 4, w: 8, h: 4 },
        props: {
          baseCurrency: 'USD',
          comparisonCurrencies: ['EUR', 'GBP'],
          chartType: 'line',
        },
      },
      {
        type: 'calculator',
        position: { x: 8, y: 4, w: 4, h: 3 },
        props: {},
      },
      {
        type: 'news-feed',
        position: { x: 8, y: 7, w: 4, h: 3 },
        props: {
          keywords: ['personal finance', 'economy'],
          maxItems: 6,
        },
      },
    ],
  },
];

// Theme utility functions
export const getTheme = (themeName: ThemeName) => {
  return ThemeColors[themeName];
};

export const getShadows = (themeName: ThemeName) => {
  return Shadows[themeName];
};

// Helper function to create themed styles
export const createThemedStyles = (themeName: ThemeName) => {
  const colors = getTheme(themeName);
  const shadows = getShadows(themeName);
  
  return {
    colors,
    shadows,
    typography: Typography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    animations: Animations,
  };
};

// Empty state configurations
export const EmptyStateConfig = {
  title: 'Your dashboard is empty',
  subtitle: 'Add your first tool',
  ctaText: 'Get Started',
  presetsTitle: 'Choose a starter preset',
  presetsSubtitle: 'Pick a pre-configured layout to get started quickly',
  
  // Preset cards
  presetCards: {
    business: {
      title: 'Business Traveler',
      description: 'For frequent travelers',
      icon: '💼',
      color: ThemeColors.light.primary,
    },
    trading: {
      title: 'Trader',
      description: 'For currency traders',
      icon: '📈',
      color: ThemeColors.light.secondary,
    },
    personal: {
      title: 'Personal',
      description: 'For personal use',
      icon: '👤',
      color: ThemeColors.light.accent,
    },
  },
};

// Animation keys for consistent timing
export const AnimationKeys = {
  addWidget: 'widget:add',
  removeWidget: 'widget:remove',
  dragStart: 'drag:start',
  dragEnd: 'drag:end',
  themeSwitch: 'theme:switch',
  emptyState: 'empty:state',
} as const;