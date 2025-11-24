import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export interface HistoricalRateData {
  date: string;
  rate: number;
}

export interface HistoricalRatesResponse {
  base: string;
  target: string;
  rates: HistoricalRateData[];
}

class ExchangeRateService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || '';
    this.apiKey = Constants.expoConfig?.extra?.apiKey || process.env.EXPO_PUBLIC_API_KEY || '';
  }

  /**
   * Fetch historical exchange rates for a currency pair
   * @param baseCurrency Base currency (e.g., 'USD')
   * @param targetCurrency Target currency (e.g., 'EUR')
   * @param days Number of days of historical data (default: 30)
   * @returns Promise<HistoricalRatesResponse>
   */
  async getHistoricalRates(
    baseCurrency: string,
    targetCurrency: string,
    days: number = 30
  ): Promise<HistoricalRatesResponse> {
    try {
      const cacheKey = `historical_${baseCurrency}_${targetCurrency}_${days}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      const cacheTimestamp = await AsyncStorage.getItem(`${cacheKey}_timestamp`);
      const now = Date.now();
      const CACHE_DURATION = 3600000; // 1 hour

      // Check if we have valid cached data
      if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
        console.log('📦 Using cached historical rates');
        return JSON.parse(cachedData);
      }

      console.log(`🌐 Fetching historical rates: ${baseCurrency} to ${targetCurrency} for ${days} days`);

      // Generate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // For demo purposes, we'll simulate historical data since CurrencyFreaks free tier might not have historical data
      // In production, you would use a proper historical API endpoint
      const historicalData = await this.fetchHistoricalDataFromAPI(baseCurrency, targetCurrency, startDateStr, endDateStr);

      const response: HistoricalRatesResponse = {
        base: baseCurrency,
        target: targetCurrency,
        rates: historicalData
      };

      // Cache the data
      await AsyncStorage.setItem(cacheKey, JSON.stringify(response));
      await AsyncStorage.setItem(`${cacheKey}_timestamp`, now.toString());

      return response;
    } catch (error) {
      console.error('❌ Error fetching historical rates:', error);

      // Try to return cached data if available
      const cacheKey = `historical_${baseCurrency}_${targetCurrency}_${days}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        console.log('📦 Using cached historical rates after error');
        return JSON.parse(cachedData);
      }

      throw error;
    }
  }

  /**
   * Fetch historical data from API (CurrencyFreaks or alternative)
   * This is a placeholder - in production you'd use the actual API endpoint
   */
  private async fetchHistoricalDataFromAPI(
    baseCurrency: string,
    targetCurrency: string,
    startDate: string,
    endDate: string
  ): Promise<HistoricalRateData[]> {
    try {
      // Try CurrencyFreaks historical endpoint if available
      const historicalUrl = `${this.apiUrl}/historical?apikey=${this.apiKey}&base=${baseCurrency}&target=${targetCurrency}&start_date=${startDate}&end_date=${endDate}`;

      const response = await fetch(historicalUrl);

      if (response.ok) {
        const data = await response.json();
        // Transform the API response to our format
        return this.transformHistoricalData(data, baseCurrency, targetCurrency);
      }

      // If CurrencyFreaks doesn't have historical data, fall back to simulation
      console.log('⚠️ Historical API not available, using simulated data');
      return this.generateSimulatedHistoricalData(baseCurrency, targetCurrency, startDate, endDate);

    } catch (error) {
      console.log('⚠️ API error, using simulated historical data');
      return this.generateSimulatedHistoricalData(baseCurrency, targetCurrency, startDate, endDate);
    }
  }

  /**
   * Transform API response to our format
   */
  private transformHistoricalData(
    apiData: any,
    baseCurrency: string,
    targetCurrency: string
  ): HistoricalRateData[] {
    // This would depend on the actual API response format
    // For now, assuming a simple format
    if (apiData && apiData.rates) {
      return Object.entries(apiData.rates).map(([date, rate]: [string, any]) => ({
        date,
        rate: typeof rate === 'number' ? rate : parseFloat(rate[targetCurrency] || rate)
      }));
    }

    // Fallback to simulation
    return [];
  }

  /**
   * Generate simulated historical data for demo purposes
   */
  private generateSimulatedHistoricalData(
    baseCurrency: string,
    targetCurrency: string,
    startDate: string,
    endDate: string
  ): HistoricalRateData[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const data: HistoricalRateData[] = [];

    // Get current rate (approximate)
    const currentRate = this.getApproximateCurrentRate(baseCurrency, targetCurrency);

    // Generate data points
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      // Add some random variation (±5%) to simulate market fluctuations
      const variation = (Math.random() - 0.5) * 0.1; // -5% to +5%
      const rate = currentRate * (1 + variation);

      data.push({
        date: date.toISOString().split('T')[0],
        rate: parseFloat(rate.toFixed(4))
      });
    }

    return data.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get approximate current rate for simulation
   */
  private getApproximateCurrentRate(baseCurrency: string, targetCurrency: string): number {
    // Common exchange rates (approximate, for demo purposes)
    const rates: { [key: string]: { [key: string]: number } } = {
      'USD': {
        'EUR': 0.85,
        'GBP': 0.73,
        'JPY': 110.0,
        'CAD': 1.25,
        'AUD': 1.35,
        'CHF': 0.92,
        'CNY': 6.45,
        'AMD': 400.0
      },
      'EUR': {
        'USD': 1.18,
        'GBP': 0.86,
        'JPY': 129.0,
        'CAD': 1.47,
        'AUD': 1.59,
        'CHF': 1.08,
        'CNY': 7.58,
        'AMD': 470.0
      },
      'AMD': {
        'USD': 0.0025,
        'EUR': 0.0021,
        'GBP': 0.0018,
        'JPY': 0.275,
        'CAD': 0.0031,
        'AUD': 0.0034,
        'CHF': 0.0023,
        'CNY': 0.0161
      }
    };

    return rates[baseCurrency]?.[targetCurrency] || 1.0;
  }

  /**
   * Clear cached historical data
   */
  async clearHistoricalCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const historicalKeys = keys.filter(key => key.startsWith('historical_'));
      await AsyncStorage.multiRemove(historicalKeys);
      console.log('🧹 Cleared historical rate cache');
    } catch (error) {
      console.error('❌ Error clearing historical cache:', error);
    }
  }
}

export default new ExchangeRateService();