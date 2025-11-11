import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./themed-text";
import { useLanguage } from "@/contexts/LanguageContext";

interface FooterProps {
  style?: any;
}

export default function Footer({ style }: FooterProps) {
  const { t, tWithParams } = useLanguage();

  return (
    <View style={[styles.footer, style]}>
      <ThemedText style={styles.footerText}>
        {tWithParams('footer.copyright', {
          appTitle: t('app.title'),
          suiteName: t('footer.suiteName')
        })}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  footerText: {
    fontSize: 12,
    color: "#1f2937",
    textAlign: "center",
  },
});