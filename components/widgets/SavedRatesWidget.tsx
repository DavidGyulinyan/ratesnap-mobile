import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "../themed-view";
import { ThemedText } from "../themed-text";
import CurrencyFlag from "../CurrencyFlag";
import BaseWidget from "./BaseWidget";

interface SavedRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: number;
}

interface SavedRatesWidgetProps {
  widgetId: string;
  onRemove: () => void;
  onToggle?: () => void;
  isEditMode?: boolean;
  onNavigateToConverter?: () => void;
}

export default function SavedRatesWidget({
  widgetId,
  onRemove,
  onToggle,
  isEditMode = false,
  onNavigateToConverter
}: SavedRatesWidgetProps) {
  const [savedRates, setSavedRates] = useState<SavedRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedRates();
  }, []);

  const loadSavedRates = async () => {
    try {
      const stored = await AsyncStorage.getItem("savedRates");
      if (stored) {
        const rates = JSON.parse(stored);
        setSavedRates(rates);
      }
    } catch (error) {
      console.error("Error loading saved rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRate = async (id: string) => {
    Alert.alert("Delete Rate", "Are you sure you want to delete this saved rate?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updatedRates = savedRates.filter((rate) => rate.id !== id);
          setSavedRates(updatedRates);
          await AsyncStorage.setItem("savedRates", JSON.stringify(updatedRates));
        },
      },
    ]);
  };

  const handleDeleteAll = async () => {
    Alert.alert("Delete All", "Are you sure you want to delete all saved rates?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete All",
        style: "destructive",
        onPress: async () => {
          setSavedRates([]);
          await AsyncStorage.removeItem("savedRates");
        },
      },
    ]);
  };

  const handleSelectRate = (from: string, to: string) => {
    AsyncStorage.setItem("selectedFromCurrency", from);
    AsyncStorage.setItem("selectedToCurrency", to);
    onNavigateToConverter?.();
  };

  const renderSavedRate = ({ item }: { item: SavedRate }) => (
    <View style={styles.rateItem}>
      <TouchableOpacity
        style={styles.rateContent}
        onPress={() => handleSelectRate(item.fromCurrency, item.toCurrency)}
      >
        <View style={styles.rateFlags}>
          <CurrencyFlag currency={item.fromCurrency} size={16} />
          <ThemedText style={styles.arrow}>→</ThemedText>
          <CurrencyFlag currency={item.toCurrency} size={16} />
        </View>
        <View style={styles.rateInfo}>
          <ThemedText style={styles.rateTitle}>
            {item.fromCurrency} → {item.toCurrency}
          </ThemedText>
          <ThemedText style={styles.rateValue}>{item.rate.toFixed(4)}</ThemedText>
          <ThemedText style={styles.rateDate}>
            {new Date(item.timestamp).toLocaleDateString()}
          </ThemedText>
        </View>
      </TouchableOpacity>

      {isEditMode && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteRate(item.id)}
        >
          <ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <BaseWidget
        widgetId={widgetId}
        title="Saved Rates"
        onRemove={onRemove}
        onToggle={onToggle}
        isEditMode={isEditMode}
      >
        <ThemedText>Loading...</ThemedText>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget
      widgetId={widgetId}
      title="Saved Rates"
      onRemove={onRemove}
      onToggle={onToggle}
      isEditMode={isEditMode}
    >
      {savedRates.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyStateText}>No saved rates yet</ThemedText>
          <ThemedText style={styles.emptyStateSubtext}>
            Use the converter to save frequently used rates
          </ThemedText>
        </View>
      ) : (
        <View style={styles.ratesList}>
          <FlatList
            data={savedRates.slice(0, 3)}
            renderItem={renderSavedRate}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />

          {/* Show more button */}
          {savedRates.length > 3 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={onNavigateToConverter}
            >
              <ThemedText style={styles.showMoreButtonText}>
                Show all {savedRates.length} rates →
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* Delete All button (only visible in edit mode) */}
          {isEditMode && savedRates.length > 0 && (
            <TouchableOpacity style={styles.deleteAllButton} onPress={handleDeleteAll}>
              <ThemedText style={styles.deleteAllButtonText}>Delete All</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </BaseWidget>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  ratesList: {
    maxHeight: 240,
  },
  rateItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rateContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  rateFlags: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  arrow: {
    marginHorizontal: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  rateInfo: {
    flex: 1,
  },
  rateTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  rateValue: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
    marginBottom: 2,
  },
  rateDate: {
    fontSize: 10,
    color: "#9ca3af",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  showMoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  showMoreButtonText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteAllButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  deleteAllButtonText: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 14,
  },
});
