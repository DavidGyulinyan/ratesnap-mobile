# Capital — Monetization strategy & implementation

Philosophy: **premium feel, careful monetization**. Core conversion and Armenia calculators stay free. Revenue from optional Pro and a single home banner (free tier only).

## Free vs Pro

| Area | Free | Capital Pro |
|------|------|-------------|
| Converter, multi-currency, calculators | Full | Full |
| Ads | Small home banner only | None |
| Saved rates | 8 pairs | Unlimited |
| Charts | 7D, 30D | + 90D, 1Y |
| Offline cache | 24h effective | 14 days (config) |
| PDF/CSV export | — | Planned |
| Widgets / extra themes | — | Home screen widgets (Pro) |

## Architecture

```
lib/monetization/
  features.ts      # ProFeatureId, limits
  entitlements.ts  # buildEntitlements(), canUseFeature()
  adsPolicy.ts     # canShowBannerAd(), AD_FREE_SURFACES
  analytics.ts     # trackMonetizationEvent() — wire to PostHog/Firebase
  storage.ts       # local pro status + env flags
  purchases.ts     # IAP adapter (stub → RevenueCat / Store)

contexts/ProContext.tsx     # usePro() for UI
components/monetization/    # banner, prompts, teaser
app/capital-pro.tsx         # upgrade screen
app/support-capital.tsx     # Support Capital page
```

### Feature flags

Use `usePro()`:

- `entitlements.isPro`
- `canUse('advanced_charts')`
- `canSaveRate(count)`
- `isChartPeriodAllowed('90D')`

Dev overrides in `.env`:

- `EXPO_PUBLIC_PRO_OVERRIDE=pro|free`
- `EXPO_PUBLIC_ENABLE_ADS=true`
- `EXPO_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-...`

## Where banner ads are allowed

| Placement | Allowed |
|-----------|---------|
| Dashboard home (below scroll, above footer) | Yes |
| Settings | No |
| Any modal (converter, charts, finance, etc.) | No |
| Onboarding / auth | No |
| During calculation / input focus | No |

Implemented: `DashboardBannerSlot` + `canShowBannerAd()` in `adsPolicy.ts`.

## Screens that must NEVER contain ads

Listed in `AD_FREE_SURFACES`: all modals, converter view, calculators, Armenia tools, onboarding, auth, Pro/Support pages.

## Upgrade flow

1. **Soft prompts** — `ProUpgradePrompt` (charts, future export).
2. **Settings** → Capital Pro.
3. **Support Capital** → explains model → Capital Pro.
4. **Dashboard teaser** — one calm card (not a popup).

No forced interstitials on launch.

## Support Capital

Route: `/support-capital`. Explains why support exists, what stays free, links to Pro.

## Offline-friendly ideas

- Already cache rates in AsyncStorage (`cachedExchangeRates`).
- Pro: extend TTL via `offlineCacheMaxAgeHours` in entitlements (enforce in `liveExchangeRates.ts` when reading cache).
- Optional: background refresh on app foreground (expo-background-fetch).

## Analytics events (retention & conversion)

See `lib/monetization/analytics.ts`. Suggested KPIs:

- Onboarding completion rate
- `saved_rate_added` with `at_limit: true`
- `chart_period_selected` with `locked: true` → `pro_screen_viewed`
- `banner_ad_impression` / MAU (keep &lt; 5% tap rate)
- `purchase_completed` / `pro_screen_viewed`

## Onboarding (short, trust-first)

- Keep existing ~6 steps; add optional final slide: “Core tools are free. Pro removes the home banner and unlocks extended charts.”
- Single CTA: **Get started** — no paywall on first open.
- Track `onboarding_completed` with `skipped` flag.

## App Store positioning

**Title:** Capital — Rates & AMD Finance  

**Subtitle:** Live FX, CBA rates, Armenia tools  

**Keywords:** currency, exchange, AMD, Armenia, dram, salary, payroll, tourist, calculator, rates  

**Short description:** Live currency converter with Central Bank of Armenia rates, charts, and Armenia salary & tax calculators. Free core tools; optional Pro removes ads and unlocks limits.

**Audience:** Travelers to/from Armenia, residents, freelancers, anyone needing fast FX + local finance estimates (informational, not advice).

**Category:** Finance (primary), Utilities (secondary).

**Data safety:** Declare location (currency hint), account email if signed in, analytics if enabled. No sale of personal data.

## Next engineering steps

1. Integrate `react-native-google-mobile-ads` in `DashboardBannerSlot` when `EXPO_PUBLIC_ENABLE_ADS=true`.
2. Connect `PurchaseService` to RevenueCat or `expo-iap`.
3. Enforce offline TTL in `liveExchangeRates.ts` using `entitlements.offlineCacheMaxAgeHours`.
4. Add export PDF/CSV behind `export_pdf_csv` when ready.
