import {
  normalizeDashboardCardOrder,
  normalizeWidgetVisibleOrder,
} from "@/lib/dashboardCardOrder";
import {
  QUICK_ACTION_CATALOG,
  QUICK_ACTION_DEFAULT_VISIBLE,
} from "@/lib/dashboardWidgets";

describe("normalizeWidgetVisibleOrder", () => {
  it("returns default when storage is missing", () => {
    expect(
      normalizeWidgetVisibleOrder(
        null,
        QUICK_ACTION_CATALOG,
        QUICK_ACTION_DEFAULT_VISIBLE
      )
    ).toEqual([...QUICK_ACTION_DEFAULT_VISIBLE]);
  });

  it("keeps only stored visible ids and does not restore removed widgets", () => {
    expect(
      normalizeWidgetVisibleOrder(
        ["converter", "charts"],
        QUICK_ACTION_CATALOG,
        QUICK_ACTION_DEFAULT_VISIBLE
      )
    ).toEqual(["converter", "charts"]);
  });

  it("falls back to default when stored list is empty", () => {
    expect(
      normalizeWidgetVisibleOrder(
        [],
        QUICK_ACTION_CATALOG,
        QUICK_ACTION_DEFAULT_VISIBLE
      )
    ).toEqual([...QUICK_ACTION_DEFAULT_VISIBLE]);
  });
});

describe("normalizeDashboardCardOrder (legacy)", () => {
  it("restores missing default ids", () => {
    expect(
      normalizeDashboardCardOrder(["converter"], QUICK_ACTION_DEFAULT_VISIBLE)
    ).toEqual([...QUICK_ACTION_DEFAULT_VISIBLE]);
  });
});
