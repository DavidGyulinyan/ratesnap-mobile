import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import CurrencyPicker from './CurrencyPicker';

interface SavedRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: number;
}

interface Data {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: {
    [key: string]: number;
  };
}

export default function CurrencyConverter() {
  const [amount, setAmount] = useState<string>('');
  const [convertedAmount, setConvertedAmount] = useState<string>('');
  const [currenciesData, setCurrenciesData] = useState<Data | null>(null);
  const [fromCurrency, setFromCurrency] = useState<string>('');
  const [toCurrency, setToCurrency] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [currencyList, setCurrencyList] = useState<string[]>([]);
  const [savedRates, setSavedRates] = useState<SavedRate[]>([]);
  const [showSavedRates, setShowSavedRates] = useState<boolean>(false);
  const [showFromPicker, setShowFromPicker] = useState<boolean>(false);
  const [showToPicker, setShowToPicker] = useState<boolean>(false);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const apiKey = process.env.EXPO_PUBLIC_API_KEY;

  useEffect(() => {
    const getExchangeData = async () => {
      try {
        console.log('Fetching from:', `${apiUrl}${apiKey}/latest/USD`);
        const response = await fetch(`${apiUrl}${apiKey}/latest/USD`);
        if (!response.ok) {
          throw new Error(`HTTP error: Status ${response.status} - ${response.statusText}`);
        }
        const data: Data = await response.json();
        console.log('API Response:', data);
        setCurrenciesData(data);

        const storedHistory = await AsyncStorage.getItem('currencyHistory');
        const history = storedHistory ? JSON.parse(storedHistory) : [];
        const initialFromCurrency = history[0]?.from || Object.keys(data.conversion_rates)[0];
        const initialToCurrency = history[0]?.to || Object.keys(data.conversion_rates)[4];

        setFromCurrency(initialFromCurrency);
        setToCurrency(initialToCurrency);
        setCurrencyList(Object.keys(data.conversion_rates));
        setLoading(false);
      } catch (error) {
        console.error('API Fetch Error:', error);
        Alert.alert('Error', `Failed to fetch exchange rates: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setLoading(false);
      }
    };

    getExchangeData();
  }, []);

  useEffect(() => {
    const loadSavedRates = async () => {
      const stored = await AsyncStorage.getItem('savedRates');
      if (stored) {
        setSavedRates(JSON.parse(stored));
      }
    };
    loadSavedRates();
  }, []);

  const handleSaveRate = async (): Promise<void> => {
    if (!fromCurrency || !toCurrency || !currenciesData) return;

    const fromRate = currenciesData.conversion_rates[fromCurrency];
    const toRate = currenciesData.conversion_rates[toCurrency];
    const rate = toRate / fromRate;

    const newRate: SavedRate = {
      id: `${fromCurrency}-${toCurrency}-${Date.now()}`,
      fromCurrency,
      toCurrency,
      rate,
      timestamp: Date.now(),
    };

    const updatedRates = [newRate, ...savedRates].slice(0, 10);
    setSavedRates(updatedRates);
    await AsyncStorage.setItem('savedRates', JSON.stringify(updatedRates));
  };

  const handleDeleteRate = async (id: string): Promise<void> => {
    const updatedRates = savedRates.filter((rate) => rate.id !== id);
    setSavedRates(updatedRates);
    await AsyncStorage.setItem('savedRates', JSON.stringify(updatedRates));
  };

  const handleSelectRate = (from: string, to: string): void => {
    setFromCurrency(from);
    setToCurrency(to);
    setShowSavedRates(false);
  };

  const handleSwap = (): void => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const updateHistory = async (from: string, to: string): Promise<void> => {
    const storedHistory = await AsyncStorage.getItem('currencyHistory');
    const history = storedHistory ? JSON.parse(storedHistory) : [];
    const newHistory = [
      { from, to },
      ...history.filter((entry: { from: string; to: string }) => entry.from !== from || entry.to !== to),
    ].slice(0, 5);
    await AsyncStorage.setItem('currencyHistory', JSON.stringify(newHistory));
  };

  useEffect(() => {
    if (fromCurrency && toCurrency) {
      updateHistory(fromCurrency, toCurrency);
    }
  }, [fromCurrency, toCurrency]);

  const handleConvert = useCallback((): void => {
    if (currenciesData && amount) {
      const fromRate = currenciesData.conversion_rates[fromCurrency];
      const toRate = currenciesData.conversion_rates[toCurrency];
      const convertedValue = (parseFloat(amount) / fromRate) * toRate;
      setConvertedAmount(convertedValue.toFixed(4));
    }
  }, [currenciesData, amount, fromCurrency, toCurrency]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const mergeHistoryWithList = (
    history: { from: string; to: string }[],
    list: string[]
  ): string[] => {
    const uniqueCurrencies = new Set();
    const mergedList: string[] = [];

    history.forEach((entry) => {
      if (!uniqueCurrencies.has(entry.from)) {
        uniqueCurrencies.add(entry.from);
        mergedList.push(entry.from);
      }
    });

    list.forEach((currency) => {
      if (!uniqueCurrencies.has(currency)) {
        uniqueCurrencies.add(currency);
        mergedList.push(currency);
      }
    });

    return mergedList;
  };

  const [history, setHistory] = useState<{ from: string; to: string }[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const stored = await AsyncStorage.getItem('currencyHistory');
      setHistory(stored ? JSON.parse(stored) : []);
    };
    loadHistory();
  }, []);

  const mergedCurrencyList = mergeHistoryWithList(history, currencyList);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Convert {fromCurrency} to {toCurrency}
      </ThemedText>

      <View style={styles.updateInfo}>
        <ThemedText style={styles.updateText}>Last update: {currenciesData?.time_last_update_utc}</ThemedText>
        <ThemedText style={styles.updateText}>Next update: {currenciesData?.time_next_update_utc}</ThemedText>
      </View>

      <View style={styles.converterBox}>
        <View style={styles.convertedAmountBox}>
          <ThemedText style={styles.convertedAmountText}>
            {parseFloat(convertedAmount) < 0
              ? 'Please enter a valid number'
              : `Converted Amount: ${convertedAmount}`}
          </ThemedText>
        </View>

        <TextInput
          style={styles.amountInput}
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <View style={styles.currencySelectors}>
          <TouchableOpacity style={styles.currencyButton} onPress={() => setShowFromPicker(true)}>
            <ThemedText style={styles.currencyButtonText}>From: {fromCurrency}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
            <ThemedText>⇄</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.currencyButton} onPress={() => setShowToPicker(true)}>
            <ThemedText style={styles.currencyButtonText}>To: {toCurrency}</ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveRate}>
          <ThemedText style={styles.saveButtonText}>Save This Rate</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.disclaimer}>
          This currency converter provides approximate exchange rates for general reference only.
        </ThemedText>
      </View>

      <View style={styles.savedRatesSection}>
        <View style={styles.savedRatesHeader}>
          <ThemedText type="subtitle" style={styles.savedRatesTitle}>Saved Rates ({savedRates.length})</ThemedText>
          {savedRates.length > 0 && (
            <TouchableOpacity onPress={() => setShowSavedRates(!showSavedRates)}>
              <ThemedText style={styles.showHideText}>{showSavedRates ? 'Hide' : 'Show'}</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {showSavedRates && (
          <View style={styles.savedRatesList}>
            {savedRates.map((rate) => (
              <TouchableOpacity
                key={rate.id}
                style={styles.savedRateItem}
                onPress={() => handleSelectRate(rate.fromCurrency, rate.toCurrency)}
              >
                <View style={styles.savedRateContent}>
                  <ThemedText style={styles.savedRateTitle}>
                    {rate.fromCurrency} → {rate.toCurrency}
                  </ThemedText>
                  <ThemedText style={{ color: '#000000' }}>Rate: {rate.rate.toFixed(4)}</ThemedText>
                  <ThemedText style={styles.savedRateDate}>
                    Saved: {new Date(rate.timestamp).toLocaleDateString()}
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={() => handleDeleteRate(rate.id)}>
                  <ThemedText style={styles.deleteButton}>🗑️</ThemedText>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <CurrencyPicker
        visible={showFromPicker}
        currencies={mergedCurrencyList}
        selectedCurrency={fromCurrency}
        onSelect={(currency) => setFromCurrency(currency)}
        onClose={() => setShowFromPicker(false)}
      />

      <CurrencyPicker
        visible={showToPicker}
        currencies={mergedCurrencyList}
        selectedCurrency={toCurrency}
        onSelect={(currency) => setToCurrency(currency)}
        onClose={() => setShowToPicker(false)}
      />
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const Footer = () => (
  <View style={styles.footer}>
    <ThemedText style={styles.footerText}>
      © 2025 RateSnap - Real-time Currency Converter
    </ThemedText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc', // Light gray background for better eye comfort
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937',
  },
  updateInfo: {
    marginBottom: 20,
    alignItems: 'center',
  },
  updateText: {
    color: '#1f2937',
  },
  converterBox: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  convertedAmountBox: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    borderWidth: 2,
    borderColor: '#bae6fd',
    marginBottom: 20,
    alignItems: 'center',
  },
  convertedAmountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    marginBottom: 20,
  },
  currencySelectors: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  currencyButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  currencyButtonText: {
    color: '#1f2937',
    fontWeight: '500',
  },
  swapButton: {
    padding: 15,
    marginHorizontal: 10,
    backgroundColor: '#2563eb',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#1f2937',
    fontStyle: 'italic',
  },
  savedRatesSection: {
    marginTop: 20,
    marginBottom: 20, // Add bottom margin to prevent overlap with footer
  },
  savedRatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  savedRatesList: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  savedRateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  savedRateContent: {
    flex: 1,
  },
  savedRateTitle: {
    fontWeight: '600',
    marginBottom: 5,
    color: '#000000',
  },
  savedRatesTitle: {
    color: '#1f2937',
  },
  showHideText: {
    color: '#1f2937',
  },
  savedRateDate: {
    fontSize: 12,
    color: '#1f2937',
  },
  deleteButton: {
    fontSize: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: 40, // Extra padding for safe area
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 12,
    color: '#1f2937',
    textAlign: 'center',
  },
});