import type { CachedExchangeRates } from "@/lib/liveExchangeRates";
import { formatGroupedNumber } from "@/lib/numberFormat";
import type { OsWidgetPairLine, OsWidgetSnapshot } from "@/lib/osWidgets/types";

const DEFAULT_HEADLINE_PAIR = { from: "USD", to: "AMD" } as const;

function resolveRate(
  rates: Record<string, number>,
  base: string,
  from: string,
  to: string
): number | null {
  if (from === to) return 1;
  const baseRate = rates[base];
  if (!baseRate || baseRate <= 0) return null;

  if (from === base) {
    const toRate = rates[to];
    return toRate && toRate > 0 ? toRate / baseRate : null;
  }
  if (to === base) {
    const fromRate = rates[from];
    return fromRate && fromRate > 0 ? baseRate / fromRate : null;
  }
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate || fromRate <= 0) return null;
  return toRate / fromRate;
}

function pairLine(
  rates: Record<string, number>,
  base: string,
  from: string,
  to: string
): OsWidgetPairLine | null {
  const rate = resolveRate(rates, base, from, to);
  if (rate == null || !Number.isFinite(rate)) return null;
  return { from, to, rate };
}

function relativeUpdatedLabel(updatedAtMs: number): string {
  const diffMin = Math.max(0, Math.floor((Date.now() - updatedAtMs) / 60000));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function buildOsWidgetSnapshot(input: {
  cached?: CachedExchangeRates | null;
  savedRates?: Array<{ from_currency: string; to_currency: string; rate?: number }>;
  headline?: { from: string; to: string };
}): OsWidgetSnapshot {
  const cached = input.cached;
  const rates = cached?.conversion_rates ?? { USD: 1 };
  const base = cached?.base_code ?? "USD";
  const updatedAt =
    cached?.time_last_update_unix != null
      ? cached.time_last_update_unix * 1000
      : Date.now();

  const savedRates: OsWidgetPairLine[] = (input.savedRates ?? [])
    .slice(0, 6)
    .map((row) => {
      const from = row.from_currency?.toUpperCase() ?? "USD";
      const to = row.to_currency?.toUpperCase() ?? "AMD";
      const computed = pairLine(rates, base, from, to);
      if (computed) return computed;
      if (typeof row.rate === "number" && Number.isFinite(row.rate)) {
        return { from, to, rate: row.rate };
      }
      return null;
    })
    .filter((x): x is OsWidgetPairLine => x != null);

  const headlinePair = input.headline ?? DEFAULT_HEADLINE_PAIR;
  const headlineResolved =
    pairLine(rates, base, headlinePair.from, headlinePair.to) ??
    savedRates[0] ?? {
      from: headlinePair.from,
      to: headlinePair.to,
      rate: 0,
    };

  const popularPairs: OsWidgetPairLine[] = [
    { from: "USD", to: "AMD" },
    { from: "EUR", to: "AMD" },
    { from: "RUB", to: "AMD" },
    { from: "USD", to: "EUR" },
  ]
    .map((p) => pairLine(rates, base, p.from, p.to))
    .filter((x): x is OsWidgetPairLine => x != null);

  return {
    updatedAt,
    updatedLabel: relativeUpdatedLabel(updatedAt),
    baseCode: base,
    pairs: popularPairs,
    savedRates,
    headline: `${headlineResolved.from} → ${headlineResolved.to}`,
    headlineRate:
      headlineResolved.rate > 0
        ? formatGroupedNumber(headlineResolved.rate, 4)
        : "—",
  };
}

export function formatWidgetRate(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return "—";
  const digits = rate >= 100 ? 2 : rate >= 1 ? 4 : 6;
  return formatGroupedNumber(rate, digits);
}
