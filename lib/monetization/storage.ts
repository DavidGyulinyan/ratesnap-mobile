import { getAsyncStorage } from "@/lib/storage";

const PRO_STATUS_KEY = "capital.pro.status.v1";
const PRO_EXPIRES_KEY = "capital.pro.expiresAt.v1";

export type StoredProStatus = "free" | "pro" | "trial";

export type StoredSubscription = {
  status: StoredProStatus;
  expiresAt: string | null;
  updatedAt: string;
};

export async function loadStoredSubscription(): Promise<StoredSubscription> {
  const storage = getAsyncStorage();
  try {
    const raw = await storage.getItem(PRO_STATUS_KEY);
    const expiresAt = await storage.getItem(PRO_EXPIRES_KEY);
    if (raw === "pro" || raw === "trial") {
      if (expiresAt) {
        const exp = new Date(expiresAt).getTime();
        if (Number.isFinite(exp) && exp < Date.now()) {
          await saveStoredSubscription({ status: "free", expiresAt: null });
          return {
            status: "free",
            expiresAt: null,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return {
        status: raw,
        expiresAt,
        updatedAt: new Date().toISOString(),
      };
    }
  } catch {
    // ignore
  }
  return { status: "free", expiresAt: null, updatedAt: new Date().toISOString() };
}

export async function saveStoredSubscription(sub: {
  status: StoredProStatus;
  expiresAt?: string | null;
}): Promise<void> {
  const storage = getAsyncStorage();
  await storage.setItem(PRO_STATUS_KEY, sub.status);
  if (sub.expiresAt) {
    await storage.setItem(PRO_EXPIRES_KEY, sub.expiresAt);
  } else {
    await storage.removeItem(PRO_EXPIRES_KEY);
  }
}

/** Dev / QA: EXPO_PUBLIC_PRO_OVERRIDE=pro|free */
export function readProOverride(): StoredProStatus | null {
  const v = process.env.EXPO_PUBLIC_PRO_OVERRIDE?.trim().toLowerCase();
  if (v === "pro" || v === "trial") return v;
  if (v === "free") return "free";
  return null;
}

export function areAdsEnabledInConfig(): boolean {
  const v = process.env.EXPO_PUBLIC_ENABLE_ADS?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function getBannerAdUnitId(): string | null {
  const id = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID?.trim();
  return id || null;
}
