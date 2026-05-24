import type { CapitalRatesWidgetProps, OsWidgetSnapshot } from "@/lib/osWidgets/types";
import { formatWidgetRate } from "@/lib/osWidgets/snapshot";

/** Map app snapshot → widget props for both iOS (`expo-widgets`) and Android. */
export function snapshotToWidgetProps(
  snapshot: OsWidgetSnapshot
): CapitalRatesWidgetProps {
  const source =
    snapshot.savedRates.length > 0 ? snapshot.savedRates : snapshot.pairs;

  return {
    headline: snapshot.headline,
    headlineRate: snapshot.headlineRate,
    updatedLabel: snapshot.updatedLabel,
    lines: source.slice(0, 3).map((pair) => ({
      label: `${pair.from} → ${pair.to}`,
      rate: formatWidgetRate(pair.rate),
    })),
  };
}
