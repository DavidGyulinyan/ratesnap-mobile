// Rate Provider Interface and Types
// Defines the contract for all rate providers

export interface RateData {
  provider: string;
  buy: number;
  sell: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface ProviderConfig {
  enabled: boolean;
  cacheTimeout: number; // Cache duration in milliseconds
  retryAttempts: number;
  timeout: number; // Request timeout in milliseconds
}

export interface ProviderInfo {
  name: string;
  displayName: string;
  description: string;
  website?: string;
  supportsCustomPair?: boolean;
  rateTypes: ('buy' | 'sell' | 'mid')[];
}

export interface RateProvider {
  info: ProviderInfo;
  config: ProviderConfig;
  
  // Fetch rates for a specific currency pair
  fetchRates(pair: string): Promise<RateData>;
  
  // Check if the provider can handle the given pair
  supportsPair(pair: string): boolean;
  
  // Provider health check
  isHealthy(): Promise<boolean>;
  
  // Update provider configuration
  updateConfig(config: Partial<ProviderConfig>): void;
  
  // Get provider-specific configuration options
  getConfigOptions(): Record<string, any>;
}

export interface ProviderError extends Error {
  code: string;
  provider: string;
  pair: string;
  originalError?: Error;
}

export class ProviderFactory {
  private static providers: Map<string, new () => RateProvider> = new Map();
  
  static registerProvider(name: string, providerClass: new () => RateProvider): void {
    this.providers.set(name, providerClass);
  }
  
  static createProvider(name: string): RateProvider | null {
    const ProviderClass = this.providers.get(name);
    if (ProviderClass) {
      return new ProviderClass();
    }
    return null;
  }
  
  static getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Base abstract class for rate providers
export abstract class BaseRateProvider implements RateProvider {
  abstract info: ProviderInfo;
  
  config: ProviderConfig = {
    enabled: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes default
    retryAttempts: 3,
    timeout: 10000, // 10 seconds default
  };
  
  private cache: Map<string, { data: RateData; timestamp: number }> = new Map();
  
  abstract fetchRates(pair: string): Promise<RateData>;
  abstract supportsPair(pair: string): boolean;
  abstract getConfigOptions(): Record<string, any>;
  
  async isHealthy(): Promise<boolean> {
    try {
      // Use a common pair for health check (EUR/USD is usually available)
      const result = await this.fetchRates('USD_EUR');
      return result.success;
    } catch (error) {
      return false;
    }
  }
  
  updateConfig(newConfig: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  // Cache management
  protected getCachedRate(pair: string): RateData | null {
    const cached = this.cache.get(pair);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached.data;
    }
    return null;
  }
  
  protected setCachedRate(pair: string, data: RateData): void {
    this.cache.set(pair, {
      data,
      timestamp: Date.now(),
    });
  }
  
  protected createError(message: string, code: string, originalError?: Error): ProviderError {
    const error = new Error(message) as ProviderError;
    error.code = code;
    error.provider = this.info.name;
    error.originalError = originalError;
    return error;
  }
  
  protected async fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt === this.config.retryAttempts) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw lastError!;
  }
  
  // Utility method to validate currency pair format
  protected validatePair(pair: string): boolean {
    return /^[A-Z]{3}_[A-Z]{3}$/.test(pair);
  }
  
  // Utility method to convert pair format (USD_EUR -> EUR/USD)
  protected convertPairFormat(pair: string, separator: string = '/'): string {
    const [from, to] = pair.split('_');
    return `${from}${separator}${to}`;
  }
}