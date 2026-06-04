import { getAsyncStorage } from "@/lib/storage";

const OVERLAY_KEY = "savedRates.amountOverlay.v1";

export type SavedRateAmountOverlay = Record<
  string,
  { from_amount?: number; to_amount?: number }
>;

export function isSavedRatesAmountColumnMissing(error: unknown): boolean {
  const e = error as { code?: string; message?: string };
  return (
    e?.code === "PGRST204" &&
    typeof e.message === "string" &&
    (e.message.includes("from_amount") || e.message.includes("to_amount"))
  );
}

export async function loadSavedRateAmountOverlay(): Promise<SavedRateAmountOverlay> {
  try {
    const storage = getAsyncStorage();
    const raw = await storage.getItem(OVERLAY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function setSavedRateAmountOverlay(
  id: string,
  fromAmount?: number | null,
  toAmount?: number | null
): Promise<void> {
  if (!id) return;
  const hasFrom = fromAmount != null && Number.isFinite(fromAmount);
  const hasTo = toAmount != null && Number.isFinite(toAmount);
  if (!hasFrom && !hasTo) return;

  const overlay = await loadSavedRateAmountOverlay();
  overlay[id] = {
    ...(hasFrom ? { from_amount: fromAmount! } : {}),
    ...(hasTo ? { to_amount: toAmount! } : {}),
  };
  const storage = getAsyncStorage();
  await storage.setItem(OVERLAY_KEY, JSON.stringify(overlay));
}

export async function removeSavedRateAmountOverlay(id: string): Promise<void> {
  const overlay = await loadSavedRateAmountOverlay();
  if (!(id in overlay)) return;
  delete overlay[id];
  const storage = getAsyncStorage();
  await storage.setItem(OVERLAY_KEY, JSON.stringify(overlay));
}

export async function clearSavedRateAmountOverlay(): Promise<void> {
  const storage = getAsyncStorage();
  await storage.removeItem(OVERLAY_KEY);
}

export function mergeSavedRatesWithAmountOverlay<
  T extends {
    id: string;
    from_amount?: number | null;
    to_amount?: number | null;
  },
>(rates: T[], overlay: SavedRateAmountOverlay): T[] {
  return rates.map((rate) => {
    if (rate.from_amount != null || rate.to_amount != null) return rate;
    const extra = overlay[rate.id];
    if (!extra) return rate;
    return {
      ...rate,
      from_amount: extra.from_amount ?? rate.from_amount ?? null,
      to_amount: extra.to_amount ?? rate.to_amount ?? null,
    };
  });
}
