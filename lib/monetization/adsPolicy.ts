/**
 * Where ads may appear — conservative policy for a finance utility.
 */

export type AdPlacementId = "dashboard_home";

export type AppSurfaceId =
  | "dashboard_home"
  | "dashboard_converter"
  | "settings"
  | "onboarding"
  | "auth"
  | "calculator"
  | "converter_modal"
  | "multi_currency_modal"
  | "saved_rates_modal"
  | "rate_alerts_modal"
  | "charts_modal"
  | "tourist_calc_modal"
  | "loan_calc_modal"
  | "armenia_finance_modal"
  | "armenia_freelance_modal"
  | "armenia_transport_modal"
  | "guide"
  | "capital_pro"
  | "support_capital";

/** Surfaces that must NEVER show ads (calculations, modals, auth). */
export const AD_FREE_SURFACES: ReadonlySet<AppSurfaceId> = new Set([
  "dashboard_converter",
  "onboarding",
  "auth",
  "calculator",
  "converter_modal",
  "multi_currency_modal",
  "saved_rates_modal",
  "rate_alerts_modal",
  "charts_modal",
  "tourist_calc_modal",
  "loan_calc_modal",
  "armenia_finance_modal",
  "armenia_freelance_modal",
  "armenia_transport_modal",
  "guide",
  "capital_pro",
  "support_capital",
]);

/** Only these placements may render a banner. */
export const BANNER_PLACEMENTS: ReadonlySet<AdPlacementId> = new Set([
  "dashboard_home",
]);

export function isSurfaceAdFree(surface: AppSurfaceId): boolean {
  return AD_FREE_SURFACES.has(surface);
}

export function canShowBannerAd(input: {
  placement: AdPlacementId;
  surface: AppSurfaceId;
  isPro: boolean;
  adsGloballyEnabled: boolean;
  reorderMode?: boolean;
}): boolean {
  if (!input.adsGloballyEnabled) return false;
  if (input.isPro) return false;
  if (!BANNER_PLACEMENTS.has(input.placement)) return false;
  if (isSurfaceAdFree(input.surface)) return false;
  if (input.placement === "dashboard_home") {
    if (input.surface !== "dashboard_home") return false;
    if (input.reorderMode) return false;
  }
  return true;
}
