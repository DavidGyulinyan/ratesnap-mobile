import { Platform } from "react-native";
import Constants from "expo-constants";

/** OS home-screen widgets require a native dev/production build. */
export function isOsWidgetNativeSupported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

export function osWidgetBuildRequiredMessageKey(): string {
  if (isExpoGo()) return "osWidgets.requiresDevBuild";
  if (Platform.OS === "web") return "osWidgets.unsupportedPlatform";
  return "osWidgets.requiresDevBuild";
}
