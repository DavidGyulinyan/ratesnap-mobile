// RateSnap Internal Rate Provider
// Simulates the internal aggregated rates from RateSnap's data sources

import { BaseRateProvider, RateData, ProviderInfo } from './ProviderInterface';

export class RateSnapProvider extends BaseRateProvider {
  info: ProviderInfo = {
    name: 'ratesnap',
    displayName: 'RateSnap Aggregated',
    description: 'RateSnap internal aggregated rates from multiple data sources',
    website: 'https://ratesnap.com',
    supportsCustomPair: true,
    rateTypes: ['buy', 'sell', 'mid'],
  };

  // Mock rate data - in production this would come from RateSnap's internal APIs
  private mockRates: Record<string, { buy: number; sell: number; mid: number }> = {
    'USD_EUR': { buy: 0.8523, sell: 0.8547, mid: 0.8535 },
    'USD_GBP': { buy: 0.7289, sell: 0.7315, mid: 0.7302 },
    'USD_JPY': { buy: 149.25, sell: 149.95, mid: 149.60 },
    'USD_CAD': { buy: 1.3245, sell: 1.3278, mid: 1.3262 },
    'USD_AUD': { buy: 1.4876, sell: 1.4912, mid: 1.4894 },
    'USD_CHF': { buy: 0.8698, sell: 0.8725, mid: 0.8712 },
    'USD_CNY': { buy: 7.2345, sell: 7.2578, mid: 7.2462 },
    'USD_INR': { buy: 83.124, sell: 83.456, mid: 83.290 },
    'EUR_GBP': { buy: 0.8542, sell: 0.8568, mid: 0.8555 },
    'EUR_JPY': { buy: 175.23, sell: 175.87, mid: 175.55 },
    'GBP_JPY': { buy: 204.78, sell: 205.42, mid: 205.10 },
  };

  // Time to live for cached rates (1 minute for internal rates as they're updated frequently)
  private cacheTimeout = 60 * 1000;

  async fetchRates(pair: string): Promise<RateData> {
    if (!this.config.enabled) {
      return {
        provider: this.info.name,
        buy: 0,
        sell: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: 'Provider is disabled',
      };
    }

    // Validate pair format
    if (!this.validatePair(pair)) {
      return {
        provider: this.info.name,
        buy: 0,
        sell: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: `Invalid pair format: ${pair}`,
      };
    }

    // Check cache first
    const cached = this.getCachedRate(pair);
    if (cached) {
      return cached;
    }

    try {
      // Simulate API call delay (100-300ms)
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

      // Get rate from mock data
      const rateData = this.mockRates[pair.toUpperCase()];
      
      if (!rateData) {
        return {
          provider: this.info.name,
          buy: 0,
          sell: 0,
          timestamp: new Date().toISOString(),
          success: false,
          error: `Pair ${pair} not supported by RateSnap provider`,
        };
      }

      const result: RateData = {
        provider: this.info.name,
        buy: rateData.buy,
        sell: rateData.sell,
        timestamp: new Date().toISOString(),
        success: true,
      };

      // Cache the result
      this.setCachedRate(pair, result);

      return result;
    } catch (error) {
      return {
        provider: this.info.name,
        buy: 0,
        sell: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: `Failed to fetch rates: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  supportsPair(pair: string): boolean {
    if (!this.validatePair(pair)) {
      return false;
    }
    
    return pair.toUpperCase() in this.mockRates;
  }

  getConfigOptions(): Record<string, any> {
    return {
      mockData: {
        description: 'Mock rate data for testing',
        type: 'readonly',
        value: Object.keys(this.mockRates).length + ' pairs available',
      },
      apiEndpoint: {
        description: 'RateSnap internal API endpoint',
        type: 'text',
        value: 'https://api.ratesnap.com/v1/rates',
        placeholder: 'https://api.ratesnap.com/v1/rates',
      },
      updateFrequency: {
        description: 'How often rates are updated (seconds)',
        type: 'number',
        value: 60,
        min: 30,
        max: 3600,
      },
    };
  }

  // Method to update mock rates (for testing/simulation)
  updateMockRate(pair: string, buy: number, sell: number): void {
    const upperPair = pair.toUpperCase();
    const mid = (buy + sell) / 2;
    this.mockRates[upperPair] = { buy, sell, mid };
    
    // Clear cache for this pair
    // Clear cache for this pair by setting an expired cached value
    const expiredTimestamp = new Date(Date.now() - this.cacheTimeout - 1000).toISOString();
    const expiredResult: RateData = {
      provider: this.info.name,
      buy: 0,
      sell: 0,
      timestamp: expiredTimestamp,
      success: false,
      error: 'Cache invalidated',
    };
    this.setCachedRate(upperPair, expiredResult);
  }

  // Get all available pairs
  getAvailablePairs(): string[] {
    return Object.keys(this.mockRates);
  }

  // Set custom cache timeout (for testing)
  setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
  }
}

// Register the provider
import { ProviderFactory } from './ProviderInterface';
ProviderFactory.registerProvider('ratesnap', RateSnapProvider);