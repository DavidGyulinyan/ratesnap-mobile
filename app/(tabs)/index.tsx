import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import CurrencyFlag from '@/components/CurrencyFlag';
import CurrencyConverter from '@/components/CurrencyConverter';

// Popular currencies for multi-currency conversion - moved outside component to avoid re-renders
const POPULAR_CURRENCIES = [
  'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD', 'MXN',
  'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR', 'AED', 'AMD'
];

export default function HomeScreen() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'converter'>('dashboard');
  const [showMultiCurrency, setShowMultiCurrency] = useState(false);
  const [showRateAlerts, setShowRateAlerts] = useState(false);
  const [showSavedRates, setShowSavedRates] = useState(false);
  const [multiAmount, setMultiAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [conversions, setConversions] = useState<{[key: string]: number}>({});
  const [currenciesData, setCurrenciesData] = useState<any>(null);
  const [savedRates, setSavedRates] = useState<any[]>([]);
  const [rateAlerts, setRateAlerts] = useState<any[]>([]);

  // Rate alert form state
  const [newAlert, setNewAlert] = useState({
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    targetRate: '',
    condition: 'below' as 'above' | 'below'
  });

  // Auto-detect user's location and set default currency
  const detectUserLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const countryToCurrency: { [key: string]: string } = {
        'US': 'USD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
        'JP': 'JPY', 'CN': 'CNY', 'CA': 'CAD', 'AU': 'AUD', 'CH': 'CHF', 'SE': 'SEK',
        'NZ': 'NZD', 'SG': 'SGD', 'HK': 'HKD', 'NO': 'NOK', 'KR': 'KRW', 'TR': 'TRY',
        'RU': 'RUB', 'IN': 'INR', 'BR': 'BRL', 'ZA': 'ZAR', 'AE': 'AED', 'AM': 'AMD'
      };
      
      const detectedCurrency = countryToCurrency[data.country_code] || 'USD';
      setFromCurrency(detectedCurrency);
    } catch (error) {
      console.error('Location detection failed:', error);
    }
  };

  useEffect(() => {
    detectUserLocation();
    loadExchangeRates();
    loadSavedRates();
    loadRateAlerts();
  }, []);

  const loadExchangeRates = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('cachedExchangeRates');
      if (cachedData) {
        const data = JSON.parse(cachedData);
        setCurrenciesData(data);
      }
    } catch (error) {
      console.error('Error loading cached rates:', error);
    }
  };

  const loadSavedRates = async () => {
    try {
      const savedRatesData = await AsyncStorage.getItem('savedRates');
      if (savedRatesData) {
        setSavedRates(JSON.parse(savedRatesData));
      }
    } catch (error) {
      console.error('Error loading saved rates:', error);
    }
  };

  const loadRateAlerts = async () => {
    try {
      const alertsData = await AsyncStorage.getItem('rateAlerts');
      if (alertsData) {
        setRateAlerts(JSON.parse(alertsData));
      }
    } catch (error) {
      console.error('Error loading rate alerts:', error);
    }
  };

  const createRateAlert = async () => {
    if (!newAlert.targetRate || parseFloat(newAlert.targetRate) <= 0) {
      alert('Please enter a valid target rate');
      return;
    }

    const newRateAlert = {
      id: `alert-${Date.now()}`,
      fromCurrency: newAlert.fromCurrency,
      toCurrency: newAlert.toCurrency,
      targetRate: parseFloat(newAlert.targetRate),
      condition: newAlert.condition,
      isActive: true,
      createdAt: Date.now()
    };

    const updatedAlerts = [newRateAlert, ...rateAlerts];
    setRateAlerts(updatedAlerts);
    await AsyncStorage.setItem('rateAlerts', JSON.stringify(updatedAlerts));
    
    setNewAlert({
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      targetRate: '',
      condition: 'below'
    });
    
    alert('Rate alert created successfully!');
  };

  const calculateMultiConversions = useCallback(() => {
    if (!currenciesData || !multiAmount || parseFloat(multiAmount) <= 0) {
      setConversions({});
      return;
    }

    const fromRate = currenciesData.conversion_rates?.[fromCurrency];
    if (!fromRate) {
      setConversions({});
      return;
    }

    const inputAmount = parseFloat(multiAmount);
    const conversionResults: {[key: string]: number} = {};

    POPULAR_CURRENCIES.forEach(currency => {
      if (currenciesData.conversion_rates?.[currency]) {
        const toRate = currenciesData.conversion_rates[currency];
        const convertedAmount = (inputAmount / fromRate) * toRate;
        conversionResults[currency] = convertedAmount;
      }
    });

    setConversions(conversionResults);
  }, [currenciesData, multiAmount, fromCurrency]); // Removed POPULAR_CURRENCIES from deps

  useEffect(() => {
    calculateMultiConversions();
  }, [calculateMultiConversions]);

  const renderMainContent = () => {
    if (currentView === 'converter') {
      return (
        <CurrencyConverter
          onNavigateToDashboard={() => setCurrentView('dashboard')}
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
              onPress={() => setCurrentView('converter')}
            >
              <ThemedText style={styles.converterButtonText}>
                💱 Open Converter
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
              onPress={() => setCurrentView('converter')}
            >
              <ThemedText style={styles.quickActionIcon}>💱</ThemedText>
              <ThemedText style={styles.quickActionTitle}>Currency Converter</ThemedText>
              <ThemedText style={styles.quickActionDescription}>
                Professional converter with all features
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, showMultiCurrency && styles.quickActionCardActive]}
              onPress={() => setShowMultiCurrency(!showMultiCurrency)}
            >
              <ThemedText style={styles.quickActionIcon}>📊</ThemedText>
              <ThemedText style={styles.quickActionTitle}>Multi-Currency</ThemedText>
              <ThemedText style={styles.quickActionDescription}>
                {showMultiCurrency ? 'Hide conversion tool' : 'Quick conversions to 20 currencies'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, showRateAlerts && styles.quickActionCardActive]}
              onPress={() => setShowRateAlerts(!showRateAlerts)}
            >
              <ThemedText style={styles.quickActionIcon}>🔔</ThemedText>
              <ThemedText style={styles.quickActionTitle}>Rate Alerts</ThemedText>
              <ThemedText style={styles.quickActionDescription}>
                {rateAlerts.length} active alerts - {showRateAlerts ? 'Hide alerts' : 'Set target rates'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, showSavedRates && styles.quickActionCardActive]}
              onPress={() => setShowSavedRates(!showSavedRates)}
            >
              <ThemedText style={styles.quickActionIcon}>📋</ThemedText>
              <ThemedText style={styles.quickActionTitle}>Saved Rates</ThemedText>
              <ThemedText style={styles.quickActionDescription}>
                {savedRates.length} saved rates - {showSavedRates ? 'Hide saved rates' : 'Quick access to favorites'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Inline Multi-Currency Converter */}
          {showMultiCurrency && (
            <View style={styles.multiCurrencySection}>
              <View style={styles.multiCurrencyCard}>
                <View style={styles.multiCurrencyHeader}>
                  <ThemedText style={styles.multiCurrencyTitle}>📊 Multi-Currency Converter</ThemedText>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowMultiCurrency(false)}
                  >
                    <ThemedText style={styles.closeButtonText}>×</ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Input Section */}
                <View style={styles.inputSection}>
                  <View style={styles.amountInputContainer}>
                    <ThemedText style={styles.inputLabel}>Amount:</ThemedText>
                    <TextInput
                      style={styles.amountInput}
                      value={multiAmount}
                      onChangeText={setMultiAmount}
                      keyboardType="numeric"
                      placeholder="Enter amount"
                    />
                  </View>

                  <View style={styles.currencyInputContainer}>
                    <ThemedText style={styles.inputLabel}>From:</ThemedText>
                    <TouchableOpacity style={styles.currencyInput}>
                      <CurrencyFlag currency={fromCurrency} size={16} />
                      <ThemedText style={styles.currencyInputText}>{fromCurrency}</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Results Section */}
                <View style={styles.resultsSection}>
                  <ThemedText style={styles.resultsTitle}>
                    {multiAmount} {fromCurrency} converts to:
                  </ThemedText>
                  <View style={styles.conversionsGrid}>
                    {Object.entries(conversions).slice(0, 8).map(([currency, amount]) => (
                      <View key={currency} style={styles.conversionItem}>
                        <CurrencyFlag currency={currency} size={16} />
                        <View style={styles.conversionInfo}>
                          <ThemedText style={styles.conversionCurrency}>{currency}</ThemedText>
                          <ThemedText style={styles.conversionAmount}>{amount.toFixed(2)}</ThemedText>
                        </View>
                      </View>
                    ))}
                  </View>
                  
                  {Object.keys(conversions).length > 8 && (
                    <TouchableOpacity
                      style={styles.showMoreButton}
                      onPress={() => setCurrentView('converter')}
                    >
                      <ThemedText style={styles.showMoreButtonText}>
                        View all {Object.keys(conversions).length} conversions →
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Inline Rate Alerts */}
          {showRateAlerts && (
            <View style={styles.rateAlertsSection}>
              <View style={styles.rateAlertsCard}>
                <View style={styles.rateAlertsHeader}>
                  <ThemedText style={styles.rateAlertsTitle}>🔔 Rate Alerts</ThemedText>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowRateAlerts(false)}
                  >
                    <ThemedText style={styles.closeButtonText}>×</ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Existing Alerts */}
                <View style={styles.existingAlerts}>
                  <ThemedText style={styles.sectionSubtitle}>Your Active Alerts:</ThemedText>
                  {rateAlerts.length === 0 ? (
                    <View style={styles.emptyState}>
                      <ThemedText style={styles.emptyStateText}>No rate alerts set yet</ThemedText>
                      <ThemedText style={styles.emptyStateSubtext}>Create your first alert below</ThemedText>
                    </View>
                  ) : (
                    <View style={styles.alertsList}>
                      {rateAlerts.slice(0, 3).map((alert, index) => (
                        <View key={index} style={styles.alertItem}>
                          <CurrencyFlag currency={alert.fromCurrency} size={16} />
                          <ThemedText style={styles.alertArrow}>→</ThemedText>
                          <CurrencyFlag currency={alert.toCurrency} size={16} />
                          <ThemedText style={styles.alertText}>
                            {alert.condition === 'below' ? '↓' : '↑'} {alert.targetRate}
                          </ThemedText>
                        </View>
                      ))}
                      {rateAlerts.length > 3 && (
                        <TouchableOpacity onPress={() => setCurrentView('converter')}>
                          <ThemedText style={styles.showMoreAlertsText}>
                            View {rateAlerts.length - 3} more alerts →
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {/* Create New Alert */}
                <View style={styles.createAlertSection}>
                  <ThemedText style={styles.sectionSubtitle}>Create New Alert:</ThemedText>
                  <View style={styles.alertForm}>
                    <View style={styles.alertFormRow}>
                      <TextInput
                        style={[styles.alertInput, { flex: 1 }]}
                        value={newAlert.fromCurrency}
                        onChangeText={(text) => setNewAlert({...newAlert, fromCurrency: text.toUpperCase()})}
                        placeholder="USD"
                        maxLength={3}
                      />
                      <TextInput
                        style={[styles.alertInput, { flex: 1 }]}
                        value={newAlert.toCurrency}
                        onChangeText={(text) => setNewAlert({...newAlert, toCurrency: text.toUpperCase()})}
                        placeholder="EUR"
                        maxLength={3}
                      />
                    </View>
                    <View style={styles.alertFormRow}>
                      <TextInput
                        style={[styles.alertInput, { flex: 1 }]}
                        value={newAlert.targetRate}
                        onChangeText={(text) => setNewAlert({...newAlert, targetRate: text})}
                        placeholder="Target rate"
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        style={styles.conditionButton}
                        onPress={() => setNewAlert({...newAlert, condition: newAlert.condition === 'below' ? 'above' : 'below'})}
                      >
                        <ThemedText style={styles.conditionButtonText}>
                          {newAlert.condition === 'below' ? '↓ Below' : '↑ Above'}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.createAlertButton} onPress={createRateAlert}>
                      <ThemedText style={styles.createAlertButtonText}>Create Alert</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Inline Saved Rates */}
          {showSavedRates && (
            <View style={styles.savedRatesSection}>
              <View style={styles.savedRatesCard}>
                <View style={styles.savedRatesHeader}>
                  <ThemedText style={styles.savedRatesTitle}>📋 Saved Rates</ThemedText>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowSavedRates(false)}
                  >
                    <ThemedText style={styles.closeButtonText}>×</ThemedText>
                  </TouchableOpacity>
                </View>

                {savedRates.length === 0 ? (
                  <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyStateText}>No saved rates yet</ThemedText>
                    <ThemedText style={styles.emptyStateSubtext}>
                      Convert currencies in the main converter to save rates
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.savedRatesList}>
                    <ThemedText style={styles.sectionSubtitle}>Your Saved Rates:</ThemedText>
                    {savedRates.slice(0, 4).map((rate, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.savedRateItem}
                        onPress={() => setCurrentView('converter')}
                      >
                        <CurrencyFlag currency={rate.fromCurrency} size={16} />
                        <ThemedText style={styles.savedRateArrow}>→</ThemedText>
                        <CurrencyFlag currency={rate.toCurrency} size={16} />
                        <View style={styles.savedRateInfo}>
                          <ThemedText style={styles.savedRateTitle}>
                            {rate.fromCurrency} → {rate.toCurrency}
                          </ThemedText>
                          <ThemedText style={styles.savedRateValue}>{rate.rate.toFixed(4)}</ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {savedRates.length > 4 && (
                      <TouchableOpacity onPress={() => setCurrentView('converter')}>
                        <ThemedText style={styles.showMoreSavedRatesText}>
                          View all {savedRates.length} saved rates →
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Status Section */}
          <View style={styles.statusSection}>
            <View style={styles.statusCard}>
              <ThemedText style={styles.statusTitle}>📱 App Status</ThemedText>
              <View style={styles.statusRow}>
                <View style={styles.statusIndicator} />
                <ThemedText style={styles.statusText}>Online - Real-time rates</ThemedText>
              </View>
              <ThemedText style={styles.lastUpdate}>
                Last updated: {new Date().toLocaleTimeString()}
              </ThemedText>
            </View>
          </View>

          {/* Features Preview */}
          <View style={styles.featuresSection}>
            <ThemedText style={styles.sectionTitle}>✨ Dashboard Features</ThemedText>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>🎛️</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>Widget System</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Customize your dashboard with different widgets
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>📊</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>Multi-Currency Converter</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Convert to multiple currencies instantly with live rates
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>🧮</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>Calculator Integration</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Built-in calculator for amount calculations
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>📱</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>Offline Mode</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Works without internet using cached rates
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>🌍</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>Auto-Detect Location</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Automatically detects your country and sets default currency
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>💾</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>Smart Caching</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Intelligent rate caching with offline fallbacks
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>🎨</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>Modern UI</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Beautiful, responsive design with smooth animations
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

  return renderMainContent();
}

const styles = StyleSheet.create({
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  converterButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  converterButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  dashboardScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom for better scrolling
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  statusSection: {
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#6b7280',
  },
  featuresSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6b7280',
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  multiCurrencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  multiCurrencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: 'bold',
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
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  currencyInputText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  resultsSection: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  conversionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  conversionItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    marginBottom: 8,
  },
  conversionInfo: {
    marginLeft: 8,
    flex: 1,
  },
  conversionCurrency: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  conversionAmount: {
    fontSize: 11,
    color: '#6b7280',
  },
  showMoreButton: {
    backgroundColor: '#dbeafe',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  showMoreButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionCardActive: {
    borderColor: '#2563eb',
    borderWidth: 2,
    backgroundColor: '#eff6ff',
  },
  // Rate Alerts Styles
  rateAlertsSection: {
    marginBottom: 24,
  },
  rateAlertsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    padding: 16,
  },
  rateAlertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rateAlertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  existingAlerts: {
    marginBottom: 20,
  },
  alertsList: {
    gap: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  alertArrow: {
    marginHorizontal: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  alertText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  createAlertSection: {
    marginTop: 16,
  },
  alertForm: {
    gap: 12,
  },
  alertFormRow: {
    flexDirection: 'row',
    gap: 8,
  },
  alertInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  conditionButton: {
    backgroundColor: '#8b5cf6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  conditionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  createAlertButton: {
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createAlertButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Saved Rates Styles
  savedRatesSection: {
    marginBottom: 24,
  },
  savedRatesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    padding: 16,
  },
  savedRatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  savedRatesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  savedRatesList: {
    gap: 8,
  },
  savedRateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fefbf3',
    borderRadius: 6,
  },
  savedRateArrow: {
    marginHorizontal: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  savedRateInfo: {
    marginLeft: 8,
    flex: 1,
  },
  savedRateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  savedRateValue: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  showMoreAlertsText: {
    color: '#8b5cf6',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  showMoreSavedRatesText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  // Additional styles
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
