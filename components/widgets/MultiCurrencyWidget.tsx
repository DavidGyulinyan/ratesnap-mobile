import React, { useState, useEffect, useCallback } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "../themed-view";
import { ThemedText } from "../themed-text";
import CurrencyFlag from "../CurrencyFlag";
import CurrencyPicker from "../CurrencyPicker";
import BaseWidget from "./BaseWidget";

interface MultiCurrencyWidgetProps {
  widgetId: string;
  onRemove: () => void;
  onToggle?: () => void;
  isEditMode?: boolean;
  onNavigateToConverter?: () => void;
}

interface Conversion {
  currency: string;
  amount: number;
  rate: number;
}

interface Data {
  result: string;
  base_code: string;
  conversion_rates: { [key: string]: number };
}

export default function MultiCurrencyWidget({
  widgetId,
  onRemove,
  onToggle,
  isEditMode = false,
  onNavigateToConverter
}: MultiCurrencyWidgetProps) {
  const [amount, setAmount] = useState<string>("100");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [currenciesData, setCurrenciesData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  // Popular currencies to show
  const popularCurrencies = [
    'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD', 'MXN',
    'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR', 'AED'
  ];

  const CURRENCYFREAKS_API_URL = "https://api.currencyfreaks.com/latest";
  const CURRENCYFREAKS_API_KEY = "870b638bf16a4be185dff4dac89e557a";

  useEffect(() => {
    const getExchangeData = async () => {
      try {
        // Check for cached data first
        const cachedData = await AsyncStorage.getItem('cachedExchangeRates');
        const cacheTimestamp = await AsyncStorage.getItem('cachedRatesTimestamp');
        const now = Date.now();
        const CACHE_DURATION = 3600000; // 1 hour

        if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
          setCurrenciesData(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const response = await fetch(
          `${CURRENCYFREAKS_API_URL}?apikey=${CURRENCYFREAKS_API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const apiData = await response.json();
        
        if (!apiData.rates || !apiData.base) {
          throw new Error("Invalid API response structure");
        }
        
        const transformedData: Data = {
          result: "success",
          base_code: apiData.base || "USD",
          conversion_rates: apiData.rates || { USD: 1 },
        };

        if (!transformedData.conversion_rates["USD"]) {
          transformedData.conversion_rates["USD"] = 1;
        }

        // Cache the data
        await AsyncStorage.setItem('cachedExchangeRates', JSON.stringify(transformedData));
        await AsyncStorage.setItem('cachedRatesTimestamp', now.toString());

        setCurrenciesData(transformedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        
        // Try to use cached data even if expired
        const cachedData = await AsyncStorage.getItem('cachedExchangeRates');
        if (cachedData) {
          setCurrenciesData(JSON.parse(cachedData));
        }
        setLoading(false);
      }
    };

    getExchangeData();
  }, []);

  const calculateConversions = useCallback(() => {
    if (!currenciesData || !amount || parseFloat(amount) <= 0) {
      setConversions([]);
      return;
    }

    const fromRate = currenciesData.conversion_rates[fromCurrency];
    if (!fromRate) {
      setConversions([]);
      return;
    }

    const inputAmount = parseFloat(amount);
    const conversionResults: Conversion[] = [];

    popularCurrencies.forEach(currency => {
      if (currenciesData.conversion_rates[currency]) {
        const toRate = currenciesData.conversion_rates[currency];
        const convertedAmount = (inputAmount / fromRate) * toRate;
        conversionResults.push({
          currency,
          amount: convertedAmount,
          rate: toRate / fromRate
        });
      }
    });

    setConversions(conversionResults);
  }, [currenciesData, amount, fromCurrency, popularCurrencies]);

  useEffect(() => {
    calculateConversions();
  }, [calculateConversions]);

  const handleCurrencySelect = (currency: string) => {
    setFromCurrency(currency);
    setShowCurrencyPicker(false);
  };

  // Available currencies for the picker
  const availableCurrencies = currenciesData ?
    Object.keys(currenciesData.conversion_rates).sort() :
    [...popularCurrencies, 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

  const renderConversion = ({ item }: { item: Conversion }) => (
    <View style={styles.conversionItem}>
      <View style={styles.conversionLeft}>
        <CurrencyFlag currency={item.currency} size={16} />
        <ThemedText style={styles.conversionCurrency}>{item.currency}</ThemedText>
      </View>
      <View style={styles.conversionRight}>
        <ThemedText style={styles.conversionAmount}>
          {item.amount.toFixed(2)}
        </ThemedText>
        <ThemedText style={styles.conversionRate}>
          Rate: {item.rate.toFixed(4)}
        </ThemedText>
      </View>
    </View>
  );

  if (loading) {
    return (
      <BaseWidget
        widgetId={widgetId}
        title="Multi-Currency"
        onRemove={onRemove}
        onToggle={onToggle}
        isEditMode={isEditMode}
      >
        <ThemedText>Loading rates...</ThemedText>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget
      widgetId={widgetId}
      title="Multi-Currency"
      onRemove={onRemove}
      onToggle={onToggle}
      isEditMode={isEditMode}
    >
      <View style={styles.container}>
        {/* Amount and Currency Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.amountInput, { flex: 2 }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Amount"
          />
          <TouchableOpacity
            style={[styles.currencyInput, { flex: 1 }]}
            onPress={() => setShowCurrencyPicker(true)}
          >
            <CurrencyFlag currency={fromCurrency} size={16} />
            <ThemedText style={styles.currencyInputText}>{fromCurrency}</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        {conversions.length > 0 && (
          <View style={styles.summary}>
            <ThemedText style={styles.summaryText}>
              {amount} {fromCurrency} converts to {conversions.length} currencies
            </ThemedText>
          </View>
        )}

        {/* Conversions List */}
        <View style={styles.conversionsContainer}>
          <FlatList
            data={conversions.slice(0, 5)} // Show only first 5 in widget
            renderItem={renderConversion}
            keyExtractor={(item) => item.currency}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
          
          {conversions.length > 5 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={onNavigateToConverter}
            >
              <ThemedText style={styles.showMoreButtonText}>
                Show all {conversions.length} conversions →
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {conversions.length === 0 && amount && parseFloat(amount) > 0 && (
          <View style={styles.noResults}>
            <ThemedText style={styles.noResultsText}>
              No conversions available
            </ThemedText>
          </View>
        )}
      </View>

      {/* Currency Picker Modal */}
      <CurrencyPicker
        visible={showCurrencyPicker}
        currencies={availableCurrencies}
        selectedCurrency={fromCurrency}
        onSelect={handleCurrencySelect}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </BaseWidget>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f8fafc',
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f8fafc',
  },
  currencyInputText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#e0f2fe',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  summaryText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  conversionsContainer: {
    maxHeight: 200,
  },
  conversionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  conversionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversionCurrency: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  conversionRight: {
    alignItems: 'flex-end',
  },
  conversionAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  conversionRate: {
    fontSize: 10,
    color: '#6b7280',
  },
  showMoreButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  showMoreButtonText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    color: '#6b7280',
    fontSize: 14,
  },
});