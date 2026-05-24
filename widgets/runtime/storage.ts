import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OS_WIDGET_CONFIG_PREFIX,
  OS_WIDGET_SNAPSHOT_KEY,
} from './constants';
import type { OsWidgetInstanceConfig, OsWidgetSnapshot } from './types';

export async function loadOsWidgetSnapshot(): Promise<OsWidgetSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(OS_WIDGET_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OsWidgetSnapshot;
  } catch {
    return null;
  }
}

export async function loadOsWidgetConfig(
  widgetId: number
): Promise<OsWidgetInstanceConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(`${OS_WIDGET_CONFIG_PREFIX}${widgetId}`);
    if (!raw) return null;
    return JSON.parse(raw) as OsWidgetInstanceConfig;
  } catch {
    return null;
  }
}

export async function saveOsWidgetConfig(
  widgetId: number,
  config: OsWidgetInstanceConfig
): Promise<void> {
  await AsyncStorage.setItem(
    `${OS_WIDGET_CONFIG_PREFIX}${widgetId}`,
    JSON.stringify(config)
  );
}

export async function removeOsWidgetConfig(widgetId: number): Promise<void> {
  await AsyncStorage.removeItem(`${OS_WIDGET_CONFIG_PREFIX}${widgetId}`);
}
