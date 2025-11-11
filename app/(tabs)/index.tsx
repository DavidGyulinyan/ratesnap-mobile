import AuthPromptModal from "@/components/AuthPromptModal";
import CurrencyConverter from "@/components/CurrencyConverter";
import CurrencyFlag from "@/components/CurrencyFlag";
import Footer from "@/components/Footer";
import GoogleAdsBanner from "@/components/GoogleAdsBanner";
import LanguageDropdown from "@/components/LanguageDropdown";
import MultiCurrencyConverter from "@/components/MultiCurrencyConverter";
import SavedRates from "@/components/SavedRates";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAsyncStorage } from "@/lib/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
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
  const [currentView, setCurrentView] = useState<"dashboard" | "converter">(
    "dashboard"
  );
  const [showMultiCurrency, setShowMultiCurrency] = useState(false);
  const [showSavedRates, setShowSavedRates] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [currenciesData, setCurrenciesData] = useState<any>(null);
  const [currencyList, setCurrencyList] = useState<string[]>([]);
  const [savedRates, setSavedRates] = useState<any[]>([]);
  const [multiCurrencyLoading, setMultiCurrencyLoading] = useState(false);

  useEffect(() => {
    loadExchangeRates();
    loadSavedRates();
  }, []);

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

  const loadSavedRates = async () => {
    try {
      const storage = getAsyncStorage();
      const savedRatesData = await storage.getItem("savedRates");
      if (savedRatesData) {
        setSavedRates(JSON.parse(savedRatesData));
      }
    } catch (error) {
      console.error("Error loading saved rates:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert("Success", "You have been signed out successfully.");
    } catch (error) {
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const deleteSavedRate = async (index: number) => {
    Alert.alert(t("common.delete"), t("saved.deleteConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          const updatedRates = savedRates.filter((_, i) => i !== index);
          setSavedRates(updatedRates);
          const storage = getAsyncStorage();
          await storage.setItem("savedRates", JSON.stringify(updatedRates));
        },
      },
    ]);
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
          setSavedRates([]);
          const storage = getAsyncStorage();
          await storage.setItem("savedRates", JSON.stringify([]));
        },
      },
    ]);
  };

  const getAuthText = (key: string) => {
    // For Russian, use compact versions to prevent header overflow
    const compactKey = key + ".compact";
    const compactText = t(compactKey);
    if (compactText !== compactKey) {
      return compactText;
    }
    return t(key);
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
              {t("app.title")} Dashboard
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            {/* Language Switcher - Always visible */}
            <LanguageDropdown compact={true} style={styles.languageSwitcher} />

            {/* Show sign-in/sign-up for non-authenticated users */}
            {!user ? (
              <>
                <TouchableOpacity
                  style={styles.authButton}
                  onPress={() => router.push("/signin")}
                >
                  <ThemedText
                    style={styles.authButtonText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getAuthText("auth.signin")}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.authButton, styles.authButtonPrimary]}
                  onPress={() => router.push("/signup")}
                >
                  <ThemedText
                    style={styles.authButtonPrimaryText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getAuthText("auth.signup")}
                  </ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.converterButton}
                  onPress={() => setCurrentView("converter")}
                >
                  <ThemedText
                    style={styles.converterButtonText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getAuthText("converter.title")}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.userInfo}
                  onPress={handleSignOut}
                >
                  <ThemedText
                    style={styles.userInfoText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getAuthText("auth.welcome")}, {user.email?.split("@")[0]}
                  </ThemedText>
                  <ThemedText
                    style={styles.signOutText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getAuthText("auth.signout")}
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
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
                {t("quick.action.converter")}
              </ThemedText>
              <ThemedText style={styles.quickActionDescription}>
                {t("quick.action.converter.desc")}
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
                {t("quick.action.multiCurrency")}
              </ThemedText>
              <ThemedText style={styles.quickActionDescription}>
                {showMultiCurrency
                  ? t("quick.action.multiCurrency.hide")
                  : t("quick.action.multiCurrency.desc")}
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
                {t("quick.action.savedRates")}
              </ThemedText>
              <ThemedText style={styles.quickActionDescription}>
                {savedRates.length}{" "}
                {savedRates.length === 1 ? "saved rate" : "saved rates"}
                {savedRates.filter(rate => rate.hasAlert).length > 0 && (
                  <> • {savedRates.filter(rate => rate.hasAlert).length} alerts</>
                )}
                {" "}-{" "}
                {showSavedRates
                  ? t("quick.action.savedRates.hide")
                  : t("quick.action.savedRates.desc")}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push("/(tabs)/settings")}
            >
              <ThemedText style={styles.quickActionIcon}>⚙️</ThemedText>
              <ThemedText style={styles.quickActionTitle}>
                {t("quick.action.settings")}
              </ThemedText>
              <ThemedText style={styles.quickActionDescription}>
                {t("quick.action.settings.desc")}
              </ThemedText>
            </TouchableOpacity>
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

          {/* Unified Saved Rates and Alerts Section */}
          {showSavedRates && (
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
              title={`📋 ${t("saved.title")}`}
              containerStyle={{ marginBottom: 24 }}
              currenciesData={currenciesData}
              onRatesUpdate={() => {
                // Reload saved rates after any changes
                loadSavedRates();
              }}
            />
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f7f9" }}>
      {renderMainContent()}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        title="Create account to sync and enable alerts"
        message="Sign up to save your data and enable premium features"
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
    justifyContent: "flex-end",
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
  languageSwitcher: {
    marginRight: 2,
  },
  burgerMenu: {
    marginLeft: 8,
  },

  // Action buttons
  converterButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  converterButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 11,
    textAlign: "center",
    flexWrap: "wrap",
  },
  authButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    maxWidth: 70,
  },
  authButtonText: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 10,
    textAlign: "center",
    flexWrap: "wrap",
  },
  authButtonPrimary: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    maxWidth: 75,
    paddingHorizontal: 10,
  },
  authButtonPrimaryText: {
    color: "white",
    fontWeight: "600",
    fontSize: 10,
    textAlign: "center",
    flexWrap: "wrap",
  },
  userInfo: {
    alignItems: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    maxWidth: 85,
  },
  userInfoText: {
    color: "#64748b",
    fontSize: 9,
    textAlign: "right",
    fontWeight: "500",
    flexWrap: "wrap",
  },
  signOutText: {
    color: "#ef4444",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "right",
    flexWrap: "wrap",
  },

  // Scroll content
  dashboardScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 80,
  },

  // Quick actions grid
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 8,
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 160,
  },
  quickActionIcon: {
    fontSize: 36,
    height: 56,
    marginBottom: 16,
    lineHeight: 56,
    textAlign: "center",
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  quickActionDescription: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 4,
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
});
