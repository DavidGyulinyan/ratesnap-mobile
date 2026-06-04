export function normalizeDashboardCardOrder<T extends string>(
  raw: unknown,
  defaultOrder: readonly T[]
): T[] {
  const allowed = new Set<string>(defaultOrder);
  if (!Array.isArray(raw)) return [...defaultOrder];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of raw) {
    if (typeof x === "string" && allowed.has(x) && !seen.has(x)) {
      seen.add(x);
      out.push(x as T);
    }
  }
  for (const id of defaultOrder) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

/**
 * Visible widget order: only IDs present in storage are shown.
 * Missing catalog items can be added via the widget picker (not auto-restored).
 */
export function normalizeWidgetVisibleOrder<T extends string>(
  raw: unknown,
  catalog: readonly T[],
  defaultVisible: readonly T[]
): T[] {
  const allowed = new Set<string>(catalog);
  if (!Array.isArray(raw)) return [...defaultVisible];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of raw) {
    if (typeof x === "string" && allowed.has(x) && !seen.has(x)) {
      seen.add(x);
      out.push(x as T);
    }
  }
  return out.length > 0 ? out : [...defaultVisible];
}
