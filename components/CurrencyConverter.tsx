import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import Logo from "./Logo";
import CurrencyPicker from "./CurrencyPicker";
import MathCalculator from "./MathCalculator";
import CurrencyFlag from "./CurrencyFlag";
import MultiCurrencyConverter from "./MultiCurrencyConverter";
import SavedRates from "./SavedRates";
import AuthPromptModal from "./AuthPromptModal";
import RateAlertManager from "./RateAlertManager";
import notificationService from "@/lib/expoGoSafeNotificationService";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedRates } from "@/hooks/useUserData";

interface AlertSettings {
  targetRate: number;
  direction: 'above' | 'below' | 'equals';
  isActive: boolean;
  frequency: 'hourly' | 'daily';
  lastChecked?: number;
  triggered?: boolean;
  triggeredAt?: number;
  message?: string;
}

interface SavedRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: number;
  hasAlert?: boolean;
  alertSettings?: AlertSettings;
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
  const { t, tWithParams } = useLanguage();
  const [amount, setAmount] = useState<string>("1");
  const [convertedAmount, setConvertedAmount] = useState<string>("");
  const [currenciesData, setCurrenciesData] = useState<Data | null>(null);
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("EUR");
  const [loading, setLoading] = useState<boolean>(true);
  const [currencyList, setCurrencyList] = useState<string[]>([]);
  const [showSavedRates, setShowSavedRates] = useState<boolean>(false);
  const [showFromPicker, setShowFromPicker] = useState<boolean>(false);
  const [showToPicker, setShowToPicker] = useState<boolean>(false);
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [showMultiCurrency, setShowMultiCurrency] = useState<boolean>(false);
  const [showRateAlerts, setShowRateAlerts] = useState<boolean>(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState<boolean>(false);

  const { user } = useAuth();
  const { savedRates, saveRate, deleteRate, deleteAllRates } = useSavedRates();

  // Enhanced Auto-detect user's location and set default currency
  const detectUserLocation = async () => {
    try {
      console.log('🔍 Checking for saved currency conversions...');
      
      // Check for saved conversions first - PRIORITIZE SAVED DATA
      const savedFromCurrency = await AsyncStorage.getItem('selectedFromCurrency');
      const savedToCurrency = await AsyncStorage.getItem('selectedToCurrency');
      
      if (savedFromCurrency && savedToCurrency && currencyList.includes(savedFromCurrency) && currencyList.includes(savedToCurrency)) {
        setFromCurrency(savedFromCurrency);
        setToCurrency(savedToCurrency);
        console.log(`💾 Using saved preferences: ${savedFromCurrency} → ${savedToCurrency}`);
        return; // Exit early - we have saved data!
      }
      
      console.log('🔍 No saved conversions found, detecting location...');
      
      // Only clear saved preferences if no saved data exists
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
        // Set a loading timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
          setLoading(false);
          console.log('⚠️ Loading timeout reached, setting default currencies');
          // Set defaults if something goes wrong
            setFromCurrency('USD');
            setToCurrency('AMD');
            clearTimeout(loadingTimeout);
            setLoading(false);
          }, 10000); // 10 second timeout

        const cachedData = await AsyncStorage.getItem('cachedExchangeRates');
        const cacheTimestamp = await AsyncStorage.getItem('cachedRatesTimestamp');
        const now = Date.now();
        const CACHE_DURATION = 3600000; // 1 hour

        if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
          const transformedData: Data = JSON.parse(cachedData);
          setCurrenciesData(transformedData);
          setCurrencyList(Object.keys(transformedData.conversion_rates));
          console.log('📦 Loaded cached exchange rates');
          
          // Wait for currency detection/loading before marking complete
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for state updates
          clearTimeout(loadingTimeout);
          setLoading(false);
          return;
        }

        console.log('🌐 Fetching fresh exchange rates...');
        const apiUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
        const apiKey = Constants.expoConfig?.extra?.apiKey || process.env.EXPO_PUBLIC_API_KEY;
        
        console.log('API Configuration:', {
          hasApiUrl: !!apiUrl,
          hasApiKey: !!apiKey,
          apiUrl,
          useConstants: !!Constants.expoConfig?.extra
        });
        
        const response = await fetch(
          `${apiUrl}?apikey=${apiKey}`
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
        console.log('📡 Fresh exchange rates loaded');
        
        // Wait for currency detection/loading before marking complete
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for state updates
        clearTimeout(loadingTimeout);
        setLoading(false);
      } catch (error) {
        console.error("CurrencyFreaks API Fetch Error:", error);
        
        const cachedData = await AsyncStorage.getItem('cachedExchangeRates');
        if (cachedData) {
          setCurrenciesData(JSON.parse(cachedData));
          setCurrencyList(Object.keys(JSON.parse(cachedData).conversion_rates || {}));
          console.log('📦 Using cached data after API error');
        } else {
          // Set default currencies if no cache available
          setFromCurrency('USD');
          setToCurrency('AMD');
          console.log('💡 No cached data available, using defaults');
        }
        
        setLoading(false);
      }
    };

    initializeApp();
  }, []);


  // Initialize notification service when component mounts
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Check if notificationService exists
        if (!notificationService) {
          console.log('⚠️ Notification service not available');
          return;
        }

        // Handle web platform gracefully - notifications not needed for mobile app web demo
        if (Platform.OS === 'web') {
          console.log('🌐 Web platform detected - notifications will work on iOS/Android');
          return;
        }
        
        // Check if methods exist before calling
        if (typeof notificationService.requestPermissions === 'function') {
          await notificationService.requestPermissions();
        }
        
        if (typeof notificationService.getPushToken === 'function') {
          await notificationService.getPushToken();
        }
        
        if (typeof notificationService.setupNotificationListeners === 'function') {
          await notificationService.setupNotificationListeners();
        }
        
        console.log('📱 Notification service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize notifications:', error);
        // Don't throw error - let the app continue working
        // Don't show error to user for web platform or for non-critical failures
        try {
          if (Platform.OS !== 'web' && error instanceof Error) {
            // Only show alert for non-web platforms and real errors
            Alert.alert('Notification Setup', 'Some notification features may not work properly. The app will continue to work normally.');
          }
        } catch (alertError) {
          console.log('Failed to show alert:', alertError);
        }
      }
    };

    // Use setTimeout to delay initialization and prevent blocking
    const timeoutId = setTimeout(async () => {
      await initializeNotifications();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Background rate monitoring for alerts
  useEffect(() => {
    const checkRateAlerts = async () => {
      try {
        const alertsWithActiveSettings = savedRates.filter(rate =>
          rate.hasAlert && rate.alertSettings?.isActive && !rate.alertSettings.triggered
        );

        for (const rate of alertsWithActiveSettings) {
          if (!currenciesData) continue;

          const currentRate = currenciesData.conversion_rates[rate.toCurrency] /
                            currenciesData.conversion_rates[rate.fromCurrency];
          
          const targetRate = rate.alertSettings!.targetRate;
          const direction = rate.alertSettings!.direction;
          
          // Check if alert should trigger
          let shouldTrigger = false;
          switch (direction) {
            case 'above':
              shouldTrigger = currentRate > targetRate;
              break;
            case 'below':
              shouldTrigger = currentRate < targetRate;
              break;
            case 'equals':
              shouldTrigger = Math.abs(currentRate - targetRate) < 0.0001;
              break;
          }

          if (shouldTrigger) {
            // Mark as triggered and send notification
            // Note: Alert triggering logic would need to be updated to work with the new system
            // For now, just send the notification
            
            // Send immediate notification
            await notificationService.sendImmediateAlert({
              id: rate.id,
              fromCurrency: rate.fromCurrency,
              toCurrency: rate.toCurrency,
              targetRate,
              direction,
              isActive: true,
              lastChecked: Date.now(),
              triggered: false,
            });
          }
        }
      } catch (error) {
        console.error('❌ Error checking rate alerts:', error);
      }
    };

    // Check alerts every 5 minutes when the app is active
    if (savedRates.some(rate => rate.hasAlert && rate.alertSettings?.isActive)) {
      const interval = setInterval(checkRateAlerts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [savedRates, currenciesData]);

  const handleSaveRate = async (): Promise<void> => {
    if (!fromCurrency || !toCurrency || !currenciesData) return;

    const fromRate = currenciesData.conversion_rates[fromCurrency];
    const toRate = currenciesData.conversion_rates[toCurrency];
    const rate = toRate / fromRate;

    const success = await saveRate(fromCurrency, toCurrency, rate);
    if (success) {
      Alert.alert('Success', user ? 'Rate saved to your account!' : 'Rate saved locally. Sign in to sync across devices!');
    } else {
      Alert.alert('Error', 'Failed to save rate. Please try again.');
    }
  };

  const handleDeleteRate = async (id: string | number): Promise<void> => {
    const success = await deleteRate(id.toString());
    if (!success) {
      Alert.alert('Error', 'Failed to delete rate. Please try again.');
    }
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

  const updateFrequentlyUsed = async (currency: string): Promise<void> => {
    const storedUsage = await AsyncStorage.getItem("frequentlyUsedCurrencies");
    const usage = storedUsage ? JSON.parse(storedUsage) : {};
    
    // Increment usage count
    usage[currency] = (usage[currency] || 0) + 1;
    
    // Keep only top 20 most used currencies
    const sortedCurrencies = Object.entries(usage)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 20);
    
    const updatedUsage: { [key: string]: number } = {};
    sortedCurrencies.forEach(([curr, count]) => {
      updatedUsage[curr] = count as number;
    });
    
    await AsyncStorage.setItem("frequentlyUsedCurrencies", JSON.stringify(updatedUsage));
  };

  const saveLastConversion = async (amount: string, from: string, to: string): Promise<void> => {
    await AsyncStorage.setItem("lastConversion", JSON.stringify({
      amount,
      fromCurrency: from,
      toCurrency: to,
      timestamp: Date.now()
    }));
  };

  const loadLastConversion = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem("lastConversion");
      if (stored) {
        const lastConversion = JSON.parse(stored);
        // Only restore if it's less than 24 hours old
        const hoursSinceLastUse = (Date.now() - lastConversion.timestamp) / (1000 * 60 * 60);
        if (hoursSinceLastUse < 24) {
          if (lastConversion.amount) setAmount(lastConversion.amount);
          if (lastConversion.fromCurrency && currencyList.includes(lastConversion.fromCurrency)) {
            setFromCurrency(lastConversion.fromCurrency);
          }
          if (lastConversion.toCurrency && currencyList.includes(lastConversion.toCurrency)) {
            setToCurrency(lastConversion.toCurrency);
          }
        }
      }
    } catch (error) {
      console.log('Failed to load last conversion:', error);
    }
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

  // Load last conversion when currencies are loaded
  useEffect(() => {
    if (currencyList.length > 0) {
      loadLastConversion();
    }
  }, [currencyList]);


  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>{t('common.loading')}</ThemedText>
      </ThemedView>
    );
  }

  return (
      <ScrollView style={styles.container}>
        {/* Navigation Header */}
        {onNavigateToDashboard && (
          <TouchableOpacity style={styles.navHeader} onPress={onNavigateToDashboard}>
            <ThemedText style={styles.navHeaderText}>{t('converter.backToDashboard')}</ThemedText>
          </TouchableOpacity>
        )}

        {/* Enhanced Header with Features */}
        <View style={styles.enhancedHeader}>
          <View style={styles.headerLogoContainer}>
            <Logo size={32} showText={true} textSize={20} />
          </View>
          <ThemedText type="title" style={styles.mainTitle}>
            {t('converter.subtitle')}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {t('dashboard.features.description')}
          </ThemedText>
        </View>


        <View style={styles.updateInfo}>
          <ThemedText style={styles.updateText}>
            {t('time.lastUpdate')}: {currenciesData?.time_last_update_utc}
          </ThemedText>
          <ThemedText style={styles.updateText}>
            {t('time.nextUpdate')}: {currenciesData?.time_next_update_utc}
          </ThemedText>
        </View>

        {/* Main Converter Box - Enhanced */}
        <View style={styles.mainConverterBox}>
          <ThemedText style={styles.converterTitle}>💱 {t('converter.standard')}</ThemedText>
          
          <View style={styles.convertedAmountBox}>
            <ThemedText style={styles.convertedAmountText}>
              {amount && parseFloat(amount) > 0 && convertedAmount
                ? tWithParams('converter.conversionResult', {
                    amount,
                    fromCurrency,
                    convertedAmount,
                    toCurrency
                  })
                : fromCurrency && toCurrency && currenciesData
                  ? tWithParams('converter.exchangeRateResult', {
                      rateLabel: t('converter.exchangeRate'),
                      fromCurrency,
                      rate: getExchangeRate().toFixed(4),
                      toCurrency
                    })
                  : t('converter.selectCurrencies')}
            </ThemedText>
          </View>

          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder={t('converter.enterAmount')}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.calculatorButton}
              onPress={() => setShowCalculator(true)}
            >
              <ThemedText style={styles.calculatorButtonText}>🧮 {t('converter.calculator')}</ThemedText>
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
                  {t('converter.from')}: {fromCurrency}
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
                  {t('converter.to')}: {toCurrency}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveRate}>
            <ThemedText style={styles.saveButtonText}>
              ⭐ {t('converter.saveRate')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Multi-Currency Converter - Using Shared Component */}
        {showMultiCurrency && currenciesData && (
          <MultiCurrencyConverter
            currenciesData={currenciesData}
            fromCurrency={fromCurrency}
            onFromCurrencyChange={setFromCurrency}
            onClose={() => setShowMultiCurrency(false)}
          />
        )}

        {/* Saved Rates Section - Using Shared Component */}
        <SavedRates
          savedRates={savedRates}
          showSavedRates={showSavedRates}
          onToggleVisibility={() => setShowSavedRates(!showSavedRates)}
          onSelectRate={handleSelectRate}
          onDeleteRate={handleDeleteRate}
          onDeleteAll={async () => {
            const success = await deleteAllRates();
            if (!success) {
              Alert.alert('Error', 'Failed to delete all rates. Please try again.');
            }
          }}
          showMoreEnabled={false}
          title={`⭐ ${t('saved.title')}`}
        />

        {/* Rate Alert Manager Section */}
        {showRateAlerts && (
          <RateAlertManager
            savedRates={savedRates.map(rate => ({
              id: rate.id,
              fromCurrency: rate.from_currency,
              toCurrency: rate.to_currency,
              rate: rate.rate,
              timestamp: new Date(rate.created_at).getTime(),
              hasAlert: false, // This might need to be updated based on actual alert data
              alertSettings: undefined
            }))}
            onRatesUpdate={() => {
              // The hook will automatically update when rates change
            }}
            currenciesData={currenciesData}
          />
        )}

        {/* Currency Pickers */}
        <CurrencyPicker
          visible={showFromPicker}
          currencies={mergedCurrencyList}
          selectedCurrency={fromCurrency}
          onSelect={(currency) => setFromCurrency(currency)}
          onClose={() => setShowFromPicker(false)}
          onCurrencySelected={(currency) => {
            updateFrequentlyUsed(currency);
            saveLastConversion(amount, currency, toCurrency);
          }}
        />

        <CurrencyPicker
          visible={showToPicker}
          currencies={mergedCurrencyList}
          selectedCurrency={toCurrency}
          onSelect={(currency) => setToCurrency(currency)}
          onClose={() => setShowToPicker(false)}
          onCurrencySelected={(currency) => {
            updateFrequentlyUsed(currency);
            saveLastConversion(amount, fromCurrency, currency);
          }}
        />

        {/* Calculator Modal */}
        <MathCalculator
          visible={showCalculator}
          onClose={() => setShowCalculator(false)}
          onResult={handleCalculatorResult}
        />

        {/* Auth Prompt Modal */}
        <AuthPromptModal
          visible={showAuthPrompt}
          onClose={() => setShowAuthPrompt(false)}
          title="Create account to sync and enable alerts"
          message="Sign up to save your data and enable premium features"
          feature="sync"
        />
      </ScrollView>
  );
}

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
  headerLogoContainer: {
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 22,
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
});
