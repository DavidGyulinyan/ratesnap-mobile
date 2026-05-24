export type OsWidgetKind = 'rate_pair' | 'saved_rates';

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
