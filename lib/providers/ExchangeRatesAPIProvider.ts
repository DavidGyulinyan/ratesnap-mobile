// ExchangeRatesAPI Public Rate Provider
// Uses free exchangerate-api.com with optional API key support

import { BaseRateProvider, RateData, ProviderInfo } from './ProviderInterface';

interface APIResponse {
  result: 'success' | 'error';
  base_code?: string;
  target_code?: string;
  conversion_rate?: number;
  time_last_update_utc?: string;
  error_message?: string;
}

interface ConversionResponse {
  result: 'success' | 'error';
  base_code: string;
  target_code: string;
  conversion_rate: number;
  time_last_update_utc: string;
  error_message?: string;
}

export class ExchangeRatesAPIProvider extends BaseRateProvider {
  info: ProviderInfo = {
    name: 'exchangeratesapi',
    displayName: 'ExchangeRates-API',
    description: 'Free currency conversion API with live rates from multiple sources',
    website: 'https://exchangerate-api.com',
    supportsCustomPair: true,
    rateTypes: ['mid'], // API provides mid-market rates
  };

  // Free API base URL (no key required for basic usage)
  private readonly freeApiBase = 'https://api.exchangerate-api.com/v4/latest';
  
  // Paid API base URL (requires API key)
  private readonly paidApiBase = 'https://v6.exchangerate-api.com/v6';
  
  // Default API key (should be configured via environment variables)
  private apiKey?: string;

  // Supported currencies cache
  private supportedCurrencies: string[] = [];

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
      const [fromCurrency, toCurrency] = pair.split('_');
      
      // Use paid API if available, otherwise free API
      const url = this.apiKey 
        ? `${this.paidApiBase}/${this.apiKey}/pair/${fromCurrency}/${toCurrency}`
        : `${this.freeApiBase}/${fromCurrency}`;
      
      const response = await this.fetchWithRetry(url);
      const data: APIResponse | ConversionResponse = await response.json();
      
      // Check if the API response is valid
      if (data.result === 'error') {
        return {
          provider: this.info.name,
          buy: 0,
          sell: 0,
          timestamp: new Date().toISOString(),
          success: false,
          error: `API Error: ${data.error_message || 'Unknown error'}`,
        };
      }

      // For free API, we need to extract the specific currency rate from the full response
      let conversionRate: number;
      let timestamp: string;

      if ('conversion_rate' in data) {
        // Paid API direct pair response
        conversionRate = data.conversion_rate!;
        timestamp = data.time_last_update_utc || new Date().toISOString();
      } else {
        // Free API full rates response - need to find our target currency
        const fullResponse = data as any;
        if (fullResponse.rates && fullResponse.rates[toCurrency]) {
          conversionRate = fullResponse.rates[toCurrency];
          timestamp = fullResponse.time_last_update_utc || new Date().toISOString();
        } else {
          return {
            provider: this.info.name,
            buy: 0,
            sell: 0,
            timestamp: new Date().toISOString(),
            success: false,
            error: `Currency ${toCurrency} not available in API response`,
          };
        }
      }

      // API provides mid-market rates only, so buy = sell = mid
      const buy = conversionRate;
      const sell = conversionRate;

      const result: RateData = {
        provider: this.info.name,
        buy,
        sell,
        timestamp: timestamp || new Date().toISOString(),
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
        error: `Failed to fetch rates: ${error instanceof Error ? error.message : 'Network error'}`,
      };
    }
  }

  supportsPair(pair: string): boolean {
    if (!this.validatePair(pair)) {
      return false;
    }

    // All ISO currency codes are supported by the API
    // This is a simplified check - in production, you might want to fetch and cache the supported currencies
    const [fromCurrency, toCurrency] = pair.split('_');
    
    // Basic validation - both should be 3-letter currency codes
    return /^[A-Z]{3}$/.test(fromCurrency) && /^[A-Z]{3}$/.test(toCurrency);
  }

  getConfigOptions(): Record<string, any> {
    return {
      apiKey: {
        description: 'ExchangeRates-API Key (optional, for premium features)',
        type: 'text',
        value: this.apiKey || '',
        placeholder: 'your-api-key-here',
        sensitive: true,
      },
      useFreeTier: {
        description: 'Use free tier (limited features)',
        type: 'boolean',
        value: !this.apiKey,
      },
      maxRequestsPerMonth: {
        description: 'Maximum requests per month (free tier: 1500)',
        type: 'number',
        value: this.apiKey ? 100000 : 1500,
        readonly: true,
      },
      features: {
        description: 'Available features',
        type: 'readonly',
        value: this.apiKey ? 'Direct pair queries, more currencies, historical data' : 'Basic currency conversion',
      },
    };
  }

  // Set API key
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    // Clear supported currencies cache when API key changes
    this.supportedCurrencies = [];
  }

  // Get supported currencies (requires API call)
  async getSupportedCurrencies(): Promise<string[]> {
    if (this.supportedCurrencies.length > 0) {
      return this.supportedCurrencies;
    }

    try {
      const url = this.apiKey 
        ? `${this.paidApiBase}/${this.apiKey}/codes`
        : `${this.freeApiBase}/USD`;
      
      const response = await this.fetchWithRetry(url);
      const data = await response.json();

      if (data.result === 'success' && data.supported_codes) {
        this.supportedCurrencies = data.supported_codes.map((code: string[]) => code[0]);
      } else if (data.rates) {
        // Free tier - extract from rates object
        this.supportedCurrencies = Object.keys(data.rates);
      }
    } catch (error) {
      console.warn('Failed to fetch supported currencies:', error);
      // Fallback to common currencies
      this.supportedCurrencies = [
        'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 
        'BRL', 'MXN', 'KRW', 'ZAR', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK'
      ];
    }

    return this.supportedCurrencies;
  }

  // Check if using free tier
  isUsingFreeTier(): boolean {
    return !this.apiKey;
  }

  // Get rate limit info
  getRateLimitInfo(): { remaining: number; resetTime?: Date } {
    if (this.apiKey) {
      // Paid tier has high limits (1M+ requests/month)
      return { remaining: 999999 };
    } else {
      // Free tier has 1500 requests/month
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { 
        remaining: 1500, 
        resetTime: nextMonth 
      };
    }
  }
}

// Register the provider
import { ProviderFactory } from './ProviderInterface';
ProviderFactory.registerProvider('exchangeratesapi', ExchangeRatesAPIProvider);