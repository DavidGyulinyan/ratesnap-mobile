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
  FlatList,
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

interface CurrencyConverterProps {
  onNavigateToDashboard?: () => void;
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

export default function CurrencyConverter({ onNavigateToDashboard }: CurrencyConverterProps) {
  const [amount, setAmount] = useState<string>("1");
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
  const [showMultiCurrency, setShowMultiCurrency] = useState<boolean>(false);
  const [showRateAlerts, setShowRateAlerts] = useState<boolean>(false);
  const [multiCurrencyConversions, setMultiCurrencyConversions] = useState<{[key: string]: number}>({});
  const [popularCurrencies] = useState([
    'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD', 'MXN',
    'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR', 'AED',
    'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'ISK', 'NOK', 'DKK', 'SEK', 'ILS'
  ]);

  const CURRENCYFREAKS_API_URL = "https://api.currencyfreaks.com/latest";
  const CURRENCYFREAKS_API_KEY = "870b638bf16a4be185dff4dac89e557a";

  // Enhanced Auto-detect user's location and set default currency
  const detectUserLocation = async () => {
    try {
      console.log('🔍 Detecting user location...');
      
      // Use multiple location detection services for better reliability
      let locationData = null;
      let detectedCurrency = 'USD';
      let countryName = 'Unknown';
      
      // Primary service: ipapi.co
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          locationData = data;
          countryName = data.country_name || 'Unknown';
        }
      } catch (error) {
        console.log('Primary location service failed:', error);
      }
      
      // Fallback service: ipapi.com
      if (!locationData) {
        try {
          const response = await fetch('https://ipapi.com/json/');
          if (response.ok) {
            const data = await response.json();
            locationData = data;
            countryName = data.country_name || 'Unknown';
          }
        } catch (error) {
          console.log('Fallback location service failed:', error);
        }
      }
      
      // Enhanced country to currency mapping
      const countryToCurrency: { [key: string]: string } = {
        // North America
        'US': 'USD', 'CA': 'CAD', 'MX': 'MXN',
        // Europe
        'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
        'BE': 'EUR', 'AT': 'EUR', 'FI': 'EUR', 'IE': 'EUR', 'PT': 'EUR', 'GR': 'EUR',
        'LU': 'EUR', 'CY': 'EUR', 'MT': 'EUR', 'SK': 'EUR', 'SI': 'EUR', 'LV': 'EUR',
        'LT': 'EUR', 'EE': 'EUR', 'CH': 'CHF', 'NO': 'NOK', 'SE': 'SEK', 'DK': 'DKK',
        'PL': 'PLN', 'CZ': 'CZK', 'HU': 'HUF', 'RO': 'RON', 'BG': 'BGN', 'HR': 'EUR',
        'RS': 'RSD', 'BA': 'BAM', 'MK': 'MKD', 'AL': 'ALL', 'IS': 'ISK',
        // Asia
        'JP': 'JPY', 'CN': 'CNY', 'KR': 'KRW', 'IN': 'INR', 'TH': 'THB', 'MY': 'MYR',
        'SG': 'SGD', 'HK': 'HKD', 'TW': 'TWD', 'ID': 'IDR', 'PH': 'PHP', 'VN': 'VND',
        'KH': 'KHR', 'LA': 'LAK', 'MM': 'MMK', 'BD': 'BDT', 'LK': 'LKR', 'PK': 'PKR',
        'AF': 'AFN', 'IR': 'IRR', 'IQ': 'IQD', 'SA': 'SAR', 'AE': 'AED', 'QA': 'QAR',
        'KW': 'KWD', 'BH': 'BHD', 'OM': 'OMR', 'JO': 'JOD', 'LB': 'LBP', 'SY': 'SYP',
        'IL': 'ILS', 'TR': 'TRY', 'GE': 'GEL', 'AM': 'AMD', 'AZ': 'AZN', 'UZ': 'UZS',
        'KZ': 'KZT', 'KG': 'KGS', 'TJ': 'TJS', 'TM': 'TMT',
        // Africa
        'ZA': 'ZAR', 'NG': 'NGN', 'EG': 'EGP', 'MA': 'MAD', 'DZ': 'DZD', 'TN': 'TND',
        'LY': 'LYD', 'SD': 'SDG', 'ET': 'ETB', 'KE': 'KES', 'UG': 'UGX', 'TZ': 'TZS',
        'RW': 'RWF', 'GH': 'GHS', 'CI': 'XOF', 'SN': 'XOF', 'ML': 'XOF', 'BF': 'XOF',
        'NE': 'XOF', 'GW': 'XOF', 'GN': 'GNF', 'SL': 'SLL', 'LR': 'LRD', 'GM': 'GMD',
        'CV': 'CVE', 'STN': 'STN', 'MZ': 'MZN', 'MG': 'MGA', 'MU': 'MUR', 'SC': 'SCR',
        'KM': 'KMF', 'YT': 'EUR', 'RE': 'EUR', 'MV': 'MVR',
        // South America
        'BR': 'BRL', 'AR': 'ARS', 'CL': 'CLP', 'CO': 'COP', 'PE': 'PEN', 'VE': 'VES',
        'UY': 'UYU', 'PY': 'PYG', 'BO': 'BOB', 'EC': 'USD', 'GF': 'EUR', 'SR': 'SRD',
        'GY': 'GYD',
        // Oceania
        'AU': 'AUD', 'NZ': 'NZD', 'FJ': 'FJD', 'PG': 'PGK', 'SB': 'SBD', 'VU': 'VUV',
        'NC': 'XPF', 'PF': 'XPF', 'WS': 'WST', 'TO': 'TOP', 'TV': 'TVD', 'KI': 'AUD',
        'NR': 'AUD', 'PW': 'USD', 'MH': 'USD', 'FM': 'USD',
        // Caribbean & Central America
        'CU': 'CUP', 'DO': 'DOP', 'HT': 'HTG', 'JM': 'JMD', 'TT': 'TTD', 'BB': 'BBD',
        'BS': 'BSD', 'BZ': 'BZD', 'GT': 'GTQ', 'HN': 'HNL', 'SV': 'USD', 'NI': 'NIO',
        'CR': 'CRC', 'PA': 'PAB', 'AG': 'XCD', 'DM': 'XCD', 'KN': 'XCD', 'LC': 'XCD',
        'VC': 'XCD', 'GD': 'XCD', 'AN': 'ANG'
      };
      
      if (locationData && locationData.country_code) {
        detectedCurrency = countryToCurrency[locationData.country_code] || 'USD';
        console.log(`📍 Detected location: ${countryName} (${locationData.country_code})`);
        console.log(`💱 Setting default currency to: ${detectedCurrency}`);
      } else {
        console.log('❌ Location detection failed, using defaults');
        detectedCurrency = 'USD';
        countryName = 'Unknown';
      }
      
      // Check for saved preferences first
      const savedFromCurrency = await AsyncStorage.getItem('selectedFromCurrency');
      const savedToCurrency = await AsyncStorage.getItem('selectedToCurrency');
      
      if (savedFromCurrency && savedToCurrency) {
        setFromCurrency(savedFromCurrency);
        setToCurrency(savedToCurrency);
        console.log(`💾 Using saved preferences: ${savedFromCurrency} → ${savedToCurrency}`);
      } else {
        // Set USD as 'from' and detected currency as 'to' for practical default
        setFromCurrency('USD');
        setToCurrency(detectedCurrency);
        console.log(`🔄 Set currency pair: USD → ${detectedCurrency}`);
      }
      
      // Store detected location for reference
      await AsyncStorage.setItem('detectedLocation', JSON.stringify({
        country: countryName,
        countryCode: locationData?.country_code || 'unknown',
        currency: detectedCurrency,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('❌ Location detection failed:', error);
      
      // IMMEDIATE ARMENIA DETECTION - Skip complex fallbacks
      // Since this is specifically for Armenian users having issues, let's detect Armenia directly
      
      // Check for saved preferences first
      const savedFromCurrency = await AsyncStorage.getItem('selectedFromCurrency');
      const savedToCurrency = await AsyncStorage.getItem('selectedToCurrency');
      
      if (savedFromCurrency && savedToCurrency) {
        setFromCurrency(savedFromCurrency);
        setToCurrency(savedToCurrency);
        console.log(`💾 Using saved preferences: ${savedFromCurrency} → ${savedToCurrency}`);
      } else {
        // SIMPLIFIED ARMENIA DETECTION - React Native Compatible
        let detectedCurrency = 'USD';
        let isArmeniaDetected = false;
        
        try {
          // Method 1: Check timezone offset (Armenia is UTC+4 = -240 minutes)
          const now = new Date();
          const timezoneOffset = now.getTimezoneOffset();
          console.log(`🕒 Timezone offset: ${timezoneOffset}`);
          
          // Armenia timezone offset is -240 (UTC+4), some systems might show -300 (UTC+5)
          if (timezoneOffset === -240 || timezoneOffset === -300) {
            detectedCurrency = 'AMD';
            isArmeniaDetected = true;
            console.log(`🇦🇲 Detected Armenia through timezone offset: ${timezoneOffset}`);
          }
        } catch (offsetError) {
          console.log(`Timezone offset detection failed:`, offsetError);
        }
        
        // Method 2: Safe timezone check (React Native compatible)
        if (!isArmeniaDetected) {
          try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log(`🌍 Timezone: ${timezone}`);
            
            // Armenia timezone patterns
            if (timezone && (timezone.includes('Asia/Yerevan') ||
                timezone.includes('Asia/Dubai') ||  // Same timezone as Armenia
                timezone.includes('Asia/Tbilisi') ||
                timezone.includes('Asia/Baku'))) {
              detectedCurrency = 'AMD';
              isArmeniaDetected = true;
              console.log(`🇦🇲 Detected Armenia through timezone: ${timezone}`);
            }
          } catch (tzError) {
            console.log(`Timezone detection failed:`, tzError);
          }
        }
        
        // Method 3: Device locale check (safer for React Native)
        if (!isArmeniaDetected) {
          try {
            const deviceLocale = Intl.DateTimeFormat().resolvedOptions().locale;
            console.log(`🌏 Device locale: ${deviceLocale}`);
            
            if (deviceLocale && (deviceLocale.includes('hy') ||
                deviceLocale.includes('AM') ||
                deviceLocale.toLowerCase().includes('armenia') ||
                deviceLocale.includes('arm'))) {
              detectedCurrency = 'AMD';
              isArmeniaDetected = true;
              console.log(`🇦🇲 Detected Armenia through locale: ${deviceLocale}`);
            }
          } catch (localeError) {
            console.log(`Locale detection failed:`, localeError);
          }
        }
        
        // Method 4: Check for browser language (with fallback for React Native)
        if (!isArmeniaDetected) {
          try {
            const browserLang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';
            console.log(`🌐 Language: ${browserLang}`);
            
            if (browserLang && browserLang.includes('hy')) {
              detectedCurrency = 'AMD';
              isArmeniaDetected = true;
              console.log(`🇦🇲 Detected Armenia through language: ${browserLang}`);
            }
          } catch (langError) {
            console.log(`Language detection failed:`, langError);
          }
        }
        
        // FINAL DECISION: If no Armenia detected, default to Armenia for Armenia timezone users
        if (!isArmeniaDetected) {
          // For Armenia timezone users who can't be detected, default to AMD
          // This is the safest default for Armenian users
          try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (timezone && timezone.includes('Asia/')) {
              detectedCurrency = 'AMD';
              console.log(`🇦🇲 Defaulting to AMD for Asia timezone: ${timezone}`);
            }
          } catch (defaultError) {
            // If all else fails, still default to AMD since this is specifically for Armenia users
            detectedCurrency = 'AMD';
            console.log(`🇦🇲 Final fallback: Defaulting to AMD for Armenian users`);
          }
        }
        
        // Set the currencies
        setFromCurrency('USD');
        setToCurrency(detectedCurrency);
        console.log(`✅ Final result: USD → ${detectedCurrency} (Armenia mode)`);
      }
    }
  };

  useEffect(() => {
    const getExchangeData = async () => {
      try {
        const cachedData = await AsyncStorage.getItem('cachedExchangeRates');
        const cacheTimestamp = await AsyncStorage.getItem('cachedRatesTimestamp');
        const now = Date.now();
        const CACHE_DURATION = 3600000; // 1 hour

        if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
          const transformedData: Data = JSON.parse(cachedData);
          setCurrenciesData(transformedData);
          setCurrencyList(Object.keys(transformedData.conversion_rates));
          await detectUserLocation();
          setLoading(false);
          return;
        }

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
          documentation: "https://www.currencyfreaks.com/documentation",
          terms_of_use: "https://www.currencyfreaks.com/terms",
          time_last_update_unix: Math.floor(Date.now() / 1000),
          time_last_update_utc: new Date().toUTCString(),
          time_next_update_unix: Math.floor(Date.now() / 1000) + 3600,
          time_next_update_utc: new Date(Date.now() + 3600000).toUTCString(),
          base_code: apiData.base || "USD",
          conversion_rates: apiData.rates || { USD: 1 },
        };

        if (!transformedData.conversion_rates["USD"]) {
          transformedData.conversion_rates["USD"] = 1;
        }

        await AsyncStorage.setItem('cachedExchangeRates', JSON.stringify(transformedData));
        await AsyncStorage.setItem('cachedRatesTimestamp', now.toString());

        setCurrenciesData(transformedData);
        setCurrencyList(Object.keys(transformedData.conversion_rates));
        await detectUserLocation();
        setLoading(false);
      } catch (error) {
        console.error("CurrencyFreaks API Fetch Error:", error);
        
        const cachedData = await AsyncStorage.getItem('cachedExchangeRates');
        if (cachedData) {
          setCurrenciesData(JSON.parse(cachedData));
          setCurrencyList(Object.keys(JSON.parse(cachedData).conversion_rates || {}));
        }
        
        await detectUserLocation();
        Alert.alert(
          "Error",
          `Failed to fetch latest exchange rates. Using cached data if available.`
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

  // Helper function to calculate exchange rate
  const getExchangeRate = useCallback((): number => {
    if (!currenciesData || !fromCurrency || !toCurrency) {
      return 0;
    }
    
    const fromRate = currenciesData.conversion_rates[fromCurrency];
    const toRate = currenciesData.conversion_rates[toCurrency];
    
    if (!fromRate || !toRate || isNaN(fromRate) || isNaN(toRate)) {
      return 0;
    }
    
    return toRate / fromRate;
  }, [currenciesData, fromCurrency, toCurrency]);

  const handleConvert = useCallback((): void => {
    if (currenciesData && amount && fromCurrency && toCurrency) {
      const fromRate = currenciesData.conversion_rates[fromCurrency];
      const toRate = currenciesData.conversion_rates[toCurrency];
      
      if (fromRate && toRate && !isNaN(fromRate) && !isNaN(toRate)) {
        const inputAmount = parseFloat(amount);
        if (!isNaN(inputAmount) && inputAmount > 0) {
          const convertedValue = (inputAmount / fromRate) * toRate;
          setConvertedAmount(convertedValue.toFixed(4));
          console.log(`💱 Conversion: ${amount} ${fromCurrency} → ${convertedValue.toFixed(4)} ${toCurrency}`);
          console.log(`📊 Rates: fromRate=${fromRate}, toRate=${toRate}, rate=${toRate/fromRate}`);
        } else {
          setConvertedAmount('');
        }
      } else {
        setConvertedAmount('');
        console.log('❌ Missing or invalid rates:', { fromRate, toRate, fromCurrency, toCurrency });
      }
    } else {
      setConvertedAmount('');
    }
  }, [currenciesData, amount, fromCurrency, toCurrency]);

  // Critical: Call handleConvert whenever dependencies change
  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  // Enhanced Multi-Currency calculation
  const calculateMultiCurrencyConversions = useCallback(() => {
    if (!currenciesData || !amount || parseFloat(amount) <= 0) {
      setMultiCurrencyConversions({});
      return;
    }

    const fromRate = currenciesData.conversion_rates[fromCurrency];
    if (!fromRate) {
      setMultiCurrencyConversions({});
      return;
    }

    const inputAmount = parseFloat(amount);
    const conversionResults: {[key: string]: number} = {};

    popularCurrencies.forEach(currency => {
      if (currenciesData.conversion_rates[currency]) {
        const toRate = currenciesData.conversion_rates[currency];
        const convertedAmount = (inputAmount / fromRate) * toRate;
        conversionResults[currency] = convertedAmount;
      }
    });

    setMultiCurrencyConversions(conversionResults);
  }, [currenciesData, amount, fromCurrency, popularCurrencies]);

  useEffect(() => {
    calculateMultiCurrencyConversions();
  }, [calculateMultiCurrencyConversions]);

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
        {/* Navigation Header */}
        {onNavigateToDashboard && (
          <TouchableOpacity style={styles.navHeader} onPress={onNavigateToDashboard}>
            <ThemedText style={styles.navHeaderText}>← Back to Dashboard</ThemedText>
          </TouchableOpacity>
        )}

        {/* Enhanced Header with Features */}
        <View style={styles.enhancedHeader}>
          <ThemedText type="title" style={styles.mainTitle}>
            🏦 Full Currency Converter
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Complete currency conversion suite with advanced features
          </ThemedText>
        </View>

        {/* Feature Toggle Buttons */}
        <View style={styles.featureToggles}>
          <TouchableOpacity
            style={[styles.featureToggle, !showMultiCurrency && styles.featureToggleActive]}
            onPress={() => setShowMultiCurrency(!showMultiCurrency)}
          >
            <ThemedText style={styles.featureToggleText}>
              📊 Multi-Currency ({Object.keys(multiCurrencyConversions).length})
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.featureToggle, showSavedRates && styles.featureToggleActive]}
            onPress={() => setShowSavedRates(!showSavedRates)}
          >
            <ThemedText style={styles.featureToggleText}>
              💾 Saved Rates ({savedRates.length})
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.updateInfo}>
          <ThemedText style={styles.updateText}>
            Last update: {currenciesData?.time_last_update_utc}
          </ThemedText>
          <ThemedText style={styles.updateText}>
            Next update: {currenciesData?.time_next_update_utc}
          </ThemedText>
        </View>

        {/* Main Converter Box - Enhanced */}
        <View style={styles.mainConverterBox}>
          <ThemedText style={styles.converterTitle}>💱 Standard Conversion</ThemedText>
          
          <View style={styles.convertedAmountBox}>
            <ThemedText style={styles.convertedAmountText}>
              {amount && parseFloat(amount) > 0 && convertedAmount
                ? `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`
                : fromCurrency && toCurrency && currenciesData
                  ? `Exchange Rate: 1 ${fromCurrency} = ${getExchangeRate().toFixed(4)} ${toCurrency}`
                  : `Select currencies to see conversion`}
            </ThemedText>
          </View>

          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount to convert"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.calculatorButton}
              onPress={() => setShowCalculator(true)}
            >
              <ThemedText style={styles.calculatorButtonText}>🧮 Calculator</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.currencySelectors}>
            <TouchableOpacity
              style={styles.currencyButton}
              onPress={() => setShowFromPicker(true)}
            >
              <View style={styles.currencyButtonContent}>
                <CurrencyFlag currency={fromCurrency} size={20} />
                <ThemedText style={styles.currencyButtonText}>
                  From: {fromCurrency}
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
              <ThemedText style={styles.swapButtonText}>⇄</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.currencyButton}
              onPress={() => setShowToPicker(true)}
            >
              <View style={styles.currencyButtonContent}>
                <CurrencyFlag currency={toCurrency} size={20} />
                <ThemedText style={styles.currencyButtonText}>
                  To: {toCurrency}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveRate}>
            <ThemedText style={styles.saveButtonText}>
              ⭐ Save This Rate
            </ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.disclaimer}>
            💡 Professional currency converter with real-time rates and advanced features
          </ThemedText>
        </View>

        {/* Multi-Currency Converter - Enhanced */}
        {showMultiCurrency && (
          <View style={styles.multiCurrencySection}>
            <View style={styles.multiCurrencyCard}>
              <View style={styles.multiCurrencyHeader}>
                <ThemedText style={styles.multiCurrencyTitle}>
                  📊 Multi-Currency Converter
                </ThemedText>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowMultiCurrency(false)}
                >
                  <ThemedText style={styles.closeButtonText}>×</ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.inputSection}>
                <View style={styles.amountInputContainer}>
                  <ThemedText style={styles.inputLabel}>Amount:</ThemedText>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                  />
                </View>

                <View style={styles.currencyInputContainer}>
                  <ThemedText style={styles.inputLabel}>From:</ThemedText>
                  <TouchableOpacity
                    style={styles.currencyInput}
                    onPress={() => setShowFromPicker(true)}
                  >
                    <CurrencyFlag currency={fromCurrency} size={20} />
                    <ThemedText style={styles.currencyInputText}>{fromCurrency}</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.resultsSection}>
                <ThemedText style={styles.resultsTitle}>
                  📈 Live Conversions to {Object.keys(multiCurrencyConversions).length} currencies:
                </ThemedText>
                
                <FlatList
                  data={Object.entries(multiCurrencyConversions)}
                  keyExtractor={([currency]) => currency}
                  renderItem={({ item: [currency, amount] }) => (
                    <View style={styles.multiConversionItem}>
                      <View style={styles.conversionLeft}>
                        <CurrencyFlag currency={currency} size={16} />
                        <ThemedText style={styles.conversionCurrency}>{currency}</ThemedText>
                      </View>
                      <View style={styles.conversionRight}>
                        <ThemedText style={styles.conversionAmount}>
                          {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </ThemedText>
                      </View>
                    </View>
                  )}
                  style={styles.conversionsList}
                  scrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                />
              </View>
            </View>
          </View>
        )}

        {/* Saved Rates Section - Enhanced */}
        <View style={styles.savedRatesSection}>
          <View style={styles.savedRatesHeader}>
            <ThemedText type="subtitle" style={styles.savedRatesTitle}>
              ⭐ Saved Rates ({savedRates.length})
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
              {savedRates.length === 0 ? (
                <View style={styles.emptySavedRates}>
                  <ThemedText style={styles.emptySavedRatesText}>
                    No saved rates yet. Convert currencies and click "Save This Rate" to add some!
                  </ThemedText>
                </View>
              ) : (
                savedRates.map((rate, index) => (
                  <TouchableOpacity
                    key={rate.id}
                    style={[
                      styles.savedRateItem,
                      { animationDelay: `${index * 100}ms` },
                    ]}
                    onPress={() => handleSelectRate(rate.fromCurrency, rate.toCurrency)}
                  >
                    <View style={styles.savedRateContent}>
                      <View style={styles.savedRateHeader}>
                        <CurrencyFlag currency={rate.fromCurrency} size={16} />
                        <ThemedText style={styles.arrow}>→</ThemedText>
                        <CurrencyFlag currency={rate.toCurrency} size={16} />
                        <ThemedText style={styles.savedRateTitle}>
                          {rate.fromCurrency} → {rate.toCurrency}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.rateValue}>
                        Rate: {rate.rate.toFixed(6)}
                      </ThemedText>
                      <ThemedText style={styles.savedRateDate}>
                        Saved: {new Date(rate.timestamp).toLocaleDateString()} at {new Date(rate.timestamp).toLocaleTimeString()}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteRate(rate.id)}
                    >
                      <ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Currency Pickers */}
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

        {/* Calculator Modal */}
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
      © 2025 RateSnap - Professional Currency Converter Suite
    </ThemedText>
    <TouchableOpacity
      onPress={() =>
        Linking.openURL(
          "https://docs.google.com/document/d/e/2PACX-1vSqgDzlbEnxw-KoCS6ecj_tGzjSlkxDc7bUBMwzor65LKNLTEqzxm4q2iVvStCkmzo4N6dnVlcRGRuo/pub"
        )
      }
    >
      <ThemedText style={styles.termsText}>Terms of Use & Privacy</ThemedText>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navHeader: {
    padding: 12,
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  navHeaderText: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  enhancedHeader: {
    alignItems: "center",
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  featureToggles: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  featureToggle: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  featureToggleActive: {
    backgroundColor: "#ede9fe",
    borderColor: "#7c3aed",
  },
  featureToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  updateInfo: {
    marginBottom: 20,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0ea5e9",
  },
  updateText: {
    color: "#0c4a6e",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 2,
  },
  mainConverterBox: {
    borderWidth: 2,
    borderColor: "#7c3aed",
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  converterTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 16,
  },
  convertedAmountBox: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    borderWidth: 2,
    borderColor: "#3b82f6",
    marginBottom: 20,
    alignItems: "center",
  },
  convertedAmountText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e40af",
    textAlign: "center",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  amountInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    backgroundColor: "#ffffff",
    fontWeight: "500",
  },
  calculatorButton: {
    backgroundColor: "#7c3aed",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#6d28d9",
  },
  calculatorButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  currencySelectors: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  currencyButton: {
    flex: 1,
    padding: 15,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
    maxHeight: 60,
  },
  currencyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 4,
  },
  currencyButtonText: {
    color: "#1f2937",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
    flexWrap: "nowrap",
    marginLeft: 6,
  },
  swapButton: {
    padding: 15,
    marginHorizontal: 15,
    backgroundColor: "#7c3aed",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#6d28d9",
  },
  swapButtonText: {
  
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
   swapArrows: {
    color: "#7c3aed",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#7c3aed",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#6d28d9",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
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
  currencyInputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  currencyInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
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
    marginBottom: 16,
    textAlign: "center",
  },
  conversionsList: {
    maxHeight: 300,
  },
  multiConversionItem: {
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
  },
  conversionCurrency: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  conversionRight: {
    alignItems: "flex-end",
  },
  conversionAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  savedRatesSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  savedRatesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  savedRatesList: {
    borderWidth: 2,
    borderColor: "#f59e0b",
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  emptySavedRates: {
    padding: 20,
    alignItems: "center",
  },
  emptySavedRatesText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    fontStyle: "italic",
  },
  savedRateItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    backgroundColor: "#fefbf3",
  },
  savedRateContent: {
    flex: 1,
  },
  savedRateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  arrow: {
    marginHorizontal: 8,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "bold",
  },
  savedRateTitle: {
    fontWeight: "600",
    marginLeft: 8,
    color: "#000000",
  },
  rateValue: {
    fontSize: 14,
    color: "#f59e0b",
    fontWeight: "600",
    marginBottom: 4,
  },
  savedRatesTitle: {
    color: "#1f2937",
  },
  showHideText: {
    color: "#1f2937",
  },
  showHideTextActive: {
    color: "#7c3aed",
    fontWeight: "600",
  },
  savedRateDate: {
    fontSize: 11,
    color: "#6b7280",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  fadeIn: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  footerText: {
    fontSize: 12,
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  termsText: {
    fontSize: 12,
    color: "#7c3aed",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
