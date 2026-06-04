/**
 * Monetization & retention analytics — wire to your provider (PostHog, Amplitude, Firebase).
 * No-op by default; safe for privacy-first rollout.
 */

export type MonetizationAnalyticsEvent =
  | { name: "onboarding_started" }
  | { name: "onboarding_completed"; skipped: boolean }
  | { name: "onboarding_step_viewed"; step: number }
  | { name: "dashboard_viewed" }
  | { name: "converter_opened"; source: string }
  | { name: "saved_rate_added"; count: number; at_limit: boolean }
  | { name: "rate_alert_created" }
  | { name: "chart_period_selected"; period: string; locked: boolean }
  | { name: "banner_ad_impression"; placement: string }
  | { name: "banner_ad_clicked"; placement: string }
  | { name: "pro_screen_viewed"; source: string }
  | { name: "support_capital_viewed"; source: string }
  | { name: "upgrade_prompt_shown"; feature: string; source: string }
  | { name: "upgrade_prompt_tapped"; feature: string; source: string }
  | { name: "purchase_started"; product_id: string }
  | { name: "purchase_completed"; product_id: string }
  | { name: "purchase_failed"; product_id: string; reason: string }
  | { name: "purchase_restored"; success: boolean }
  | { name: "subscription_active"; tier: "pro" | "free" };

type AnalyticsHandler = (event: MonetizationAnalyticsEvent) => void;

let handler: AnalyticsHandler | null = null;

export function setMonetizationAnalyticsHandler(h: AnalyticsHandler | null) {
  handler = h;
}

export function trackMonetizationEvent(event: MonetizationAnalyticsEvent) {
  if (__DEV__) {
    console.log("[analytics]", event.name, event);
  }
  handler?.(event);
}

/** Suggested KPIs for store / growth reviews */
export const MONETIZATION_KPIS = [
  "D1 / D7 retention after onboarding",
  "Converter sessions per WAU",
  "Saved-rate limit hit rate (upgrade intent)",
  "Chart period lock tap → pro_screen_viewed",
  "banner_ad_impression / MAU (keep low)",
  "pro_screen_viewed → purchase_completed",
  "support_capital_viewed → purchase_completed",
] as const;
