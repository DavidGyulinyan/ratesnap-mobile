import { Text, TextInput } from "react-native";

/**
 * Caps how much system font-size accessibility settings can grow text.
 * Uncapped scaling (2–3× on iOS/Android) overflows fixed-height UI across the app.
 */
export const MAX_FONT_SIZE_MULTIPLIER = 1.35;

/** Line height that stays readable when font scaling is applied. */
export function scaledLineHeight(fontSize: number, ratio = 1.45): number {
  return Math.round(fontSize * ratio);
}

type ComponentWithDefaultProps = {
  defaultProps?: Record<string, unknown>;
};

/**
 * Apply once at startup so every `Text` / `TextInput` respects the cap.
 */
export function configureAccessibilityFontScaling(): void {
  const textDefaults = (Text as ComponentWithDefaultProps).defaultProps ?? {};
  (Text as ComponentWithDefaultProps).defaultProps = {
    ...textDefaults,
    allowFontScaling: true,
    maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
  };

  const inputDefaults = (TextInput as ComponentWithDefaultProps).defaultProps ?? {};
  (TextInput as ComponentWithDefaultProps).defaultProps = {
    ...inputDefaults,
    allowFontScaling: true,
    maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
    /** Keep iOS/Android copy · paste · select on long-press for every TextInput. */
    contextMenuHidden: false,
  };
}

configureAccessibilityFontScaling();
