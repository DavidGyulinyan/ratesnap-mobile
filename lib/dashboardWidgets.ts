/** Quick-action tiles on the home dashboard (FX tools + shortcuts). */
export const QUICK_ACTION_CATALOG = [
  "converter",
  "calculator",
  "multi",
  "saved",
  "alerts",
  "charts",
  "tourist",
  "loan",
  "amFinance",
  "amFreelance",
  "amTransport",
] as const;

export type DashboardQuickActionId = (typeof QUICK_ACTION_CATALOG)[number];

export const QUICK_ACTION_DEFAULT_VISIBLE: DashboardQuickActionId[] = [
  "converter",
  "calculator",
  "multi",
  "saved",
  "alerts",
  "charts",
  "tourist",
];

/** Armenia salary & finance tiles. */
export const AM_FINANCE_CATALOG = [
  "paidLeave",
  "maternity",
  "amSalary",
  "deposit",
  "amFreelance",
  "loanCalc",
] as const;

export type AmFinanceCardId = (typeof AM_FINANCE_CATALOG)[number];

export const AM_FINANCE_DEFAULT_VISIBLE: AmFinanceCardId[] = [
  ...AM_FINANCE_CATALOG,
];

/** Armenia vehicle / customs tiles. */
export const AM_TRANSPORT_CATALOG = ["tmCustoms", "tmDeal"] as const;

export type AmTransportCardId = (typeof AM_TRANSPORT_CATALOG)[number];

export const AM_TRANSPORT_DEFAULT_VISIBLE: AmTransportCardId[] = [
  ...AM_TRANSPORT_CATALOG,
];

export function catalogIdsNotInOrder<T extends string>(
  catalog: readonly T[],
  order: readonly T[]
): T[] {
  const visible = new Set(order);
  return catalog.filter((id) => !visible.has(id));
}
