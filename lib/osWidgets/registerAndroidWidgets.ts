import { NativeModules, Platform } from "react-native";
import { hasOsWidgetNativeModule } from "@/lib/osWidgets/platform";

let registered = false;

/**
 * Register Android widget handlers after the React tree is up.
 * Calling this from index.js can crash some installs at cold start.
 */
export function registerAndroidWidgetsOnce(): void {
  if (registered || Platform.OS !== "android" || !hasOsWidgetNativeModule()) {
    return;
  }
  registered = true;

  try {
    if (NativeModules.AndroidWidget == null) return;

    const {
      registerWidgetConfigurationScreen,
      registerWidgetTaskHandler,
    } = require("react-native-android-widget");
    const { widgetTaskHandler } = require("@/widgets/widgetTaskHandler");
    const OsWidgetConfigurationScreen =
      require("@/widgets/OsWidgetConfigurationScreen").default;

    registerWidgetTaskHandler(widgetTaskHandler);
    registerWidgetConfigurationScreen(OsWidgetConfigurationScreen);
  } catch (error) {
    registered = false;
    if (__DEV__) {
      console.warn("[widgets] deferred registration failed:", error);
    }
  }
}
