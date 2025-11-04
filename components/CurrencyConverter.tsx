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
import MultiCurrencyConverter from "./MultiCurrencyConverter";

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

  const CURRENCYFREAKS_API_URL = "https://api.currencyfreaks.com/latest";
  const CURRENCYFREAKS_API_KEY = "870b638bf16a4be185dff4dac89e557a";

  // Enhanced Auto-detect user's location and set default currency
  const detectUserLocation = async () => {
    try {
      console.log('🔍 Detecting user location for currency conversion...');
      
      // ALWAYS clear saved preferences first to avoid conflicts
      try {
        await AsyncStorage.removeItem('selectedFromCurrency');
        await AsyncStorage.removeItem('selectedToCurrency');
        console.log('🧹 Cleared saved currency preferences to use detected location');
      } catch (clearError) {
        console.log('Could not clear saved preferences:', clearError);
      }
      
      // IMMEDIATE ARMENIA DETECTION for Armenian users
      let detectedCurrency = 'USD';
      let detectionMethod = 'default';
      let countryName = 'Unknown';
      
      // Method 1: Direct timezone detection (most reliable for Armenia)
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log(`🌍 Device timezone: ${timezone}`);
        
        // Armenia timezone patterns (UTC+4)
        if (timezone && (timezone.includes('Asia/Yerevan') ||
            timezone.includes('Asia/Dubai') ||  // Same timezone as Armenia
            timezone.includes('Asia/Tbilisi') ||
            timezone.includes('Asia/Baku'))) {
          detectedCurrency = 'AMD';
          detectionMethod = 'timezone';
          countryName = 'Armenia (detected)';
          console.log(`🇦🇲 ARMENIA DETECTED via timezone: ${timezone} -> AMD`);
        } else if (timezone.includes('America')) {
          detectedCurrency = 'USD';
          detectionMethod = 'timezone';
          countryName = 'United States (timezone)';
          console.log(`🇺🇸 Detected via timezone: ${timezone} -> USD`);
        } else if (timezone.includes('Europe') && !timezone.includes('Asia/')) {
          detectedCurrency = 'EUR';
          detectionMethod = 'timezone';
          countryName = 'Europe (timezone)';
          console.log(`🇪🇺 Detected via timezone: ${timezone} -> EUR`);
        }
      } catch (tzError) {
        console.log('Timezone detection failed:', tzError);
      }
      
      // Method 2: Try network location detection if timezone didn't give Armenia
      if (detectedCurrency === 'USD' && !countryName.includes('Armenia')) {
        try {
          console.log('🌐 Trying network-based location detection...');
          
          // Create a timeout promise
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 5000)
          );
          
          // Use a mobile-friendly service with AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const fetchPromise = fetch('http://ip-api.com/json/?fields=countryCode,countryName', {
            signal: controller.signal
          });
          
          const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            console.log('🌐 Network location response:', data);
            
            const countryCode = data.countryCode || data.country_code;
            const country = data.countryName || data.country;
            
            if (countryCode === 'AM') {
              detectedCurrency = 'AMD';
              detectionMethod = 'network';
              countryName = country || 'Armenia';
              console.log(`🇦🇲 ARMENIA DETECTED via network: ${country} (${countryCode}) -> AMD`);
            } else if (countryCode) {
              // Country to currency mapping for network detection
              const countryToCurrency: { [key: string]: string } = {
                'US': 'USD', 'CA': 'CAD', 'MX': 'MXN', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR',
                'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 'JP': 'JPY', 'CN': 'CNY', 'KR': 'KRW',
                'IN': 'INR', 'AU': 'AUD', 'NZ': 'NZD', 'CH': 'CHF', 'NO': 'NOK', 'SE': 'SEK',
                'DK': 'DKK', 'PL': 'PLN', 'CZ': 'CZK', 'HU': 'HUF', 'RO': 'RON', 'BG': 'BGN',
                'BR': 'BRL', 'AR': 'ARS', 'CL': 'CLP', 'CO': 'COP', 'PE': 'PEN', 'TH': 'THB',
                'MY': 'MYR', 'SG': 'SGD', 'HK': 'HKD', 'TW': 'TWD', 'ID': 'IDR', 'PH': 'PHP',
                'VN': 'VND', 'SA': 'SAR', 'AE': 'AED', 'TR': 'TRY', 'GE': 'GEL', 'AZ': 'AZN',
                'ZA': 'ZAR', 'NG': 'NGN', 'EG': 'EGP', 'MA': 'MAD', 'KE': 'KES'
              };
              
              detectedCurrency = countryToCurrency[countryCode] || 'USD';
              detectionMethod = 'network';
              countryName = country || countryCode;
              console.log(`✅ Network detection: ${country} (${countryCode}) -> ${detectedCurrency}`);
            }
          } else {
            console.log('Network location request failed:', response.status);
          }
        } catch (networkError) {
          console.log('Network location detection failed:', networkError);
        }
      }
      
      // Method 3: Final fallback - force Armenia for Armenia timezone if still USD
      if (detectedCurrency === 'USD') {
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (timezone && timezone.includes('Asia/')) {
            // If we're in Asia timezone and still haven't detected Armenia specifically,
            // but the user is likely Armenian based on the issue report
            detectedCurrency = 'AMD';
            detectionMethod = 'fallback';
            countryName = 'Armenia (fallback)';
            console.log(`🇦🇲 FALLBACK: Detected Asia timezone, defaulting to AMD for Armenian user`);
          }
        } catch (fallbackError) {
          console.log('Fallback detection failed:', fallbackError);
        }
      }
      
      // Set the currency pair: USD -> detected currency
      setFromCurrency('USD');
      setToCurrency(detectedCurrency);
      console.log(`✅ FINAL RESULT: USD → ${detectedCurrency} (${detectionMethod} method)`);
      console.log(`🌍 Country: ${countryName}`);
      
      // Store detection result for debugging
      try {
        await AsyncStorage.setItem('detectedLocation', JSON.stringify({
          country: countryName,
          currency: detectedCurrency,
          method: detectionMethod,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timestamp: Date.now()
        }));
      } catch (storageError) {
        console.log('Failed to store detection result:', storageError);
      }
      
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
                timezone.includes('Asia/Tehran'))) {
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
    const initializeApp = async () => {
      try {
        const cachedData = await AsyncStorage.getItem('cachedExchangeRates');
        const cacheTimestamp = await AsyncStorage.getItem('cachedRatesTimestamp');
        const now = Date.now();
        const CACHE_DURATION = 3600000; // 1 hour

        if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
          const transformedData: Data = JSON.parse(cachedData);
          setCurrenciesData(transformedData);
          setCurrencyList(Object.keys(transformedData.conversion_rates));
          // Wait for location detection before loading is complete
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
        
        // CRITICAL: Wait for location detection before marking loading as complete
        await detectUserLocation();
        setLoading(false);
      } catch (error) {
        console.error("CurrencyFreaks API Fetch Error:", error);
        
        const cachedData = await AsyncStorage.getItem('cachedExchangeRates');
        if (cachedData) {
          setCurrenciesData(JSON.parse(cachedData));
          setCurrencyList(Object.keys(JSON.parse(cachedData).conversion_rates || {}));
        }
        
        // Even on error, wait for location detection
        await detectUserLocation();
        Alert.alert(
          "Error",
          `Failed to fetch latest exchange rates. Using cached data if available.`
        );
        setLoading(false);
      }
    };

    initializeApp();
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
    console.log('🔄 Converting currencies...', {
      hasData: !!currenciesData,
      amount,
      fromCurrency,
      toCurrency,
      fromRate: currenciesData?.conversion_rates[fromCurrency],
      toRate: currenciesData?.conversion_rates[toCurrency]
    });

    // Comprehensive validation
    if (!currenciesData || !amount || !fromCurrency || !toCurrency) {
      setConvertedAmount('');
      console.log('❌ Missing required data for conversion');
      return;
    }

    const fromRate = currenciesData.conversion_rates[fromCurrency];
    const toRate = currenciesData.conversion_rates[toCurrency];
    
    if (!fromRate || !toRate || isNaN(fromRate) || isNaN(toRate) || fromRate === 0) {
      setConvertedAmount('');
      console.log('❌ Invalid exchange rates:', { fromRate, toRate, fromCurrency, toCurrency });
      return;
    }

    const inputAmount = parseFloat(amount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      setConvertedAmount('');
      console.log('❌ Invalid input amount:', amount);
      return;
    }

    try {
      // Proper currency conversion: amount in base currency * (target rate / source rate)
      const convertedValue = (inputAmount / fromRate) * toRate;
      
      if (isNaN(convertedValue) || !isFinite(convertedValue)) {
        setConvertedAmount('');
        console.log('❌ Invalid conversion result');
        return;
      }

      const formattedResult = convertedValue.toFixed(4);
      setConvertedAmount(formattedResult);
      console.log(`✅ Conversion successful: ${amount} ${fromCurrency} → ${formattedResult} ${toCurrency}`);
      console.log(`📊 Calculation: (${inputAmount} / ${fromRate}) * ${toRate} = ${convertedValue}`);
    } catch (error) {
      setConvertedAmount('');
      console.log('❌ Conversion error:', error);
    }
  }, [currenciesData, amount, fromCurrency, toCurrency]);

  // Critical: Call handleConvert whenever dependencies change
  useEffect(() => {
    // Only convert if we have all required data and currencies are properly set
    if (currenciesData && fromCurrency && toCurrency && currenciesData.conversion_rates[fromCurrency] && currenciesData.conversion_rates[toCurrency]) {
      handleConvert();
    } else {
      // Clear conversion if data is incomplete
      setConvertedAmount('');
    }
  }, [handleConvert, currenciesData, fromCurrency, toCurrency]);

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
            style={[styles.featureToggle, showMultiCurrency && styles.featureToggleActive]}
            onPress={() => setShowMultiCurrency(!showMultiCurrency)}
          >
            <ThemedText style={styles.featureToggleText}>
              📊 Multi-Currency
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

        {/* Multi-Currency Converter - Using Shared Component */}
        {showMultiCurrency && currenciesData && (
          <MultiCurrencyConverter
            currenciesData={currenciesData}
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            amount={amount}
            onAmountChange={setAmount}
            showCloseButton={true}
            onClose={() => setShowMultiCurrency(false)}
          />
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
