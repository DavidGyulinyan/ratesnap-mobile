import { useLanguage } from "@/contexts/LanguageContext";
import { usePro } from "@/contexts/ProContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { canShowBannerAd } from "@/lib/monetization/adsPolicy";
import { trackMonetizationEvent } from "@/lib/monetization/analytics";
import { getBannerAdUnitId } from "@/lib/monetization/storage";
import { Layout, hexToRgba } from "@/constants/theme";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";

type DashboardBannerSlotProps = {
  reorderMode?: boolean;
};

/**
 * Small home-only banner. Replace inner placeholder with AdMob Banner when
 * `EXPO_PUBLIC_ENABLE_ADS=true` and `EXPO_PUBLIC_ADMOB_BANNER_ID` are set.
 */
export default function DashboardBannerSlot({
  reorderMode = false,
}: DashboardBannerSlotProps) {
  const { t } = useLanguage();
  const { isPro, adsEnabled, ready } = usePro();
  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "border");
  const textSecondaryColor = useThemeColor({}, "textSecondary");

  const visible =
    ready &&
    canShowBannerAd({
      placement: "dashboard_home",
      surface: "dashboard_home",
      isPro,
      adsGloballyEnabled: adsEnabled,
      reorderMode,
    });

  useEffect(() => {
    if (visible) {
      trackMonetizationEvent({
        name: "banner_ad_impression",
        placement: "dashboard_home",
      });
    }
  }, [visible]);

  if (!visible) return null;

  const adUnitId = getBannerAdUnitId();
  const hasLiveAd = Boolean(adUnitId);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole={hasLiveAd ? "button" : "text"}
        accessibilityLabel={t("ads.label")}
        onPress={() => {
          if (!hasLiveAd) return;
          trackMonetizationEvent({
            name: "banner_ad_clicked",
            placement: "dashboard_home",
          });
          // AdMob handles clicks when integrated; placeholder noop
        }}
        style={[
          styles.banner,
          {
            backgroundColor: surfaceColor,
            borderColor: hexToRgba(borderColor, 0.55),
          },
        ]}
      >
        <ThemedText
          type="caption"
          style={[styles.sponsored, { color: textSecondaryColor }]}
        >
          {t("ads.label")}
        </ThemedText>
        <View style={styles.placeholder}>
          <ThemedText
            type="caption"
            style={{ color: textSecondaryColor, textAlign: "center" }}
          >
            {hasLiveAd ? "Ad" : t("ads.placeholder")}
          </ThemedText>
        </View>
      </Pressable>
    </View>
  );
}

const BANNER_HEIGHT = 50;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Layout.spaceMd,
    paddingTop: Layout.spaceSm,
    paddingBottom: Layout.spaceXs,
  },
  banner: {
    borderRadius: Layout.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    minHeight: BANNER_HEIGHT,
  },
  sponsored: {
    position: "absolute",
    top: 4,
    right: 8,
    fontSize: 10,
    opacity: 0.7,
    zIndex: 1,
  },
  placeholder: {
    minHeight: BANNER_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Layout.spaceMd,
  },
});
