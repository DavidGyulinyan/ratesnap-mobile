import {
  FREE_TIER_LIMITS,
  type ChartPeriodKey,
  type ProFeatureId,
  PRO_TIER_LIMITS,
} from "@/lib/monetization/features";

export type { ProFeatureId };

export type SubscriptionTier = "free" | "pro";

export type Entitlements = {
  tier: SubscriptionTier;
  isPro: boolean;
  canShowAds: boolean;
  savedRatesMax: number;
  chartPeriods: readonly ChartPeriodKey[];
  offlineCacheMaxAgeHours: number;
};

export function buildEntitlements(isPro: boolean): Entitlements {
  const limits = isPro ? PRO_TIER_LIMITS : FREE_TIER_LIMITS;
  return {
    tier: isPro ? "pro" : "free",
    isPro,
    canShowAds: !isPro,
    savedRatesMax: limits.savedRatesMax,
    chartPeriods: limits.chartPeriods,
    offlineCacheMaxAgeHours: limits.offlineCacheMaxAgeHours,
  };
}

export function canUseFeature(
  entitlements: Entitlements,
  feature: ProFeatureId
): boolean {
  if (entitlements.isPro) return true;
  switch (feature) {
    case "remove_ads":
      return false;
    case "unlimited_saved_rates":
      return false;
    case "advanced_charts":
      return false;
    case "export_pdf_csv":
      return false;
    case "extended_offline_cache":
      return false;
    case "premium_themes":
    case "early_access":
      return false;
    default:
      return false;
  }
}

export function canSaveAnotherRate(
  entitlements: Entitlements,
  currentCount: number
): boolean {
  return currentCount < entitlements.savedRatesMax;
}

export function isChartPeriodAllowed(
  entitlements: Entitlements,
  period: ChartPeriodKey
): boolean {
  return entitlements.chartPeriods.includes(period);
}
