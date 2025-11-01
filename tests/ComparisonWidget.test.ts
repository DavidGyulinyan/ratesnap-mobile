// Tests for Comparison Widget and Provider Adapters

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProviderFactory, RateData } from '@/lib/providers/ProviderInterface';
import { RateSnapProvider } from '@/lib/providers/RateSnapProvider';
import { ExchangeRatesAPIProvider } from '@/lib/providers/ExchangeRatesAPIProvider';

// Mock fetch for testing
(global as any).fetch = jest.fn();

describe('Provider Adapters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any registered providers and re-register
    (ProviderFactory as any).providers.clear();
    ProviderFactory.registerProvider('ratesnap', RateSnapProvider);
    ProviderFactory.registerProvider('exchangeratesapi', ExchangeRatesAPIProvider);
  });

  describe('RateSnapProvider', () => {
    let provider: RateSnapProvider;

    beforeEach(() => {
      provider = new RateSnapProvider();
    });

    it('should create provider instance', () => {
      expect(provider).toBeInstanceOf(RateSnapProvider);
      expect(provider.info.name).toBe('ratesnap');
      expect(provider.info.displayName).toBe('RateSnap Aggregated');
    });

    it('should support known currency pairs', () => {
      expect(provider.supportsPair('USD_EUR')).toBe(true);
      expect(provider.supportsPair('USD_GBP')).toBe(true);
      expect(provider.supportsPair('EUR_JPY')).toBe(true);
    });

    it('should not support unknown currency pairs', () => {
      expect(provider.supportsPair('INVALID_PAIR')).toBe(false);
      expect(provider.supportsPair('USD')).toBe(false);
    });

    it('should fetch rates successfully', async () => {
      const result = await provider.fetchRates('USD_EUR');
      
      expect(result).toMatchObject({
        provider: 'ratesnap',
        success: true,
      });
      expect(result.buy).toBeGreaterThan(0);
      expect(result.sell).toBeGreaterThan(0);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle invalid pairs gracefully', async () => {
      const result = await provider.fetchRates('INVALID_PAIR');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid pair format');
      expect(result.buy).toBe(0);
      expect(result.sell).toBe(0);
    });

    it('should handle unsupported pairs gracefully', async () => {
      const result = await provider.fetchRates('ABC_XYZ');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not supported');
      expect(result.buy).toBe(0);
      expect(result.sell).toBe(0);
    });

    it('should cache results', async () => {
      const result1 = await provider.fetchRates('USD_EUR');
      const result2 = await provider.fetchRates('USD_EUR');
      
      expect(result1.timestamp).toBe(result2.timestamp);
      expect(result1.buy).toBe(result2.buy);
    });

    it('should handle disabled provider', async () => {
      provider.updateConfig({ enabled: false });
      
      const result = await provider.fetchRates('USD_EUR');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled');
    });

    it('should update mock rates', () => {
      provider.updateMockRate('USD_EUR', 0.90, 0.92);
      
      expect(provider['mockRates']['USD_EUR']).toEqual({
        buy: 0.90,
        sell: 0.92,
        mid: 0.91,
      });
    });

    it('should get available pairs', () => {
      const pairs = provider.getAvailablePairs();
      expect(pairs).toContain('USD_EUR');
      expect(pairs).toContain('USD_GBP');
      expect(pairs.length).toBeGreaterThan(0);
    });

    it('should check provider health', async () => {
      const isHealthy = await provider.isHealthy();
      expect(isHealthy).toBe(true);
    });

    it('should provide configuration options', () => {
      const options = provider.getConfigOptions();
      expect(options).toHaveProperty('mockData');
      expect(options).toHaveProperty('apiEndpoint');
      expect(options).toHaveProperty('updateFrequency');
    });
  });

  describe('ExchangeRatesAPIProvider', () => {
    let provider: ExchangeRatesAPIProvider;

    beforeEach(() => {
      provider = new ExchangeRatesAPIProvider();
      // Mock fetch to return a successful response
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          result: 'success',
          base_code: 'USD',
          target_code: 'EUR',
          conversion_rate: 0.8535,
          time_last_update_utc: '2023-11-01T00:00:00Z',
        }),
      });
    });

    it('should create provider instance', () => {
      expect(provider).toBeInstanceOf(ExchangeRatesAPIProvider);
      expect(provider.info.name).toBe('exchangeratesapi');
      expect(provider.info.displayName).toBe('ExchangeRates-API');
    });

    it('should support any valid currency pair format', () => {
      expect(provider.supportsPair('USD_EUR')).toBe(true);
      expect(provider.supportsPair('GBP_JPY')).toBe(true);
      expect(provider.supportsPair('ABC_DEF')).toBe(true); // Valid format but may not exist in API
    });

    it('should not support invalid currency pair format', () => {
      expect(provider.supportsPair('INVALID_PAIR')).toBe(false);
      expect(provider.supportsPair('USD')).toBe(false);
      expect(provider.supportsPair('USD_EUR_GBP')).toBe(false);
    });

    it('should fetch rates successfully with free API', async () => {
      const result = await provider.fetchRates('USD_EUR');
      
      expect(result.success).toBe(true);
      expect(result.provider).toBe('exchangeratesapi');
      expect(result.buy).toBe(0.8535);
      expect(result.sell).toBe(0.8535); // API provides mid-market rate
      expect(result.timestamp).toBeDefined();
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          result: 'error',
          'error-message': 'Invalid currency code',
        }),
      });

      const result = await provider.fetchRates('INVALID_PAIR');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await provider.fetchRates('USD_EUR');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should set API key', () => {
      provider.setApiKey('test-api-key');
      expect(provider['apiKey']).toBe('test-api-key');
    });

    it('should detect free tier usage', () => {
      expect(provider.isUsingFreeTier()).toBe(true);
      
      provider.setApiKey('test-key');
      expect(provider.isUsingFreeTier()).toBe(false);
    });

    it('should provide configuration options', () => {
      const options = provider.getConfigOptions();
      expect(options).toHaveProperty('apiKey');
      expect(options).toHaveProperty('useFreeTier');
      expect(options).toHaveProperty('maxRequestsPerMonth');
      expect(options).toHaveProperty('features');
    });

    it('should provide rate limit information', () => {
      const info = provider.getRateLimitInfo();
      expect(info).toHaveProperty('remaining');
      expect(info.resetTime).toBeDefined();
    });

    it('should validate currency pair format', () => {
      expect((provider as any).validatePair('USD_EUR')).toBe(true);
      expect((provider as any).validatePair('INVALID')).toBe(false);
      expect((provider as any).validatePair('USD_EUR_GBP')).toBe(false);
    });

    it('should convert pair format', () => {
      expect((provider as any).convertPairFormat('USD_EUR')).toBe('USD/EUR');
      expect((provider as any).convertPairFormat('USD_EUR', '-')).toBe('USD-EUR');
    });
  });

  describe('ProviderFactory', () => {
    it('should register and create providers', () => {
      const provider = ProviderFactory.createProvider('ratesnap');
      expect(provider).toBeInstanceOf(RateSnapProvider);
    });

    it('should return null for unknown providers', () => {
      const provider = ProviderFactory.createProvider('unknown');
      expect(provider).toBeNull();
    });

    it('should list registered providers', () => {
      const providers = ProviderFactory.getRegisteredProviders();
      expect(providers).toContain('ratesnap');
      expect(providers).toContain('exchangeratesapi');
    });

    it('should handle provider registration', () => {
      ProviderFactory.registerProvider('test', RateSnapProvider);
      expect(ProviderFactory.getRegisteredProviders()).toContain('test');
    });
  });
});

describe('Comparison Widget Integration', () => {
  it('should integrate Comparison widget with provider system', () => {
    // Test that the Comparison widget can be imported and created
    const { Comparison } = require('@/widgets/Comparison');
    expect(typeof Comparison).toBe('function');
  });

  it('should provide mock data for testing', () => {
    // Verify mock rates are available for testing
    const provider = new RateSnapProvider();
    const mockRates = provider['mockRates'];
    
    expect(mockRates['USD_EUR']).toBeDefined();
    expect(mockRates['USD_EUR'].buy).toBeGreaterThan(0);
    expect(mockRates['USD_EUR'].sell).toBeGreaterThan(0);
    expect(mockRates['USD_EUR'].mid).toBeGreaterThan(0);
  });
});

describe('Rate Data Structure', () => {
  it('should have correct RateData interface', () => {
    const validRateData: RateData = {
      provider: 'test-provider',
      buy: 1.1234,
      sell: 1.1235,
      timestamp: new Date().toISOString(),
      success: true,
    };

    expect(validRateData.provider).toBe('test-provider');
    expect(validRateData.buy).toBeGreaterThan(0);
    expect(validRateData.sell).toBeGreaterThan(0);
    expect(validRateData.success).toBe(true);
    expect(validRateData.timestamp).toBeDefined();
  });

  it('should handle error RateData', () => {
    const errorRateData: RateData = {
      provider: 'test-provider',
      buy: 0,
      sell: 0,
      timestamp: new Date().toISOString(),
      success: false,
      error: 'Provider not available',
    };

    expect(errorRateData.success).toBe(false);
    expect(errorRateData.error).toBeDefined();
    expect(errorRateData.buy).toBe(0);
    expect(errorRateData.sell).toBe(0);
  });
});