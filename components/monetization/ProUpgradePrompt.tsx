import { ThemedText } from "@/components/themed-text";
import { useLanguage } from "@/contexts/LanguageContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { trackMonetizationEvent } from "@/lib/monetization/analytics";
import type { ProFeatureId } from "@/lib/monetization/features";
import { Layout, hexToRgba } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type ProUpgradePromptProps = {
  feature: ProFeatureId;
  source: string;
  messageKey: string;
  messageParams?: Record<string, string | number>;
  onDismiss?: () => void;
};

/** Soft inline prompt — not a blocking modal. */
export default function ProUpgradePrompt({
  feature,
  source,
  messageKey,
  messageParams,
  onDismiss,
}: ProUpgradePromptProps) {
  const { t, tWithParams } = useLanguage();
  const router = useRouter();
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "border");

  useEffect(() => {
    trackMonetizationEvent({
      name: "upgrade_prompt_shown",
      feature,
      source,
    });
  }, [feature, source]);

  const message = messageParams
    ? tWithParams(messageKey, messageParams)
    : t(messageKey);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: hexToRgba(primaryColor, 0.08),
          borderColor: hexToRgba(borderColor, 0.5),
        },
      ]}
    >
      <View style={styles.row}>
        <Ionicons name="sparkles-outline" size={20} color={primaryColor} />
        <View style={styles.copy}>
          <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
            {t("pro.prompt.title")}
          </ThemedText>
          <ThemedText
            type="caption"
            style={{ color: textSecondaryColor, marginTop: 4, lineHeight: 18 }}
          >
            {message}
          </ThemedText>
        </View>
      </View>
      <View style={styles.actions}>
        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            style={({ pressed }) => [styles.btnGhost, pressed && styles.pressed]}
          >
            <ThemedText type="caption" style={{ color: textSecondaryColor }}>
              {t("pro.prompt.notNow")}
            </ThemedText>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            trackMonetizationEvent({
              name: "upgrade_prompt_tapped",
              feature,
              source,
            });
            router.push({ pathname: "/capital-pro", params: { source } });
          }}
          style={({ pressed }) => [
            styles.btnPrimary,
            { backgroundColor: primaryColor },
            pressed && styles.pressed,
          ]}
        >
          <ThemedText
            type="caption"
            style={{ color: "#fff", fontWeight: "600" }}
          >
            {t("pro.prompt.cta")}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Layout.spaceMd,
    marginVertical: Layout.spaceSm,
  },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  copy: { flex: 1, minWidth: 0 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    marginTop: Layout.spaceSm,
  },
  btnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Layout.radiusSm,
  },
  btnGhost: { paddingHorizontal: 8, paddingVertical: 8 },
  pressed: { opacity: 0.85 },
});
