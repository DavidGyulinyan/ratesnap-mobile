'use no memo';

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { formatWidgetRate } from '../runtime/snapshot';
import type { OsWidgetInstanceConfig, OsWidgetSnapshot } from '../runtime/types';

const COLORS = {
  bg: '#FAF6F2',
  text: '#1C1917',
  muted: '#78716C',
  accent: '#C2410C',
};

function resolvePairRate(
  snapshot: OsWidgetSnapshot,
  config: OsWidgetInstanceConfig
) {
  const from = config.fromCurrency?.toUpperCase() ?? 'USD';
  const to = config.toCurrency?.toUpperCase() ?? 'AMD';
  const match =
    snapshot.savedRates.find((p) => p.from === from && p.to === to) ??
    snapshot.pairs.find((p) => p.from === from && p.to === to);
  return { from, to, rate: match?.rate ?? 0 };
}

export function CapitalRatePairWidgetView(props: {
  snapshot: OsWidgetSnapshot;
  config: OsWidgetInstanceConfig;
}) {
  const { from, to, rate } = resolvePairRate(props.snapshot, props.config);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: COLORS.bg,
        borderRadius: 20,
        padding: 16,
        justifyContent: 'space-between',
      }}
      accessibilityLabel={`${from} to ${to} rate`}
    >
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TextWidget text="Capital" style={{ fontSize: 12, color: COLORS.muted }} />
        <TextWidget
          text={props.snapshot.updatedLabel}
          style={{ fontSize: 11, color: COLORS.muted }}
        />
      </FlexWidget>
      <FlexWidget>
        <TextWidget
          text={`${from} → ${to}`}
          style={{ fontSize: 14, color: COLORS.muted, marginBottom: 4 }}
        />
        <TextWidget
          text={formatWidgetRate(rate)}
          style={{ fontSize: 28, color: COLORS.accent }}
        />
      </FlexWidget>
      <TextWidget
        text="Tap to open converter"
        style={{ fontSize: 11, color: COLORS.muted }}
      />
    </FlexWidget>
  );
}

export function CapitalSavedRatesWidgetView(props: { snapshot: OsWidgetSnapshot }) {
  const lines = (props.snapshot.savedRates.length
    ? props.snapshot.savedRates
    : props.snapshot.pairs
  ).slice(0, 4);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: COLORS.bg,
        borderRadius: 20,
        padding: 16,
        justifyContent: 'flex-start',
      }}
      accessibilityLabel="Saved exchange rates"
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <TextWidget text="Capital" style={{ fontSize: 12, color: COLORS.muted }} />
        <TextWidget
          text={props.snapshot.updatedLabel}
          style={{ fontSize: 11, color: COLORS.muted }}
        />
      </FlexWidget>
      {lines.length === 0 ? (
        <TextWidget
          text="Add saved rates in the app"
          style={{ fontSize: 14, color: COLORS.text }}
        />
      ) : (
        lines.map((line, index) => (
          <FlexWidget
            key={`${line.from}-${line.to}-${index}`}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <TextWidget
              text={`${line.from} → ${line.to}`}
              style={{ fontSize: 13, color: COLORS.text }}
            />
            <TextWidget
              text={formatWidgetRate(line.rate)}
              style={{ fontSize: 13, color: COLORS.accent }}
            />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
