import { ThemedText } from "@/components/themed-text";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePro } from "@/contexts/ProContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { trackMonetizationEvent } from "@/lib/monetization/analytics";
import { Layout, hexToRgba } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupportCapitalScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const source = typeof params.source === "string" ? params.source : "direct";
  const { isPro } = usePro();

  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");

  useEffect(() => {
    trackMonetizationEvent({ name: "support_capital_viewed", source });
  }, [source]);

  const freeItems = [
    t("support.free.item1"),
    t("support.free.item2"),
    t("support.free.item3"),
  ] as const;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={["top", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: hexToRgba(borderColor, 0.5) }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <ThemedText type="subtitle" style={{ color: textColor, flex: 1 }}>
          {t("support.title")}
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={[styles.lead, { color: textSecondaryColor }]}>
          {t("support.subtitle")}
        </ThemedText>

        <View
          style={[
            styles.block,
            { backgroundColor: surfaceColor, borderColor: hexToRgba(borderColor, 0.45) },
          ]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
            {t("support.why.title")}
          </ThemedText>
          <ThemedText
            style={[styles.body, { color: textSecondaryColor }]}
          >
            {t("support.why.body")}
          </ThemedText>
        </View>

        <View
          style={[
            styles.block,
            { backgroundColor: surfaceColor, borderColor: hexToRgba(borderColor, 0.45) },
          ]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
            {t("support.free.title")}
          </ThemedText>
          {freeItems.map((line) => (
            <View key={line} style={styles.bulletRow}>
              <Ionicons name="checkmark" size={16} color={primaryColor} />
              <ThemedText style={[styles.bullet, { color: textSecondaryColor }]}>
                {line}
              </ThemedText>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.push("/capital-pro")}
          style={({ pressed }) => [
            styles.proCard,
            {
              backgroundColor: hexToRgba(primaryColor, 0.1),
              borderColor: hexToRgba(primaryColor, 0.35),
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <View style={styles.proCardHeader}>
            <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
              {t("support.pro.card.title")}
            </ThemedText>
            {isPro ? (
              <View style={[styles.badge, { backgroundColor: primaryColor }]}>
                <ThemedText type="caption" style={{ color: "#fff", fontWeight: "600" }}>
                  {t("pro.badge")}
                </ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText style={{ color: textSecondaryColor, marginTop: 6, lineHeight: 20 }}>
            {t("support.pro.card.body")}
          </ThemedText>
          {!isPro ? (
            <ThemedText
              style={{ color: primaryColor, marginTop: 10, fontWeight: "600" }}
            >
              {t("support.cta.pro")} →
            </ThemedText>
          ) : null}
        </Pressable>

        <View
          style={[
            styles.block,
            { backgroundColor: surfaceColor, borderColor: hexToRgba(borderColor, 0.45) },
          ]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
            {t("support.tip.title")}
          </ThemedText>
          <ThemedText style={[styles.body, { color: textSecondaryColor }]}>
            {t("support.tip.body")}
          </ThemedText>
        </View>
      </ScrollView>
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
  scroll: { padding: Layout.spaceMd, paddingBottom: 32, gap: 14 },
  lead: { fontSize: 15, lineHeight: 22 },
  block: {
    padding: Layout.spaceMd,
    borderRadius: Layout.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: { marginTop: 8, fontSize: 14, lineHeight: 21 },
  bulletRow: { flexDirection: "row", gap: 8, marginTop: 10, alignItems: "flex-start" },
  bullet: { flex: 1, fontSize: 14, lineHeight: 20 },
  proCard: {
    padding: Layout.spaceMd,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  proCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
