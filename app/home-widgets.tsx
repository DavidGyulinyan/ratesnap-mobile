import ProUpgradePrompt from "@/components/monetization/ProUpgradePrompt";
import { ThemedText } from "@/components/themed-text";
import { Layout, hexToRgba } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePro } from "@/contexts/ProContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useUserData } from "@/hooks/useUserData";
import {
  isOsWidgetNativeSupported,
  osWidgetBuildRequiredMessageKey,
  osWidgetsReadyOnDevice,
} from "@/lib/osWidgets/platform";
import { buildOsWidgetSnapshot } from "@/lib/osWidgets/snapshot";
import {
  loadOsWidgetPresets,
  loadOsWidgetSnapshot,
  saveOsWidgetPresets,
} from "@/lib/osWidgets/storage";
import { syncOsWidgetData } from "@/lib/osWidgets/sync";
import type { OsWidgetPreset } from "@/lib/osWidgets/types";
import { getAsyncStorage } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CURRENCIES = ["USD", "EUR", "GBP", "AMD", "RUB", "GEL", "TRY"];

export default function HomeWidgetsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { canUse } = usePro();
  const { savedRates } = useUserData();
  const widgetsAllowed = canUse("home_widgets");

  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");

  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("AMD");
  const [presets, setPresets] = useState<OsWidgetPreset[]>([]);
  const [headlineRate, setHeadlineRate] = useState("—");
  const [updatedLabel, setUpdatedLabel] = useState("");
  const [syncing, setSyncing] = useState(false);

  const refreshPreview = useCallback(async () => {
    const snapshot =
      (await loadOsWidgetSnapshot()) ??
      buildOsWidgetSnapshot({
        savedRates: savedRates.savedRates,
        headline: { from: fromCurrency, to: toCurrency },
      });
    setHeadlineRate(snapshot.headlineRate);
    setUpdatedLabel(snapshot.updatedLabel);
  }, [fromCurrency, toCurrency, savedRates.savedRates]);

  useEffect(() => {
    void loadOsWidgetPresets().then(setPresets);
    void refreshPreview();
  }, [refreshPreview]);

  const onSync = async () => {
    setSyncing(true);
    try {
      const raw = await getAsyncStorage().getItem("cachedExchangeRates");
      const cached = raw ? JSON.parse(raw) : null;
      await syncOsWidgetData({
        cached,
        savedRates: savedRates.savedRates,
        headline: { from: fromCurrency, to: toCurrency },
      });
      await refreshPreview();
    } finally {
      setSyncing(false);
    }
  };

  const onSavePreset = async () => {
    const preset: OsWidgetPreset = {
      id: `${Date.now()}`,
      label: `${fromCurrency} → ${toCurrency}`,
      config: {
        kind: "rate_pair",
        fromCurrency,
        toCurrency,
      },
      createdAt: Date.now(),
    };
    const next = [preset, ...presets].slice(0, 8);
    setPresets(next);
    await saveOsWidgetPresets(next);
    await onSync();
  };

  if (!widgetsAllowed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </Pressable>
          <ThemedText type="subtitle" style={{ color: textColor, flex: 1 }}>
            {t("osWidgets.title")}
          </ThemedText>
        </View>
        <ProUpgradePrompt
          feature="home_widgets"
          source="os_widgets"
          messageKey="pro.feature.widgets.desc"
        />
      </SafeAreaView>
    );
  }

  const instructionsKey =
    Platform.OS === "ios"
      ? "osWidgets.instructionsIos"
      : Platform.OS === "android"
        ? "osWidgets.instructionsAndroid"
        : "osWidgets.unsupportedPlatform";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={["top", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <ThemedText type="subtitle" style={{ color: textColor, flex: 1 }}>
          {t("osWidgets.title")}
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!osWidgetsReadyOnDevice() ? (
          <View style={[styles.banner, { backgroundColor: hexToRgba(primaryColor, 0.12), borderColor }]}>
            <Ionicons name="information-circle-outline" size={22} color={primaryColor} style={styles.bannerIcon} />
            <ThemedText style={[styles.bannerText, { color: textColor }]}>
              {t(osWidgetBuildRequiredMessageKey())}
            </ThemedText>
          </View>
        ) : null}

        <ThemedText style={{ color: textSecondaryColor, marginBottom: 16 }}>
          {t("osWidgets.subtitle")}
        </ThemedText>

        <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
          <ThemedText type="defaultSemiBold" style={{ color: textColor, marginBottom: 8 }}>
            {t("osWidgets.preview")}
          </ThemedText>
          <ThemedText style={{ color: textSecondaryColor, marginBottom: 4 }}>
            {fromCurrency} → {toCurrency}
          </ThemedText>
          <ThemedText style={{ fontSize: 32, color: primaryColor, marginBottom: 4 }}>
            {headlineRate}
          </ThemedText>
          <ThemedText type="caption" style={{ color: textSecondaryColor }}>
            {updatedLabel || t("osWidgets.notSyncedYet")}
          </ThemedText>
        </View>

        <ThemedText type="defaultSemiBold" style={{ color: textColor, marginBottom: 8 }}>
          {t("osWidgets.pickPair")}
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {CURRENCIES.map((code) => (
              <Pressable
                key={`from-${code}`}
                onPress={() => setFromCurrency(code)}
                style={[
                  styles.chip,
                  {
                    borderColor,
                    backgroundColor:
                      fromCurrency === code
                        ? hexToRgba(primaryColor, 0.14)
                        : surfaceColor,
                  },
                ]}
              >
                <ThemedText style={{ color: fromCurrency === code ? primaryColor : textColor }}>
                  {code}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {CURRENCIES.map((code) => (
              <Pressable
                key={`to-${code}`}
                onPress={() => setToCurrency(code)}
                style={[
                  styles.chip,
                  {
                    borderColor,
                    backgroundColor:
                      toCurrency === code ? hexToRgba(primaryColor, 0.14) : surfaceColor,
                  },
                ]}
              >
                <ThemedText style={{ color: toCurrency === code ? primaryColor : textColor }}>
                  {code}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Pressable
          onPress={() => void onSavePreset()}
          style={[styles.primaryBtn, { backgroundColor: primaryColor }]}
        >
          <ThemedText style={{ color: "#FFFFFF" }}>{t("osWidgets.savePreset")}</ThemedText>
        </Pressable>

        <Pressable
          onPress={() => void onSync()}
          disabled={syncing}
          style={[styles.secondaryBtn, { borderColor, backgroundColor: surfaceColor }]}
        >
          {syncing ? (
            <ActivityIndicator color={primaryColor} />
          ) : (
            <ThemedText style={{ color: primaryColor }}>{t("osWidgets.syncNow")}</ThemedText>
          )}
        </Pressable>

        {presets.length > 0 ? (
          <View style={[styles.card, { backgroundColor: surfaceColor, borderColor, marginTop: 20 }]}>
            <ThemedText type="defaultSemiBold" style={{ color: textColor, marginBottom: 10 }}>
              {t("osWidgets.savedPresets")}
            </ThemedText>
            {presets.map((preset) => (
              <View key={preset.id} style={styles.presetRow}>
                <ThemedText style={{ color: textColor }}>{preset.label}</ThemedText>
                <ThemedText style={{ color: textSecondaryColor }}>
                  {preset.config.kind === "rate_pair"
                    ? t("osWidgets.presetRatePair")
                    : t("osWidgets.presetSavedRates")}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: surfaceColor, borderColor, marginTop: 20 }]}>
          <ThemedText type="defaultSemiBold" style={{ color: textColor, marginBottom: 10 }}>
            {t("osWidgets.addToHomeTitle")}
          </ThemedText>
          <ThemedText style={{ color: textSecondaryColor, marginBottom: 12 }}>
            {t(instructionsKey)}
          </ThemedText>
          {isOsWidgetNativeSupported() && Platform.OS === "android" ? (
            <View style={styles.widgetList}>
              <ThemedText style={{ color: textColor }}>• {t("osWidgets.androidRateWidget")}</ThemedText>
              <ThemedText style={{ color: textColor }}>• {t("osWidgets.androidSavedWidget")}</ThemedText>
            </View>
          ) : null}
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
    gap: 12,
    paddingHorizontal: Layout.spaceMd,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: {
    padding: Layout.spaceMd,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  bannerIcon: { marginTop: 1 },
  bannerText: { flex: 1, lineHeight: 22 },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  chipScroll: { marginBottom: 10 },
  chipRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryBtn: {
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  secondaryBtn: {
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
    borderWidth: 1,
  },
  presetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  widgetList: { gap: 6 },
});
