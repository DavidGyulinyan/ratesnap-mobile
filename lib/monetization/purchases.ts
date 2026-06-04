import { PRO_PRODUCT_ID } from "@/lib/monetization/features";
import {
  loadStoredSubscription,
  saveStoredSubscription,
  type StoredProStatus,
} from "@/lib/monetization/storage";

export type PurchaseResult =
  | { ok: true; status: StoredProStatus }
  | { ok: false; reason: string };

/**
 * IAP adapter — replace internals with RevenueCat / expo-in-app-purchases.
 * Local stub supports QA via EXPO_PUBLIC_PRO_OVERRIDE and dev simulate.
 */
export const PurchaseService = {
  async getSubscriptionStatus(): Promise<StoredProStatus> {
    const sub = await loadStoredSubscription();
    return sub.status === "trial" ? "pro" : sub.status;
  },

  async purchasePro(): Promise<PurchaseResult> {
    // TODO: connect store billing
    await saveStoredSubscription({ status: "pro", expiresAt: null });
    return { ok: true, status: "pro" };
  },

  async restorePurchases(): Promise<PurchaseResult> {
    const sub = await loadStoredSubscription();
    if (sub.status === "pro" || sub.status === "trial") {
      return { ok: true, status: sub.status };
    }
    return { ok: false, reason: "no_active_subscription" };
  },

  productId: PRO_PRODUCT_ID,
};
