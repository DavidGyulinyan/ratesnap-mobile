import { formatGroupedNumber } from "@/lib/numberFormat";

export type SavedRateAmountFields = {
  from_amount?: number | null;
  to_amount?: number | null;
  fromAmount?: number | null;
  toAmount?: number | null;
};

export function savedRateFromAmount(rate: SavedRateAmountFields): number | null {
  const raw = rate.from_amount ?? rate.fromAmount;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function savedRateToAmount(rate: SavedRateAmountFields): number | null {
  const raw = rate.to_amount ?? rate.toAmount;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export type SavedRateWithPair = SavedRateAmountFields & {
  from_currency: string;
  to_currency: string;
  rate?: number | null;
};

/** Resolves from/to amounts; derives `to` from `from * rate` when only source amount was stored. */
export function resolveSavedConversionAmounts(
  rate: SavedRateWithPair
): { from: number; to: number } | null {
  const from = savedRateFromAmount(rate);
  if (from == null || from <= 0) return null;

  let to = savedRateToAmount(rate);
  if (to == null || !Number.isFinite(to)) {
    const r = Number(rate.rate);
    if (Number.isFinite(r) && r > 0) {
      to = from * r;
    }
  }
  if (to == null || !Number.isFinite(to)) return { from, to: from };

  return { from, to };
}

/** e.g. "500 USD → 192,500 AMD" */
export function formatSavedConversionAmount(rate: SavedRateWithPair): string | null {
  const amounts = resolveSavedConversionAmounts(rate);
  if (!amounts) return null;
  return `${formatGroupedNumber(amounts.from)} ${rate.from_currency} → ${formatGroupedNumber(amounts.to)} ${rate.to_currency}`;
}
