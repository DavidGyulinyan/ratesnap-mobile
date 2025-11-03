import React, { useState, useEffect, useCallback } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "../themed-view";
import { ThemedText } from "../themed-text";
import CurrencyFlag from "../CurrencyFlag";
import BaseWidget from "./BaseWidget";

interface QuickConverterWidgetProps {
  widgetId: string;
  onRemove: () => void;
  onToggle?: () => void;
  isEditMode?: boolean;
  onNavigateToConverter?: () => void;
}

interface Data {
  result: string;
  base_code: string;
  conversion_rates: { [key: string]: number };
}

export default function QuickConverterWidget({
  widgetId,
  onRemove,
  onToggle,
  isEditMode = false,
  onNavigateToConverter
}: QuickConverterWidgetProps) {
  const [amount, setAmount] = useState<string>("100");
  const [convertedAmount, setConvertedAmount] = useState<string>("");
  const [currenciesData, setCurrenciesData] = useState<Data | null>(null);
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("EUR");
  const [loading, setLoading] = useState<boolean>(true);

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
          console.log("Using cached exchange rates");
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
        console.log("Successfully fetched fresh exchange rates");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        
        // Try to use cached data even if expired
        const cachedData = await AsyncStorage.getItem('cachedExchangeRates');
        if (cachedData) {
          setCurrenciesData(JSON.parse(cachedData));
          console.log("Using expired cached data due to error");
        } else {
          Alert.alert(
            "Error",
            "Failed to fetch exchange rates. Please check your internet connection."
          );
        }
        setLoading(false);
      }
    };

    getExchangeData();
  }, []);

  const handleConvert = useCallback(() => {
    if (currenciesData && amount && parseFloat(amount) > 0) {
      const fromRate = currenciesData.conversion_rates[fromCurrency];
      const toRate = currenciesData.conversion_rates[toCurrency];
      
      if (fromRate && toRate) {
        const convertedValue = (parseFloat(amount) / fromRate) * toRate;
        setConvertedAmount(convertedValue.toFixed(4));
      }
    } else {
      setConvertedAmount("");
    }
  }, [currenciesData, amount, fromCurrency, toCurrency]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  if (loading) {
    return (
      <BaseWidget
        widgetId={widgetId}
        title="Quick Converter"
        onRemove={onRemove}
        onToggle={onToggle}
        isEditMode={isEditMode}
      >
        <ThemedText>Loading...</ThemedText>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget
      widgetId={widgetId}
      title="Quick Converter"
      onRemove={onRemove}
      onToggle={onToggle}
      isEditMode={isEditMode}
    >
      <View style={styles.converterContainer}>
        {/* Amount Input */}
        <TextInput
          style={styles.amountInput}
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        {/* Currency Selection */}
        <View style={styles.currencyRow}>
          <TouchableOpacity
            style={styles.currencyButton}
            onPress={onNavigateToConverter}
          >
            <CurrencyFlag currency={fromCurrency} size={16} />
            <ThemedText style={styles.currencyText}>{fromCurrency}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.swapButton} onPress={handleSwapCurrencies}>
            <ThemedText style={styles.swapText}>⇄</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.currencyButton}
            onPress={onNavigateToConverter}
          >
            <CurrencyFlag currency={toCurrency} size={16} />
            <ThemedText style={styles.currencyText}>{toCurrency}</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Converted Amount */}
        {convertedAmount && parseFloat(amount) > 0 && (
          <View style={styles.resultContainer}>
            <ThemedText style={styles.resultText}>
              {amount} {fromCurrency} = {convertedAmount} {toCurrency}
            </ThemedText>
          </View>
        )}

        {/* Full Converter Button */}
        <TouchableOpacity
          style={styles.fullConverterButton}
          onPress={onNavigateToConverter}
        >
          <ThemedText style={styles.fullConverterButtonText}>
            Open Full Converter
          </ThemedText>
        </TouchableOpacity>
      </View>
    </BaseWidget>
  );
}

const styles = StyleSheet.create({
  converterContainer: {
    gap: 12,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  currencyText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  swapButton: {
    padding: 10,
    marginHorizontal: 10,
    backgroundColor: '#2563eb',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  resultText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#2563eb',
  },
  fullConverterButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  fullConverterButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});