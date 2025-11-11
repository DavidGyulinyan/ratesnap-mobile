import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "./themed-text";
import CurrencyFlag from "./CurrencyFlag";
import { useLanguage } from "@/contexts/LanguageContext";

interface SavedRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp?: number;
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
}: SavedRatesProps) {
  const { t } = useLanguage();
  
  const displayTitle = title || `⭐ ${t('saved.shortTitle')}`;
  
  const renderSavedRateItem = (rate: SavedRate, index: number) => (
    <TouchableOpacity
      key={typeof rate.id === "string" ? rate.id : index}
      style={styles.savedRateItem}
      onPress={() => onSelectRate?.(rate.fromCurrency, rate.toCurrency)}
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
          {t('converter.rate')}: {rate.rate.toFixed(6)}
        </ThemedText>
        {rate.timestamp && (
          <ThemedText style={styles.savedRateDate}>
            {t('saved.savedOn')}: {new Date(rate.timestamp).toLocaleDateString()} {t('saved.at')}{" "}
            {new Date(rate.timestamp).toLocaleTimeString()}
          </ThemedText>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDeleteRate(rate.id || index)}
      >
        <ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
      </TouchableOpacity>
    </TouchableOpacity>
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
                No saved rates yet. Convert currencies and click &quot;Save This
                Rate&quot; to add some!
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
  showMoreButton: {
    backgroundColor: "#dbeafe",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 12,
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
    marginTop: 12,
  },
  deleteAllText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
