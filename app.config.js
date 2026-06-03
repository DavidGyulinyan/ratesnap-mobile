// @ts-check
const base = require("./app.json").expo;

/** Dev-only — store/preview builds should not ship expo-dev-client (startup issues on device). */
const isDevClientBuild =
  process.env.EAS_BUILD_PROFILE === "development" ||
  process.env.EXPO_PUBLIC_USE_DEV_CLIENT === "1";

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...base,
  ...config,
  plugins: [
    ...(base.plugins ?? []),
    ...(isDevClientBuild ? ["expo-dev-client"] : []),
  ],
});
