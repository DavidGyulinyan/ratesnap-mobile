// @ts-check
const base = require("./app.json").expo;

const APP_GROUP = "group.com.davidgyulinyan.exratiomobile.widgets";
const IOS_WIDGET_BUNDLE_ID = "com.davidgyulinyan.exratiomobile.widgets";

const enableOsWidgets =
  process.env.EXPO_PUBLIC_ENABLE_OS_WIDGETS === "1" ||
  process.env.EAS_BUILD_ENABLE_WIDGETS === "1";

/** Dev-only — store/preview builds should not ship expo-dev-client (startup issues on device). */
const isDevClientBuild =
  process.env.EAS_BUILD_PROFILE === "development" ||
  process.env.EXPO_PUBLIC_USE_DEV_CLIENT === "1";

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...base,
  ...config,
  ios: {
    ...base.ios,
    ...config.ios,
    ...(enableOsWidgets
      ? {
          entitlements: {
            ...(config.ios?.entitlements ?? {}),
            "com.apple.security.application-groups": [APP_GROUP],
          },
        }
      : {}),
  },
  plugins: [
    ...(base.plugins ?? []),
    ...(isDevClientBuild ? ["expo-dev-client"] : []),
    ...(enableOsWidgets
      ? [
          [
            "expo-widgets",
            {
              bundleIdentifier: IOS_WIDGET_BUNDLE_ID,
              groupIdentifier: APP_GROUP,
              widgets: [
                {
                  name: "CapitalRates",
                  displayName: "Capital Rates",
                  description: "Live FX rates and saved pairs at a glance.",
                  contentMarginsDisabled: false,
                  supportedFamilies: ["systemSmall", "systemMedium"],
                },
              ],
            },
          ],
          [
            "react-native-android-widget",
            {
              widgets: [
                {
                  name: "CapitalRatePair",
                  label: "Capital rates",
                  description: "Live rate for a currency pair you choose.",
                  minWidth: "180dp",
                  minHeight: "110dp",
                  targetCellWidth: 2,
                  targetCellHeight: 2,
                  widgetFeatures: "reconfigurable",
                  updatePeriodMillis: 1800000,
                },
                {
                  name: "CapitalSavedRates",
                  label: "Capital saved",
                  description: "Your saved currency pairs at a glance.",
                  minWidth: "320dp",
                  minHeight: "120dp",
                  targetCellWidth: 4,
                  targetCellHeight: 2,
                  widgetFeatures: "reconfigurable|configuration_optional",
                  updatePeriodMillis: 1800000,
                },
              ],
            },
          ],
        ]
      : []),
  ],
});
