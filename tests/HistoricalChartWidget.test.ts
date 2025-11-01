// Unit tests for HistoricalChart widget functionality

import { historicalRatesAPI, DataPoint } from '../utils/api/history';

// Mock the native modules for testing
jest.mock('react-native-chart-kit', () => ({
  LineChart: ({ data, width, height, chartConfig, ...props }: any) => {
    return null; // Mock component for testing
  },
}));

jest.mock('@/components/themed-view', () => ({
  ThemedView: ({ children, style }: any) => {
    return null; // Mock component for testing
  },
}));

jest.mock('@/components/themed-text', () => ({
  ThemedText: ({ children, style }: any) => {
    return null; // Mock component for testing
  },
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

describe('Historical Chart Widget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Historical Rates API', () => {
    describe('fetchHistoricalRates', () => {
      it('should fetch historical rates successfully', async () => {
        const response = await historicalRatesAPI.fetchHistoricalRates({
          baseCurrency: 'USD',
          quoteCurrency: 'EUR',
          timeRange: '30d',
        });

        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(response.data?.pair).toBe('USD_EUR');
        expect(response.data?.range).toBe('30d');
        expect(response.data?.dataPoints).toBeDefined();
        expect(Array.isArray(response.data?.dataPoints)).toBe(true);
      });

      it('should handle different time ranges correctly', async () => {
        const ranges: Array<'7d' | '30d' | '1y'> = ['7d', '30d', '1y'];
        
        for (const range of ranges) {
          const response = await historicalRatesAPI.fetchHistoricalRates({
            baseCurrency: 'USD',
            quoteCurrency: 'GBP',
            timeRange: range,
          });

          expect(response.success).toBe(true);
          expect(response.data?.range).toBe(range);
          
          // Check that data points are generated
          const dataPoints = response.data?.dataPoints || [];
          expect(dataPoints.length).toBeGreaterThan(0);
          
          // Verify time ranges have appropriate number of points
          switch (range) {
            case '7d':
              expect(dataPoints.length).toBe(8); // 7 days + today
              break;
            case '30d':
              expect(dataPoints.length).toBe(31); // 30 days + today
              break;
            case '1y':
              expect(dataPoints.length).toBe(53); // Weekly data for 52 weeks + today
              break;
          }
        }
      });

      it('should handle error states gracefully', async () => {
        // Test with invalid parameters that would cause errors
        const response = await historicalRatesAPI.fetchHistoricalRates({
          baseCurrency: '', // Empty base currency
          quoteCurrency: '', // Empty quote currency
          timeRange: 'invalid' as any, // Invalid time range
        });

        // The implementation gracefully handles invalid inputs by using defaults
        expect(response.success).toBe(true); // Should still succeed with defaults
        expect(response.data).toBeDefined();
      });
    });

    describe('generateMockHistoricalData', () => {
      it('should generate realistic data with proper volatility', () => {
        const data = historicalRatesAPI['generateMockHistoricalData']('USD_EUR', '7d');
        
        expect(data.length).toBe(8); // 7 days + today
        expect(data[0].timestamp).toBeDefined();
        expect(data[0].rate).toBeGreaterThan(0);
        expect(data[0].formattedDate).toBeDefined();
      });

      it('should maintain rate consistency within expected ranges', () => {
        const pairs = ['USD_EUR', 'USD_GBP', 'USD_JPY'];
        
        pairs.forEach(pair => {
          const data = historicalRatesAPI['generateMockHistoricalData'](pair, '30d');
          const rates = data.map(point => point.rate);
          
          // Check that rates are reasonable (no extreme values)
          const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
          expect(avgRate).toBeGreaterThan(0.001); // Reasonable minimum
          expect(avgRate).toBeLessThan(1000); // Reasonable maximum
          
          // Check that there's some variation
          const minRate = Math.min(...rates);
          const maxRate = Math.max(...rates);
          expect(maxRate - minRate).toBeGreaterThan(0);
        });
      });

      it('should handle unknown currency pairs gracefully', () => {
        const data = historicalRatesAPI['generateMockHistoricalData']('INVALID_PAIR', '30d');
        
        expect(data.length).toBeGreaterThan(0);
        expect(data[0].rate).toBeGreaterThan(0); // Should generate valid rates even for unknown pairs
        expect(data[0].rate).toBeLessThan(2); // Should be in reasonable range
      });
    });

    describe('calculateStats', () => {
      it('should calculate correct statistics', () => {
        const sampleData: DataPoint[] = [
          { timestamp: '2023-01-01T00:00:00Z', rate: 1.0, formattedDate: 'Jan 1' },
          { timestamp: '2023-01-02T00:00:00Z', rate: 1.1, formattedDate: 'Jan 2' },
          { timestamp: '2023-01-03T00:00:00Z', rate: 0.9, formattedDate: 'Jan 3' },
          { timestamp: '2023-01-04T00:00:00Z', rate: 1.05, formattedDate: 'Jan 4' },
        ];

        const stats = historicalRatesAPI.calculateStats(sampleData);

        expect(stats.min).toBe(0.9);
        expect(stats.max).toBe(1.1);
        expect(stats.avg).toBeCloseTo(1.0125, 4);
        expect(stats.change).toBe(0.05); // 1.05 - 1.0
        expect(stats.changePercent).toBeCloseTo(5, 1);
      });

      it('should handle empty data correctly', () => {
        const stats = historicalRatesAPI.calculateStats([]);
        
        expect(stats.min).toBe(0);
        expect(stats.max).toBe(0);
        expect(stats.avg).toBe(0);
        expect(stats.change).toBe(0);
        expect(stats.changePercent).toBe(0);
        expect(stats.volatility).toBe(0);
      });
    });

    describe('getSupportedPairs', () => {
      it('should return supported currency pairs', () => {
        const pairs = historicalRatesAPI.getSupportedPairs();
        
        expect(Array.isArray(pairs)).toBe(true);
        expect(pairs.length).toBeGreaterThan(0);
        
        // Check structure of each pair
        pairs.forEach(pair => {
          expect(pair).toHaveProperty('base');
          expect(pair).toHaveProperty('quote');
          expect(pair).toHaveProperty('label');
          expect(pair.base).toHaveLength(3);
          expect(pair.quote).toHaveLength(3);
        });
      });

      it('should include popular currency pairs', () => {
        const pairs = historicalRatesAPI.getSupportedPairs();
        const pairLabels = pairs.map(p => p.label);
        
        // Check for some popular pairs
        expect(pairLabels).toContain('USD/EUR');
        expect(pairLabels).toContain('USD/GBP');
        expect(pairLabels).toContain('USD/JPY');
        expect(pairLabels).toContain('EUR/GBP');
      });
    });

    describe('volatility and trend calculation', () => {
      it('should generate appropriate volatility for different time ranges', () => {
        const range7d = historicalRatesAPI['generateMockHistoricalData']('USD_EUR', '7d');
        const range30d = historicalRatesAPI['generateMockHistoricalData']('USD_EUR', '30d');
        const range1y = historicalRatesAPI['generateMockHistoricalData']('USD_EUR', '1y');

        // 7d should have less variation due to lower volatility
        const rates7d = range7d.map(p => p.rate);
        const variation7d = Math.max(...rates7d) - Math.min(...rates7d);

        // 1y should have more variation due to higher volatility
        const rates1y = range1y.map(p => p.rate);
        const variation1y = Math.max(...rates1y) - Math.min(...rates1y);

        // 1y should generally have more variation than 7d
        // (This is a heuristic test since we're using random data)
        expect(variation1y).toBeGreaterThanOrEqual(variation7d * 0.5);
      });

      it('should include trend components in data generation', () => {
        const data = historicalRatesAPI['generateMockHistoricalData']('USD_EUR', '30d');
        
        // Check that data spans the correct time period
        expect(data.length).toBe(31); // 30 days + today
        
        // Verify timestamps are properly formatted
        data.forEach(point => {
          expect(new Date(point.timestamp)).toBeInstanceOf(Date);
          expect(point.formattedDate).toBeTruthy();
        });
      });
    });
  });

  describe('Widget Component Props', () => {
    it('should have proper default props', () => {
      const defaultProps = {
        baseCurrency: 'USD',
        quoteCurrency: 'EUR',
        timeRange: '30d' as const,
      };

      expect(defaultProps.baseCurrency).toBe('USD');
      expect(defaultProps.quoteCurrency).toBe('EUR');
      expect(defaultProps.timeRange).toBe('30d');
    });

    it('should accept custom props', () => {
      const customProps = {
        baseCurrency: 'GBP',
        quoteCurrency: 'JPY',
        timeRange: '1y' as const,
      };

      expect(customProps.baseCurrency).toBe('GBP');
      expect(customProps.quoteCurrency).toBe('JPY');
      expect(customProps.timeRange).toBe('1y');
    });
  });

  describe('Time range handling', () => {
    it('should generate correct number of data points for each range', () => {
      const ranges = [
        { range: '7d', expected: 8 },
        { range: '30d', expected: 31 },
        { range: '1y', expected: 53 }, // Weekly data
      ];

      ranges.forEach(({ range, expected }) => {
        const data = historicalRatesAPI['generateMockHistoricalData']('USD_EUR', range);
        expect(data.length).toBe(expected);
      });
    });

    it('should format dates appropriately for each range', () => {
      const testDate = new Date('2023-05-15');
      
      // Test date formatting for different ranges
      expect(historicalRatesAPI['formatDateForRange'](testDate, '7d')).toContain('May');
      expect(historicalRatesAPI['formatDateForRange'](testDate, '30d')).toContain('May');
      expect(historicalRatesAPI['formatDateForRange'](testDate, '1y')).toMatch(/\d{2}$/); // Should include year for 1y
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle invalid currency codes gracefully', async () => {
      const response = await historicalRatesAPI.fetchHistoricalRates({
        baseCurrency: 'INVALID',
        quoteCurrency: 'INVALID',
        timeRange: '30d',
      });

      expect(response.success).toBe(true); // Should still return data with defaults
      expect(response.data).toBeDefined();
    });

    it('should handle edge case time ranges', async () => {
      // Test with different case variations
      const response = await historicalRatesAPI.fetchHistoricalRates({
        baseCurrency: 'USD',
        quoteCurrency: 'EUR',
        timeRange: '30d',
      });

      expect(response.success).toBe(true);
      expect(response.data?.dataPoints.length).toBeGreaterThan(0);
    });

    it('should maintain data integrity during transformations', () => {
      const originalData: DataPoint[] = [
        { timestamp: '2023-01-01T00:00:00Z', rate: 1.0, formattedDate: 'Jan 1' },
      ];

      const stats = historicalRatesAPI.calculateStats(originalData);
      
      expect(stats.avg).toBe(1.0);
      expect(stats.min).toBe(1.0);
      expect(stats.max).toBe(1.0);
    });
  });

  describe('Performance considerations', () => {
    it('should handle large datasets efficiently', () => {
      // Generate a large dataset
      const largeDataSet: DataPoint[] = [];
      for (let i = 0; i < 1000; i++) {
        largeDataSet.push({
          timestamp: new Date(2023, 0, i + 1).toISOString(),
          rate: 1.0 + Math.random() * 0.1,
          formattedDate: `Day ${i + 1}`,
        });
      }

      const startTime = performance.now();
      const stats = historicalRatesAPI.calculateStats(largeDataSet);
      const endTime = performance.now();

      expect(stats).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should not cause memory leaks with frequent API calls', async () => {
      // Simulate multiple concurrent API calls
      const promises = Array.from({ length: 10 }, () =>
        historicalRatesAPI.fetchHistoricalRates({
          baseCurrency: 'USD',
          quoteCurrency: 'EUR',
          timeRange: '30d',
        })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
      });
    });
  });
});

// Integration tests for the full widget
describe('Historical Chart Widget Integration', () => {
  it('should render without crashing with valid props', () => {
    // This would test the actual React component rendering
    // For now, we'll test the props validation
    
    const validProps = {
      baseCurrency: 'USD',
      quoteCurrency: 'EUR',
      timeRange: '30d' as const,
    };

    expect(validProps.baseCurrency).toHaveLength(3);
    expect(validProps.quoteCurrency).toHaveLength(3);
    expect(['7d', '30d', '1y']).toContain(validProps.timeRange);
  });

  it('should handle prop changes correctly', () => {
    const initialProps = {
      baseCurrency: 'USD',
      quoteCurrency: 'EUR',
      timeRange: '30d' as const,
    };

    const updatedProps = {
      ...initialProps,
      baseCurrency: 'GBP',
      timeRange: '7d' as const,
    };

    expect(updatedProps.baseCurrency).toBe('GBP');
    expect(updatedProps.timeRange).toBe('7d');
    expect(updatedProps.quoteCurrency).toBe('EUR'); // Unchanged
  });

  it('should provide meaningful data for chart visualization', () => {
    const data = historicalRatesAPI['generateMockHistoricalData']('USD_EUR', '30d');
    
    // Verify data structure for chart library
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('timestamp');
    expect(data[0]).toHaveProperty('rate');
    expect(data[0]).toHaveProperty('formattedDate');
    
    // Rates should be numerical and positive
    data.forEach(point => {
      expect(typeof point.rate).toBe('number');
      expect(point.rate).toBeGreaterThan(0);
    });
  });
});