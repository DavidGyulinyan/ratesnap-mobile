import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

/** OS home-screen widgets require a native dev/production build. */
export function isOsWidgetNativeSupported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/** Running inside the Expo Go store app — widgets are not available. */
export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

/**
 * True when react-native-android-widget native code is linked in this APK/IPA.
 * OTA updates (eas update) cannot add this — only a new eas build / expo run can.
 */
export function hasOsWidgetNativeModule(): boolean {
  if (Platform.OS === "android") {
    return NativeModules.AndroidWidget != null;
  }
  if (Platform.OS === "ios") {
    // iOS widget extension is separate; expo-widgets loads only in native builds.
    return !isExpoGo();
  }
  return false;
}

/**
 * True when the app is not Expo Go (dev client, local run, or store build).
 */
export function isHomeScreenWidgetsBuild(): boolean {
  if (!isOsWidgetNativeSupported()) return false;
  return !isExpoGo();
}

export function osWidgetsReadyOnDevice(): boolean {
  return isHomeScreenWidgetsBuild() && hasOsWidgetNativeModule();
}

export function osWidgetBuildRequiredMessageKey():
  | "osWidgets.requiresExpoGo"
  | "osWidgets.requiresNativeRebuild"
  | "osWidgets.requiresDevBuild"
  | "osWidgets.unsupportedPlatform" {
  if (!isOsWidgetNativeSupported()) return "osWidgets.unsupportedPlatform";
  if (isExpoGo()) return "osWidgets.requiresExpoGo";
  if (!hasOsWidgetNativeModule()) return "osWidgets.requiresNativeRebuild";
  return "osWidgets.requiresDevBuild";
}
