import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface HistoricalChartProps {
  widgetId?: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  timeRange?: '7d' | '30d' | '1y';
  onWidgetChange?: (props: Record<string, any>) => void;
}

// Historical data point
interface DataPoint {
  timestamp: string;
  rate: number;
  formattedDate: string;
}

// API response interface
interface HistoricalRateResponse {
  success: boolean;
  data: {
    pair: string;
    range: string;
    dataPoints: DataPoint[];
  };
  error?: string;
}

export function HistoricalChart({
  widgetId,
  baseCurrency = 'USD',
  quoteCurrency = 'EUR',
  timeRange = '30d',
  onWidgetChange,
}: HistoricalChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDataPoint, setSelectedDataPoint] = useState<DataPoint | null>(null);
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: isDark ? '#1a1a1a' : '#ffffff',
    backgroundGradientTo: isDark ? '#1a1a1a' : '#ffffff',
    decimalPlaces: 6,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#007AFF',
    },
    propsForBackgroundLines: {
      stroke: isDark ? '#333333' : '#E5E5EA',
    },
  };

  // Time range options
  const timeRanges = [
    { value: '7d' as const, label: '7 Days' },
    { value: '30d' as const, label: '30 Days' },
    { value: '1y' as const, label: '1 Year' },
  ];

  // Popular currency pairs
  const popularPairs = [
    { base: 'USD', quote: 'EUR', label: 'USD/EUR' },
    { base: 'USD', quote: 'GBP', label: 'USD/GBP' },
    { base: 'USD', quote: 'JPY', label: 'USD/JPY' },
    { base: 'EUR', quote: 'GBP', label: 'EUR/GBP' },
    { base: 'USD', quote: 'CAD', label: 'USD/CAD' },
    { base: 'USD', quote: 'AUD', label: 'USD/AUD' },
  ];

  // Fetch historical rates
  const fetchHistoricalRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Create historical data based on time range
      const generateHistoricalData = (pair: string, range: string): DataPoint[] => {
        const now = new Date();
        const dataPoints: DataPoint[] = [];
        
        let days = 30;
        let interval = 1; // days
        
        switch (range) {
          case '7d':
            days = 7;
            interval = 1;
            break;
          case '30d':
            days = 30;
            interval = 1;
            break;
          case '1y':
            days = 365;
            interval = 7; // Weekly data for 1 year
            break;
        }

        // Generate mock historical data with realistic trends
        const baseRates: Record<string, number> = {
          'USD_EUR': 0.85,
          'USD_GBP': 0.73,
          'USD_JPY': 110.0,
          'USD_CAD': 1.25,
          'USD_AUD': 1.35,
          'EUR_GBP': 0.86,
          'EUR_USD': 1.18,
          'GBP_USD': 1.37,
        };

        const baseRate = baseRates[pair] || 1.0;
        const volatility = 0.02; // 2% daily volatility

        for (let i = days; i >= 0; i -= interval) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          
          // Add some realistic variation
          const randomFactor = 1 + (Math.random() - 0.5) * volatility;
          const trendFactor = 1 + (Math.sin(i / days * Math.PI * 2) * 0.01); // slight trend
          const rate = baseRate * randomFactor * trendFactor;
          
          dataPoints.push({
            timestamp: date.toISOString(),
            rate: parseFloat(rate.toFixed(6)),
            formattedDate: date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              ...(range === '1y' && { year: '2-digit' })
            }),
          });
        }

        return dataPoints;
      };

      const pair = `${baseCurrency}_${quoteCurrency}`;
      const historicalData = generateHistoricalData(pair, timeRange);
      
      setData(historicalData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch historical rates:', err);
      setError('Failed to load historical data');
      setLoading(false);
    }
  }, [baseCurrency, quoteCurrency, timeRange]);

  // Handle time range change
  const handleTimeRangeChange = (newRange: typeof timeRange) => {
    onWidgetChange?.({
      timeRange: newRange,
    });
  };

  // Handle currency pair change
  const handlePairChange = (newBase: string, newQuote: string) => {
    onWidgetChange?.({
      baseCurrency: newBase,
      quoteCurrency: newQuote,
    });
  };

  // Get chart data for react-native-chart-kit
  const getChartData = () => {
    if (data.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [0],
          color: () => '#007AFF',
        }],
      };
    }

    return {
      labels: data.map(point => point.formattedDate),
      datasets: [{
        data: data.map(point => point.rate),
        color: () => '#007AFF',
        strokeWidth: 2,
      }],
    };
  };

  // Get stats for display
  const getStats = () => {
    if (data.length === 0) return { min: 0, max: 0, change: 0 };

    const rates = data.map(point => point.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const first = data[0]?.rate || 0;
    const last = data[data.length - 1]?.rate || 0;
    const change = ((last - first) / first) * 100;

    return { min, max, change };
  };

  // Initialize
  useEffect(() => {
    fetchHistoricalRates();
  }, [fetchHistoricalRates]);

  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <ThemedText style={styles.loadingText}>Loading historical data...</ThemedText>
    </View>
  );

  // Render error state
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <ThemedText style={styles.errorText}>{error || 'Failed to load data'}</ThemedText>
      <TouchableOpacity style={styles.retryButton} onPress={fetchHistoricalRates}>
        <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
      </TouchableOpacity>
    </View>
  );

  // Render no data state
  const renderNoData = () => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataIcon}>📊</Text>
      <ThemedText style={styles.noDataText}>No historical data available</ThemedText>
      <ThemedText style={styles.noDataSubtext}>
        Try selecting a different time range or currency pair
      </ThemedText>
    </View>
  );

  // Render tooltip
  const renderTooltip = () => {
    if (!selectedDataPoint) return null;

    return (
      <View style={[
        styles.tooltip,
        { backgroundColor: isDark ? '#333333' : '#ffffff' }
      ]}>
        <ThemedText style={styles.tooltipDate}>
          {new Date(selectedDataPoint.timestamp).toLocaleDateString()}
        </ThemedText>
        <ThemedText style={styles.tooltipRate}>
          {selectedDataPoint.rate.toFixed(6)} {quoteCurrency}
        </ThemedText>
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        {renderLoading()}
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        {renderError()}
      </ThemedView>
    );
  }

  if (data.length === 0) {
    return (
      <ThemedView style={styles.container}>
        {renderNoData()}
      </ThemedView>
    );
  }

  const stats = getStats();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          📈 {baseCurrency}/{quoteCurrency} Historical Rates
        </ThemedText>
        <View style={styles.statsContainer}>
          <Text style={[
            styles.changeText,
            { color: stats.change >= 0 ? '#34C759' : '#FF3B30' }
          ]}>
            {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {timeRanges.map((range) => (
          <TouchableOpacity
            key={range.value}
            style={[
              styles.timeRangeButton,
              timeRange === range.value && styles.timeRangeButtonActive
            ]}
            onPress={() => handleTimeRangeChange(range.value)}
          >
            <ThemedText style={[
              styles.timeRangeText,
              timeRange === range.value && styles.timeRangeTextActive
            ]}>
              {range.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <LineChart
          data={getChartData()}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          onDataPointClick={(clickData) => {
            const index = clickData.index;
            if (index >= 0 && index < data.length) {
              setSelectedDataPoint(data[index]);
            }
          }}
          formatYLabel={(value) => parseFloat(value).toFixed(4)}
        />
        {renderTooltip()}
      </View>

      {/* Range Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statLabel}>Range</ThemedText>
          <ThemedText style={styles.statValue}>
            {stats.min.toFixed(4)} - {stats.max.toFixed(4)}
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statLabel}>Data Points</ThemedText>
          <ThemedText style={styles.statValue}>{data.length}</ThemedText>
        </View>
      </View>

      {/* Pair Selector */}
      <TouchableOpacity
        style={styles.pairSelector}
        onPress={() => {
          Alert.alert(
            'Select Currency Pair',
            'Choose from popular pairs:',
            [
              ...popularPairs.map(pair => ({
                text: pair.label,
                onPress: () => handlePairChange(pair.base, pair.quote),
              })),
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
      >
        <ThemedText style={styles.pairSelectorText}>
          Change Pair: {baseCurrency}/{quoteCurrency}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorIcon: {
    fontSize: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  noDataIcon: {
    fontSize: 48,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  timeRangeTextActive: {
    color: 'white',
  },
  chartContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  tooltip: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    borderRadius: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  tooltipDate: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  tooltipRate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  pairSelector: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e6f3ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cce7ff',
  },
  pairSelectorText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});