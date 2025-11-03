import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "../themed-view";
import { ThemedText } from "../themed-text";
import BaseWidget from "./BaseWidget";

interface OfflineStatusWidgetProps {
  widgetId: string;
  onRemove: () => void;
  onToggle?: () => void;
  isEditMode?: boolean;
  isOnline: boolean;
}

interface CachedData {
  timestamp: number;
  currenciesCount: number;
  baseCurrency: string;
}

export default function OfflineStatusWidget({
  widgetId,
  onRemove,
  onToggle,
  isEditMode = false,
  isOnline
}: OfflineStatusWidgetProps) {
  const [cachedData, setCachedData] = useState<CachedData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("Never");

  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      const cachedRates = await AsyncStorage.getItem('cachedExchangeRates');
      const cacheTimestamp = await AsyncStorage.getItem('cachedRatesTimestamp');
      
      if (cachedRates && cacheTimestamp) {
        const ratesData = JSON.parse(cachedRates);
        const timestamp = parseInt(cacheTimestamp);
        
        setCachedData({
          timestamp,
          currenciesCount: Object.keys(ratesData.conversion_rates || {}).length,
          baseCurrency: ratesData.base_code || 'USD'
        });
        
        // Calculate time since last update
        const now = Date.now();
        const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMinutes < 1) {
          setLastUpdate("Just now");
        } else if (diffMinutes < 60) {
          setLastUpdate(`${diffMinutes}m ago`);
        } else if (diffHours < 24) {
          setLastUpdate(`${diffHours}h ago`);
        } else if (diffDays < 7) {
          setLastUpdate(`${diffDays}d ago`);
        } else {
          setLastUpdate(new Date(timestamp).toLocaleDateString());
        }
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const refreshCachedData = async () => {
    // This would trigger a refresh of cached data
    // In a real implementation, you might want to implement this
    await loadCachedData();
  };

  const getStatusColor = () => {
    if (!cachedData) return '#ef4444'; // Red - no cache
    if (!isOnline) return '#f59e0b'; // Orange - offline with cache
    return '#10b981'; // Green - online
  };

  const getStatusIcon = () => {
    if (!cachedData) return '⚠️';
    if (!isOnline) return '📱';
    return '🌐';
  };

  const getStatusMessage = () => {
    if (!cachedData) return 'No cached data';
    if (!isOnline) return 'Working offline';
    return 'Online & fresh';
  };

  // Calculate cache health flex (width equivalent)
  const getCacheHealthFlex = () => {
    if (!cachedData) return 0;
    if (isOnline) return 1; // 100%
    const hoursOld = Math.floor((Date.now() - cachedData.timestamp) / (1000 * 60 * 60));
    return Math.max(0.1, (100 - hoursOld) / 100); // Minimum 0.1 for visibility
  };

  return (
    <BaseWidget
      widgetId={widgetId}
      title="Offline Status"
      onRemove={onRemove}
      onToggle={onToggle}
      isEditMode={isEditMode}
    >
      <View style={styles.container}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <ThemedText style={styles.statusText}>{getStatusMessage()}</ThemedText>
          <ThemedText style={styles.statusIcon}>{getStatusIcon()}</ThemedText>
        </View>

        {/* Connection Status */}
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Connection:</ThemedText>
          <ThemedText style={[
            styles.infoValue,
            { color: isOnline ? '#10b981' : '#ef4444' }
          ]}>
            {isOnline ? 'Online' : 'Offline'}
          </ThemedText>
        </View>

        {/* Cached Data Info */}
        {cachedData && (
          <>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Cached Rates:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {cachedData.currenciesCount} currencies
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Base Currency:</ThemedText>
              <ThemedText style={styles.infoValue}>{cachedData.baseCurrency}</ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Last Update:</ThemedText>
              <ThemedText style={styles.infoValue}>{lastUpdate}</ThemedText>
            </View>
          </>
        )}

        {/* Cache Health */}
        <View style={styles.cacheHealth}>
          <View style={styles.healthBar}>
            <View
              style={[
                styles.healthFill,
                {
                  flex: getCacheHealthFlex(),
                  backgroundColor: getStatusColor()
                }
              ]}
            />
          </View>
          <ThemedText style={styles.healthLabel}>
            Cache Health
          </ThemedText>
        </View>

        {/* Refresh Button */}
        {isOnline && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshCachedData}
          >
            <ThemedText style={styles.refreshButtonText}>
              🔄 Refresh Cache
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <ThemedText style={styles.tipsText}>
            💡 App works offline using cached rates from your last online session
          </ThemedText>
        </View>
      </View>
    </BaseWidget>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusIcon: {
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  cacheHealth: {
    marginTop: 8,
  },
  healthBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  healthFill: {
    height: '100%',
    borderRadius: 3,
  },
  healthLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  tipsText: {
    fontSize: 11,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 14,
  },
});