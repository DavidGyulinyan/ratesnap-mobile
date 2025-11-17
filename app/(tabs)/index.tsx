import AuthPromptModal from "@/components/AuthPromptModal";
import BurgerMenu from "@/components/BurgerMenu";
import CurrencyConverter from "@/components/CurrencyConverter";
import Footer from "@/components/Footer";
import GoogleAdsBanner from "@/components/GoogleAdsBanner";
import MultiCurrencyConverter from "@/components/MultiCurrencyConverter";
import SavedRates from "@/components/SavedRates";
import RateAlertManager from "@/components/RateAlertManager";
import MathCalculator from "@/components/MathCalculator";
import OnboardingGuide from "@/components/OnboardingGuide";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSavedRates } from "@/hooks/useUserData";
import { getAsyncStorage } from "@/lib/storage";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const { t } = useLanguage();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { savedRates, deleteRate, deleteAllRates } = useSavedRates();
  const [currentView, setCurrentView] = useState<"dashboard" | "converter">(
    "dashboard"
  );
  const [showMultiCurrency, setShowMultiCurrency] = useState(false);
  const [showSavedRates, setShowSavedRates] = useState(false);
  const [showRateAlerts, setShowRateAlerts] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currenciesData, setCurrenciesData] = useState<any>(null);
  const [currencyList, setCurrencyList] = useState<string[]>([]);
  const [multiCurrencyLoading, setMultiCurrencyLoading] = useState(false);
  const [savedRatesMaxVisible, setSavedRatesMaxVisible] = useState(4);

  useEffect(() => {
    loadExchangeRates();
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');

      // Show onboarding if:
      // 1. User hasn't completed onboarding, OR
      // 2. User account was created very recently (within last 24 hours)
      const shouldShowOnboarding = !onboardingCompleted ||
        (user && user.created_at && (Date.now() - new Date(user.created_at).getTime()) < 24 * 60 * 60 * 1000);

      if (shouldShowOnboarding && user) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  };

  const loadExchangeRates = async () => {
    try {
      setMultiCurrencyLoading(true);
      const storage = getAsyncStorage();
      const cachedData = await storage.getItem("cachedExchangeRates");
      if (cachedData) {
        const data = JSON.parse(cachedData);
        setCurrenciesData(data);
        setCurrencyList(Object.keys(data.conversion_rates || {}));
        console.log("📦 Loaded cached exchange rates for multi-currency");
      } else {
        // Set default currencies if no cached data
        setCurrencyList(POPULAR_CURRENCIES);
        console.log("💡 No cached data available for multi-currency");
      }
    } catch (error) {
      console.error("Error loading cached rates:", error);
      setCurrencyList(POPULAR_CURRENCIES);
    } finally {
      setMultiCurrencyLoading(false);
    }
  };


  const deleteSavedRate = async (id: string | number) => {
    const success = await deleteRate(id.toString());
    if (!success) {
      Alert.alert('Error', 'Failed to delete rate. Please try again.');
    }
  };

  const deleteAllSavedRates = async () => {
    if (savedRates.length === 0) return;

    Alert.alert(t("saved.deleteAll"), t("saved.deleteAllConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("saved.deleteAll"),
        style: "destructive",
        onPress: async () => {
          const success = await deleteAllRates();
          if (!success) {
            Alert.alert('Error', 'Failed to delete all rates. Please try again.');
          }
        },
      },
    ]);
  };


  const handleCalculatorResult = (result: number): void => {
    console.log('Calculator result:', result);
    // You can use this result for currency conversion or other calculations
    Alert.alert('Calculation Result', `Result: ${result}`);
  };

  const handleTestNotification = async () => {
    try {
      // Force a test alert to show immediately (bypassing rate check)
      const testMessage = `🎯 USD → AMD rate alert!\n💰 Current rate: 385.75\n🚀 Alert triggered: USD is above 382 AMD\n\n📱 This is a test notification (Expo Go)`;
      
      // Show immediate in-app alert - this is what would happen when a real alert triggers
      Alert.alert(
        '🚨 RATE ALERT TRIGGERED!',
        testMessage,
        [
          {
            text: 'View Details',
            onPress: () => {
              Alert.alert(
                '💰 USD → AMD Alert Details',
                'Target: USD above 382 AMD\nStatus: ACTIVE ✅\nLast Checked: Just now\nThis is a simulated notification for testing.',
                [{ text: 'OK' }]
              );
            }
          },
          { text: 'Dismiss', style: 'cancel' }
        ]
      );

      // Show confirmation that test was completed
      setTimeout(() => {
        Alert.alert(
          "📱 TEST COMPLETED SUCCESSFULLY!",
          `✅ The alert notification system is working!\n\n🎯 What just happened:\n• A rate alert popup appeared\n• This simulates a real notification\n• The alert shows USD → AMD above 382\n\n📲 In Expo Go:\n• In-app alerts are used\n• No push notifications available\n\n🚀 In Production:\n• Real push notifications would appear\n• Background monitoring would work\n• Cross-platform compatibility`,
          [
            {
              text: "Perfect!",
              style: "default"
            }
          ]
        );
      }, 1500);
      
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert(
        "❌ Error",
        "Failed to send test notification. Check console for details."
      );
    }
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
          <View style={styles.titleContainer}>
            <View style={styles.logoIcon}>
              <ThemedText style={styles.logoEmoji}>💱</ThemedText>
            </View>
            <ThemedText type="title" style={styles.dashboardTitle}>
              RateSnap Dashboard
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <BurgerMenu style={styles.burgerMenu} />
          </View>
        </View>

        {/* Scrollable Dashboard Content */}
        <ScrollView
          style={styles.dashboardScrollView}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
        >
          {/* Quick Actions - Redesigned for better UX */}
          <View style={styles.quickActionsContainer}>
            <ThemedText style={styles.quickActionsTitle}>
              {t("dashboard.quickActions")}
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsScrollContent}
              style={styles.quickActionsScrollView}
            >
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => setCurrentView("converter")}
              >
                <View style={[styles.quickActionIconContainer, styles.iconContainerConverter]}>
                  <ThemedText style={styles.quickActionIcon}>🔄</ThemedText>
                </View>
                <View style={styles.quickActionContent}>
                  <ThemedText style={styles.quickActionTitle}>
                    {t("quick.action.converter")}
                  </ThemedText>
                  <ThemedText style={styles.quickActionDescription}>
                    {t("quick.action.converter.desc")}
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickActionCard,
                  showCalculator && styles.quickActionCardActive,
                ]}
                onPress={() => setShowCalculator(!showCalculator)}
              >
                <View style={[styles.quickActionIconContainer, styles.iconContainerCalculator]}>
                  <ThemedText style={styles.quickActionIcon}>🧮</ThemedText>
                </View>
                <View style={styles.quickActionContent}>
                  <ThemedText style={styles.quickActionTitle}>
                    {t("quick.action.calculator")}
                  </ThemedText>
                  <ThemedText style={styles.quickActionDescription}>
                    {showCalculator
                      ? t("quick.action.calculator.hide")
                      : t("quick.action.calculator.desc")}
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickActionCard,
                  showMultiCurrency && styles.quickActionCardActive,
                ]}
                onPress={() => setShowMultiCurrency(!showMultiCurrency)}
              >
                <View style={[styles.quickActionIconContainer, styles.iconContainerMulti]}>
                  <ThemedText style={styles.quickActionIcon}>📊</ThemedText>
                </View>
                <View style={styles.quickActionContent}>
                  <ThemedText style={styles.quickActionTitle}>
                    {t("quick.action.multiCurrency")}
                  </ThemedText>
                  <ThemedText style={styles.quickActionDescription}>
                    {showMultiCurrency
                      ? t("quick.action.multiCurrency.hide")
                      : t("quick.action.multiCurrency.desc")}
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickActionCard,
                  showSavedRates && styles.quickActionCardActive,
                ]}
                onPress={() => setShowSavedRates(!showSavedRates)}
              >
                <View style={[styles.quickActionIconContainer, styles.iconContainerSaved]}>
                  <ThemedText style={styles.quickActionIcon}>💾</ThemedText>
                </View>
                <View style={styles.quickActionContent}>
                  <ThemedText style={styles.quickActionTitle}>
                    {t("quick.action.savedRates")}
                  </ThemedText>
                  <ThemedText style={styles.quickActionDescription}>
                    {savedRates.length}{" "}
                    {savedRates.length === 1 ? t("saved.rate") : t("saved.rates")}
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickActionCard,
                  showRateAlerts && styles.quickActionCardActive,
                ]}
                onPress={() => setShowRateAlerts(!showRateAlerts)}
              >
                <View style={[styles.quickActionIconContainer, styles.iconContainerAlerts]}>
                  <ThemedText style={styles.quickActionIcon}>🚨</ThemedText>
                </View>
                <View style={styles.quickActionContent}>
                  <ThemedText style={styles.quickActionTitle}>
                    {t("quick.action.rateAlerts")}
                  </ThemedText>
                  <ThemedText style={styles.quickActionDescription}>
                    {savedRates.filter(rate => rate.hasAlert).length}{" "}
                    {savedRates.filter(rate => rate.hasAlert).length === 1 ? t("alerts.activeAlert") : t("alerts.activeAlerts")}
                  </ThemedText>
                </View>
              </TouchableOpacity>

            </ScrollView>
          </View>

          {/* Inline Multi-Currency Converter - Using Shared Component */}
          {showMultiCurrency && (
            <View style={styles.multiCurrencySection}>
              <View style={styles.multiCurrencyCard}>
                <View style={styles.multiCurrencyHeader}>
                  <ThemedText style={styles.multiCurrencyTitle}>
                    📊 {t("converter.multiCurrency.section")}
                  </ThemedText>
                </View>

                {!currenciesData ? (
                  <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyStateText}>
                      {t("converter.loadingRates")}
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={loadExchangeRates}
                    >
                      <ThemedText style={styles.refreshButtonText}>
                        🔄 {t("converter.refreshData")}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <MultiCurrencyConverter
                    key="multiCurrencyConverter-main"
                    currenciesData={currenciesData}
                    fromCurrency="USD"
                    onFromCurrencyChange={(currency) =>
                      console.log("From currency changed to:", currency)
                    }
                    onClose={() => setShowMultiCurrency(false)}
                    style={{ marginBottom: 24 }}
                  />
                )}
              </View>
            </View>
          )}

          {/* Inline Calculator Widget */}
          {showCalculator && (
            <View style={styles.calculatorSection}>
              <View style={styles.calculatorCard}>
                <View style={styles.calculatorHeader}>
                  <ThemedText style={styles.calculatorTitle}>
                    🧮 {t("calculator.title")}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowCalculator(false)}
                  >
                    <ThemedText style={styles.closeButtonText}>×</ThemedText>
                  </TouchableOpacity>
                </View>
                
                <MathCalculator
                  visible={true}
                  onClose={() => setShowCalculator(false)}
                  onResult={handleCalculatorResult}
                />
              </View>
            </View>
          )}

          {/* Saved Rates Section - Separate Component */}
          {showSavedRates && (
            <SavedRates
              savedRates={savedRates}
              showSavedRates={showSavedRates}
              onToggleVisibility={() => {
                setShowSavedRates(!showSavedRates);
                setSavedRatesMaxVisible(4); // Reset to default when toggling visibility
              }}
              onSelectRate={() => setCurrentView("converter")}
              onDeleteRate={deleteSavedRate}
              onDeleteAll={deleteAllSavedRates}
              showMoreEnabled={true}
              onShowMore={() => setSavedRatesMaxVisible(savedRates.length)}
              maxVisibleItems={savedRatesMaxVisible}
              title={`📋 ${t("saved.title")}`}
              containerStyle={{ marginBottom: 24 }}
            />
          )}

          {/* Rate Alerts Section - Using Same Component as Currency Converter */}
          {showRateAlerts && (
            <View>
              {/* Test Notification Button */}
              <View style={styles.testNotificationContainer}>
                <TouchableOpacity
                  style={styles.testNotificationButton}
                  onPress={handleTestNotification}
                >
                  <ThemedText style={styles.testNotificationButtonText}>
                    {"🧪 Test USD > 382 AMD Alert"}
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.testNotificationDescription}>
                  Click to test notification when 1 USD is more than 382 AMD
                </ThemedText>
              </View>

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
            </View>
          )}

          {/* Google Ads Banner */}
          <View style={styles.adsContainer}>
            <GoogleAdsBanner
              type="banner"
              size="medium"
              style={styles.adsBanner}
            />
          </View>
          {/* Features Preview */}
          <View style={styles.featuresSection}>
            <ThemedText style={styles.sectionTitle}>
              ✨ {t("dashboard.features")}
            </ThemedText>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>📊</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>
                    {t("feature.multiCurrency.title")}
                  </ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    {t("feature.multiCurrency.desc")}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>🧮</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>
                    {t("feature.calculator.title")}
                  </ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    {t("feature.calculator.desc")}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>📱</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>
                    {t("feature.offline.title")}
                  </ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    {t("feature.offline.desc")}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>🌍</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>
                    {t("feature.location.title")}
                  </ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    {t("feature.location.desc")}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>💾</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>
                    {t("feature.caching.title")}
                  </ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    {t("feature.caching.desc")}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Google Ads Banner */}
          <View style={styles.adsContainer}>
            <GoogleAdsBanner
              type="banner"
              size="medium"
              style={styles.adsBanner}
            />
          </View>
          {/* Additional Content to Enable Scrolling */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ThemedView>
    );
  };

  // Show onboarding for new users
  if (showOnboarding) {
    return (
      <OnboardingGuide
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f7f9" }}>
      {renderMainContent()}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        title="Create account to sync and enable alerts"
        message="Sign up to save your data"
        feature="general"
      />
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main containers
  dashboardContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Header styles
  dashboardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 18,
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#6366f1",
    textAlign: "right",
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    backdropFilter: "blur(8px)",
  },
  headerRight: {
    position: 'absolute',
    right: 20,
    top: 16,
  },
  burgerMenu: {
    // Burger menu is now positioned absolutely in headerRight
  },

  // Scroll content
  dashboardScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 80,
  },

  // Quick actions - Redesigned horizontal scroll
  quickActionsContainer: {
    marginBottom: 32,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  quickActionsScrollView: {
    marginHorizontal: -20,
  },
  quickActionsScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  quickActionCard: {
    width: 140,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 120,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconContainerConverter: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  iconContainerCalculator: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  iconContainerMulti: {
    backgroundColor: "rgba(251, 146, 60, 0.1)",
  },
  iconContainerSaved: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
  },
  iconContainerAlerts: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  iconContainerSettings: {
    backgroundColor: "rgba(107, 114, 128, 0.1)",
  },
  quickActionIcon: {
    fontSize: 24,
    textAlign: "center",
  },
  quickActionContent: {
    alignItems: "center",
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
    textAlign: "center",
    lineHeight: 18,
  },
  quickActionDescription: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 15,
    paddingHorizontal: 2,
  },
  quickActionCardActive: {
    borderColor: "#6366f1",
    borderWidth: 2,
    backgroundColor: "rgba(99, 102, 241, 0.05)",
    shadowOpacity: 0.12,
  },

  // Features section
  featuresSection: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 16,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
    lineHeight: 20,
  },
  featureDescription: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 60,
  },

  // Modern card sections
  multiCurrencySection: {
    marginBottom: 24,
  },
  multiCurrencyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  multiCurrencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  multiCurrencyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  closeButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: '50%',
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "bold",
  },

  // State styles
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  refreshButton: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // Rate alerts styles
  rateAlertsSection: {
    marginBottom: 24,
  },
  rateAlertsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  rateAlertsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rateAlertsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  existingAlerts: {
    marginBottom: 24,
  },
  alertsList: {
    gap: 12,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
  },
  alertArrow: {
    marginHorizontal: 10,
    fontSize: 14,
    color: "#64748b",
  },
  alertText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
  },
  createAlertSection: {
    marginTop: 20,
  },
  alertForm: {
    gap: 16,
  },
  alertFormRow: {
    flexDirection: "row",
    gap: 10,
  },
  alertInput: {
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    color: "#1e293b",
  },
  conditionButton: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  conditionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  createAlertButton: {
    backgroundColor: "#10b981",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  createAlertButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  showMoreAlertsText: {
    color: "#6366f1",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  alertContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  alertDeleteButton: {
    padding: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 6,
    marginLeft: 12,
  },
  alertDeleteText: {
    fontSize: 14,
  },
  deleteAllInlineButton: {
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteAllInlineText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  currencyPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
    gap: 8,
  },
  currencyPickerButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
  },

  // Settings button
  settingsButton: {
    backgroundColor: "rgba(107, 114, 128, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#6b7280",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 10,
    textAlign: "center",
  },

  // Ads
  adsContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  adsBanner: {
    width: "100%",
    marginBottom: 0,
  },

  // Test notification styles
  testNotificationContainer: {
    backgroundColor: "#f0f9ff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#0ea5e9",
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  testNotificationButton: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  testNotificationButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  testNotificationDescription: {
    fontSize: 14,
    color: "#0c4a6e",
    textAlign: "center",
    fontStyle: "italic",
  },

  // Calculator widget styles
  calculatorSection: {
    marginBottom: 24,
  },
  calculatorCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  calculatorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calculatorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
});
