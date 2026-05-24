import AsyncStorage from '@react-native-async-storage/async-storage';
import { OS_WIDGET_SNAPSHOT_KEY } from './constants';
import type { OsWidgetPairLine, OsWidgetSnapshot } from './types';

function formatRate(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return '—';
  const digits = rate >= 100 ? 2 : rate >= 1 ? 4 : 6;
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(rate);
}

function relativeUpdatedLabel(updatedAtMs: number): string {
  const diffMin = Math.max(0, Math.floor((Date.now() - updatedAtMs) / 60000));
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

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

export function buildFallbackSnapshot(): OsWidgetSnapshot {
  return {
    updatedAt: Date.now(),
    updatedLabel: 'Open Capital',
    baseCode: 'USD',
    pairs: [],
    savedRates: [],
    headline: 'USD → AMD',
    headlineRate: '—',
  };
}

export async function ensureWidgetSnapshot(): Promise<OsWidgetSnapshot> {
  const cached = await loadOsWidgetSnapshot();
  if (cached) return cached;

  try {
    const raw = await AsyncStorage.getItem('cachedExchangeRates');
    if (!raw) return buildFallbackSnapshot();
    const data = JSON.parse(raw) as {
      base_code?: string;
      conversion_rates?: Record<string, number>;
      time_last_update_unix?: number;
    };
    const rates = data.conversion_rates ?? { USD: 1 };
    const base = data.base_code ?? 'USD';
    const updatedAt =
      data.time_last_update_unix != null
        ? data.time_last_update_unix * 1000
        : Date.now();

    const headline = pairLine(rates, base, 'USD', 'AMD') ?? {
      from: 'USD',
      to: 'AMD',
      rate: 0,
    };

    return {
      updatedAt,
      updatedLabel: relativeUpdatedLabel(updatedAt),
      baseCode: base,
      pairs: [
        { from: 'USD', to: 'AMD' },
        { from: 'EUR', to: 'AMD' },
      ]
        .map((p) => pairLine(rates, base, p.from, p.to))
        .filter((x): x is OsWidgetPairLine => x != null),
      savedRates: [],
      headline: `${headline.from} → ${headline.to}`,
      headlineRate: headline.rate > 0 ? formatRate(headline.rate) : '—',
    };
  } catch {
    return buildFallbackSnapshot();
  }
}

export function formatWidgetRate(rate: number): string {
  return formatRate(rate);
}

async function loadOsWidgetSnapshot(): Promise<OsWidgetSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(OS_WIDGET_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OsWidgetSnapshot;
  } catch {
    return null;
  }
}
