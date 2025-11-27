import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useLanguage } from "@/contexts/LanguageContext";

interface FooterProps {
  style?: any;
}

export default function Footer({ style }: FooterProps) {
  const { t, tWithParams } = useLanguage();
  const backgroundColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[{ backgroundColor, borderTopWidth: 1, borderTopColor: borderColor, padding: 20, paddingBottom: 40, alignItems: "center" }, style]}>
      <ThemedText style={{ fontSize: 12, textAlign: "center" }}>
        {tWithParams('footer.copyright', {
          appTitle: "ExRatio",
          suiteName: t('footer.suiteName')
        })}
      </ThemedText>
    </View>
  );
}
