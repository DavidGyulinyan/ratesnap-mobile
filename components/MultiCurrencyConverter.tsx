import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "./themed-text";
import CurrencyFlag from "./CurrencyFlag";
import CurrencyPicker from "./CurrencyPicker";

interface MultiCurrencyConverterProps {
  currenciesData: any;
  fromCurrency: string;
  toCurrency: string;
  amount: string;
  onAmountChange: (amount: string) => void;
  showCloseButton?: boolean;
  onClose?: () => void;
  style?: any;
}

interface ConversionResult {
  [currency: string]: number;
}

// Popular currencies for multi-currency conversion
const POPULAR_CURRENCIES = [
  "AMD", "RUB", "GEL", "EUR", "CAD", "GBP", "JPY", "AUD", "CHF", "CNY",
  "SEK", "NZD", "MXN", "SGD", "HKD", "NOK", "KRW", "TRY", "INR", "BRL", "ZAR", "AED"
];

export default function MultiCurrencyConverter({
  currenciesData,
  fromCurrency,
  toCurrency,
  amount,
  onAmountChange,
  showCloseButton = false,
  onClose,
  style,
}: MultiCurrencyConverterProps) {
  const [conversions, setConversions] = useState<ConversionResult>({});
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencyList, setCurrencyList] = useState<string[]>([]);

  // Load available currencies from currenciesData
  useEffect(() => {
    if (currenciesData && currenciesData.conversion_rates) {
      setCurrencyList(Object.keys(currenciesData.conversion_rates));
    }
  }, [currenciesData]);

  // Load selected currencies from storage
  useEffect(() => {
    const loadSelectedCurrencies = async () => {
      try {
        const saved = await AsyncStorage.getItem("selectedCurrencies");
        if (saved) {
          setSelectedCurrencies(JSON.parse(saved));
        } else {
          // Default to some popular currencies
          const defaults = [
            "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "SEK", "NZD", "MXN",
            "SGD", "HKD", "NOK", "KRW", "TRY", "INR", "BRL", "ZAR", "AED"
          ];
          setSelectedCurrencies(defaults);
        }
      } catch (error) {
        console.error("Error loading selected currencies:", error);
      }
    };
    loadSelectedCurrencies();
  }, []);

  // Calculate multi-currency conversions
  const calculateMultiConversions = useCallback(() => {
    if (!currenciesData || !amount || parseFloat(amount) <= 0) {
      setConversions({});
      return;
    }

    // Always use the provided base currency for multi-currency conversions
    const baseRate = currenciesData.conversion_rates?.[fromCurrency];
    if (!baseRate) {
      setConversions({});
      return;
    }

    const inputAmount = parseFloat(amount);
    const conversionResults: ConversionResult = {};

    // Convert from base currency to all selected currencies
    selectedCurrencies.forEach((currency) => {
      if (currenciesData.conversion_rates?.[currency]) {
        const targetRate = currenciesData.conversion_rates[currency];
        // Convert: base currency → target currency
        const convertedAmount = (inputAmount / baseRate) * targetRate;
        conversionResults[currency] = convertedAmount;
      }
    });

    setConversions(conversionResults);
  }, [currenciesData, amount, fromCurrency, selectedCurrencies]);

  useEffect(() => {
    calculateMultiConversions();
  }, [calculateMultiConversions]);

  const saveSelectedCurrencies = async (currencies: string[]) => {
    try {
      setSelectedCurrencies(currencies);
      await AsyncStorage.setItem("selectedCurrencies", JSON.stringify(currencies));
    } catch (error) {
      console.error("Error saving selected currencies:", error);
    }
  };

  const toggleCurrency = (currency: string) => {
    const updated = selectedCurrencies.includes(currency)
      ? selectedCurrencies.filter((c) => c !== currency)
      : [...selectedCurrencies, currency];
    saveSelectedCurrencies(updated);
  };

  const handleCurrencySelect = (currency: string) => {
    toggleCurrency(currency);
    setShowCurrencyPicker(false);
  };

  return (
    <View style={[styles.multiCurrencySection, style]}>
      <View style={styles.multiCurrencyCard}>
        <View style={styles.multiCurrencyHeader}>
          <ThemedText style={styles.multiCurrencyTitle}>
            📊 Multi-Currency Converter
          </ThemedText>
          {showCloseButton && onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <ThemedText style={styles.closeButtonText}>×</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.amountInputContainer}>
            <ThemedText style={styles.inputLabel}>Amount:</ThemedText>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={onAmountChange}
              keyboardType="numeric"
              placeholder="Enter amount"
            />
          </View>

          <View style={styles.currencyInputContainer}>
            <ThemedText style={styles.inputLabel}>From:</ThemedText>
            <TouchableOpacity style={styles.currencyInput}>
              <CurrencyFlag currency={fromCurrency} size={16} />
              <ThemedText style={styles.currencyInputText}>
                {fromCurrency}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Section */}
        <View style={styles.resultsSection}>
          <ThemedText style={styles.resultsTitle}>
            {amount} {fromCurrency} converts to:
          </ThemedText>

          {/* Show user's currency conversion prominently if different from base */}
          {toCurrency && conversions[toCurrency] && toCurrency !== fromCurrency && (
            <View style={styles.primaryConversion}>
              <ThemedText style={styles.primaryConversionTitle}>
                🌍 Your Local Currency ({toCurrency})
              </ThemedText>
              <View style={styles.primaryConversionItem}>
                <CurrencyFlag currency={toCurrency} size={20} />
                <ThemedText style={styles.primaryConversionAmount}>
                  {conversions[toCurrency].toFixed(4)} {toCurrency}
                </ThemedText>
              </View>
            </View>
          )}

          <View style={styles.conversionsGrid}>
            {Object.entries(conversions)
              .filter(([currency]) => currency !== fromCurrency) // Don't duplicate base currency
              .filter(([currency]) => currency !== toCurrency) // Don't duplicate user's currency if different
              .map(([currency, amount]) => (
                <View key={currency} style={styles.conversionItem}>
                  <View style={styles.conversionLeft}>
                    <CurrencyFlag currency={currency} size={16} />
                    <View style={styles.conversionInfo}>
                      <ThemedText style={styles.conversionCurrency}>
                        {currency}
                      </ThemedText>
                      <ThemedText style={styles.conversionAmount}>
                        {amount.toFixed(4)}
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeCurrencyButton}
                    onPress={() => toggleCurrency(currency)}
                  >
                    <ThemedText style={styles.removeCurrencyText}>
                      ×
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ))}

            {/* Show selected currencies that don't have conversions yet */}
            {selectedCurrencies
              .filter(currency => !conversions[currency] && currency !== fromCurrency)
              .map(currency => (
                <View key={currency} style={styles.conversionItem}>
                  <View style={styles.conversionLeft}>
                    <CurrencyFlag currency={currency} size={16} />
                    <View style={styles.conversionInfo}>
                      <ThemedText style={styles.conversionCurrency}>
                        {currency}
                      </ThemedText>
                      <ThemedText style={[styles.conversionAmount, { color: '#9ca3af' }]}>
                        No data
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeCurrencyButton}
                    onPress={() => toggleCurrency(currency)}
                  >
                    <ThemedText style={styles.removeCurrencyText}>
                      ×
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ))}

            {/* Manage Currencies Button */}
            <TouchableOpacity
              style={styles.manageCurrenciesButton}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <ThemedText style={styles.manageCurrenciesText}>
                ⚙️ Manage Currencies ({selectedCurrencies.length} selected)
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Currency Picker Modal for managing currencies */}
      <CurrencyPicker
        visible={showCurrencyPicker}
        currencies={currencyList}
        selectedCurrency=""
        onSelect={handleCurrencySelect}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Multi-Currency Styles
  multiCurrencySection: {
    marginBottom: 24,
  },
  multiCurrencyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#8b5cf6",
    padding: 20,
  },
  multiCurrencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  multiCurrencyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#dc2626",
    fontWeight: "bold",
  },
  inputSection: {
    marginBottom: 20,
  },
  amountInputContainer: {
    marginBottom: 12,
  },
  currencyInputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  amountInput: {
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    backgroundColor: "#ffffff",
    fontWeight: "500",
  },
  currencyInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 15,
    backgroundColor: "#ffffff",
  },
  currencyInputText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  resultsSection: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  conversionsGrid: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  conversionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  conversionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  conversionInfo: {
    marginLeft: 8,
    flex: 1,
  },
  conversionCurrency: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  conversionAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  removeCurrencyButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  removeCurrencyText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "bold",
  },
  primaryConversion: {
    backgroundColor: "#e0f2fe",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#0284c7",
  },
  primaryConversionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0c4a6e",
    textAlign: "center",
    marginBottom: 8,
  },
  primaryConversionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryConversionAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0369a1",
    marginLeft: 8,
  },
  manageCurrenciesButton: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  manageCurrenciesText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
});