import AuthPromptModal from "@/components/AuthPromptModal";
import BurgerMenu from "@/components/BurgerMenu";
import CurrencyConverter from "@/components/CurrencyConverter";
import DashboardModal from "@/components/DashboardModal";
import Footer from "@/components/Footer";
import GoogleAdsBanner from "@/components/GoogleAdsBanner";
import Logo from "@/components/Logo";
import MultiCurrencyConverter from "@/components/MultiCurrencyConverter";
import SavedRates from "@/components/SavedRates";
import RateAlertManager from "@/components/RateAlertManager";
import MathCalculator from "@/components/MathCalculator";
import OnboardingGuide from "@/components/OnboardingGuide";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserData } from "@/hooks/useUserData";
import { getAsyncStorage } from "@/lib/storage";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
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
  const { savedRates: { savedRates, deleteRate, deleteAllRates, refreshRates }, rateAlerts: { rateAlerts } } = useUserData();

  // Theme colors - must be called at top level
  const primaryColor = useThemeColor({}, 'primary');
  const textInverseColor = useThemeColor({}, 'textInverse');
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceSecondaryColor = useThemeColor({}, 'surfaceSecondary');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const shadowColor = '#000000'; // Use black for shadows

  const [currentView, setCurrentView] = useState<"dashboard" | "converter">(
    "dashboard"
  );
  const [showMultiCurrency, setShowMultiCurrency] = useState(false);
  const [multiCurrencyShowAllTargets, setMultiCurrencyShowAllTargets] = useState(false);
  const [showSavedRates, setShowSavedRates] = useState(false);
  const [showRateAlerts, setShowRateAlerts] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currenciesData, setCurrenciesData] = useState<any>(null);
  const [currencyList, setCurrencyList] = useState<string[]>([]);
  const [multiCurrencyLoading, setMultiCurrencyLoading] = useState(false);
  const [savedRatesMaxVisible, setSavedRatesMaxVisible] = useState(4);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadExchangeRates();
    checkOnboardingStatus();
  }, [user]);

  // Refresh saved rates when the modal opens
  useEffect(() => {
    if (showSavedRates) {
      refreshRates();
    }
  }, [showSavedRates, refreshRates]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadExchangeRates(),
      refreshRates()
    ]);
    setRefreshing(false);
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


  const renderMainContent = (): React.ReactElement => {
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
        <View style={[styles.dashboardHeader, { shadowColor }]}>
          <View style={styles.titleContainer}>
            <Logo size={36} showText={false} />
            <ThemedText type="title" style={{
              fontSize: 22,
              fontWeight: "700",
              color: "#1894EE",
              textAlign: "right",
              letterSpacing: 0.5,
            }}>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Quick Actions - Redesigned for better UX */}
          <View style={styles.quickActionsContainer}>
            <ThemedText style={[{ color: textColor }, styles.quickActionsTitle]}>
              {t("dashboard.quickActions")}
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsScrollContent}
              style={styles.quickActionsScrollView}
            >
              <TouchableOpacity
                style={[{ backgroundColor: surfaceColor, borderColor: borderColor, shadowColor }, styles.quickActionCard]}
                onPress={() => setCurrentView("converter")}
              >
                <View style={[styles.quickActionIconContainer, styles.iconContainerConverter]}>
                  <ThemedText style={styles.quickActionIcon}>🔄</ThemedText>
                </View>
                <View style={styles.quickActionContent}>
                  <ThemedText style={[{ color: textColor }, styles.quickActionTitle]}>
                    {t("quick.action.converter")}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.quickActionDescription]}>
                    {t("quick.action.converter.desc")}
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  { backgroundColor: surfaceColor, borderColor: borderColor, shadowColor },
                  styles.quickActionCard,
                  showCalculator && styles.quickActionCardActive,
                ]}
                onPress={() => setShowCalculator(!showCalculator)}
              >
                <View style={[styles.quickActionIconContainer, styles.iconContainerCalculator]}>
                  <ThemedText style={styles.quickActionIcon}>🧮</ThemedText>
                </View>
                <View style={styles.quickActionContent}>
                  <ThemedText style={[{ color: textColor }, styles.quickActionTitle]}>
                    {t("quick.action.calculator")}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.quickActionDescription]}>
                    {showCalculator
                      ? t("quick.action.calculator.hide")
                      : t("quick.action.calculator.desc")}
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  { backgroundColor: surfaceColor, borderColor: borderColor, shadowColor },
                  styles.quickActionCard,
                  showMultiCurrency && styles.quickActionCardActive,
                ]}
                onPress={() => setShowMultiCurrency(!showMultiCurrency)}
              >
                <View style={[styles.quickActionIconContainer, styles.iconContainerMulti]}>
                  <ThemedText style={styles.quickActionIcon}>📊</ThemedText>
                </View>
                <View style={styles.quickActionContent}>
                  <ThemedText style={[{ color: textColor }, styles.quickActionTitle]}>
                    {t("quick.action.multiCurrency")}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.quickActionDescription]}>
                    {showMultiCurrency
                      ? t("quick.action.multiCurrency.hide")
                      : t("quick.action.multiCurrency.desc")}
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  { backgroundColor: surfaceColor, borderColor: borderColor, shadowColor },
                  styles.quickActionCard,
                  showSavedRates && styles.quickActionCardActive,
                ]}
                onPress={() => setShowSavedRates(!showSavedRates)}
              >
                <View style={[styles.quickActionIconContainer, styles.iconContainerSaved]}>
                  <ThemedText style={styles.quickActionIcon}>💾</ThemedText>
                </View>
                <View style={styles.quickActionContent}>
                  <ThemedText style={[{ color: textColor }, styles.quickActionTitle]}>
                    {t("quick.action.savedRates")}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.quickActionDescription]}>
                    {savedRates.length}{" "}
                    {savedRates.length === 1 ? t("saved.rate") : t("saved.rates")}
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  { backgroundColor: surfaceColor, borderColor: borderColor, shadowColor },
                  styles.quickActionCard,
                  showRateAlerts && styles.quickActionCardActive,
                ]}
                onPress={() => setShowRateAlerts(!showRateAlerts)}
              >
                <View style={[styles.quickActionIconContainer, styles.iconContainerAlerts]}>
                  <ThemedText style={styles.quickActionIcon}>🚨</ThemedText>
                </View>
                <View style={styles.quickActionContent}>
                  <ThemedText style={[{ color: textColor }, styles.quickActionTitle]}>
                    {t("quick.action.rateAlerts")}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.quickActionDescription]}>
                    {rateAlerts.filter(alert => alert.is_active).length}{" "}
                    {rateAlerts.filter(alert => alert.is_active).length === 1 ? t("alerts.activeAlert") : t("alerts.activeAlerts")}
                  </ThemedText>
                </View>
              </TouchableOpacity>

            </ScrollView>
          </View>

          {/* Inline Multi-Currency Converter - Using Shared Component */}
          {showMultiCurrency && (
            <DashboardModal
              title={t("converter.multiCurrency.section")}
              icon="📊"
              onClose={() => {
                setShowMultiCurrency(false);
                setMultiCurrencyShowAllTargets(false); // Reset to default when closing
              }}
            >
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
                  inModal={true} // Hide MultiCurrencyConverter close button since DashboardModal handles it
                  showAllTargets={multiCurrencyShowAllTargets}
                  onShowMore={() => setMultiCurrencyShowAllTargets(true)}
                />
              )}
            </DashboardModal>
          )}

          {/* Calculator Modal */}
          <MathCalculator
            visible={showCalculator}
            onClose={() => setShowCalculator(false)}
            onResult={handleCalculatorResult}
            autoCloseAfterCalculation={false}
          />

          {/* Saved Rates Section - Separate Component */}
          {showSavedRates && (
            <DashboardModal
              title={t("saved.title")}
              icon="💾"
              onClose={() => {
                setShowSavedRates(false);
                setSavedRatesMaxVisible(4); // Reset to default when closing
              }}
            >
              <SavedRates
                savedRates={savedRates}
                showSavedRates={true}
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
                title="" // Remove title since DashboardModal handles it
                containerStyle={{ marginBottom: 0 }} // Remove bottom margin since modal handles it
                inModal={true} // Hide SavedRates header since DashboardModal handles it
              />
            </DashboardModal>
          )}

          {/* Rate Alerts Section - Using Same Component as Currency Converter */}
          {showRateAlerts && (
            <DashboardModal
              title={t("rateAlerts.title")}
              icon="🚨"
              onClose={() => setShowRateAlerts(false)}
            >

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
                inModal={true} // Hide RateAlertManager header since DashboardModal handles it
              />
            </DashboardModal>
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
          <View style={[{ backgroundColor: surfaceColor, borderColor: borderColor }, styles.featuresSection]}>
            <ThemedText style={[{ color: textColor }, styles.sectionTitle]}>
              ✨ {t("dashboard.features")}
            </ThemedText>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>📊</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={[{ color: textColor }, styles.featureTitle]}>
                    {t("feature.multiCurrency.title")}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.featureDescription]}>
                    {t("feature.multiCurrency.desc")}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>🧮</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={[{ color: textColor }, styles.featureTitle]}>
                    {t("feature.calculator.title")}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.featureDescription]}>
                    {t("feature.calculator.desc")}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>📱</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={[{ color: textColor }, styles.featureTitle]}>
                    {t("feature.offline.title")}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.featureDescription]}>
                    {t("feature.offline.desc")}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>🌍</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={[{ color: textColor }, styles.featureTitle]}>
                    {t("feature.location.title")}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.featureDescription]}>
                    {t("feature.location.desc")}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>💾</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={[{ color: textColor }, styles.featureTitle]}>
                    {t("feature.caching.title")}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.featureDescription]}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColor }}>
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
    gap: 12,
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
    position: 'absolute',
    right: 1,
    top: 7,
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
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
    marginBottom: 4,
    textAlign: "center",
    lineHeight: 18,
  },
  quickActionDescription: {
    fontSize: 11,
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
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
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
    marginBottom: 6,
    lineHeight: 20,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 60,
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


});
