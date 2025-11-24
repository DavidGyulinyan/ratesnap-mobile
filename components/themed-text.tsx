import React from 'react';
import { StyleSheet, Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { useLanguage } from "@/contexts/LanguageContext";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const { language } = useLanguage();

  // Reduce font size by 2px for Armenian and Russian languages
  const isSmallerLanguage = language === 'hy' || language === 'ru';
  const fontSizeAdjustment = isSmallerLanguage ? -2 : 0;

  return (
    <Text
      style={[
        { color },
        type === "default" ? { ...styles.default, fontSize: Math.max(14, styles.default.fontSize + fontSizeAdjustment) } : undefined,
        type === "title" ? { ...styles.title, fontSize: Math.max(28, styles.title.fontSize + fontSizeAdjustment) } : undefined,
        type === "defaultSemiBold" ? { ...styles.defaultSemiBold, fontSize: Math.max(14, styles.defaultSemiBold.fontSize + fontSizeAdjustment) } : undefined,
        type === "subtitle" ? { ...styles.subtitle, fontSize: Math.max(16, styles.subtitle.fontSize + fontSizeAdjustment) } : undefined,
        type === "link" ? { ...styles.link, fontSize: Math.max(14, styles.link.fontSize + fontSizeAdjustment) } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
});
