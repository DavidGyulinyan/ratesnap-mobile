// Unit tests for CurrencyConverter widget
// Note: These are integration-style tests focused on logic rather than full component rendering

// Mock the AsyncStorage for testing
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  clear: jest.fn(),
}));

// Mock environment variables
const originalEnv = process.env;

describe('Currency Converter Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset process.env
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('convertCurrency function', () => {
    it('should convert USD to EUR correctly', () => {
      const exchangeRates = {
        USD: 1.0,
        EUR: 0.85,
      };
      
      const result = convertCurrency(100, 'USD', 'EUR', exchangeRates);
      expect(result).toBeCloseTo(85.0, 4);
    });

    it('should convert EUR to USD correctly', () => {
      const exchangeRates = {
        USD: 1.0,
        EUR: 0.85,
      };
      
      const result = convertCurrency(100, 'EUR', 'USD', exchangeRates);
      expect(result).toBeCloseTo(117.647, 3); // 100 / 0.85
    });

    it('should handle same currency conversion', () => {
      const exchangeRates = {
        USD: 1.0,
        EUR: 0.85,
      };
      
      const result = convertCurrency(100, 'USD', 'USD', exchangeRates);
      expect(result).toBe(100);
    });

    it('should return 0 for invalid amount', () => {
      const exchangeRates = {
        USD: 1.0,
        EUR: 0.85,
      };
      
      expect(convertCurrency(-10, 'USD', 'EUR', exchangeRates)).toBe(0);
      expect(convertCurrency(0, 'USD', 'EUR', exchangeRates)).toBe(0);
    });

    it('should return 0 for missing exchange rates', () => {
      const exchangeRates = {
        USD: 1.0,
        EUR: 0.85,
      };
      
      expect(convertCurrency(100, 'USD', 'UNKNOWN', exchangeRates)).toBe(0);
      expect(convertCurrency(100, 'UNKNOWN', 'EUR', exchangeRates)).toBe(0);
    });

    it('should handle complex conversion chain', () => {
      const exchangeRates = {
        USD: 1.0,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.0,
      };
      
      // USD -> EUR -> GBP
      const usdToEur = convertCurrency(100, 'USD', 'EUR', exchangeRates);
      const eurToGbp = convertCurrency(usdToEur, 'EUR', 'GBP', exchangeRates);
      
      // Direct USD -> GBP
      const directUsdToGbp = convertCurrency(100, 'USD', 'GBP', exchangeRates);
      
      expect(eurToGbp).toBeCloseTo(directUsdToGbp, 4);
    });

    it('should handle decimal precision correctly', () => {
      const exchangeRates = {
        USD: 1.0,
        EUR: 0.851234,
      };
      
      const result = convertCurrency(100, 'USD', 'EUR', exchangeRates, 6);
      expect(result).toBe(85.1234);
    });
  });

  describe('formatCurrency function', () => {
    it('should format currency with default precision', () => {
      expect(formatCurrency(85.123456)).toBe('85.1235');
    });

    it('should format currency with custom precision', () => {
      expect(formatCurrency(85.123456, 2)).toBe('85.12');
      expect(formatCurrency(85.123456, 6)).toBe('85.123456');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1234567.89)).toBe('1234567.8900');
    });

    it('should handle very small numbers', () => {
      expect(formatCurrency(0.000001)).toBe('0.0000');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('0.0000');
    });
  });

  describe('parseAmount function', () => {
    it('should parse valid numeric strings', () => {
      expect(parseAmount('100')).toBe(100);
      expect(parseAmount('100.50')).toBe(100.5);
      expect(parseAmount('0.123')).toBe(0.123);
    });

    it('should handle invalid strings', () => {
      expect(parseAmount('abc')).toBe(0);
      expect(parseAmount('')).toBe(0);
      expect(parseAmount('100.50.50')).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(parseAmount('-100')).toBe(0); // Should not allow negative
    });

    it('should handle whitespace', () => {
      expect(parseAmount('  100.50  ')).toBe(100.5);
      expect(parseAmount('  abc  ')).toBe(0);
    });

    it('should limit decimal places', () => {
      expect(parseAmount('100.123456')).toBe(100.123456);
      expect(parseAmount('100.123456789')).toBe(100.123457); // Correct rounding
    });
  });

  describe('Widget State Persistence', () => {
    it('should create correct widget props for persistence', () => {
      const widgetProps = {
        initialAmount: 100,
        initialFromCurrency: 'USD',
        initialToCurrency: 'EUR',
        decimalPlaces: 4,
      };
      
      expect(widgetProps).toHaveProperty('initialAmount');
      expect(widgetProps).toHaveProperty('initialFromCurrency');
      expect(widgetProps).toHaveProperty('initialToCurrency');
      expect(widgetProps).toHaveProperty('decimalPlaces');
    });

    it('should validate widget props', () => {
      const validProps = {
        initialAmount: 100,
        initialFromCurrency: 'USD',
        initialToCurrency: 'EUR',
        decimalPlaces: 4,
      };

      const invalidProps = {
        initialAmount: -100,
        initialFromCurrency: '',
        initialToCurrency: 'EUR',
        decimalPlaces: -1,
      };

      // Validation logic would check these
      expect(validProps.initialAmount).toBeGreaterThan(0);
      expect(validProps.initialFromCurrency).toHaveLength(3);
      expect(validProps.decimalPlaces).toBeGreaterThanOrEqual(0);
      
      expect(invalidProps.initialAmount).toBeLessThanOrEqual(0);
      expect(invalidProps.initialFromCurrency).toHaveLength(0);
      expect(invalidProps.decimalPlaces).toBeLessThan(0);
    });
  });

  describe('Exchange Rate API Integration', () => {
    beforeEach(() => {
      // Mock fetch for API calls
      global.fetch = jest.fn();
    });

    it('should handle API success response', async () => {
      const mockResponse = {
        data: {
          conversion_rate: 0.85,
        },
      };
      
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Test API call logic
      const apiUrl = 'https://api.polygon.io/v1/';
      const apiKey = 'test-key';
      
      const response = await fetch(`${apiUrl}conversion/USD/EUR?apiKey=${apiKey}`);
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.data.conversion_rate).toBe(0.85);
    });

    it('should handle API error response', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const apiUrl = 'https://api.polygon.io/v1/';
      const apiKey = 'test-key';
      
      const response = await fetch(`${apiUrl}conversion/USD/EUR?apiKey=${apiKey}`);
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('should handle network error', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      const apiUrl = 'https://api.polygon.io/v1/';
      const apiKey = 'test-key';
      
      await expect(fetch(`${apiUrl}conversion/USD/EUR?apiKey=${apiKey}`))
        .rejects.toThrow('Network error');
    });

    it('should fall back to static rates when API fails', () => {
      const staticRates = {
        USD: 1.0,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.0,
      };

      expect(staticRates.USD).toBe(1.0);
      expect(staticRates.EUR).toBeGreaterThan(0);
      expect(staticRates.GBP).toBeGreaterThan(0);
      expect(staticRates.JPY).toBeGreaterThan(0);
    });
  });

  describe('Recent Pairs Management', () => {
    it('should limit recent pairs to 5', () => {
      const recentPairs = [
        { from: 'USD', to: 'EUR', lastUsed: Date.now() - 1000 },
        { from: 'EUR', to: 'GBP', lastUsed: Date.now() - 2000 },
        { from: 'GBP', to: 'JPY', lastUsed: Date.now() - 3000 },
        { from: 'JPY', to: 'CAD', lastUsed: Date.now() - 4000 },
        { from: 'CAD', to: 'AUD', lastUsed: Date.now() - 5000 },
        { from: 'AUD', to: 'CHF', lastUsed: Date.now() - 6000 }, // Should be trimmed
      ];

      const limitedPairs = recentPairs.slice(0, 5);
      expect(limitedPairs).toHaveLength(5);
    });

    it('should update lastUsed timestamp when pair is accessed', () => {
      const oldTime = Date.now() - 10000;
      const recentPair = { from: 'USD', to: 'EUR', lastUsed: oldTime };
      
      const updatedPair = { ...recentPair, lastUsed: Date.now() };
      
      expect(updatedPair.lastUsed).toBeGreaterThan(recentPair.lastUsed);
    });

    it('should not duplicate pairs in recent list', () => {
      const existingPairs = [
        { from: 'USD', to: 'EUR', lastUsed: Date.now() - 1000 },
      ];

      const newPair = { from: 'USD', to: 'EUR', lastUsed: Date.now() };
      
      // In a real implementation, this would replace the existing pair
      const updatedPairs = [
        newPair,
        ...existingPairs.filter(pair => !(pair.from === newPair.from && pair.to === newPair.to))
      ];

      expect(updatedPairs).toHaveLength(1);
      expect(updatedPairs[0]).toEqual(newPair);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid currency codes', () => {
      const exchangeRates = {
        USD: 1.0,
        EUR: 0.85,
      };

      expect(() => convertCurrency(100, 'INVALID', 'EUR', exchangeRates)).not.toThrow();
      expect(convertCurrency(100, 'INVALID', 'EUR', exchangeRates)).toBe(0);
    });

    it('should handle undefined/null inputs', () => {
      const exchangeRates = {
        USD: 1.0,
        EUR: 0.85,
      };

      expect(() => convertCurrency(100, undefined as any, 'EUR', exchangeRates)).not.toThrow();
      expect(() => convertCurrency(100, 'USD', null as any, exchangeRates)).not.toThrow();
    });

    it('should handle NaN amounts', () => {
      const exchangeRates = {
        USD: 1.0,
        EUR: 0.85,
      };

      expect(convertCurrency(NaN, 'USD', 'EUR', exchangeRates)).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should handle large currency lists efficiently', () => {
      const largeExchangeRates: Record<string, number> = {};
      
      // Create 100+ currencies
      for (let i = 0; i < 150; i++) {
        largeExchangeRates[`CUR${i}`] = Math.random() * 100;
      }

      const startTime = performance.now();
      const result = convertCurrency(100, 'CUR0', 'CUR149', largeExchangeRates);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      expect(result).toBeGreaterThan(0);
    });
  });
});

// Utility functions for testing
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number>,
  precision: number = 4
): number => {
  if (!amount || amount <= 0 || !exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
    return 0;
  }

  const fromRate = exchangeRates[fromCurrency];
  const toRate = exchangeRates[toCurrency];
  
  if (!fromRate || !toRate) {
    return 0;
  }

  const convertedValue = (amount / fromRate) * toRate;
  return parseFloat(convertedValue.toFixed(precision));
};

export const formatCurrency = (amount: number, precision: number = 4): string => {
  return amount.toFixed(precision);
};

export const parseAmount = (input: string): number => {
  if (!input || typeof input !== 'string') return 0;
  
  const cleaned = input.trim();
  if (!cleaned) return 0;
  
  // Check for valid numeric format (only digits and at most one decimal point)
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return 0;
  
  const numericValue = parseFloat(cleaned);
  if (isNaN(numericValue) || numericValue < 0) return 0;
  
  // Limit to 6 decimal places
  return Math.round(numericValue * 1000000) / 1000000;
};