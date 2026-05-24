import React from 'react';
import type { WidgetInfo, WidgetRepresentation } from 'react-native-android-widget';
import { CapitalRatePairWidgetView, CapitalSavedRatesWidgetView } from './android/CapitalWidgetViews';
import {
  ANDROID_WIDGET_RATE_PAIR,
  ANDROID_WIDGET_SAVED_RATES,
} from './runtime/constants';
import { ensureWidgetSnapshot } from './runtime/snapshot';
import { loadOsWidgetConfig } from './runtime/storage';
import type { OsWidgetInstanceConfig } from './runtime/types';

const defaultRatePairConfig: OsWidgetInstanceConfig = {
  kind: 'rate_pair',
  fromCurrency: 'USD',
  toCurrency: 'AMD',
};

export async function renderAndroidWidgetByName(
  widgetName: string,
  widgetInfo: WidgetInfo
): Promise<WidgetRepresentation> {
  const snapshot = await ensureWidgetSnapshot();
  if (widgetName === ANDROID_WIDGET_SAVED_RATES) {
    return <CapitalSavedRatesWidgetView snapshot={snapshot} />;
  }

  const config =
    (await loadOsWidgetConfig(widgetInfo.widgetId)) ?? defaultRatePairConfig;

  return (
    <CapitalRatePairWidgetView snapshot={snapshot} config={config} />
  );
}

export async function renderWidgetForTask(
  widgetName: string,
  widgetInfo: WidgetInfo
): Promise<WidgetRepresentation> {
  if (
    widgetName !== ANDROID_WIDGET_RATE_PAIR &&
    widgetName !== ANDROID_WIDGET_SAVED_RATES
  ) {
    return (
      <CapitalRatePairWidgetView
        snapshot={await ensureWidgetSnapshot()}
        config={defaultRatePairConfig}
      />
    );
  }
  return renderAndroidWidgetByName(widgetName, widgetInfo);
}
