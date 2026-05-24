import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  buildEntitlements,
  canSaveAnotherRate,
  canUseFeature,
  isChartPeriodAllowed,
  type Entitlements,
  type ProFeatureId,
} from "@/lib/monetization/entitlements";
import { trackMonetizationEvent } from "@/lib/monetization/analytics";
import { PurchaseService } from "@/lib/monetization/purchases";
import {
  areAdsEnabledInConfig,
  loadStoredSubscription,
  readProOverride,
  saveStoredSubscription,
} from "@/lib/monetization/storage";

type ProContextValue = {
  ready: boolean;
  entitlements: Entitlements;
  isPro: boolean;
  adsEnabled: boolean;
  canUse: (feature: ProFeatureId) => boolean;
  canSaveRate: (currentCount: number) => boolean;
  isChartPeriodAllowed: (period: "7D" | "30D" | "90D" | "1Y") => boolean;
  refreshSubscription: () => Promise<void>;
  purchasePro: () => Promise<{ ok: boolean; message?: string }>;
  restorePurchases: () => Promise<{ ok: boolean; message?: string }>;
  /** Dev: toggle Pro without store */
  setDevProStatus: (pro: boolean) => Promise<void>;
};

const ProContext = createContext<ProContextValue | undefined>(undefined);

export function ProProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const adsEnabled = areAdsEnabledInConfig();

  const refreshSubscription = useCallback(async () => {
    const override = readProOverride();
    if (override) {
      const pro = override === "pro" || override === "trial";
      setIsPro(pro);
      await saveStoredSubscription({
        status: override,
        expiresAt: null,
      });
      return;
    }
    const status = await PurchaseService.getSubscriptionStatus();
    setIsPro(status === "pro");
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const override = readProOverride();
      let tier: "pro" | "free" = "free";
      if (override === "pro" || override === "trial") {
        tier = "pro";
      } else {
        const status = await PurchaseService.getSubscriptionStatus();
        tier = status === "pro" ? "pro" : "free";
      }
      if (!alive) return;
      setIsPro(tier === "pro");
      setReady(true);
      trackMonetizationEvent({ name: "subscription_active", tier });
    })();
    return () => {
      alive = false;
    };
  }, []);

  const entitlements = useMemo(() => buildEntitlements(isPro), [isPro]);

  const purchasePro = useCallback(async () => {
    trackMonetizationEvent({
      name: "purchase_started",
      product_id: PurchaseService.productId,
    });
    const result = await PurchaseService.purchasePro();
    if (result.ok) {
      setIsPro(true);
      trackMonetizationEvent({
        name: "purchase_completed",
        product_id: PurchaseService.productId,
      });
      return { ok: true };
    }
    trackMonetizationEvent({
      name: "purchase_failed",
      product_id: PurchaseService.productId,
      reason: result.reason,
    });
    return { ok: false, message: result.reason };
  }, []);

  const restorePurchases = useCallback(async () => {
    const result = await PurchaseService.restorePurchases();
    if (result.ok) {
      setIsPro(true);
      trackMonetizationEvent({ name: "purchase_restored", success: true });
      return { ok: true };
    }
    trackMonetizationEvent({ name: "purchase_restored", success: false });
    return { ok: false, message: result.reason };
  }, []);

  const setDevProStatus = useCallback(async (pro: boolean) => {
    await saveStoredSubscription({
      status: pro ? "pro" : "free",
      expiresAt: null,
    });
    setIsPro(pro);
  }, []);

  const value = useMemo<ProContextValue>(
    () => ({
      ready,
      entitlements,
      isPro,
      adsEnabled,
      canUse: (f) => canUseFeature(entitlements, f),
      canSaveRate: (n) => canSaveAnotherRate(entitlements, n),
      isChartPeriodAllowed: (p) => isChartPeriodAllowed(entitlements, p),
      refreshSubscription,
      purchasePro,
      restorePurchases,
      setDevProStatus,
    }),
    [
      ready,
      entitlements,
      isPro,
      adsEnabled,
      refreshSubscription,
      purchasePro,
      restorePurchases,
      setDevProStatus,
    ]
  );

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro() {
  const ctx = useContext(ProContext);
  if (!ctx) {
    throw new Error("usePro must be used within ProProvider");
  }
  return ctx;
}

export async function hydrateProForTests(pro: boolean) {
  await saveStoredSubscription({ status: pro ? "pro" : "free", expiresAt: null });
  const sub = await loadStoredSubscription();
  return sub.status === "pro";
}
