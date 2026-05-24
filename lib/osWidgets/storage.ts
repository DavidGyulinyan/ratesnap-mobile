import {
  OS_WIDGET_CONFIG_PREFIX,
  OS_WIDGET_PRESETS_KEY,
  OS_WIDGET_SNAPSHOT_KEY,
} from "@/lib/osWidgets/constants";
import type {
  OsWidgetInstanceConfig,
  OsWidgetPreset,
  OsWidgetSnapshot,
} from "@/lib/osWidgets/types";
import { getAsyncStorage } from "@/lib/storage";

export async function loadOsWidgetSnapshot(): Promise<OsWidgetSnapshot | null> {
  try {
    const raw = await getAsyncStorage().getItem(OS_WIDGET_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OsWidgetSnapshot;
  } catch {
    return null;
  }
}

export async function saveOsWidgetSnapshot(snapshot: OsWidgetSnapshot): Promise<void> {
  await getAsyncStorage().setItem(
    OS_WIDGET_SNAPSHOT_KEY,
    JSON.stringify(snapshot)
  );
}

export async function loadOsWidgetConfig(
  widgetId: number
): Promise<OsWidgetInstanceConfig | null> {
  try {
    const raw = await getAsyncStorage().getItem(
      `${OS_WIDGET_CONFIG_PREFIX}${widgetId}`
    );
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
  await getAsyncStorage().setItem(
    `${OS_WIDGET_CONFIG_PREFIX}${widgetId}`,
    JSON.stringify(config)
  );
}

export async function removeOsWidgetConfig(widgetId: number): Promise<void> {
  await getAsyncStorage().removeItem(`${OS_WIDGET_CONFIG_PREFIX}${widgetId}`);
}

export async function loadOsWidgetPresets(): Promise<OsWidgetPreset[]> {
  try {
    const raw = await getAsyncStorage().getItem(OS_WIDGET_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as OsWidgetPreset[]) : [];
  } catch {
    return [];
  }
}

export async function saveOsWidgetPresets(presets: OsWidgetPreset[]): Promise<void> {
  await getAsyncStorage().setItem(
    OS_WIDGET_PRESETS_KEY,
    JSON.stringify(presets)
  );
}
