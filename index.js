if (typeof globalThis !== 'undefined') {
  try {
    const { Platform } = require('react-native');
    if (Platform.OS === 'android') {
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
  } catch {
    /* widgets unavailable in Expo Go */
  }
}

require('expo-router/entry');
