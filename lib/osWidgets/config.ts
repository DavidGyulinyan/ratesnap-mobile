/**
 * OS home-screen widgets are opt-in. Set EXPO_PUBLIC_ENABLE_OS_WIDGETS=1 only when
 * building/testing with widget native plugins (eas build / expo run). Default off
 * avoids startup crashes on installs that bundled widget native code too early.
 */
export function isOsWidgetsEnabled(): boolean {
  return process.env.EXPO_PUBLIC_ENABLE_OS_WIDGETS === "1";
}
