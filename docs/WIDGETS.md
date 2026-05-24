# Home screen widgets (iOS + Android)

Capital uses the official **[expo-widgets](https://docs.expo.dev/versions/latest/sdk/widgets/)** library on iOS and **[react-native-android-widget](https://saleksovski.github.io/react-native-android-widget/)** on Android. Both require a **development build** (not Expo Go).

> **SDK note:** `expo-widgets` ships with Expo SDK **56+**. This repo currently runs Expo **54** with `expo-widgets` installed; for production iOS widgets, upgrade to SDK 56 (`npx expo install expo@^56`). Android widgets work on SDK 54 today.

## 1. Install dependencies

```bash
npx expo install expo-widgets @expo/ui react-native-android-widget
npm uninstall @bacons/apple-targets   # if present — replaced by expo-widgets
```

## 2. App config (`app.config.js`)

Already configured:

- **iOS:** `expo-widgets` plugin with App Group `group.com.davidgyulinyan.exratiomobile.widgets`
- **Android:** `react-native-android-widget` with `CapitalRatePair` and `CapitalSavedRates` providers
- **Entry:** `package.json` → `"main": "index.js"` registers Android task handler before `expo-router/entry`

Add your Apple Team ID for iOS release builds:

```js
ios: {
  appleTeamId: "YOUR_TEAM_ID",
  // ...
}
```

## 3. Prebuild & run

```bash
npx expo prebuild --clean
npx expo run:ios    # or: eas build --profile development --platform ios
npx expo run:android
```

## 4. Architecture

| Layer | Path | Role |
|-------|------|------|
| Shared bridge | `lib/osWidgets/bridge.ts` | `snapshotToWidgetProps()` |
| Sync | `lib/osWidgets/sync.ts` | `syncOsWidgetData()` → AsyncStorage + iOS snapshot + Android refresh |
| iOS UI | `widgets/ios/CapitalRatesWidget.tsx` | `createWidget` + `@expo/ui/swift-ui` |
| Android UI | `widgets/android/` + `widgets/runtime/` | Headless-safe layouts (no `@/` imports) |
| Setup screen | `app/home-widgets.tsx` | Pro: pick pair, sync, instructions |

### Data flow

1. App loads rates → `buildOsWidgetSnapshot()` in `lib/osWidgets/snapshot.ts`
2. `saveOsWidgetSnapshot()` writes JSON to AsyncStorage key `capitalOsWidgetSnapshotV1`
3. **iOS:** `CapitalRates.updateSnapshot(props)` via `expo-widgets`
4. **Android:** `requestWidgetUpdate()` reads the same snapshot from AsyncStorage in the widget task handler

## 5. Add widgets on device

**iOS:** Long-press home screen → **+** → **Capital** → **Capital Rates**  
**Android:** Long-press home screen → **Widgets** → **Capital — Rate** or **Capital — Saved rates**

Then open **Settings → Home screen widgets → Sync widget data** (Pro).

## 6. Files to touch when changing the widget

- Props shape: `lib/osWidgets/types.ts` → `CapitalRatesWidgetProps`
- iOS layout: `widgets/ios/CapitalRatesWidget.tsx`
- Android layout: `widgets/android/CapitalWidgetViews.tsx`
- Widget name in config must match `createWidget('CapitalRates', …)` and `IOS_WIDGET_NAME` in `lib/osWidgets/constants.ts`
