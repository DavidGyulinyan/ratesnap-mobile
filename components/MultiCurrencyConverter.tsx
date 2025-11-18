import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "./themed-text";
import CurrencyFlag from "./CurrencyFlag";
import CurrencyPicker from "./CurrencyPicker";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConverterHistory } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";

interface MultiCurrencyConverterProps {
  currenciesData: any;
  fromCurrency?: string;
  onFromCurrencyChange?: (currency: string) => void;
  onClose?: () => void;
  style?: any;
  inModal?: boolean; // Hide close button when used inside DashboardModal
}

interface ConversionTarget {
  id: string;
  currency: string;
}

export default function MultiCurrencyConverter({
  currenciesData,
  fromCurrency: fromCurrencyProp,
  onFromCurrencyChange,
  onClose,
  style,
  inModal = false,
}: MultiCurrencyConverterProps) {
  const [amount, setAmount] = useState<string>("1");
  const [fromCurrency, setFromCurrency] = useState<string>(fromCurrencyProp || "");
  const [showFromCurrencyPicker, setShowFromCurrencyPicker] = useState(false);
  const [conversionTargets, setConversionTargets] = useState<ConversionTarget[]>([]);
  const [conversions, setConversions] = useState<{[key: string]: number}>({});
  const [currencyList, setCurrencyList] = useState<string[]>([]);
  const [showTargetCurrencyPicker, setShowTargetCurrencyPicker] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [closeButtonPressed, setCloseButtonPressed] = useState(false);

  const { t } = useLanguage();
  const { user } = useAuth();
  const { saveConversion } = useConverterHistory();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceSecondaryColor = useThemeColor({}, 'surfaceSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const shadowColor = '#000000'; // Use black for shadows

  // Storage key for multi-currency converter state
  const STORAGE_KEY = "multiCurrencyConverterState";

  // Debug current state on every render
  console.log("🎬 MultiCurrencyConverter: Component rendering...", {
    amount,
    fromCurrency,
    targetCount: conversionTargets.length,
    targets: conversionTargets.map(t => t.currency),
    hasCurrenciesData: !!currenciesData
  });

  // Load available currencies
  useEffect(() => {
    if (currenciesData && currenciesData.conversion_rates) {
      setCurrencyList(Object.keys(currenciesData.conversion_rates));
    }
  }, [currenciesData]);

  // Update fromCurrency when prop changes
  useEffect(() => {
    if (fromCurrencyProp) {
      setFromCurrency(fromCurrencyProp);
    }
  }, [fromCurrencyProp]);

  // Update prop when fromCurrency changes
  useEffect(() => {
    if (onFromCurrencyChange && fromCurrency && fromCurrency !== fromCurrencyProp) {
      onFromCurrencyChange(fromCurrency);
    }
  }, [fromCurrency, onFromCurrencyChange, fromCurrencyProp]);

  // Calculate conversions
  const calculateConversions = useCallback(() => {
    if (!currenciesData || !amount || parseFloat(amount) <= 0 || !fromCurrency) {
      setConversions({});
      return;
    }

    const baseRate = currenciesData.conversion_rates?.[fromCurrency];
    if (!baseRate) {
      setConversions({});
      return;
    }

    const inputAmount = parseFloat(amount);
    const conversionResults: {[key: string]: number} = {};

    conversionTargets.forEach((target) => {
      if (currenciesData.conversion_rates?.[target.currency]) {
        const targetRate = currenciesData.conversion_rates[target.currency];
        const convertedAmount = (inputAmount / baseRate) * targetRate;
        conversionResults[target.currency] = convertedAmount;
      }
    });

    setConversions(conversionResults);
  }, [currenciesData, amount, fromCurrency, conversionTargets]);

  // Save conversion to history when calculations change
  const saveConversionToHistory = useCallback(async () => {
    if (user && amount && fromCurrency && conversionTargets.length > 0 && Object.keys(conversions).length > 0) {
      try {
        const targetCurrencies = conversionTargets.map(target => ({
          currency: target.currency,
          amount: conversions[target.currency] || 0,
          rate: currenciesData?.conversion_rates?.[target.currency] || 0
        }));

        await saveConversion(fromCurrency, parseFloat(amount), targetCurrencies, conversions);
      } catch (error) {
        console.error('Error saving conversion to history:', error);
      }
    }
  }, [user, amount, fromCurrency, conversionTargets, conversions, currenciesData, saveConversion]);

  useEffect(() => {
    calculateConversions();
  }, [calculateConversions]);

  // Save to history whenever conversions are calculated
  useEffect(() => {
    if (Object.keys(conversions).length > 0) {
      saveConversionToHistory();
    }
  }, [conversions, saveConversionToHistory]);

  // Load saved state from storage
  const loadSavedState = useCallback(async () => {
    try {
      console.log("🔄 Loading saved multi-currency converter state...");
      const savedState = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        const { amount: savedAmount, fromCurrency: savedFromCurrency, conversionTargets: savedTargets } = parsedState;
        
        console.log("📦 Saved state found:", { savedAmount, savedFromCurrency, savedTargetsCount: savedTargets?.length });
        
        // Load amount if available
        if (savedAmount) {
          setAmount(savedAmount);
          console.log("✅ Loaded amount:", savedAmount);
        }
        
        // Load fromCurrency if available and exists in currency list
        if (savedFromCurrency && currencyList.includes(savedFromCurrency)) {
          setFromCurrency(savedFromCurrency);
          console.log("✅ Loaded fromCurrency:", savedFromCurrency);
        }
        
        // Load target currencies only if they exist in current currency list
        if (savedTargets && Array.isArray(savedTargets)) {
          const validTargets = savedTargets.filter((target: ConversionTarget) =>
            currencyList.includes(target.currency)
          );
          
          if (validTargets.length > 0) {
            setConversionTargets(validTargets);
            console.log("✅ Loaded conversion targets:", validTargets.map(t => t.currency));
          } else {
            console.log("⚠️ No valid conversion targets found in current currency list");
          }
        }
      } else {
        console.log("ℹ️ No saved state found");
      }
    } catch (error) {
      console.error("❌ Error loading saved multi-currency converter state:", error);
    }
  }, [currencyList]);

  // Save current state to storage
  const saveCurrentState = useCallback(async () => {
    try {
      const stateToSave = {
        amount,
        fromCurrency,
        conversionTargets,
        timestamp: Date.now(),
        version: "1.0"
      };
      
      const serializedState = JSON.stringify(stateToSave);
      console.log("💾 MultiCurrencyConverter: Attempting to save state:", stateToSave);
      
      await AsyncStorage.setItem(STORAGE_KEY, serializedState);
      
      console.log("✅ MultiCurrencyConverter: Successfully saved state to AsyncStorage");
      console.log("💾 MultiCurrencyConverter: Saved multi-currency converter state:", {
        amount,
        fromCurrency,
        targetCount: conversionTargets.length,
        targets: conversionTargets.map(t => t.currency)
      });
    } catch (error) {
      console.error("❌ MultiCurrencyConverter: Error saving multi-currency converter state:", error);
      // Don't throw error to prevent breaking the user flow
    }
  }, [amount, fromCurrency, conversionTargets]);

  // Track component lifecycle
  useEffect(() => {
    console.log("🚀 MultiCurrencyConverter: Component mounted");
    
    return () => {
      console.log("🔄 MultiCurrencyConverter: Component unmounting");
    };
  }, []);

  // Test AsyncStorage functionality
  useEffect(() => {
    const testAsyncStorage = async () => {
      try {
        // Test write
        const testKey = "test_multi_currency_" + Date.now();
        const testData = { test: true, timestamp: Date.now() };
        await AsyncStorage.setItem(testKey, JSON.stringify(testData));
        console.log("✅ MultiCurrencyConverter: Test write successful");

        // Test read
        const readData = await AsyncStorage.getItem(testKey);
        if (readData) {
          console.log("✅ MultiCurrencyConverter: Test read successful:", readData);
          
          // Clean up test data
          await AsyncStorage.removeItem(testKey);
          console.log("✅ MultiCurrencyConverter: Test cleanup successful");
        } else {
          console.error("❌ MultiCurrencyConverter: Test read failed - no data found");
        }
      } catch (error) {
        console.error("❌ MultiCurrencyConverter: AsyncStorage test failed:", error);
      }
    };

    testAsyncStorage();
  }, []);

  // Fallback loading mechanism - load immediately when component mounts
  useEffect(() => {
    console.log("🚀 MultiCurrencyConverter: Component mounted, starting fallback loading");
    
    const loadStateFallback = async () => {
      try {
        console.log("📖 MultiCurrencyConverter: Attempting to read from AsyncStorage with key:", STORAGE_KEY);
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        
        if (savedState) {
          console.log("💾 MultiCurrencyConverter: Found saved state data:", savedState);
          const parsedState = JSON.parse(savedState);
          const { amount: savedAmount, fromCurrency: savedFromCurrency, conversionTargets: savedTargets } = parsedState;
          
          console.log("🔍 MultiCurrencyConverter: Parsed saved state:", {
            savedAmount,
            savedFromCurrency,
            savedTargets,
            targetCount: savedTargets?.length || 0
          });
          
          // Set state immediately, validation will happen when currencies are loaded
          if (savedAmount) {
            setAmount(savedAmount);
            console.log("✅ MultiCurrencyConverter: Set amount to:", savedAmount);
          }
          
          if (savedFromCurrency) {
            setFromCurrency(savedFromCurrency);
            console.log("✅ MultiCurrencyConverter: Set fromCurrency to:", savedFromCurrency);
          }
          
          if (savedTargets && Array.isArray(savedTargets)) {
            setConversionTargets(savedTargets);
            console.log("✅ MultiCurrencyConverter: Set conversionTargets to:", savedTargets.map(t => t.currency));
          }
          
          console.log("🔄 MultiCurrencyConverter: Fallback loading completed");
        } else {
          console.log("ℹ️ MultiCurrencyConverter: No saved state found in AsyncStorage");
        }
      } catch (error) {
        console.error("❌ MultiCurrencyConverter: Error in fallback loading:", error);
      }
    };
    
    loadStateFallback();
  }, []);

  // Enhanced persistence mechanism with force refresh
  useEffect(() => {
    console.log("🔄 MultiCurrencyConverter: Enhanced persistence mechanism running...");
    
    const forceRefreshPersistedData = async () => {
      console.log("🔄 MultiCurrencyConverter: Force refreshing persisted data...");
      
      try {
        // Force reload from AsyncStorage
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          const { amount: savedAmount, fromCurrency: savedFromCurrency, conversionTargets: savedTargets } = parsedState;
          
          console.log("🔍 MultiCurrencyConverter: Force refresh - loaded state:", {
            savedAmount,
            savedFromCurrency,
            savedTargetsCount: savedTargets?.length || 0
          });
          
          // Always set the targets, even if they might be filtered later
          if (savedTargets && Array.isArray(savedTargets)) {
            console.log("✅ MultiCurrencyConverter: Force setting conversionTargets:", savedTargets.map(t => t.currency));
            setConversionTargets(savedTargets);
          }
          
          if (savedAmount) {
            setAmount(savedAmount);
          }
          
          if (savedFromCurrency) {
            setFromCurrency(savedFromCurrency);
          }
        } else {
          console.log("ℹ️ MultiCurrencyConverter: No saved state found during force refresh");
        }
      } catch (error) {
        console.error("❌ MultiCurrencyConverter: Error during force refresh:", error);
      }
    };

    // Run immediately when component mounts
    forceRefreshPersistedData();
  }, []);

  // Validate and clean up loaded state when currency list is available
  useEffect(() => {
    if (currencyList.length > 0) {
      console.log("💱 MultiCurrencyConverter: Currency list loaded, validating loaded state...");
      console.log("📋 MultiCurrencyConverter: Current currency list length:", currencyList.length);
      console.log("🔍 MultiCurrencyConverter: Current fromCurrency:", fromCurrency);
      console.log("🎯 MultiCurrencyConverter: Current conversionTargets:", conversionTargets.map(t => t.currency));
      
      // Clean up invalid currencies in fromCurrency
      if (fromCurrency && !currencyList.includes(fromCurrency)) {
        console.log("⚠️ MultiCurrencyConverter: fromCurrency not in current list, clearing...");
        setFromCurrency("");
      }
      
      // Clean up invalid currencies in conversionTargets
      const validTargets = conversionTargets.filter(target =>
        currencyList.includes(target.currency)
      );
      
      console.log("🧹 MultiCurrencyConverter: Valid targets after filtering:", validTargets.map(t => t.currency));
      
      if (validTargets.length !== conversionTargets.length) {
        console.log("🔧 MultiCurrencyConverter: Cleaning up invalid target currencies, removing", conversionTargets.length - validTargets.length, "invalid ones");
        setConversionTargets(validTargets);
      } else {
        console.log("✅ MultiCurrencyConverter: All conversion targets are valid");
      }
      
      console.log("✅ MultiCurrencyConverter: State validation completed");
    }
  }, [currencyList, fromCurrency, conversionTargets]);

  // Save state whenever it changes
  useEffect(() => {
    console.log("💾 MultiCurrencyConverter: State changed, scheduling save...");
    console.log("📊 MultiCurrencyConverter: Current state:", {
      amount,
      fromCurrency,
      targetCount: conversionTargets.length,
      targets: conversionTargets.map(t => t.currency)
    });
    
    // Add a small delay to avoid excessive saves during rapid changes
    const timeoutId = setTimeout(() => {
      if (amount || fromCurrency || conversionTargets.length > 0) {
        saveCurrentState();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [amount, fromCurrency, conversionTargets, saveCurrentState]);

  // Add new target currency
  const addTargetCurrency = (currency: string) => {
    // Check if currency is already in the list
    const isDuplicate = conversionTargets.some(target => target.currency === currency);
    if (isDuplicate) {
      Alert.alert(
        t('error.duplicateCurrency'),
        `${currency} ${t('multi.alreadyInList')}`,
        [{ text: t('common.ok'), style: "default" }]
      );
      setShowTargetCurrencyPicker(false);
      setEditingTargetId(null);
      return;
    }

    const newTarget: ConversionTarget = {
      id: Date.now().toString(),
      currency,
    };
    setConversionTargets([...conversionTargets, newTarget]);
    setShowTargetCurrencyPicker(false);
    setEditingTargetId(null);
  };

  // Remove target currency
  const removeTargetCurrency = (id: string) => {
    setConversionTargets(conversionTargets.filter(target => target.id !== id));
  };

  // Handle "From" currency selection
  const handleFromCurrencySelect = (currency: string) => {
    setFromCurrency(currency);
    setShowFromCurrencyPicker(false);
  };

  // Handle target currency selection
  const handleTargetCurrencySelect = (currency: string) => {
    if (editingTargetId) {
      // Update existing target
      setConversionTargets(targets => 
        targets.map(target => 
          target.id === editingTargetId 
            ? { ...target, currency }
            : target
        )
      );
      setEditingTargetId(null);
    } else {
      // Add new target
      addTargetCurrency(currency);
    }
    setShowTargetCurrencyPicker(false);
  };

  // Start editing target currency
  const editTargetCurrency = (id: string) => {
    setEditingTargetId(id);
    setShowTargetCurrencyPicker(true);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[{ backgroundColor: surfaceColor, borderColor: primaryColor, shadowColor: shadowColor }, styles.card]}>
        {!inModal && (
          <View style={styles.header}>
            {onClose && (
              <TouchableOpacity
                style={[
                  { backgroundColor: surfaceSecondaryColor, shadowColor: shadowColor },
                  styles.closeButton,
                  closeButtonPressed && { backgroundColor: borderColor }
                ]}
                onPressIn={() => setCloseButtonPressed(true)}
                onPressOut={() => setCloseButtonPressed(false)}
                onPress={() => {
                  onClose();
                  setCloseButtonPressed(false);
                }}
              >
                <ThemedText style={[
                  { color: textColor },
                  styles.closeButtonText,
                  closeButtonPressed && { color: textSecondaryColor }
                ]}>×</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <ThemedText style={[{ color: textColor }, styles.label]}>Amount</ThemedText>
          <TextInput
            style={[{ backgroundColor: surfaceColor, borderColor: borderColor, color: textColor }, styles.amountInput]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder={t('converter.enterAmount')}
            placeholderTextColor={textSecondaryColor}
          />
        </View>

        {/* From Currency Input */}
        <View style={styles.inputGroup}>
          <ThemedText style={[{ color: textColor }, styles.label]}>From</ThemedText>
          <TouchableOpacity
            style={[{ backgroundColor: surfaceColor, borderColor: borderColor, shadowColor: shadowColor }, styles.currencyButton]}
            onPress={() => setShowFromCurrencyPicker(true)}
          >
            {fromCurrency ? (
              <>
                <CurrencyFlag currency={fromCurrency} size={20} />
                <ThemedText style={[{ color: textColor }, styles.currencyButtonText]}>
                  {fromCurrency}
                </ThemedText>
              </>
            ) : (
              <ThemedText style={[{ color: textSecondaryColor }, styles.currencyButtonPlaceholder]}>
                Select currency
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Target Currencies Section */}
        <View style={styles.targetsSection}>
          <View style={styles.targetsHeader}>
            <ThemedText style={[{ color: textColor }, styles.label]}>Convert To</ThemedText>
            <TouchableOpacity
              style={[{ backgroundColor: surfaceSecondaryColor, borderColor: primaryColor, shadowColor: shadowColor }, styles.addButton]}
              onPress={() => {
                setEditingTargetId(null);
                setShowTargetCurrencyPicker(true);
              }}
            >
              <ThemedText style={[{ color: primaryColor }, styles.addButtonText]}>+ Add Currency</ThemedText>
            </TouchableOpacity>
          </View>

          {conversionTargets.length === 0 ? (
            <View style={[{ backgroundColor: surfaceSecondaryColor, borderColor: borderColor }, styles.emptyState]}>
              <ThemedText style={[{ color: textSecondaryColor }, styles.emptyStateText]}>
                {t('multi.emptyState')}
              </ThemedText>
            </View>
          ) : (
            <ScrollView style={styles.targetsList} showsVerticalScrollIndicator={false}>
              {conversionTargets.map((target) => (
                <View key={target.id} style={[{ backgroundColor: surfaceSecondaryColor, borderColor: borderColor, shadowColor: shadowColor }, styles.targetItem]}>
                  <TouchableOpacity
                    style={[{ backgroundColor: surfaceColor, borderColor: borderColor, shadowColor: shadowColor }, styles.targetCurrencyButton]}
                    onPress={() => editTargetCurrency(target.id)}
                  >
                    <CurrencyFlag currency={target.currency} size={18} />
                    <ThemedText style={[{ color: textColor }, styles.targetCurrencyText]}>
                      {target.currency}
                    </ThemedText>
                  </TouchableOpacity>

                  <View style={styles.conversionResult}>
                    <ThemedText style={[{ color: primaryColor }, styles.conversionAmount]}>
                      {conversions[target.currency]?.toFixed(4) || "---"}
                    </ThemedText>
                  </View>

                  <TouchableOpacity
                    style={[{ backgroundColor: errorColor, shadowColor: errorColor }, styles.removeButton]}
                    onPress={() => removeTargetCurrency(target.id)}
                  >
                    <ThemedText style={[{ color: textColor }, styles.removeButtonText]}>×</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* From Currency Picker */}
      <CurrencyPicker
        visible={showFromCurrencyPicker}
        currencies={currencyList}
        selectedCurrency={fromCurrency}
        onSelect={handleFromCurrencySelect}
        onClose={() => setShowFromCurrencyPicker(false)}
      />

      {/* Target Currency Picker */}
      <CurrencyPicker
        visible={showTargetCurrencyPicker}
        currencies={currencyList}
        selectedCurrency={editingTargetId ? conversionTargets.find(t => t.id === editingTargetId)?.currency || "" : ""}
        onSelect={handleTargetCurrencySelect}
        onClose={() => {
          setShowTargetCurrencyPicker(false);
          setEditingTargetId(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent:'flex-end',
    marginBottom: 20,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    paddingRight: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonActive: {
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  closeButtonTextActive: {
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: "500",
  },
  currencyButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
  },
  currencyButtonText: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: "600",
  },
  currencyButtonPlaceholder: {
    fontSize: 16,
    fontStyle: "italic",
  },
  targetsSection: {
    marginTop: 16,
  },
  targetsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  targetsList: {
    maxHeight: 300,
  },
  targetItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  targetCurrencyButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  targetCurrencyText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  conversionResult: {
    marginHorizontal: 12,
    minWidth: 80,
    alignItems: "center",
  },
  conversionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});