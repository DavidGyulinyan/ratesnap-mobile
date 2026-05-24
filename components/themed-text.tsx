import React from "react";
import { Platform, Text, type TextProps } from "react-native";

import { MAX_FONT_SIZE_MULTIPLIER, scaledLineHeight } from "@/lib/accessibilityFontScaling";
import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link" | "caption";
  /** When true, users can select and copy this text on mobile (long-press). */
  copyable?: boolean;
};

const TYPE_STYLES = {
  default: { fontSize: 16, fontWeight: "400" as const },
  defaultSemiBold: { fontSize: 16, fontWeight: "600" as const },
  title: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.3 },
  subtitle: { fontSize: 18, fontWeight: "600" as const },
  caption: { fontSize: 13, fontWeight: "500" as const, opacity: 0.92 },
  link: { fontSize: 16, fontWeight: "400" as const },
} as const;

const MIN_FONT_BY_TYPE: Record<keyof typeof TYPE_STYLES, number> = {
  default: 14,
  defaultSemiBold: 14,
  title: 28,
  subtitle: 16,
  caption: 12,
  link: 14,
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  copyable,
  selectable,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const linkTint = useThemeColor({}, "primary");

  /** Armenian script reads better with a slight size reduction. */
  const fontSizeAdjustment = -2;
  const base = TYPE_STYLES[type];
  const fontSize = Math.max(
    MIN_FONT_BY_TYPE[type],
    base.fontSize + fontSizeAdjustment
  );
  const typeStyle = {
    ...base,
    fontSize,
    lineHeight: scaledLineHeight(fontSize),
    ...(type === "link" ? { color: linkTint } : null),
  };

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
      selectable={copyable ?? selectable}
      style={[
        { color },
        typeStyle,
        Platform.OS === "android" ? { includeFontPadding: false } : null,
        style,
      ]}
      {...rest}
    />
  );
}
