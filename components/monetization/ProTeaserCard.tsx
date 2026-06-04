import { ThemedText } from "@/components/themed-text";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePro } from "@/contexts/ProContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Layout, hexToRgba } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

/** Subtle dashboard teaser — dismissible by upgrading or ignoring. */
export default function ProTeaserCard() {
  const { t } = useLanguage();
  const { isPro, ready } = usePro();
  const router = useRouter();
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");

  if (!ready || isPro) return null;

  return (
    <Pressable
      onPress={() => router.push("/support-capital")}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: hexToRgba(borderColor, 0.45),
          backgroundColor: hexToRgba(primaryColor, 0.06),
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <Ionicons name="heart-outline" size={18} color={primaryColor} />
      <View style={styles.text}>
        <ThemedText
          type="caption"
          style={{ color: textSecondaryColor, flexShrink: 1 }}
        >
          {t("dashboard.proTeaser")}
        </ThemedText>
        <ThemedText
          type="caption"
          style={{ color: primaryColor, marginTop: 4, fontWeight: "600" }}
        >
          {t("dashboard.proTeaser.cta")}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={16} color={textSecondaryColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: Layout.spaceMd,
    marginBottom: Layout.spaceSm,
    padding: Layout.spaceMd,
    borderRadius: Layout.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, minWidth: 0 },
});
