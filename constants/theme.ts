/**
 * Modern, user-friendly color palette and design system
 * Optimized for better UX and visual appeal
 */

import { Platform } from "react-native";

// Modern color palette
const primary = "#6B6ACD"; // Logo orange
const primaryDark = "#E66A1A"; // Darker orange
const secondary = "#06b6d4"; // Cyan
const accent = "#6B6ACD"; // Logo orange
const success = "#10b981"; // Emerald
const warning = "#f59e0b";
const error = "#ef4444"; // Red

export const Colors = {
  light: {
    // Primary colors
    primary: primary,
    primaryDark: primaryDark,
    secondary: secondary,
    colorAccent: accent,
    
    // Background colors
    background: "#FFFFFF",
    surface: "#F3F3F3",
    surfaceSecondary: "#F3F3F3",
    cardBackground: "#dae3eaa1",
    
    // Text colors
    text: "#1e293b",
    textSecondary: "#64748b",
    textTertiary: "#94a3b8",
    textInverse: "#ffffff",
    
    // Interactive colors
    tint: primary,
    accent: accent,
    success: success,
    warning: warning,
    error: error,
    
    // Border and dividers
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    divider: "#e2e8f0",
    
    // Icon colors
    icon: "#64748b",
    iconSecondary: "#94a3b8",
    iconInverse: "#ffffff",
    
    // Tab colors
    tabIconDefault: "#64748b",
    tabIconSelected: primary,
    tabBackground: "#DAE3EA",
    
    // Special backgrounds
    headerBackground: "#DAE3EA",
    headerBorder: "#e2e8f0",
    
    // Status colors
    online: "#10b981",
    offline: "#ef4444",
    pending: "#f59e0b",
  },
  dark: {
    // Primary colors
    primary: primary,
    primaryDark: primaryDark,
    secondary: secondary,
    colorAccent: accent,
    
    // Background colors
    background: "#0f172a",
    surface: "#1e293b",
    surfaceSecondary: "#334155",
    cardBackground: "#1e293b",
    modalBackground: "rgba(0, 0, 0, 0.7)",
    
    // Text colors
    text: "#f1f5f9",
    textSecondary: "#cbd5e1",
    textTertiary: "#94a3b8",
    textInverse: "#1e293b",
    
    // Interactive colors
    tint: primary,
    accent: accent,
    success: success,
    warning: warning,
    error: error,
    
    // Border and dividers
    border: "#334155",
    borderLight: "#475569",
    divider: "#334155",
    
    // Icon colors
    icon: "#cbd5e1",
    iconSecondary: "#94a3b8",
    iconInverse: "#1e293b",
    
    // Tab colors
    tabIconDefault: "#94a3b8",
    tabIconSelected: primary,
    tabBackground: "#1e293b",
    
    // Special backgrounds
    headerBackground: "#1e293b",
    headerBorder: "#334155",
    
    // Status colors
    online: "#10b981",
    offline: "#ef4444",
    pending: "#f59e0b",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
