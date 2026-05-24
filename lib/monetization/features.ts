/**
 * Capital Pro feature flags — single source of truth for free vs Pro capabilities.
 */

export const PRO_PRODUCT_ID = "capital_pro" as const;

export type ProFeatureId =
  | "remove_ads"
  | "unlimited_saved_rates"
  | "advanced_charts"
  | "export_pdf_csv"
  | "extended_offline_cache"
  | "home_widgets"
  | "premium_themes"
  | "early_access";

export type ProFeatureMeta = {
  id: ProFeatureId;
  /** i18n key under `pro.feature.*` */
  labelKey: string;
  descriptionKey: string;
  /** Shown on upgrade screen */
  highlight: boolean;
  /** Available in v1 (others may be “coming soon”) */
  shipped: boolean;
};

export const PRO_FEATURES: readonly ProFeatureMeta[] = [
  {
    id: "remove_ads",
    labelKey: "pro.feature.removeAds",
    descriptionKey: "pro.feature.removeAds.desc",
    highlight: true,
    shipped: true,
  },
  {
    id: "unlimited_saved_rates",
    labelKey: "pro.feature.unlimitedBookmarks",
    descriptionKey: "pro.feature.unlimitedBookmarks.desc",
    highlight: true,
    shipped: true,
  },
  {
    id: "advanced_charts",
    labelKey: "pro.feature.advancedCharts",
    descriptionKey: "pro.feature.advancedCharts.desc",
    highlight: true,
    shipped: true,
  },
  {
    id: "export_pdf_csv",
    labelKey: "pro.feature.export",
    descriptionKey: "pro.feature.export.desc",
    highlight: false,
    shipped: false,
  },
  {
    id: "extended_offline_cache",
    labelKey: "pro.feature.offlineCache",
    descriptionKey: "pro.feature.offlineCache.desc",
    highlight: true,
    shipped: true,
  },
  {
    id: "home_widgets",
    labelKey: "pro.feature.widgets",
    descriptionKey: "pro.feature.widgets.desc",
    highlight: false,
    shipped: false,
  },
  {
    id: "premium_themes",
    labelKey: "pro.feature.themes",
    descriptionKey: "pro.feature.themes.desc",
    highlight: false,
    shipped: false,
  },
  {
    id: "early_access",
    labelKey: "pro.feature.earlyAccess",
    descriptionKey: "pro.feature.earlyAccess.desc",
    highlight: false,
    shipped: false,
  },
] as const;

/** Free-tier limits (generous — core tools stay usable). */
export const FREE_TIER_LIMITS = {
  savedRatesMax: 8,
  chartPeriods: ["7D", "30D"] as const,
  offlineCacheMaxAgeHours: 24,
} as const;

export const PRO_TIER_LIMITS = {
  savedRatesMax: 999,
  chartPeriods: ["7D", "30D", "90D", "1Y"] as const,
  offlineCacheMaxAgeHours: 24 * 14,
} as const;

export type ChartPeriodKey = "7D" | "30D" | "90D" | "1Y";

export function isProFeature(id: ProFeatureId): boolean {
  return PRO_FEATURES.some((f) => f.id === id);
}
