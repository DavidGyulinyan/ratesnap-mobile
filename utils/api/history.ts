// API utility for fetching historical currency rates
// Since this is an Expo project, we'll create an API utility rather than Next.js API routes

interface HistoricalRateRequest {
  baseCurrency: string;
  quoteCurrency: string;
  timeRange: '7d' | '30d' | '1y';
}

interface DataPoint {
  timestamp: string;
  rate: number;
  formattedDate: string;
}

interface HistoricalRateResponse {
  success: boolean;
  data?: {
    pair: string;
    range: string;
    dataPoints: DataPoint[];
  };
  error?: string;
}

class HistoricalRatesAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.polygon.io/v1/';
    this.apiKey = process.env.EXPO_PUBLIC_API_KEY || '';
  }

  /**
   * Fetch historical rates for a currency pair
   */
  async fetchHistoricalRates({
    baseCurrency,
    quoteCurrency,
    timeRange,
  }: HistoricalRateRequest): Promise<HistoricalRateResponse> {
    try {
      // For production, this would call a real historical rates API
      // For now, we'll generate realistic mock data based on current rates

      const pair = `${baseCurrency}_${quoteCurrency}`;
      const historicalData = this.generateMockHistoricalData(pair, timeRange);

      return {
        success: true,
        data: {
          pair,
          range: timeRange,
          dataPoints: historicalData,
        },
      };
    } catch (error) {
      console.error('Failed to fetch historical rates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate realistic mock historical data
   */
  private generateMockHistoricalData(pair: string, timeRange: string): DataPoint[] {
    const now = new Date();
    const dataPoints: DataPoint[] = [];
    
    // Realistic base rates for popular pairs
    const baseRates: Record<string, number> = {
      'USD_EUR': 0.85,
      'USD_GBP': 0.73,
      'USD_JPY': 110.0,
      'USD_CAD': 1.25,
      'USD_AUD': 1.35,
      'USD_CHF': 0.92,
      'USD_CNY': 6.45,
      'USD_SEK': 8.6,
      'EUR_GBP': 0.86,
      'EUR_USD': 1.18,
      'EUR_JPY': 129.4,
      'EUR_CHF': 1.08,
      'GBP_USD': 1.37,
      'GBP_EUR': 1.16,
      'GBP_JPY': 150.7,
      'JPY_USD': 0.0091,
      'JPY_EUR': 0.0077,
      'JPY_GBP': 0.0066,
    };

    let days = 30;
    let interval = 1; // days
    
    switch (timeRange) {
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
        interval = 7; // Weekly data for 1 year to keep it manageable
        break;
    }

    const baseRate = baseRates[pair] || 1.0;
    const volatility = this.getVolatilityForRange(timeRange);
    
    // Generate data points going backwards from today
    for (let i = days; i >= 0; i -= interval) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Create realistic rate with trend and volatility
      const trendFactor = 1 + (Math.sin((days - i) / days * Math.PI * 2) * 0.01);
      const randomFactor = 1 + (Math.random() - 0.5) * volatility;
      const longTermTrend = 1 + (i / days) * 0.005; // slight upward trend over time
      
      const rate = baseRate * randomFactor * trendFactor * longTermTrend;
      
      dataPoints.push({
        timestamp: date.toISOString(),
        rate: parseFloat(rate.toFixed(6)),
        formattedDate: this.formatDateForRange(date, timeRange),
      });
    }

    return dataPoints;
  }

  /**
   * Get volatility factor based on time range
   */
  private getVolatilityForRange(timeRange: string): number {
    switch (timeRange) {
      case '7d':
        return 0.015; // 1.5% daily volatility
      case '30d':
        return 0.02; // 2% daily volatility
      case '1y':
        return 0.025; // 2.5% daily volatility
      default:
        return 0.02;
    }
  }

  /**
   * Format date for display based on time range
   */
  private formatDateForRange(date: Date, timeRange: string): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    if (timeRange === '1y') {
      options.year = '2-digit';
    }

    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Try to fetch real data from external API (for future implementation)
   */
  private async tryFetchRealData(
    baseCurrency: string,
    quoteCurrency: string,
    timeRange: string
  ): Promise<DataPoint[] | null> {
    try {
      // Example of how this would work with a real API like Alpha Vantage or Polygon.io
      const url = `${this.baseUrl}v2/aggs/ticker/C:${baseCurrency}${quoteCurrency}/range/1/day/${this.getApiDateRange(
        timeRange
      )}?adjusted=true&sort=asc&limit=120&apiKey=${this.apiKey}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.results || result.results.length === 0) {
        throw new Error('No historical data available');
      }

      return result.results.map((item: any) => ({
        timestamp: new Date(item.t).toISOString(),
        rate: item.c, // Close price as the rate
        formattedDate: this.formatDateForRange(new Date(item.t), timeRange),
      }));
    } catch (error) {
      console.warn('Real API fetch failed, falling back to mock data:', error);
      return null;
    }
  }

  /**
   * Get date range string for API call
   */
  private getApiDateRange(timeRange: string): string {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return `${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}`;
  }

  /**
   * Get supported currency pairs
   */
  getSupportedPairs(): Array<{ base: string; quote: string; label: string }> {
    return [
      { base: 'USD', quote: 'EUR', label: 'USD/EUR' },
      { base: 'USD', quote: 'GBP', label: 'USD/GBP' },
      { base: 'USD', quote: 'JPY', label: 'USD/JPY' },
      { base: 'USD', quote: 'CAD', label: 'USD/CAD' },
      { base: 'USD', quote: 'AUD', label: 'USD/AUD' },
      { base: 'USD', quote: 'CHF', label: 'USD/CHF' },
      { base: 'USD', quote: 'CNY', label: 'USD/CNY' },
      { base: 'USD', quote: 'SEK', label: 'USD/SEK' },
      { base: 'EUR', quote: 'GBP', label: 'EUR/GBP' },
      { base: 'EUR', quote: 'USD', label: 'EUR/USD' },
      { base: 'EUR', quote: 'JPY', label: 'EUR/JPY' },
      { base: 'EUR', quote: 'CHF', label: 'EUR/CHF' },
      { base: 'GBP', quote: 'USD', label: 'GBP/USD' },
      { base: 'GBP', quote: 'EUR', label: 'GBP/EUR' },
      { base: 'GBP', quote: 'JPY', label: 'GBP/JPY' },
      { base: 'JPY', quote: 'USD', label: 'JPY/USD' },
      { base: 'JPY', quote: 'EUR', label: 'JPY/EUR' },
      { base: 'JPY', quote: 'GBP', label: 'JPY/GBP' },
    ];
  }

  /**
   * Calculate statistics for a data series
   */
  calculateStats(dataPoints: DataPoint[]) {
    if (dataPoints.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        change: 0,
        changePercent: 0,
        volatility: 0,
      };
    }

    const rates = dataPoints.map(point => point.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    
    const first = dataPoints[0].rate;
    const last = dataPoints[dataPoints.length - 1].rate;
    const change = last - first;
    const changePercent = (change / first) * 100;
    
    // Calculate volatility (standard deviation)
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - avg, 2), 0) / rates.length;
    const volatility = Math.sqrt(variance);

    return {
      min: parseFloat(min.toFixed(6)),
      max: parseFloat(max.toFixed(6)),
      avg: parseFloat(avg.toFixed(6)),
      change: parseFloat(change.toFixed(6)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volatility: parseFloat(volatility.toFixed(6)),
    };
  }
}

// Export singleton instance
export const historicalRatesAPI = new HistoricalRatesAPI();
export type { HistoricalRateRequest, HistoricalRateResponse, DataPoint };