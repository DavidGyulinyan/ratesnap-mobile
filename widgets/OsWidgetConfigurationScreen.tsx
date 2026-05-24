import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { WidgetConfigurationScreenProps } from 'react-native-android-widget';
import { ANDROID_WIDGET_SAVED_RATES } from './runtime/constants';
import { saveOsWidgetConfig } from './runtime/storage';
import type { OsWidgetInstanceConfig } from './runtime/types';
import { renderAndroidWidgetByName } from './renderAndroidWidget';

const CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'AMD',
  'RUB',
  'GEL',
  'TRY',
  'AED',
  'CHF',
  'CAD',
];

function OsWidgetConfigurationScreen({
  widgetInfo,
  renderWidget,
  setResult,
}: WidgetConfigurationScreenProps) {
  const isSavedRates = widgetInfo.widgetName === ANDROID_WIDGET_SAVED_RATES;
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('AMD');

  const config = useMemo((): OsWidgetInstanceConfig => {
    if (isSavedRates) return { kind: 'saved_rates' };
    return {
      kind: 'rate_pair',
      fromCurrency,
      toCurrency,
    };
  }, [fromCurrency, isSavedRates, toCurrency]);

  const refreshPreview = useCallback(async () => {
    const tree = await renderAndroidWidgetByName(widgetInfo.widgetName, widgetInfo);
    renderWidget(tree);
  }, [renderWidget, widgetInfo]);

  useEffect(() => {
    void refreshPreview();
  }, [refreshPreview, fromCurrency, toCurrency]);

  const onConfirm = async () => {
    await saveOsWidgetConfig(widgetInfo.widgetId, config);
    await refreshPreview();
    setResult('ok');
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Widget setup</Text>
      <Text style={styles.subtitle}>
        {isSavedRates
          ? 'This widget shows your saved rates from Capital.'
          : 'Choose the currency pair for this widget.'}
      </Text>

      {!isSavedRates ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
            <View style={styles.row}>
              {CURRENCIES.map((code) => (
                <Pressable
                  key={`from-${code}`}
                  onPress={() => setFromCurrency(code)}
                  style={[styles.chip, fromCurrency === code && styles.chipActive]}
                >
                  <Text style={fromCurrency === code ? styles.chipTextActive : styles.chipText}>
                    {code}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
            <View style={styles.row}>
              {CURRENCIES.map((code) => (
                <Pressable
                  key={`to-${code}`}
                  onPress={() => setToCurrency(code)}
                  style={[styles.chip, toCurrency === code && styles.chipActive]}
                >
                  <Text style={toCurrency === code ? styles.chipTextActive : styles.chipText}>
                    {code}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={() => setResult('cancel')} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={() => void onConfirm()} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>Add widget</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default OsWidgetConfigurationScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
    paddingTop: 24,
    backgroundColor: '#FAF6F2',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1917',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#78716C',
    marginBottom: 16,
  },
  rowScroll: { marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    borderColor: '#C2410C',
    backgroundColor: '#FEF3EB',
  },
  chipText: { color: '#1C1917' },
  chipTextActive: { color: '#C2410C', fontWeight: '600' },
  actions: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
  },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#C2410C',
  },
  primaryText: { color: '#FFFFFF', fontWeight: '600' },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#FFFFFF',
  },
  secondaryText: { color: '#78716C' },
});
