import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import CurrencyFlag from '@/components/CurrencyFlag';

interface CurrencyConverterProps {
  widgetId?: string;
  initialAmount?: number;
  initialFromCurrency?: string;
  initialToCurrency?: string;
  decimalPlaces?: number;
  onWidgetChange?: (props: Record<string, any>) => void;
}

// Currency data interface matching the existing API
interface ExchangeData {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
  time_last_update_utc: string;
  time_next_update_utc: string;
}

// Recent pair interface for quick access
interface RecentPair {
  from: string;
  to: string;
  lastUsed: number;
}

export function CurrencyConverter({
  widgetId,
  initialAmount = 100,
  initialFromCurrency = 'USD',
  initialToCurrency = 'EUR',
  decimalPlaces = 4,
  onWidgetChange,
}: CurrencyConverterProps) {
  const [amount, setAmount] = useState<string>(initialAmount.toString());
  const [convertedAmount, setConvertedAmount] = useState<string>('0.00');
  const [fromCurrency, setFromCurrency] = useState<string>(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState<string>(initialToCurrency);
  const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
  const [recentPairs, setRecentPairs] = useState<RecentPair[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const apiKey = process.env.EXPO_PUBLIC_API_KEY;

  // Common currencies for quick access
  const commonCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
    'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY',
    'RUB', 'INR', 'BRL', 'ZAR', 'AED', 'AMD'
  ];

  // Fetch exchange rates
  const fetchExchangeRates = useCallback(async () => {
    try {
      setLoading(true);
      
      // Create fallback exchange rates
      const fallbackRates: Record<string, number> = {
        USD: 1.00, EUR: 0.85, GBP: 0.73, JPY: 110.0, CAD: 1.25,
        AUD: 1.35, CHF: 0.92, CNY: 6.45, SEK: 8.6, NZD: 1.4,
        MXN: 20.0, SGD: 1.35, HKD: 7.8, NOK: 8.5, KRW: 1180.0,
        TRY: 8.3, RUB: 75.0, INR: 74.5, BRL: 5.2, ZAR: 14.8,
        AED: 3.67, AMD: 382.0, QAR: 3.64, OMR: 0.38
      };

      const mockExchangeData: ExchangeData = {
        result: 'success',
        base_code: 'USD',
        conversion_rates: fallbackRates,
        time_last_update_utc: new Date().toUTCString(),
        time_next_update_utc: new Date(Date.now() + 3600000).toUTCString(),
      };

      // Try to fetch real rates from Polygon.io for major pairs
      if (apiUrl && apiKey) {
        try {
          const currencyToFetch = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
          const fetchPromises = currencyToFetch.map(async (currency) => {
            try {
              const response = await fetch(
                `${apiUrl}conversion/USD/${currency}?apiKey=${apiKey}`
              );
              if (response.ok) {
                const data = await response.json();
                return { currency, rate: data.data?.conversion_rate || fallbackRates[currency] };
              }
            } catch (error) {
              console.log(`Failed to fetch ${currency} rate:`, error);
            }
            return { currency, rate: fallbackRates[currency] };
          });

          const results = await Promise.all(fetchPromises);
          results.forEach(({ currency, rate }) => {
            mockExchangeData.conversion_rates[currency] = rate;
          });
        } catch (error) {
          console.log('Polygon.io API fetch failed, using fallback rates:', error);
        }
      }

      setExchangeData(mockExchangeData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      setLoading(false);
    }
  }, [apiUrl, apiKey]);

  // Load recent pairs from storage
  const loadRecentPairs = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('currency_converter_recent_pairs');
      if (stored) {
        setRecentPairs(JSON.parse(stored));
      } else {
        // Add default recent pairs
        const defaults: RecentPair[] = [
          { from: 'USD', to: 'EUR', lastUsed: Date.now() - 86400000 },
          { from: 'USD', to: 'GBP', lastUsed: Date.now() - 172800000 },
          { from: 'EUR', to: 'USD', lastUsed: Date.now() - 259200000 },
        ];
        setRecentPairs(defaults);
        await AsyncStorage.setItem('currency_converter_recent_pairs', JSON.stringify(defaults));
      }
    } catch (error) {
      console.error('Failed to load recent pairs:', error);
    }
  }, []);

  // Save recent pair
  const saveRecentPair = useCallback(async (from: string, to: string) => {
    try {
      const newPair: RecentPair = { from, to, lastUsed: Date.now() };
      const updatedPairs = [
        newPair,
        ...recentPairs.filter(pair => !(pair.from === from && pair.to === to))
      ].slice(0, 5); // Keep only 5 most recent
      
      setRecentPairs(updatedPairs);
      await AsyncStorage.setItem('currency_converter_recent_pairs', JSON.stringify(updatedPairs));
    } catch (error) {
      console.error('Failed to save recent pair:', error);
    }
  }, [recentPairs]);

  // Convert currency
  const convertCurrency = useCallback(() => {
    if (!exchangeData || !amount || parseFloat(amount) <= 0) {
      setConvertedAmount('0.00');
      return;
    }

    const fromRate = exchangeData.conversion_rates[fromCurrency];
    const toRate = exchangeData.conversion_rates[toCurrency];

    if (!fromRate || !toRate) {
      setConvertedAmount('0.00');
      return;
    }

    const convertedValue = (parseFloat(amount) / fromRate) * toRate;
    setConvertedAmount(convertedValue.toFixed(decimalPlaces));

    // Save the pair as recently used
    saveRecentPair(fromCurrency, toCurrency);
  }, [exchangeData, amount, fromCurrency, toCurrency, decimalPlaces, saveRecentPair]);

  // Handle amount change
  const handleAmountChange = (newAmount: string) => {
    // Allow only numeric input with decimal
    const numericValue = newAmount.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    
    if (parts.length > 2) return; // Prevent multiple decimal points
    if (parts[1] && parts[1].length > 6) return; // Limit decimal places
    
    setAmount(numericValue);
    onWidgetChange?.({
      initialAmount: parseFloat(numericValue) || 0,
    });
  };

  // Handle currency change
  const handleCurrencyChange = (type: 'from' | 'to', currency: string) => {
    if (type === 'from') {
      setFromCurrency(currency);
      onWidgetChange?.({
        initialFromCurrency: currency,
      });
    } else {
      setToCurrency(currency);
      onWidgetChange?.({
        initialToCurrency: currency,
      });
    }
  };

  // Handle swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    onWidgetChange?.({
      initialFromCurrency: toCurrency,
      initialToCurrency: fromCurrency,
    });
  };

  // Handle recent pair selection
  const handleRecentPairSelect = (pair: RecentPair) => {
    setFromCurrency(pair.from);
    setToCurrency(pair.to);
    onWidgetChange?.({
      initialFromCurrency: pair.from,
      initialToCurrency: pair.to,
    });
  };

  // Initialize
  useEffect(() => {
    fetchExchangeRates();
    loadRecentPairs();
  }, [fetchExchangeRates, loadRecentPairs]);

  // Recalculate when data changes
  useEffect(() => {
    convertCurrency();
  }, [convertCurrency]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading rates...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Widget Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>💱 Currency Converter</ThemedText>
        {exchangeData && (
          <ThemedText style={styles.updateInfo}>
            Updated: {new Date(exchangeData.time_last_update_utc).toLocaleTimeString()}
          </ThemedText>
        )}
      </View>

      {/* Amount Input */}
      <View style={styles.amountSection}>
        <TextInput
          style={styles.amountInput}
          placeholder="Amount"
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
        />
      </View>

      {/* Currency Selection */}
      <View style={styles.currencySection}>
        {/* From Currency */}
        <TouchableOpacity 
          style={styles.currencySelector}
          onPress={() => {
            // Show currency picker modal - simplified for demo
            Alert.alert(
              'Select Currency',
              'Choose from: ' + commonCurrencies.join(', '),
              [
                ...commonCurrencies.map(currency => ({
                  text: `${currency} ${currency === fromCurrency ? '✓' : ''}`,
                  onPress: () => handleCurrencyChange('from', currency),
                })),
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <View style={styles.currencyDisplay}>
            <CurrencyFlag currency={fromCurrency} size={20} />
            <ThemedText style={styles.currencyText}>{fromCurrency}</ThemedText>
          </View>
        </TouchableOpacity>

        {/* Swap Button */}
        <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
          <ThemedText style={styles.swapButtonText}>⇄</ThemedText>
        </TouchableOpacity>

        {/* To Currency */}
        <TouchableOpacity 
          style={styles.currencySelector}
          onPress={() => {
            // Show currency picker modal
            Alert.alert(
              'Select Currency',
              'Choose from: ' + commonCurrencies.join(', '),
              [
                ...commonCurrencies.map(currency => ({
                  text: `${currency} ${currency === toCurrency ? '✓' : ''}`,
                  onPress: () => handleCurrencyChange('to', currency),
                })),
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <View style={styles.currencyDisplay}>
            <CurrencyFlag currency={toCurrency} size={20} />
            <ThemedText style={styles.currencyText}>{toCurrency}</ThemedText>
          </View>
        </TouchableOpacity>
      </View>

      {/* Converted Amount */}
      <View style={styles.resultSection}>
        <View style={styles.resultDisplay}>
          <ThemedText style={styles.resultLabel}>Converted:</ThemedText>
          <ThemedText style={styles.resultAmount}>
            {convertedAmount} {toCurrency}
          </ThemedText>
        </View>
      </View>

      {/* Recent Pairs */}
      {recentPairs.length > 0 && (
        <View style={styles.recentSection}>
          <ThemedText style={styles.recentTitle}>Recent Pairs:</ThemedText>
          <View style={styles.recentPairs}>
            {recentPairs.slice(0, 3).map((pair, index) => (
              <TouchableOpacity
                key={`${pair.from}-${pair.to}`}
                style={styles.recentPair}
                onPress={() => handleRecentPairSelect(pair)}
              >
                <ThemedText style={styles.recentPairText}>
                  {pair.from} → {pair.to}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Rate Info */}
      {exchangeData && (
        <View style={styles.rateInfo}>
          <ThemedText style={styles.rateText}>
            1 {fromCurrency} = {(exchangeData.conversion_rates[toCurrency] / exchangeData.conversion_rates[fromCurrency]).toFixed(decimalPlaces)} {toCurrency}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  updateInfo: {
    fontSize: 12,
    color: '#666',
  },
  amountSection: {
    marginBottom: 16,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  currencySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  currencySelector: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultSection: {
    marginBottom: 16,
  },
  resultDisplay: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#e6f3ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cce7ff',
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  resultAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  recentSection: {
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  recentPairs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentPair: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  recentPairText: {
    fontSize: 12,
    color: '#007AFF',
  },
  rateInfo: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  rateText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});