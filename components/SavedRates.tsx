import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { ThemedText } from "./themed-text";
import CurrencyFlag from "./CurrencyFlag";
import { useLanguage } from "@/contexts/LanguageContext";
import RateAlertManager from "./RateAlertManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAsyncStorage } from "@/lib/storage";

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
  timestamp?: number;
  hasAlert?: boolean;
  alertSettings?: AlertSettings;
}

interface SavedRatesProps {
  savedRates: SavedRate[];
  showSavedRates: boolean;
  onToggleVisibility: () => void;
  onSelectRate?: (from: string, to: string) => void;
  onDeleteRate: (id: string | number) => void;
  onDeleteAll?: () => void;
  showMoreEnabled?: boolean;
  onShowMore?: () => void;
  maxVisibleItems?: number;
  containerStyle?: any;
  title?: string;
  currenciesData?: any;
  onRatesUpdate?: () => void;
}

export default function SavedRates({
  savedRates,
  showSavedRates,
  onToggleVisibility,
  onSelectRate,
  onDeleteRate,
  onDeleteAll,
  showMoreEnabled = false,
  onShowMore,
  maxVisibleItems = 10,
  containerStyle,
  title,
  currenciesData,
  onRatesUpdate,
}: SavedRatesProps) {
  const { t } = useLanguage();
  const [showAlertManager, setShowAlertManager] = useState(false);
  const [selectedRateForAlert, setSelectedRateForAlert] = useState<SavedRate | null>(null);
  
  const displayTitle = title || `⭐ ${t('saved.shortTitle')}`;

  const handleCreateAlert = (rate: SavedRate) => {
    setSelectedRateForAlert(rate);
    setShowAlertManager(true);
  };

  const handleSaveRateWithAlert = async (rate: SavedRate, alertSettings: AlertSettings) => {
    try {
      const storage = getAsyncStorage();
      
      // Update the saved rate with alert settings
      const updatedRates = savedRates.map(r =>
        r.id === rate.id
          ? {
              ...r,
              hasAlert: true,
              alertSettings: { ...alertSettings, lastChecked: Date.now() }
            }
          : r
      );

      // Save to AsyncStorage
      await storage.setItem("savedRates", JSON.stringify(updatedRates));
      
      // Update local state
      if (onRatesUpdate) {
        onRatesUpdate();
      }

      setShowAlertManager(false);
      Alert.alert('Success', 'Rate alert created successfully!');
    } catch (error) {
      console.error('Error saving rate with alert:', error);
      Alert.alert('Error', 'Failed to create rate alert');
    }
  };
  
  const renderSavedRateItem = (rate: SavedRate, index: number) => (
    <View key={typeof rate.id === "string" ? rate.id : index} style={styles.savedRateItem}>
      {/* Main Content Area */}
      <TouchableOpacity
        style={styles.savedRateMainContent}
        onPress={() => onSelectRate?.(rate.fromCurrency, rate.toCurrency)}
      >
        <View style={styles.savedRateContent}>
          {/* Header Row: Currency Pair + Alert Status */}
          <View style={styles.headerRow}>
            <View style={styles.currencyPairContainer}>
              <CurrencyFlag currency={rate.fromCurrency} size={18} />
              <ThemedText style={styles.arrow}>→</ThemedText>
              <CurrencyFlag currency={rate.toCurrency} size={18} />
              <ThemedText style={styles.savedRateTitle}>
                {rate.fromCurrency} → {rate.toCurrency}
              </ThemedText>
            </View>
            
            {/* Alert Status Badge */}
            {rate.hasAlert && rate.alertSettings && (
              <View style={[styles.alertBadge, rate.alertSettings.isActive ? styles.alertBadgeActive : styles.alertBadgeInactive]}>
                <ThemedText style={styles.alertBadgeText}>
                  {rate.alertSettings.isActive ? '🔔' : '🔕'}
                </ThemedText>
                <ThemedText style={styles.alertBadgeSubtext}>
                  {rate.alertSettings.isActive ? 'ACTIVE' : 'INACTIVE'}
                </ThemedText>
              </View>
            )}
          </View>
          
          {/* Rate Information */}
          <View style={styles.rateInfoContainer}>
            <ThemedText style={styles.rateLabel}>Exchange Rate:</ThemedText>
            <ThemedText style={styles.rateValue}>{rate.rate.toFixed(6)}</ThemedText>
          </View>
          
          {/* Alert Details Row */}
          {rate.hasAlert && rate.alertSettings && (
            <View style={styles.alertDetailsRow}>
              <View style={styles.alertDetailsItem}>
                <ThemedText style={styles.alertDetailsLabel}>Target:</ThemedText>
                <ThemedText style={styles.alertDetailsValue}>
                  {rate.alertSettings.direction === 'above' ? '↑' : rate.alertSettings.direction === 'below' ? '↓' : '='} {rate.alertSettings.targetRate}
                </ThemedText>
              </View>
              
              <View style={styles.alertDetailsItem}>
                <ThemedText style={styles.alertDetailsLabel}>Frequency:</ThemedText>
                <ThemedText style={styles.alertDetailsValue}>{rate.alertSettings.frequency}</ThemedText>
              </View>
              
              {rate.alertSettings.triggered && (
                <View style={styles.triggeredContainer}>
                  <ThemedText style={styles.triggeredAlertText}>⚠️ TRIGGERED</ThemedText>
                </View>
              )}
            </View>
          )}
          
          {/* Timestamp */}
          {rate.timestamp && (
            <ThemedText style={styles.savedRateDate}>
              Saved on {new Date(rate.timestamp).toLocaleDateString()} at {new Date(rate.timestamp).toLocaleTimeString()}
            </ThemedText>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.alertButton]}
          onPress={() => handleCreateAlert(rate)}
        >
          <ThemedText style={styles.actionButtonText}>
            {rate.hasAlert ? '🔔' : '🔕'}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDeleteRate(rate.id || index)}
        >
          <ThemedText style={styles.actionButtonText}>🗑️</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const visibleRates =
    showMoreEnabled && savedRates.length > maxVisibleItems
      ? savedRates.slice(0, maxVisibleItems)
      : savedRates;

  return (
    <View style={[styles.savedRatesSection, containerStyle]}>
      <View style={styles.savedRatesHeader}>
        <ThemedText type="subtitle" style={styles.savedRatesTitle}>
          {displayTitle} ({savedRates.length})
        </ThemedText>
        {savedRates.length > 0 && (
          <TouchableOpacity onPress={onToggleVisibility}>
            <ThemedText
              style={[
                styles.showHideText,
                showSavedRates && styles.showHideTextActive,
              ]}
            >
              {showSavedRates ? `▼ ${t('common.less')}` : `▶ ${t('common.more')}`}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {showSavedRates && (
        <View style={[styles.savedRatesList, styles.fadeIn]}>
          {savedRates.length === 0 ? (
            <View style={styles.emptySavedRates}>
              <ThemedText style={styles.emptySavedRatesText}>
                No saved rates yet. Convert currencies and click "Save This
                Rate" to add some!
              </ThemedText>
            </View>
          ) : (
            <>
              {visibleRates.map((rate, index) =>
                renderSavedRateItem(rate, index)
              )}

              {showMoreEnabled && savedRates.length > maxVisibleItems && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={onShowMore}
                >
                  <ThemedText style={styles.showMoreText}>
                    {t('common.showMore').replace('more', `all ${savedRates.length} saved rates`)} →
                  </ThemedText>
                </TouchableOpacity>
              )}

              {savedRates.length > 1 && onDeleteAll && (
                <TouchableOpacity
                  style={styles.deleteAllButton}
                  onPress={onDeleteAll}
                >
                  <ThemedText style={styles.deleteAllText}>
                   {t('saved.deleteAll')} ({savedRates.length})
                  </ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      {/* Rate Alert Manager - Inline Section */}
      {showAlertManager && selectedRateForAlert && (
        <View style={styles.rateAlertManagerContainer}>
          <View style={styles.rateAlertManagerHeader}>
            <ThemedText style={styles.rateAlertManagerTitle}>
              Alert for {selectedRateForAlert.fromCurrency} → {selectedRateForAlert.toCurrency}
            </ThemedText>
            <TouchableOpacity
              style={styles.closeAlertManagerButton}
              onPress={() => {
                setShowAlertManager(false);
                setSelectedRateForAlert(null);
              }}
            >
              <ThemedText style={styles.closeAlertManagerText}>✕</ThemedText>
            </TouchableOpacity>
          </View>
          <RateAlertManager
            savedRates={[{...selectedRateForAlert, timestamp: selectedRateForAlert.timestamp || Date.now()}]}
            onRatesUpdate={() => {
              if (onRatesUpdate) {
                onRatesUpdate();
              }
              setShowAlertManager(false);
              setSelectedRateForAlert(null);
            }}
            currenciesData={currenciesData}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    backgroundColor: "#fefbf3",
  },
  savedRateMainContent: {
    flex: 1,
  },
  savedRateContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  currencyPairContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  arrow: {
    marginHorizontal: 6,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "bold",
  },
  savedRateTitle: {
    fontWeight: "700",
    marginLeft: 6,
    color: "#1f2937",
    fontSize: 16,
  },
  alertBadge: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 50,
  },
  alertBadgeActive: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#16a34a",
  },
  alertBadgeInactive: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#9ca3af",
  },
  alertBadgeText: {
    fontSize: 14,
    marginBottom: 2,
  },
  alertBadgeSubtext: {
    fontSize: 8,
    fontWeight: "600",
  },
  rateInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rateLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginRight: 8,
  },
  rateValue: {
    fontSize: 16,
    color: "#f59e0b",
    fontWeight: "700",
  },
  alertDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  alertDetailsItem: {
    flex: 1,
    alignItems: "center",
  },
  alertDetailsLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  alertDetailsValue: {
    fontSize: 14,
    color: "#7c3aed",
    fontWeight: "600",
  },
  triggeredContainer: {
    backgroundColor: "#fef2f2",
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  triggeredAlertText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#dc2626",
  },
  savedRateDate: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  alertButton: {
    backgroundColor: "#ede9fe",
    borderColor: "#7c3aed",
  },
  deleteButton: {
    backgroundColor: "#fef2f2",
    borderColor: "#dc2626",
  },
  actionButtonText: {
    fontSize: 16,
  },
  savedRatesTitle: {
    color: "#1e2937",
    fontSize: 16,
    fontWeight: "600",
  },
  showHideText: {
    color: "#1e2937",
    fontSize: 14,
    fontWeight: "500",
  },
  showHideTextActive: {
    color: "#7c3aed",
    fontWeight: "600",
  },
  fadeIn: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  showMoreButton: {
    backgroundColor: "#dbeafe",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  showMoreText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteAllButton: {
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  deleteAllText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Rate Alert Manager styles
  rateAlertManagerContainer: {
    borderWidth: 2,
    borderColor: "#6366f1",
    borderRadius: 12,
    marginTop: 16,
    backgroundColor: "#f8fafc",
  },
  rateAlertManagerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#6366f1",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  rateAlertManagerTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  closeAlertManagerButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeAlertManagerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
