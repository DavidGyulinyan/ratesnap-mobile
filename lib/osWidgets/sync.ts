import type { CachedExchangeRates } from "@/lib/liveExchangeRates";
import {
  ANDROID_WIDGET_RATE_PAIR,
  ANDROID_WIDGET_SAVED_RATES,
  IOS_WIDGET_NAME,
} from "@/lib/osWidgets/constants";
import { snapshotToWidgetProps } from "@/lib/osWidgets/bridge";
import { isOsWidgetsEnabled } from "@/lib/osWidgets/config";
import { isExpoGo } from "@/lib/osWidgets/platform";
import { buildOsWidgetSnapshot } from "@/lib/osWidgets/snapshot";
import { saveOsWidgetSnapshot } from "@/lib/osWidgets/storage";
import { getAsyncStorage } from "@/lib/storage";
import { Platform } from "react-native";

type SyncInput = {
  cached?: CachedExchangeRates | null;
  savedRates?: Array<{ from_currency: string; to_currency: string; rate?: number }>;
  headline?: { from: string; to: string };
};

async function pushSnapshotToIosWidget(
  props: ReturnType<typeof snapshotToWidgetProps>
): Promise<void> {
  if (Platform.OS !== "ios" || isExpoGo()) return;
  try {
    const CapitalRates = (await import("@/widgets/ios/CapitalRatesWidget")).default;
    CapitalRates.updateSnapshot(props);
  } catch (error) {
    if (__DEV__) {
      console.warn("[widgets] iOS updateSnapshot failed:", error);
    }
  }
}

async function refreshAndroidWidgets(): Promise<void> {
  if (Platform.OS !== "android" || isExpoGo()) return;
  try {
    const { requestWidgetUpdate } = await import("react-native-android-widget");
    const { renderAndroidWidgetByName } = await import(
      "@/widgets/renderAndroidWidget"
    );
    await requestWidgetUpdate({
      widgetName: ANDROID_WIDGET_RATE_PAIR,
      renderWidget: (info) => renderAndroidWidgetByName(ANDROID_WIDGET_RATE_PAIR, info),
    });
    await requestWidgetUpdate({
      widgetName: ANDROID_WIDGET_SAVED_RATES,
      renderWidget: (info) =>
        renderAndroidWidgetByName(ANDROID_WIDGET_SAVED_RATES, info),
    });
  } catch (error) {
    if (__DEV__) {
      console.warn("[widgets] Android requestWidgetUpdate failed:", error);
    }
  }
}

/**
 * Shared bridge: persist snapshot for Android headless reads, push props to iOS via expo-widgets.
 */
export async function syncOsWidgetData(input: SyncInput = {}): Promise<void> {
  if (!isOsWidgetsEnabled()) return;

  let cached = input.cached ?? null;
  if (!cached) {
    try {
      const raw = await getAsyncStorage().getItem("cachedExchangeRates");
      if (raw) cached = JSON.parse(raw) as CachedExchangeRates;
    } catch {
      cached = null;
    }
  }

  let savedRates = input.savedRates;
  if (!savedRates) {
    try {
      const raw =
        (await getAsyncStorage().getItem("savedRates")) ??
        (await getAsyncStorage().getItem("saved_rates"));
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        savedRates = Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      savedRates = [];
    }
  }

  const snapshot = buildOsWidgetSnapshot({
    cached,
    savedRates,
    headline: input.headline,
  });
  await saveOsWidgetSnapshot(snapshot);

  const props = snapshotToWidgetProps(snapshot);
  await pushSnapshotToIosWidget(props);
  await refreshAndroidWidgets();
}

export { IOS_WIDGET_NAME };
