import { ThemedText } from "@/components/themed-text";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePro } from "@/contexts/ProContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { PRO_FEATURES } from "@/lib/monetization/features";
import { trackMonetizationEvent } from "@/lib/monetization/analytics";
import { Layout, hexToRgba } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CapitalProScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const source = typeof params.source === "string" ? params.source : "direct";
  const { isPro, purchasePro, restorePurchases } = usePro();
  const [busy, setBusy] = useState(false);

  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");

  useEffect(() => {
    trackMonetizationEvent({ name: "pro_screen_viewed", source });
  }, [source]);

  const onSubscribe = async () => {
    setBusy(true);
    const result = await purchasePro();
    setBusy(false);
    if (result.ok) {
      Alert.alert(t("pro.title"), t("pro.active"));
      router.back();
    }
  };

  const onRestore = async () => {
    setBusy(true);
    const result = await restorePurchases();
    setBusy(false);
    if (result.ok) {
      Alert.alert(t("pro.title"), t("pro.active"));
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={["top", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: hexToRgba(borderColor, 0.5) }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <ThemedText type="subtitle" style={{ color: textColor, flex: 1 }}>
          {t("pro.title")}
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={[styles.subtitle, { color: textSecondaryColor }]}>
          {isPro ? t("pro.active") : t("pro.subtitle")}
        </ThemedText>
        {!isPro ? (
          <ThemedText
            type="caption"
            style={{ color: textSecondaryColor, marginBottom: Layout.spaceMd }}
          >
            {t("pro.price.hint")}
          </ThemedText>
        ) : null}

        <View style={styles.featureList}>
          {PRO_FEATURES.map((f) => (
            <View
              key={f.id}
              style={[
                styles.featureRow,
                {
                  backgroundColor: surfaceColor,
                  borderColor: hexToRgba(borderColor, 0.45),
                },
              ]}
            >
              <Ionicons
                name={f.shipped ? "checkmark-circle" : "time-outline"}
                size={22}
                color={f.shipped ? primaryColor : textSecondaryColor}
              />
              <View style={styles.featureCopy}>
                <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
                  {t(f.labelKey)}
                  {!f.shipped ? (
                    <ThemedText type="caption" style={{ color: textSecondaryColor }}>
                      {" "}
                      · {t("pro.comingSoon")}
                    </ThemedText>
                  ) : null}
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={{ color: textSecondaryColor, marginTop: 4, lineHeight: 18 }}
                >
                  {t(f.descriptionKey)}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <ThemedText
          type="caption"
          style={[styles.legal, { color: textSecondaryColor }]}
        >
          {t("pro.legal")}
        </ThemedText>
      </ScrollView>

      {!isPro ? (
        <View style={[styles.footer, { borderTopColor: hexToRgba(borderColor, 0.5) }]}>
          <Pressable
            disabled={busy}
            onPress={onSubscribe}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: primaryColor, opacity: pressed || busy ? 0.9 : 1 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.primaryBtnText}>
                {t("pro.cta.subscribe")}
              </ThemedText>
            )}
          </Pressable>
          <Pressable disabled={busy} onPress={onRestore} style={styles.linkBtn}>
            <ThemedText type="caption" style={{ color: primaryColor }}>
              {t("pro.cta.restore")}
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Layout.spaceMd,
    paddingVertical: Layout.spaceSm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { marginRight: 8, padding: 4 },
  scroll: { padding: Layout.spaceMd, paddingBottom: 40 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: Layout.spaceSm },
  featureList: { gap: 10 },
  featureRow: {
    flexDirection: "row",
    gap: 12,
    padding: Layout.spaceMd,
    borderRadius: Layout.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
  },
  featureCopy: { flex: 1, minWidth: 0 },
  legal: { marginTop: Layout.spaceLg, lineHeight: 18 },
  footer: {
    padding: Layout.spaceMd,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  primaryBtn: {
    borderRadius: Layout.radiusMd,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
});
