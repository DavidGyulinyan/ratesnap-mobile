import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { ThemedText } from "./themed-text";
import CurrencyFlag from "./CurrencyFlag";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSavedRates } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";

interface SavedRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  created_at: string;
  updated_at: string;
}

interface SavedRatesProps {
  savedRates?: SavedRate[]; // Optional - will use hook data if not provided
  showSavedRates: boolean;
  onToggleVisibility: () => void;
  onSelectRate?: (from: string, to: string) => void;
  onDeleteRate?: (id: string | number) => void; // Optional - will use hook if not provided
  onDeleteAll?: () => void; // Optional - will use hook if not provided
  showMoreEnabled?: boolean;
  onShowMore?: () => void;
  maxVisibleItems?: number;
  containerStyle?: any;
  title?: string;
}

export default function SavedRates({
  savedRates: propSavedRates,
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
  const { user } = useAuth();
  const { savedRates: hookSavedRates, deleteRate, deleteAllRates, loading } = useSavedRates();
  
  // Use hook data if no prop provided and user is authenticated
  const savedRates = propSavedRates || (user ? hookSavedRates : []);
  
  const displayTitle = title || `⭐ ${t('saved.shortTitle')}`;
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteRate = async (id: string) => {
    if (onDeleteRate) {
      onDeleteRate(id);
    } else if (user) {
      Alert.alert(
        'Delete Rate',
        'Are you sure you want to delete this saved rate?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setDeletingId(id);
                const success = await deleteRate(id);
                if (success) {
                  Alert.alert('Success', 'Rate deleted successfully');
                } else {
                  Alert.alert(
                    'Delete Failed',
                    'Unable to delete the rate. Please try again or check your internet connection.'
                  );
                }
              } catch (error) {
                Alert.alert(
                  'Error',
                  'An unexpected error occurred while deleting the rate.'
                );
                console.error('Delete rate error:', error);
              } finally {
                setDeletingId(null);
              }
            }
          }
        ]
      );
    }
  };

  const handleDeleteAllRates = async () => {
    if (onDeleteAll) {
      onDeleteAll();
    } else if (user) {
      Alert.alert(
        'Delete All Rates',
        'Are you sure you want to delete all saved rates? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: async () => {
              const success = await deleteAllRates();
              if (!success) {
                Alert.alert('Error', 'Failed to delete all saved rates');
              }
            }
          }
        ]
      );
    }
  };
  
  const renderSavedRateItem = (rate: SavedRate, index: number) => (
    <TouchableOpacity
      key={rate.id || index}
      style={styles.savedRateItem}
      onPress={() => onSelectRate?.(rate.from_currency, rate.to_currency)}
    >
      <View style={styles.savedRateContent}>
        <View style={styles.savedRateHeader}>
          <CurrencyFlag currency={rate.from_currency} size={16} />
          <ThemedText style={styles.arrow}>→</ThemedText>
          <CurrencyFlag currency={rate.to_currency} size={16} />
          <ThemedText style={styles.savedRateTitle}>
            {rate.from_currency} → {rate.to_currency}
          </ThemedText>
        </View>
        <ThemedText style={styles.rateValue}>
          {t('converter.rate')}: {rate.rate.toFixed(6)}
        </ThemedText>
        <ThemedText style={styles.savedRateDate}>
          {t('saved.savedOn')}: {new Date(rate.created_at).toLocaleDateString()} {t('saved.at')}{" "}
          {new Date(rate.created_at).toLocaleTimeString()}
        </ThemedText>
      </View>
      <TouchableOpacity
        style={[styles.deleteButton, deletingId === rate.id && styles.deleteButtonDisabled]}
        onPress={() => handleDeleteRate(rate.id)}
        disabled={deletingId === rate.id}
      >
        <ThemedText style={[
          styles.deleteButtonText,
          deletingId === rate.id && styles.deleteButtonTextDisabled
        ]}>
          {deletingId === rate.id ? '⏳' : '🗑️'}
        </ThemedText>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const visibleRates =
    showMoreEnabled && savedRates.length > maxVisibleItems
      ? savedRates.slice(0, maxVisibleItems)
      : savedRates;

  // Show loading state
  if (loading && !user) {
    return (
      <View style={[styles.savedRatesSection, containerStyle]}>
        <View style={styles.savedRatesHeader}>
          <ThemedText type="subtitle" style={styles.savedRatesTitle}>
            {displayTitle} (0)
          </ThemedText>
        </View>
        <View style={styles.savedRatesList}>
          <View style={styles.emptySavedRates}>
            <ThemedText style={styles.emptySavedRatesText}>
              Loading saved rates...
            </ThemedText>
          </View>
        </View>
      </View>
    );
  }

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
                {!user
                  ? "Sign in to save and sync your currency rates across devices!"
                  : "No saved rates yet. Convert currencies and click \"Save This Rate\" to add some!"
                }
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

              {savedRates.length > 1 && (
                <TouchableOpacity
                  style={styles.deleteAllButton}
                  onPress={handleDeleteAllRates}
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
    alignItems: "flex-start",
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
    color: "#1e2937",
  },
  showHideText: {
    color: "#1e2937",
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
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  deleteButtonTextDisabled: {
    opacity: 0.5,
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
