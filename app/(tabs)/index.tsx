import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import CurrencyFlag from "@/components/CurrencyFlag";
import { detectUserLocation } from "@/components/LocationDetection";
import CurrencyConverter from "@/components/CurrencyConverter";
import MultiCurrencyConverter from "@/components/MultiCurrencyConverter";
import CurrencyPicker from "@/components/CurrencyPicker";
import SavedRates from "@/components/SavedRates";

// Popular currencies for multi-currency conversion - moved outside component to avoid re-renders
const POPULAR_CURRENCIES = [
  "AMD",
  "RUB",
  "GEL",
  "EUR",
  "CAD",
  "GBP",
  "JPY",
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
  "INR",
  "BRL",
  "ZAR",
  "AED",
];

export default function HomeScreen() {
  const [currentView, setCurrentView] = useState<"dashboard" | "converter">(
    "dashboard"
  );
  const [showMultiCurrency, setShowMultiCurrency] = useState(false);
  const [showRateAlerts, setShowRateAlerts] = useState(false);
  const [showSavedRates, setShowSavedRates] = useState(false);
  const [showFromCurrencyPicker, setShowFromCurrencyPicker] = useState(false);
  const [showToCurrencyPicker, setShowToCurrencyPicker] = useState(false);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR"); // Default to EUR, will be updated by location detection
  const [multiAmount, setMultiAmount] = useState("1");
  const [currenciesData, setCurrenciesData] = useState<any>(null);
  const [currencyList, setCurrencyList] = useState<string[]>([]);
  const [savedRates, setSavedRates] = useState<any[]>([]);
  const [rateAlerts, setRateAlerts] = useState<any[]>([]);
  const [multiCurrencyLoading, setMultiCurrencyLoading] = useState(false);

  // Rate alert form state
  const [newAlert, setNewAlert] = useState({
    fromCurrency: "USD",
    toCurrency: "EUR",
    targetRate: "",
    condition: "below" as "above" | "below",
  });

  useEffect(() => {
    // Use imported location detection utility
    const initApp = async () => {
      try {
        const detectedCurrency = await detectUserLocation();
        if (detectedCurrency && detectedCurrency !== "USD") {
          // Set USD as fromCurrency and detected currency as toCurrency
          // This creates an initial conversion: USD → user's currency
          setFromCurrency("USD");
          setToCurrency(detectedCurrency);

          // Update new alert defaults to use user's currency as well
          setNewAlert((prev) => ({
            ...prev,
            toCurrency: detectedCurrency,
          }));
        }
      } catch (error) {
        console.warn(
          "Location detection failed, using default currency:",
          error
        );
      }
    };

    initApp();
    loadExchangeRates();
    loadSavedRates();
    loadRateAlerts();
  }, []);

  const loadExchangeRates = async () => {
    try {
      setMultiCurrencyLoading(true);
      const cachedData = await AsyncStorage.getItem("cachedExchangeRates");
      if (cachedData) {
        const data = JSON.parse(cachedData);
        setCurrenciesData(data);
        setCurrencyList(Object.keys(data.conversion_rates || {}));
        console.log('📦 Loaded cached exchange rates for multi-currency');
      } else {
        // Set default currencies if no cached data
        setCurrencyList(POPULAR_CURRENCIES);
        console.log('💡 No cached data available for multi-currency');
      }
    } catch (error) {
      console.error("Error loading cached rates:", error);
      setCurrencyList(POPULAR_CURRENCIES);
    } finally {
      setMultiCurrencyLoading(false);
    }
  };

  const loadSavedRates = async () => {
    try {
      const savedRatesData = await AsyncStorage.getItem("savedRates");
      if (savedRatesData) {
        setSavedRates(JSON.parse(savedRatesData));
      }
    } catch (error) {
      console.error("Error loading saved rates:", error);
    }
  };

  const loadRateAlerts = async () => {
    try {
      const alertsData = await AsyncStorage.getItem("rateAlerts");
      if (alertsData) {
        setRateAlerts(JSON.parse(alertsData));
      }
    } catch (error) {
      console.error("Error loading rate alerts:", error);
    }
  };

  const createRateAlert = async () => {
    if (!newAlert.targetRate || parseFloat(newAlert.targetRate) <= 0) {
      alert("Please enter a valid target rate");
      return;
    }

    const newRateAlert = {
      id: `alert-${Date.now()}`,
      fromCurrency: newAlert.fromCurrency,
      toCurrency: newAlert.toCurrency,
      targetRate: parseFloat(newAlert.targetRate),
      condition: newAlert.condition,
      isActive: true,
      createdAt: Date.now(),
    };

    const updatedAlerts = [newRateAlert, ...rateAlerts];
    setRateAlerts(updatedAlerts);
    await AsyncStorage.setItem("rateAlerts", JSON.stringify(updatedAlerts));

    setNewAlert({
      fromCurrency: "USD",
      toCurrency: "EUR",
      targetRate: "",
      condition: "below",
    });

    alert("Rate alert created successfully!");
  };

  const deleteAlert = async (alertId: string) => {
    Alert.alert(
      "Delete Alert",
      "Are you sure you want to delete this rate alert?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedAlerts = rateAlerts.filter(
              (alert) => alert.id !== alertId
            );
            setRateAlerts(updatedAlerts);
            await AsyncStorage.setItem(
              "rateAlerts",
              JSON.stringify(updatedAlerts)
            );
          },
        },
      ]
    );
  };

  const deleteAllAlerts = async () => {
    if (rateAlerts.length === 0) return;

    Alert.alert(
      "Delete All Alerts",
      `Are you sure you want to delete all ${rateAlerts.length} rate alerts? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            setRateAlerts([]);
            await AsyncStorage.setItem("rateAlerts", JSON.stringify([]));
          },
        },
      ]
    );
  };

  const deleteSavedRate = async (index: number) => {
    Alert.alert(
      "Delete Saved Rate",
      "Are you sure you want to delete this saved rate?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedRates = savedRates.filter((_, i) => i !== index);
            setSavedRates(updatedRates);
            await AsyncStorage.setItem(
              "savedRates",
              JSON.stringify(updatedRates)
            );
          },
        },
      ]
    );
  };

  const deleteAllSavedRates = async () => {
    if (savedRates.length === 0) return;

    Alert.alert(
      "Delete All Saved Rates",
      `Are you sure you want to delete all ${savedRates.length} saved rates? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            setSavedRates([]);
            await AsyncStorage.setItem("savedRates", JSON.stringify([]));
          },
        },
      ]
    );
  };

  const handleFromCurrencySelect = (currency: string) => {
    setNewAlert({
      ...newAlert,
      fromCurrency: currency,
    });
    setShowFromCurrencyPicker(false);
  };

  const handleToCurrencySelect = (currency: string) => {
    setNewAlert({
      ...newAlert,
      toCurrency: currency,
    });
    setShowToCurrencyPicker(false);
  };

  const renderMainContent = () => {
    if (currentView === "converter") {
      return (
        <CurrencyConverter
          onNavigateToDashboard={() => setCurrentView("dashboard")}
        />
      );
    }

    // Dashboard view with widget system
    return (
      <ThemedView style={styles.dashboardContainer}>
        {/* Dashboard Header - Fixed at top */}
        <View style={styles.dashboardHeader}>
          <ThemedText type="title" style={styles.dashboardTitle}>
            RateSnap Dashboard
          </ThemedText>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.converterButton}
              onPress={() => setCurrentView("converter")}
            >
              <ThemedText style={styles.converterButtonText}>
                💱 Converter
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Dashboard Content */}
        <ScrollView
          style={styles.dashboardScrollView}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
        >
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setCurrentView("converter")}
            >
              <ThemedText style={styles.quickActionIcon}>💱</ThemedText>
              <ThemedText style={styles.quickActionTitle}>
                Currency Converter
              </ThemedText>
              <ThemedText style={styles.quickActionDescription}>
                Professional converter with all features
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                showMultiCurrency && styles.quickActionCardActive,
              ]}
              onPress={() => setShowMultiCurrency(!showMultiCurrency)}
            >
              <ThemedText style={styles.quickActionIcon}>📊</ThemedText>
              <ThemedText style={styles.quickActionTitle}>
                Multi Currency
              </ThemedText>
              <ThemedText style={styles.quickActionDescription}>
                {showMultiCurrency
                  ? "Hide conversion tool"
                  : "Quick conversions to 20 currencies"}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                showRateAlerts && styles.quickActionCardActive,
              ]}
              onPress={() => setShowRateAlerts(!showRateAlerts)}
            >
              <ThemedText style={styles.quickActionIcon}>🔔</ThemedText>
              <ThemedText style={styles.quickActionTitle}>
                Rate Alerts
              </ThemedText>
              <ThemedText style={styles.quickActionDescription}>
                {rateAlerts.length} active alerts -{" "}
                {showRateAlerts ? "Hide alerts" : "Set target rates"}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                showSavedRates && styles.quickActionCardActive,
              ]}
              onPress={() => setShowSavedRates(!showSavedRates)}
            >
              <ThemedText style={styles.quickActionIcon}>📋</ThemedText>
              <ThemedText style={styles.quickActionTitle}>
                Saved Rates
              </ThemedText>
              <ThemedText style={styles.quickActionDescription}>
                {savedRates.length} saved rates -{" "}
                {showSavedRates
                  ? "Hide saved rates"
                  : "Quick access to favorites"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Inline Multi-Currency Converter - Using Shared Component */}
          {showMultiCurrency && (
            <View style={styles.multiCurrencySection}>
              <View style={styles.multiCurrencyCard}>
                <View style={styles.multiCurrencyHeader}>
                  <ThemedText style={styles.multiCurrencyTitle}>
                    📊 Multi-Currency Converter
                  </ThemedText>
                </View>

                {!currenciesData ? (
                  <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyStateText}>Loading exchange rates...</ThemedText>
                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={loadExchangeRates}
                    >
                      <ThemedText style={styles.refreshButtonText}>
                        🔄 Refresh Data
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <MultiCurrencyConverter
                    key="multiCurrencyConverter-main"
                    currenciesData={currenciesData}
                    fromCurrency="USD"
                    onFromCurrencyChange={(currency) => console.log('From currency changed to:', currency)}
                    onClose={() => setShowMultiCurrency(false)}
                    style={{ marginBottom: 24 }}
                  />
                )}
              </View>
            </View>
          )}

          {/* Inline Rate Alerts */}
          {showRateAlerts && (
            <View style={styles.rateAlertsSection}>
              <View style={styles.rateAlertsCard}>
                <View style={styles.rateAlertsHeader}>
                  <ThemedText style={styles.rateAlertsTitle}>
                    🔔 Rate Alerts
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowRateAlerts(false)}
                  >
                    <ThemedText style={styles.closeButtonText}>×</ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Existing Alerts */}
                <View style={styles.existingAlerts}>
                  <ThemedText style={styles.sectionSubtitle}>
                    Your Active Alerts:
                  </ThemedText>
                  {rateAlerts.length === 0 ? (
                    <View style={styles.emptyState}>
                      <ThemedText style={styles.emptyStateText}>
                        No rate alerts set yet
                      </ThemedText>
                      <ThemedText style={styles.emptyStateSubtext}>
                        Create your first alert below
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.alertsList}>
                      {rateAlerts.slice(0, 3).map((alert, index) => (
                        <View key={index} style={styles.alertItem}>
                          <View style={styles.alertContent}>
                            <CurrencyFlag
                              currency={alert.fromCurrency}
                              size={16}
                            />
                            <ThemedText style={styles.alertArrow}>→</ThemedText>
                            <CurrencyFlag
                              currency={alert.toCurrency}
                              size={16}
                            />
                            <ThemedText style={styles.alertText}>
                              {alert.condition === "below" ? "↓" : "↑"}{" "}
                              {alert.targetRate}
                            </ThemedText>
                          </View>
                          <TouchableOpacity
                            style={styles.alertDeleteButton}
                            onPress={() => deleteAlert(alert.id)}
                          >
                            <ThemedText style={styles.alertDeleteText}>
                              🗑️
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      ))}
                      {rateAlerts.length > 3 && (
                        <TouchableOpacity
                          onPress={() => setCurrentView("converter")}
                        >
                          <ThemedText style={styles.showMoreAlertsText}>
                            View {rateAlerts.length - 3} more alerts →
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                      {rateAlerts.length > 1 && (
                        <TouchableOpacity
                          style={styles.deleteAllInlineButton}
                          onPress={deleteAllAlerts}
                        >
                          <ThemedText style={styles.deleteAllInlineText}>
                            🗑️ Delete All ({rateAlerts.length})
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {/* Create New Alert */}
                <View style={styles.createAlertSection}>
                  <ThemedText style={styles.sectionSubtitle}>
                    Create New Alert:
                  </ThemedText>
                  <View style={styles.alertForm}>
                    <View style={styles.alertFormRow}>
                      <TouchableOpacity
                        style={[styles.currencyPickerButton, { flex: 1 }]}
                        onPress={() => setShowFromCurrencyPicker(true)}
                      >
                        <CurrencyFlag
                          currency={newAlert.fromCurrency}
                          size={20}
                        />
                        <ThemedText style={styles.currencyPickerButtonText}>
                          From: {newAlert.fromCurrency}
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.currencyPickerButton, { flex: 1 }]}
                        onPress={() => setShowToCurrencyPicker(true)}
                      >
                        <CurrencyFlag
                          currency={newAlert.toCurrency}
                          size={20}
                        />
                        <ThemedText style={styles.currencyPickerButtonText}>
                          To: {newAlert.toCurrency}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.alertFormRow}>
                      <TextInput
                        style={[styles.alertInput, { flex: 1 }]}
                        value={newAlert.targetRate}
                        onChangeText={(text) =>
                          setNewAlert({ ...newAlert, targetRate: text })
                        }
                        placeholder="Target rate"
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        style={styles.conditionButton}
                        onPress={() =>
                          setNewAlert({
                            ...newAlert,
                            condition:
                              newAlert.condition === "below"
                                ? "above"
                                : "below",
                          })
                        }
                      >
                        <ThemedText style={styles.conditionButtonText}>
                          {newAlert.condition === "below"
                            ? "↓ Below"
                            : "↑ Above"}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.createAlertButton}
                      onPress={createRateAlert}
                    >
                      <ThemedText style={styles.createAlertButtonText}>
                        Create Alert
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Inline Saved Rates - Using Shared Component */}
          <SavedRates
            savedRates={savedRates}
            showSavedRates={showSavedRates}
            onToggleVisibility={() => setShowSavedRates(!showSavedRates)}
            onSelectRate={() => setCurrentView("converter")}
            onDeleteRate={(id) => deleteSavedRate(Number(id))}
            onDeleteAll={deleteAllSavedRates}
            showMoreEnabled={true}
            onShowMore={() => setCurrentView("converter")}
            maxVisibleItems={4}
            title="📋 Saved Rates"
            containerStyle={{ marginBottom: 24 }}
          />

          {/* Features Preview */}
          <View style={styles.featuresSection}>
            <ThemedText style={styles.sectionTitle}>
              ✨ Dashboard Features
            </ThemedText>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>📊</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>
                    Multi-Currency Converter
                  </ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Convert to multiple currencies instantly with live rates
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>🧮</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>
                    Calculator Integration
                  </ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Built-in calculator for amount calculations
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>📱</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>
                    Offline Mode
                  </ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Works without internet using cached rates
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>🌍</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>
                    Auto-Detect Location
                  </ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Automatically detects your country and sets default currency
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>💾</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>
                    Smart Caching
                  </ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Intelligent rate caching with offline fallbacks
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Additional Content to Enable Scrolling */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ThemedView>
    );
  };

  return (
    <>
      {renderMainContent()}

      {/* Currency Pickers for Rate Alerts */}
      <CurrencyPicker
        visible={showFromCurrencyPicker}
        currencies={currencyList}
        selectedCurrency={newAlert.fromCurrency}
        onSelect={handleFromCurrencySelect}
        onClose={() => setShowFromCurrencyPicker(false)}
      />

      <CurrencyPicker
        visible={showToCurrencyPicker}
        currencies={currencyList}
        selectedCurrency={newAlert.toCurrency}
        onSelect={handleToCurrencySelect}
        onClose={() => setShowToCurrencyPicker(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  dashboardContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  dashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
    marginRight: 12,
  },
  headerActions: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  converterButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    maxWidth: 140,
  },
  converterButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },
  dashboardScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom for better scrolling
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    padding: 24,
    paddingTop: 32,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 160,
  },
  quickActionIcon: {
    fontSize: 36,
    height: 56,
    marginBottom: 20,
    lineHeight: 56,
    textAlign: "center",
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  quickActionDescription: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  featuresSection: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 20, // Extra space at the bottom for comfortable scrolling
  },
  // Multi-Currency Styles
  multiCurrencySection: {
    marginBottom: 24,
  },
  multiCurrencyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
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
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#dc2626",
    fontWeight: "bold",
  },
  inputSection: {
    marginBottom: 16,
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
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  currencyInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9fafb",
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
  },
  conversionsGrid: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  conversionItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    marginBottom: 8,
  },
  conversionInfo: {
    marginLeft: 8,
    flex: 1,
  },
  conversionCurrency: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  conversionAmount: {
    fontSize: 11,
    color: "#6b7280",
  },
  showMoreButton: {
    backgroundColor: "#dbeafe",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 12,
  },
  showMoreButtonText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
  quickActionCardActive: {
    borderColor: "#2563eb",
    borderWidth: 2,
    backgroundColor: "#eff6ff",
  },
  // Rate Alerts Styles
  rateAlertsSection: {
    marginBottom: 24,
  },
  rateAlertsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8b5cf6",
    padding: 16,
  },
  rateAlertsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rateAlertsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  existingAlerts: {
    marginBottom: 20,
  },
  alertsList: {
    gap: 8,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
  },
  alertArrow: {
    marginHorizontal: 8,
    fontSize: 12,
    color: "#6b7280",
  },
  alertText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#8b5cf6",
  },
  createAlertSection: {
    marginTop: 16,
  },
  alertForm: {
    gap: 12,
  },
  alertFormRow: {
    flexDirection: "row",
    gap: 8,
  },
  alertInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#f9fafb",
  },
  conditionButton: {
    backgroundColor: "#8b5cf6",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  conditionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  createAlertButton: {
    backgroundColor: "#059669",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  createAlertButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  showMoreAlertsText: {
    color: "#8b5cf6",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  // Additional styles
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
  // Alert-specific styles
  alertContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  alertDeleteButton: {
    padding: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 6,
    marginLeft: 8,
  },
  alertDeleteText: {
    fontSize: 16,
  },
  deleteAllInlineButton: {
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  deleteAllInlineText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Currency picker button styles
  currencyPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    gap: 8,
  },
  currencyPickerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  // Primary conversion styles for user's currency
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
    color: "red",
    justifyContent: "center",
  },
  primaryConversionAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0369a1",
    marginLeft: 8,
  },
  // Currency Management Styles
  conversionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  // Multi-Currency Loading and Refresh
  refreshButton: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
