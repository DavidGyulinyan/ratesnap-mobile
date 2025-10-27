import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import CurrencyPicker from "./CurrencyPicker";
import MathCalculator from "./MathCalculator";
import CurrencyFlag from "./CurrencyFlag";

interface SavedRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: number;
}

interface PolygonData {
  status: string;
  request_id: string;
  data: {
    market: string;
    conversion_rate: number;
    last_trade: string;
    last_trade_unix: number;
    daily_open_rate: number;
    daily_high_rate: number;
    daily_low_rate: number;
    daily_close_rate: number;
    daily_volume: number;
    from_symbol: string;
    to_symbol: string;
  };
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
  const [amount, setAmount] = useState<string>("");
  const [convertedAmount, setConvertedAmount] = useState<string>("");
  const [currenciesData, setCurrenciesData] = useState<Data | null>(null);
  const [fromCurrency, setFromCurrency] = useState<string>("");
  const [toCurrency, setToCurrency] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [currencyList, setCurrencyList] = useState<string[]>([]);
  const [savedRates, setSavedRates] = useState<SavedRate[]>([]);
  const [showSavedRates, setShowSavedRates] = useState<boolean>(false);
  const [showFromPicker, setShowFromPicker] = useState<boolean>(false);
  const [showToPicker, setShowToPicker] = useState<boolean>(false);
  const [showCalculator, setShowCalculator] = useState<boolean>(false);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const apiKey = process.env.EXPO_PUBLIC_API_KEY;

  useEffect(() => {
    const getExchangeData = async () => {
      try {
        // For Polygon.io, we'll use a different approach - get rates for common currencies
        // First, let's get a list of supported currencies and their rates
        const commonCurrencies = [
          "EUR",
          "GBP",
          "JPY",
          "CAD",
          "AUD",
          "CHF",
          "CNY",
          "SEK",
          "NZD",
          "MXN",
          "SGD",
          "HKD",
          "NOK",
          "KRW",
          "TRY",
          "RUB",
          "INR",
          "BRL",
          "ZAR",
          "AED",
          "AFN",
          "ALL",
          "AMD",
          "ANG",
          "AOA",
          "ARS",
          "AWG",
          "AZN",
          "BAM",
          "BBD",
          "BDT",
          "BGN",
          "BHD",
          "BIF",
          "BMD",
          "BND",
          "BOB",
          "BSD",
          "BTN",
          "BWP",
          "BYN",
          "BZD",
          "CDF",
          "CLP",
          "COP",
          "CRC",
          "CUP",
          "CVE",
          "CZK",
          "DJF",
          "DKK",
          "DOP",
          "DZD",
          "EGP",
          "ERN",
          "ETB",
          "FJD",
          "FKP",
          "FOK",
          "GEL",
          "GGP",
          "GHS",
          "GIP",
          "GMD",
          "GNF",
          "GTQ",
          "GYD",
          "HNL",
          "HRK",
          "HTG",
          "HUF",
          "IDR",
          "ILS",
          "IMP",
          "IQD",
          "IRR",
          "ISK",
          "JEP",
          "JMD",
          "JOD",
          "KES",
          "KGS",
          "KHR",
          "KID",
          "KMF",
          "KYD",
          "KZT",
          "LAK",
          "LBP",
          "LKR",
          "LRD",
          "LSL",
          "LYD",
          "MAD",
          "MDL",
          "MGA",
          "MKD",
          "MMK",
          "MNT",
          "MOP",
          "MRU",
          "MUR",
          "MVR",
          "MWK",
          "MYR",
          "MZN",
          "NAD",
          "NGN",
          "NIO",
          "NPR",
          "OMR",
          "PAB",
          "PEN",
          "PGK",
          "PHP",
          "PKR",
          "PLN",
          "PYG",
          "QAR",
          "RON",
          "RSD",
          "RWF",
          "SAR",
          "SBD",
          "SCR",
          "SDG",
          "SHP",
          "SLE",
          "SLL",
          "SOS",
          "SRD",
          "SSP",
          "STN",
          "SYP",
          "SZL",
          "THB",
          "TJS",
          "TMT",
          "TND",
          "TOP",
          "TTD",
          "TVD",
          "TWD",
          "TZS",
          "UAH",
          "UGX",
          "UYU",
          "UZS",
          "VES",
          "VND",
          "VUV",
          "WST",
          "XAF",
          "XCD",
          "XCG",
          "XDR",
          "XOF",
          "XPF",
          "YER",
          "ZMW",
          "ZWL",
        ];

        // Create a mock data structure similar to ExchangeRate-API for compatibility
        const mockData: Data = {
          result: "success",
          documentation: "https://polygon.io/docs/forex",
          terms_of_use: "https://polygon.io/legal/terms-of-service",
          time_last_update_unix: Date.now() / 1000,
          time_last_update_utc: new Date().toUTCString(),
          time_next_update_unix: Date.now() / 1000 + 3600, // Next update in 1 hour
          time_next_update_utc: new Date(Date.now() + 3600000).toUTCString(),
          base_code: "USD",
          conversion_rates: {
            USD: 1,
            EUR: 0.85,
            GBP: 0.73,
            JPY: 110.0,
            CAD: 1.25,
            AUD: 1.35,
            CHF: 0.92,
            CNY: 6.45,
            SEK: 8.6,
            NZD: 1.4,
            MXN: 20.0,
            SGD: 1.35,
            HKD: 7.8,
            NOK: 8.5,
            KRW: 1180.0,
            TRY: 8.3,
            RUB: 75.0,
            INR: 74.5,
            BRL: 5.2,
            ZAR: 14.8,
            AED: 3.67,
            AFN: 66.0,
            ALL: 83.0,
            AMD: 382.0,
            ANG: 1.79,
            AOA: 921.0,
            ARS: 1485.0,
            AWG: 1.79,
            AZN: 1.7,
            BAM: 1.68,
            BBD: 2.0,
            BDT: 122.0,
            BGN: 1.68,
            BHD: 0.38,
            BIF: 2940.0,
            BMD: 1.0,
            BND: 1.3,
            BOB: 6.91,
            BSD: 1.0,
            BTN: 87.8,
            BWP: 14.3,
            BYN: 3.26,
            BZD: 2.0,
            CDF: 2242.0,
            CLP: 946.0,
            COP: 3890.0,
            CRC: 501.0,
            CUP: 24.0,
            CVE: 94.9,
            CZK: 20.9,
            DJF: 178.0,
            DKK: 6.42,
            DOP: 63.5,
            DZD: 130.0,
            EGP: 47.6,
            ERN: 15.0,
            ETB: 149.0,
            FJD: 2.3,
            FKP: 0.75,
            FOK: 6.42,
            GEL: 2.71,
            GGP: 0.75,
            GHS: 10.9,
            GIP: 0.75,
            GMD: 73.3,
            GNF: 8678.0,
            GTQ: 7.64,
            GYD: 209.0,
            HNL: 26.2,
            HRK: 6.48,
            HTG: 131.0,
            HUF: 336.0,
            IDR: 16622.0,
            ILS: 3.29,
            IMP: 0.75,
            IQD: 1307.0,
            IRR: 42120.0,
            ISK: 123.0,
            JEP: 0.75,
            JMD: 161.0,
            JOD: 0.71,
            KES: 129.0,
            KGS: 87.3,
            KHR: 4021.0,
            KID: 1.35,
            KMF: 423.0,
            KYD: 0.83,
            KZT: 538.0,
            LAK: 21731.0,
            LBP: 89500.0,
            LKR: 303.0,
            LRD: 183.0,
            LSL: 17.3,
            LYD: 5.42,
            MAD: 9.24,
            MDL: 17.0,
            MGA: 4492.0,
            MKD: 53.0,
            MMK: 2097.0,
            MNT: 3592.0,
            MOP: 8.0,
            MRU: 40.1,
            MUR: 45.4,
            MVR: 15.4,
            MWK: 1737.0,
            MYR: 4.22,
            MZN: 63.6,
            NAD: 17.3,
            NGN: 1462.0,
            NIO: 36.7,
            NPR: 141.0,
            OMR: 0.38,
            PAB: 1.0,
            PEN: 3.39,
            PGK: 4.2,
            PHP: 58.7,
            PKR: 283.0,
            PLN: 3.65,
            PYG: 7075.0,
            QAR: 3.64,
            RON: 4.38,
            RSD: 101.0,
            RWF: 1453.0,
            SAR: 3.75,
            SBD: 8.15,
            SCR: 14.0,
            SDG: 572.0,
            SHP: 0.75,
            SLE: 23.1,
            SLL: 23133.0,
            SOS: 570.0,
            SRD: 39.8,
            SSP: 4624.0,
            STN: 21.1,
            SYP: 11009.0,
            SZL: 17.3,
            THB: 32.7,
            TJS: 9.22,
            TMT: 3.5,
            TND: 2.93,
            TOP: 2.35,
            TTD: 6.77,
            TVD: 1.35,
            TWD: 30.8,
            TZS: 2460.0,
            UAH: 42.0,
            UGX: 3463.0,
            UYU: 39.7,
            UZS: 12060.0,
            VES: 216.0,
            VND: 26183.0,
            VUV: 122.0,
            WST: 2.77,
            XAF: 564.0,
            XCD: 2.7,
            XCG: 1.79,
            XDR: 0.73,
            XOF: 564.0,
            XPF: 103.0,
            YER: 238.0,
            ZMW: 22.4,
            ZWL: 26.5,
          },
        };

        // Try to fetch real rates from Polygon.io for USD pairs
        try {
          const fetchPromises = commonCurrencies.map(async (currency) => {
            try {
              const response = await fetch(
                `${apiUrl}conversion/USD/${currency}?apiKey=${apiKey}`
              );
              if (response.ok) {
                const polygonData: PolygonData = await response.json();
                return { currency, rate: polygonData.data.conversion_rate };
              }
            } catch (error) {
              console.log(`Failed to fetch ${currency} rate:`, error);
            }
            return null;
          });

          const results = await Promise.all(fetchPromises);
          results.forEach((result) => {
            if (result) {
              mockData.conversion_rates[result.currency] = result.rate;
            }
          });
        } catch (error) {
          console.log(
            "Polygon.io API fetch failed, using fallback rates:",
            error
          );
        }

        console.log("Using exchange rates:", mockData);
        setCurrenciesData(mockData);

        const storedHistory = await AsyncStorage.getItem("currencyHistory");
        const history = storedHistory ? JSON.parse(storedHistory) : [];
        const initialFromCurrency = history[0]?.from || "USD";
        const initialToCurrency = history[0]?.to || "EUR";

        setFromCurrency(initialFromCurrency);
        setToCurrency(initialToCurrency);
        setCurrencyList(Object.keys(mockData.conversion_rates));
        setLoading(false);
      } catch (error) {
        console.error("API Fetch Error:", error);
        Alert.alert(
          "Error",
          `Failed to fetch exchange rates: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setLoading(false);
      }
    };

    getExchangeData();
  }, []);

  useEffect(() => {
    const loadSavedRates = async () => {
      const stored = await AsyncStorage.getItem("savedRates");
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
    await AsyncStorage.setItem("savedRates", JSON.stringify(updatedRates));
  };

  const handleDeleteRate = async (id: string): Promise<void> => {
    const updatedRates = savedRates.filter((rate) => rate.id !== id);
    setSavedRates(updatedRates);
    await AsyncStorage.setItem("savedRates", JSON.stringify(updatedRates));
  };

  const handleSelectRate = (from: string, to: string): void => {
    setFromCurrency(from);
    setToCurrency(to);
    setShowSavedRates(false);
  };

  const handleCalculatorResult = (result: number): void => {
    setAmount(result.toString());
    setShowCalculator(false);
  };

  const handleSwap = (): void => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const updateHistory = async (from: string, to: string): Promise<void> => {
    const storedHistory = await AsyncStorage.getItem("currencyHistory");
    const history = storedHistory ? JSON.parse(storedHistory) : [];
    const newHistory = [
      { from, to },
      ...history.filter(
        (entry: { from: string; to: string }) =>
          entry.from !== from || entry.to !== to
      ),
    ].slice(0, 5);
    await AsyncStorage.setItem("currencyHistory", JSON.stringify(newHistory));
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
      const stored = await AsyncStorage.getItem("currencyHistory");
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
          <ThemedText style={styles.updateText}>
            Last update: {currenciesData?.time_last_update_utc}
          </ThemedText>
          <ThemedText style={styles.updateText}>
            Next update: {currenciesData?.time_next_update_utc}
          </ThemedText>
        </View>

        <View style={styles.converterBox}>
          <View style={styles.convertedAmountBox}>
            <ThemedText style={styles.convertedAmountText}>
              {amount && parseFloat(amount) > 0
                ? `Converted Amount: ${convertedAmount}`
                : "Converted Amount: 0.00"}
            </ThemedText>
          </View>

          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.calculatorButton}
              onPress={() => setShowCalculator(true)}
            >
              <ThemedText style={styles.calculatorButtonText}>🧮</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.currencySelectors}>
            <TouchableOpacity
              style={styles.currencyButton}
              onPress={() => setShowFromPicker(true)}
            >
              <View style={styles.currencyButtonContent}>
                <CurrencyFlag currency={fromCurrency} size={16} />
                <ThemedText style={styles.currencyButtonText}>
                  From: {fromCurrency}
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
              <ThemedText>⇄</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.currencyButton}
              onPress={() => setShowToPicker(true)}
            >
              <View style={styles.currencyButtonContent}>
                <CurrencyFlag currency={toCurrency} size={16} />
                <ThemedText style={styles.currencyButtonText}>
                  To: {toCurrency}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveRate}>
            <ThemedText style={styles.saveButtonText}>
              Save This Rate
            </ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.disclaimer}>
            This currency converter provides approximate exchange rates for
            general reference only.
          </ThemedText>
        </View>

        <View style={styles.savedRatesSection}>
          <View style={styles.savedRatesHeader}>
            <ThemedText type="subtitle" style={styles.savedRatesTitle}>
              Saved Rates ({savedRates.length})
            </ThemedText>
            {savedRates.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowSavedRates(!showSavedRates)}
              >
                <ThemedText
                  style={[
                    styles.showHideText,
                    showSavedRates && styles.showHideTextActive,
                  ]}
                >
                  {showSavedRates ? "Hide ▲" : "Show ▼"}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {showSavedRates && (
            <View style={[styles.savedRatesList, styles.fadeIn]}>
              {savedRates.map((rate, index) => (
                <TouchableOpacity
                  key={rate.id}
                  style={[
                    styles.savedRateItem,
                    { animationDelay: `${index * 100}ms` },
                  ]}
                  onPress={() =>
                    handleSelectRate(rate.fromCurrency, rate.toCurrency)
                  }
                >
                  <View style={styles.savedRateContent}>
                    <ThemedText style={styles.savedRateTitle}>
                      {rate.fromCurrency} → {rate.toCurrency}
                    </ThemedText>
                    <ThemedText style={{ color: "#000000" }}>
                      Rate: {rate.rate.toFixed(4)}
                    </ThemedText>
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

        <MathCalculator
          visible={showCalculator}
          onClose={() => setShowCalculator(false)}
          onResult={handleCalculatorResult}
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
    <TouchableOpacity
      onPress={() =>
        Linking.openURL(
          "https://docs.google.com/document/d/e/2PACX-1vSqgDzlbEnxw-KoCS6ecj_tGzjSlkxDc7bUBMwzor65LKNLTEqzxm4q2iVvStCkmzo4N6dnVlcRGRuo/pub"
        )
      }
    >
      <ThemedText style={styles.termsText}>Terms of Use</ThemedText>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8fafc", // Light gray background for better eye comfort
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    color: "#1f2937",
  },
  updateInfo: {
    marginBottom: 20,
    alignItems: "center",
  },
  updateText: {
    color: "#1f2937",
    fontSize: 12,
    textAlign: "center",
  },
  converterBox: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  convertedAmountBox: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#e0f2fe",
    borderWidth: 2,
    borderColor: "#bae6fd",
    marginBottom: 20,
    alignItems: "center",
  },
  convertedAmountText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2563eb",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#f8fafc",
  },
  calculatorButton: {
    marginLeft: 10,
    padding: 15,
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  calculatorButtonText: {
    fontSize: 16,
  },
  currencySelectors: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  currencyButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    maxHeight: 50,
  },
  currencyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  currencyButtonText: {
    color: "#1f2937",
    fontWeight: "500",
    fontSize: 12,
    textAlign: "center",
    flexWrap: "nowrap",
  },
  swapButton: {
    padding: 15,
    marginHorizontal: 10,
    backgroundColor: "#2563eb",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 12,
    color: "#1f2937",
    fontStyle: "italic",
  },
  savedRatesSection: {
    marginTop: 20,
    marginBottom: 20, // Add bottom margin to prevent overlap with footer
  },
  savedRatesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  savedRatesList: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  savedRateItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  savedRateContent: {
    flex: 1,
  },
  savedRateTitle: {
    fontWeight: "600",
    marginBottom: 5,
    color: "#000000",
  },
  savedRatesTitle: {
    color: "#1f2937",
  },
  showHideText: {
    color: "#1f2937",
  },
  showHideTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  savedRateDate: {
    fontSize: 12,
    color: "#1f2937",
  },
  deleteButton: {
    fontSize: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: 40, // Extra padding for safe area
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  footerText: {
    fontSize: 12,
    color: "#1f2937",
    textAlign: "center",
  },
  termsText: {
    fontSize: 12,
    color: "#2563eb",
    textAlign: "center",
    textDecorationLine: "underline",
    marginTop: 5,
  },
  fadeIn: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
});
