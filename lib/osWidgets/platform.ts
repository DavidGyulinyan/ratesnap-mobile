import Constants from "expo-constants";
import { Platform } from "react-native";

/** OS home-screen widgets require a native dev/production build. */
export function isOsWidgetNativeSupported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/** Running inside the Expo Go store app — widgets are not available. */
export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

/**
 * True when the app is not Expo Go (dev client, local run, or store build).
 * Widgets still only appear if that binary was built after `expo prebuild` with widget plugins.
 */
export function isHomeScreenWidgetsBuild(): boolean {
  if (!isOsWidgetNativeSupported()) return false;
  return !isExpoGo();
}

export function osWidgetBuildRequiredMessageKey(): "osWidgets.requiresExpoGo" | "osWidgets.requiresDevBuild" | "osWidgets.unsupportedPlatform" {
  if (!isOsWidgetNativeSupported()) return "osWidgets.unsupportedPlatform";
  if (isExpoGo()) return "osWidgets.requiresExpoGo";
  return "osWidgets.requiresDevBuild";
}
