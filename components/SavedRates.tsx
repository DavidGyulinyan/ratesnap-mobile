import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { ThemedText } from "./themed-text";
import CurrencyFlag from "./CurrencyFlag";
import { useThemeColor } from "@/hooks/use-theme-color";
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
  inModal?: boolean; // Hide header when used inside DashboardModal
  forceUseHook?: boolean; // Force use hook data instead of prop
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
  inModal = false,
  forceUseHook = false,
}: SavedRatesProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { savedRates: hookSavedRates, deleteRate, deleteAllRates, loading } = useSavedRates();

  // Theme colors
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceSecondaryColor = useThemeColor({}, 'surfaceSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const errorColor = useThemeColor({}, 'error');
  const textInverseColor = useThemeColor({}, 'textInverse');
  const shadowColor = '#000000'; // Use black for shadows

  // Use hook data if forceUseHook is true, otherwise use prop or fallback to hook
  const savedRates = forceUseHook ? hookSavedRates : (propSavedRates || (user ? hookSavedRates : []));

  const displayTitle = title || `⭐ ${t('saved.shortTitle')}`;

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteRate = async (id: string) => {
    if (onDeleteRate) {
      onDeleteRate(id);
    } else {
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
    } else {
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
      style={[{ backgroundColor: surfaceSecondaryColor, borderColor: borderColor, shadowColor: shadowColor }, styles.savedRateItem]}
      onPress={() => onSelectRate?.(rate.from_currency, rate.to_currency)}
    >
      <View style={styles.savedRateContent}>
        <View style={styles.savedRateHeader}>
          <CurrencyFlag currency={rate.from_currency} size={16} />
          <ThemedText style={[{ color: textSecondaryColor }, styles.arrow]}>→</ThemedText>
          <CurrencyFlag currency={rate.to_currency} size={16} />
          <ThemedText style={[{ color: textColor }, styles.savedRateTitle]}>
            {rate.from_currency} → {rate.to_currency}
          </ThemedText>
        </View>
        <ThemedText style={[{ color: primaryColor }, styles.rateValue]}>
          {t('converter.rate')}: {rate.rate.toFixed(6)}
        </ThemedText>
        <ThemedText style={[{ color: textSecondaryColor }, styles.savedRateDate]}>
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
  if (loading) {
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
      {!inModal && (
        <View style={styles.savedRatesHeader}>
          <ThemedText type="subtitle" style={styles.savedRatesTitle}>
            {displayTitle} ({savedRates.length})
          </ThemedText>
          {savedRates.length > 0 && (
            <TouchableOpacity onPress={onToggleVisibility}>
            <ThemedText
              style={[
                { color: textColor },
                styles.showHideText,
                showSavedRates && { color: primaryColor, fontWeight: "600" },
              ]}
            >
              {showSavedRates ? "×" : `▶ ${t('common.more')}`}
            </ThemedText>
          </TouchableOpacity>
          )}
        </View>
      )}

      {showSavedRates && (
        <View style={[
          inModal
            ? styles.fadeIn
            : [{ backgroundColor: surfaceColor, borderColor: primaryColor, shadowColor: shadowColor }, styles.savedRatesList, styles.fadeIn]
        ]}>
          {savedRates.length === 0 ? (
            <View style={styles.emptySavedRates}>
              <ThemedText style={[{ color: textSecondaryColor }, styles.emptySavedRatesText]}>
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
                  style={[{ backgroundColor: surfaceSecondaryColor, shadowColor: shadowColor }, styles.showMoreButton]}
                  onPress={onShowMore}
                >
                  <ThemedText style={[{ color: primaryColor }, styles.showMoreText]}>
                    {t('common.showMore').replace('more', `all ${savedRates.length} saved rates`)} →
                  </ThemedText>
                </TouchableOpacity>
              )}

              {savedRates.length > 1 && (
                <TouchableOpacity
                  style={[{ backgroundColor: errorColor, shadowColor: errorColor }, styles.deleteAllButton]}
                  onPress={handleDeleteAllRates}
                >
                  <ThemedText style={[{ color: textInverseColor }, styles.deleteAllText]}>
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
    borderRadius: 16,
    padding: 20,
  },
  emptySavedRates: {
    padding: 20,
    alignItems: "center",
  },
  emptySavedRatesText: {
    fontSize: 14,
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
    marginBottom: 12,
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
    fontWeight: "bold",
  },
  savedRateTitle: {
    fontWeight: "600",
    marginLeft: 8,
  },
  rateValue: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  savedRatesTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  showHideText: {
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 30,
    textAlign: "center",
  },
  showHideTextActive: {
  },
  savedRateDate: {
    fontSize: 11,
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
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 12,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  deleteAllButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  deleteAllText: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
