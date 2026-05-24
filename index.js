/**
 * Entry point — register Android home-screen widgets only when native code exists.
 * OTA updates (eas update) cannot add the widget native module; calling register*
 * without it can crash the app immediately on launch.
 */
if (typeof globalThis !== 'undefined') {
  try {
    const { NativeModules, Platform } = require('react-native');
    if (Platform.OS === 'android' && NativeModules.AndroidWidget != null) {
      const {
        registerWidgetConfigurationScreen,
        registerWidgetTaskHandler,
      } = require('react-native-android-widget');
      const { widgetTaskHandler } = require('./widgets/widgetTaskHandler');
      const OsWidgetConfigurationScreen =
        require('./widgets/OsWidgetConfigurationScreen').default;
      registerWidgetTaskHandler(widgetTaskHandler);
      registerWidgetConfigurationScreen(OsWidgetConfigurationScreen);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[widgets] Android widget registration skipped:', error);
    }
  }
}

require('expo-router/entry');
