import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ProviderFactory, RateData } from '@/lib/providers/ProviderInterface';
import { RateSnapProvider } from '@/lib/providers/RateSnapProvider';
import { ExchangeRatesAPIProvider } from '@/lib/providers/ExchangeRatesAPIProvider';

interface ComparisonProps {
  widgetId: string;
  pair?: string; // Default pair to compare (format: USD_EUR)
  providers?: string[]; // List of provider names to include
  onWidgetChange?: (props: any) => void;
}

interface ProviderDisplayData {
  name: string;
  displayName: string;
  data?: RateData;
  loading: boolean;
  error?: string;
  website?: string;
}

export function Comparison({ 
  widgetId, 
  pair = 'USD_EUR', 
  providers = ['ratesnap', 'exchangeratesapi'],
  onWidgetChange 
}: ComparisonProps) {
  const [providerData, setProviderData] = useState<ProviderDisplayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPair, setSelectedPair] = useState(pair);
  const [error, setError] = useState<string | null>(null);

  // Common currency pairs for quick selection
  const popularPairs = [
    { value: 'USD_EUR', label: 'USD/EUR' },
    { value: 'USD_GBP', label: 'USD/GBP' },
    { value: 'USD_JPY', label: 'USD/JPY' },
    { value: 'USD_CAD', label: 'USD/CAD' },
    { value: 'USD_AUD', label: 'USD/AUD' },
    { value: 'EUR_GBP', label: 'EUR/GBP' },
    { value: 'EUR_JPY', label: 'EUR/JPY' },
    { value: 'GBP_JPY', label: 'GBP/JPY' },
  ];

  useEffect(() => {
    fetchRates();
  }, [selectedPair, providers]);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);

    try {
      // Initialize provider data
      const initialData: ProviderDisplayData[] = providers.map(providerName => {
        const provider = ProviderFactory.createProvider(providerName);
        if (!provider) {
          return {
            name: providerName,
            displayName: providerName,
            loading: false,
            error: `Provider ${providerName} not found`,
          };
        }

        return {
          name: provider.info.name,
          displayName: provider.info.displayName,
          loading: true,
          website: provider.info.website,
        };
      });

      setProviderData(initialData);

      // Fetch rates from all providers
      const results = await Promise.allSettled(
        providers.map(async (providerName) => {
          const provider = ProviderFactory.createProvider(providerName);
          if (!provider) {
            throw new Error(`Provider ${providerName} not found`);
          }

          const result = await provider.fetchRates(selectedPair);
          return { providerName, result };
        })
      );

      // Update provider data with results
      const updatedData: ProviderDisplayData[] = initialData.map((item, index) => {
        const result = results[index];
        
        if (result.status === 'fulfilled') {
          return {
            ...item,
            loading: false,
            data: result.value.result,
          };
        } else {
          return {
            ...item,
            loading: false,
            error: result.reason?.message || 'Unknown error',
          };
        }
      });

      setProviderData(updatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRates();
  };

  const handlePairChange = (newPair: string) => {
    setSelectedPair(newPair);
    onWidgetChange?.({ ...{ pair: newPair, providers } });
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const formatRate = (rate: number): string => {
    if (rate === 0) return 'N/A';
    
    // Format based on rate magnitude
    if (rate < 0.01) return rate.toFixed(6);
    if (rate < 1) return rate.toFixed(4);
    if (rate < 100) return rate.toFixed(3);
    return rate.toFixed(2);
  };

  const getRateDifference = (data: RateData[]): { best: number; worst: number } => {
    const validRates = data.filter(d => d.success && d.buy > 0);
    if (validRates.length < 2) return { best: 0, worst: 0 };
    
    const rates = validRates.map(d => d.buy);
    return {
      best: Math.max(...rates),
      worst: Math.min(...rates),
    };
  };

  const successfulProviders = providerData.filter(p => p.data?.success);
  const { best: bestRate, worst: worstRate } = getRateDifference(
    successfulProviders.map(p => p.data!)
  );
  const spread = bestRate > 0 && worstRate > 0 ? ((bestRate - worstRate) / worstRate) * 100 : 0;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>⚖️</Text>
          <ThemedText style={styles.title}>Rate Comparison</ThemedText>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.refreshButtonText}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Pair Selection */}
      <View style={styles.pairSelector}>
        <ThemedText style={styles.pairLabel}>Currency Pair:</ThemedText>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pairList}
        >
          {popularPairs.map((pairOption) => (
            <TouchableOpacity
              key={pairOption.value}
              style={[
                styles.pairButton,
                selectedPair === pairOption.value && styles.pairButtonActive
              ]}
              onPress={() => handlePairChange(pairOption.value)}
            >
              <Text style={[
                styles.pairButtonText,
                selectedPair === pairOption.value && styles.pairButtonTextActive
              ]}>
                {pairOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      {/* Summary Stats */}
      {successfulProviders.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryLabel}>Providers:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {successfulProviders.length}/{providerData.length}
            </ThemedText>
          </View>
          {spread > 0 && (
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Spread:</ThemedText>
              <ThemedText style={styles.summaryValue}>{spread.toFixed(2)}%</ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Rate Comparison Table */}
      <ScrollView 
        style={styles.tableContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {providerData.map((provider) => (
          <View key={provider.name} style={styles.providerRow}>
            {/* Provider Info */}
            <View style={styles.providerInfo}>
              <View style={styles.providerHeader}>
                <ThemedText style={styles.providerName}>
                  {provider.displayName}
                </ThemedText>
                {provider.website && (
                  <TouchableOpacity 
                    style={styles.websiteButton}
                    onPress={() => {
                      // In a real app, you'd open the website
                      Alert.alert('External Link', `Open ${provider.website}`);
                    }}
                  >
                    <Text style={styles.websiteButtonText}>🔗</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {provider.data?.success && provider.data.timestamp && (
                <ThemedText style={styles.timestamp}>
                  {formatTimestamp(provider.data.timestamp)}
                </ThemedText>
              )}
            </View>

            {/* Rates */}
            <View style={styles.ratesContainer}>
              {provider.loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <ThemedText style={styles.loadingText}>Loading...</ThemedText>
                </View>
              ) : provider.error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>❌</Text>
                  <ThemedText style={styles.errorText}>
                    {provider.error.length > 20 
                      ? provider.error.substring(0, 20) + '...'
                      : provider.error
                    }
                  </ThemedText>
                </View>
              ) : provider.data?.success ? (
                <View style={styles.ratesGrid}>
                  <View style={styles.rateColumn}>
                    <ThemedText style={styles.rateLabel}>Buy</ThemedText>
                    <ThemedText style={[
                      styles.rateValue,
                      provider.data.buy === bestRate && styles.bestRate
                    ]}>
                      {formatRate(provider.data.buy)}
                    </ThemedText>
                  </View>
                  <View style={styles.rateColumn}>
                    <ThemedText style={styles.rateLabel}>Sell</ThemedText>
                    <ThemedText style={[
                      styles.rateValue,
                      provider.data.sell === worstRate && styles.worstRate
                    ]}>
                      {formatRate(provider.data.sell)}
                    </ThemedText>
                  </View>
                </View>
              ) : (
                <View style={styles.noDataContainer}>
                  <ThemedText style={styles.noDataText}>No data</ThemedText>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Rates are for informational purposes only. 
          Please check with providers for actual transaction rates.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  pairSelector: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  pairLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pairList: {
    gap: 8,
  },
  pairButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  pairButtonActive: {
    backgroundColor: '#007AFF',
  },
  pairButtonText: {
    fontSize: 14,
    color: '#000',
  },
  pairButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  tableContainer: {
    flex: 1,
  },
  providerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  providerInfo: {
    flex: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  websiteButton: {
    padding: 4,
    marginLeft: 8,
  },
  websiteButtonText: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  ratesContainer: {
    width: 140,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    flex: 1,
  },
  ratesGrid: {
    flexDirection: 'row',
  },
  rateColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  rateLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 2,
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  bestRate: {
    color: '#34C759',
  },
  worstRate: {
    color: '#FF3B30',
  },
  noDataContainer: {
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerText: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
  },
});