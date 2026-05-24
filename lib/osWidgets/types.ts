export type OsWidgetKind = "rate_pair" | "saved_rates";

export type OsWidgetPairLine = {
  from: string;
  to: string;
  rate: number;
};

export type OsWidgetSnapshot = {
  updatedAt: number;
  updatedLabel: string;
  baseCode: string;
  pairs: OsWidgetPairLine[];
  savedRates: OsWidgetPairLine[];
  headline: string;
  headlineRate: string;
};

export type OsWidgetInstanceConfig = {
  kind: OsWidgetKind;
  fromCurrency?: string;
  toCurrency?: string;
};

export type OsWidgetPreset = {
  id: string;
  label: string;
  config: OsWidgetInstanceConfig;
  createdAt: number;
};

/** Props pushed to iOS via `expo-widgets` `updateSnapshot` and mirrored on Android. */
export type CapitalRatesWidgetProps = {
  headline: string;
  headlineRate: string;
  updatedLabel: string;
  lines: { label: string; rate: string }[];
};
