import { HStack, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

/** Keep in sync with `lib/osWidgets/types.ts` → `CapitalRatesWidgetProps`. */
export type CapitalRatesWidgetProps = {
  headline: string;
  headlineRate: string;
  updatedLabel: string;
  lines: { label: string; rate: string }[];
};

const MUTED = '#78716C';
const TEXT = '#1C1917';
const ACCENT = '#C2410C';

function CapitalRatesWidget(
  props: CapitalRatesWidgetProps,
  environment: WidgetEnvironment
) {
  'widget';

  const header = (
    <HStack>
      <Text modifiers={[font({ size: 12 }), foregroundStyle(MUTED)]}>Capital</Text>
      <Text modifiers={[font({ size: 11 }), foregroundStyle(MUTED)]}>
        {props.updatedLabel}
      </Text>
    </HStack>
  );

  if (environment.widgetFamily === 'systemMedium' && props.lines.length > 0) {
    return (
      <VStack>
        {header}
        {props.lines.map((line) => (
          <HStack key={line.label}>
            <Text modifiers={[font({ size: 13 }), foregroundStyle(TEXT)]}>
              {line.label}
            </Text>
            <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(ACCENT)]}>
              {line.rate}
            </Text>
          </HStack>
        ))}
      </VStack>
    );
  }

  return (
    <VStack>
      {header}
      <Text modifiers={[font({ size: 14 }), foregroundStyle(MUTED)]}>{props.headline}</Text>
      <Text modifiers={[font({ size: 28, weight: 'bold' }), foregroundStyle(ACCENT)]}>
        {props.headlineRate}
      </Text>
    </VStack>
  );
}

/** Name must match `widgets[].name` in app.config.js expo-widgets plugin. */
const CapitalRates = createWidget('CapitalRates', CapitalRatesWidget);

export default CapitalRates;
