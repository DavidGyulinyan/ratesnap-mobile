// News Service with Caching for Financial/Currency News

export interface NewsArticle {
  imageUrl: any;
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: string;
  author?: string;
}

export interface NewsRequest {
  keywords: string[];
  sources?: string[];
  limit: number;
  language?: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
  status: string;
  code?: string;
  message?: string;
}

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cached requests

interface CacheEntry {
  data: NewsResponse;
  timestamp: number;
}

class NewsCache {
  private cache = new Map<string, CacheEntry>();

  constructor(private maxSize: number = MAX_CACHE_SIZE) {}

  private generateKey(request: NewsRequest): string {
    return JSON.stringify({
      keywords: request.keywords.sort(),
      sources: request.sources?.sort() || [],
      limit: request.limit,
      language: request.language || 'en',
    });
  }

  get(request: NewsRequest): NewsResponse | null {
    const key = this.generateKey(request);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if cache is expired
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(request: NewsRequest, data: NewsResponse): void {
    const key = this.generateKey(request);
    
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }
}

const newsCache = new NewsCache();

// Mock news data for testing and when external APIs are unavailable
const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: '1',
    title: 'Federal Reserve Holds Interest Rates Steady, Signals Cautious Approach',
    description: 'The Federal Reserve decided to maintain current interest rates while signaling a data-dependent approach to future policy decisions.',
    url: 'https://example.com/fed-holds-rates',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    source: 'Reuters',
    author: 'Federal Reserve Reporter',
  },
  {
    id: '2',
    title: 'EUR/USD Rises on ECB Hawkish Tone, Eyes 1.1000 Level',
    description: 'The euro gained against the dollar following comments from European Central Bank officials suggesting a more aggressive policy stance.',
    url: 'https://example.com/eur-usd-rises',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    source: 'Bloomberg',
    author: 'Currency Markets Team',
  },
  {
    id: '3',
    title: 'Dollar Weakens as Risk Sentiment Improves, Yen Retreats',
    description: 'The U.S. dollar index fell for the second consecutive day as investor risk appetite improved amid positive economic data.',
    url: 'https://example.com/dollar-weakens',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    source: 'CNBC',
    author: 'Forex Correspondent',
  },
  {
    id: '4',
    title: 'Bank of England Governor Signals Potential Rate Cuts Next Year',
    description: 'Bank of England Governor Andrew Bailey indicated that the central bank may consider cutting interest rates in 2024 if inflation continues to moderate.',
    url: 'https://example.com/boe-signals-cuts',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    source: 'Financial Times',
    author: 'UK Economics Reporter',
  },
  {
    id: '5',
    title: 'Asian Currencies Gain on China Stimulus Hopes, Yen Strengthens',
    description: 'Asian currencies rose against the dollar as investors bet on additional stimulus measures from China, while the Japanese yen found support.',
    url: 'https://example.com/asian-currencies-gain',
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
    source: 'MarketWatch',
    author: 'Asian Markets Analyst',
  },
  {
    id: '6',
    title: 'Gold Prices Hit Two-Month High as Dollar Slips, Safe-Haven Demand Fades',
    description: 'Gold futures climbed to their highest level in two months as the dollar weakened and investors shifted away from safe-haven assets.',
    url: 'https://example.com/gold-hits-high',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    source: 'Yahoo Finance',
    author: 'Commodities Reporter',
  },
  {
    id: '7',
    title: 'Canadian Dollar Strengthens on Strong Employment Data, Oil Price Support',
    description: 'The loonie gained against the U.S. dollar following robust Canadian employment figures and rising crude oil prices.',
    url: 'https://example.com/cad-strengthens',
    publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), // 14 hours ago
    source: 'Investopedia',
    author: 'North American Markets',
  },
  {
    id: '8',
    title: 'Emerging Market Currencies Rally on Improved Global Growth Outlook',
    description: 'Emerging market currencies rose across the board as investors increased exposure to riskier assets following positive global economic indicators.',
    url: 'https://example.com/em-currencies-rally',
    publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(), // 16 hours ago
    source: 'Financial Times',
    author: 'Emerging Markets Team',
  },
];

// Filter articles based on keywords and sources
function filterArticles(articles: NewsArticle[], keywords: string[], sources: string[] = []): NewsArticle[] {
  let filtered = articles;

  // Filter by sources if specified
  if (sources.length > 0) {
    filtered = filtered.filter(article => 
      sources.some(source => 
        article.source.toLowerCase().includes(source.toLowerCase())
      )
    );
  }

  // Filter by keywords if specified
  if (keywords.length > 0) {
    filtered = filtered.filter(article => {
      const searchText = `${article.title} ${article.description}`.toLowerCase();
      return keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
    });
  }

  return filtered;
}

// Generate mock response with filtered articles
function generateMockResponse(request: NewsRequest): NewsResponse {
  // For currency-related keywords, we'll simulate different results based on keywords
  let availableArticles = [...MOCK_ARTICLES];

  // If specific currency keywords are provided, bias the selection
  const currencyKeywords = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];
  const hasCurrencyKeywords = request.keywords.some(keyword => 
    currencyKeywords.includes(keyword.toUpperCase())
  );

  if (hasCurrencyKeywords) {
    // Prioritize articles that mention the specific currencies
    const currencySpecific = availableArticles.filter(article => {
      const searchText = `${article.title} ${article.description}`.toUpperCase();
      return request.keywords.some(keyword => 
        searchText.includes(keyword.toUpperCase())
      );
    });

    if (currencySpecific.length > 0) {
      availableArticles = [...currencySpecific, ...MOCK_ARTICLES];
    }
  }

  const filtered = filterArticles(availableArticles, request.keywords, request.sources);
  const limited = filtered.slice(0, request.limit);

  return {
    articles: limited,
    totalResults: filtered.length,
    status: 'ok',
  };
}

// Fetch news from external API (NewsAPI.org simulation)
async function fetchFromExternalAPI(request: NewsRequest): Promise<NewsResponse> {
  // In a real implementation, you would integrate with NewsAPI, Alpha Vantage, or similar
  // For now, we'll simulate the API call
  
  // This is where you would make the actual API call:
  // const response = await fetch(`https://newsapi.org/v2/everything?apiKey=${API_KEY}&q=${keywords.join(' OR ')}&pageSize=${limit}&sortBy=publishedAt`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // Simulate occasional API failures
  if (Math.random() < 0.1) {
    throw new Error('News API temporarily unavailable');
  }
  
  // For demo purposes, return mock data
  return generateMockResponse(request);
}

// Main function to fetch news with caching
export async function fetchNews(request: NewsRequest): Promise<NewsResponse> {
  try {
    // Check cache first
    const cached = newsCache.get(request);
    if (cached) {
      console.log('📰 Returning cached news data');
      return cached;
    }

    // Try external API first
    try {
      const response = await fetchFromExternalAPI(request);
      newsCache.set(request, response);
      return response;
    } catch (externalError) {
      console.warn('📰 External news API failed, using mock data:', externalError);
      
      // Fallback to mock data
      const mockResponse = generateMockResponse(request);
      newsCache.set(request, mockResponse);
      return mockResponse;
    }
  } catch (error) {
    // Final fallback - at least return some mock data
    console.error('📰 News fetch failed completely:', error);
    
    return {
      articles: [],
      totalResults: 0,
      status: 'error',
      code: 'NO_DATA',
      message: error instanceof Error ? error.message : 'Unable to fetch news',
    };
  }
}

// Utility functions for the UI
export function formatNewsTimestamp(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  } catch {
    return 'Unknown';
  }
}

export function getNewsCategories(): string[] {
  return [
    'All',
    'Central Banks',
    'Currency Pairs',
    'Interest Rates',
    'Economic Data',
    'Market Analysis',
    'Brexit/Geopolitics',
    'Commodities',
    'Tech/Stocks',
  ];
}

// Cache management functions (useful for testing or manual cache clearing)
export function clearNewsCache(): void {
  newsCache.clear();
}

export function getCacheInfo(): { size: number; maxSize: number; duration: number } {
  return {
    size: newsCache.getSize(),
    maxSize: MAX_CACHE_SIZE,
    duration: CACHE_DURATION,
  };
}

// Simulate news update (for testing)
export function simulateNewsUpdate(): void {
  // Add a new article to the mock data
  const newArticle: NewsArticle = {
    id: Date.now().toString(),
    title: 'Breaking: USD Surges on Strong Economic Data Beat',
    description: 'The U.S. dollar index jumped 0.8% as new economic data exceeded expectations, raising Fed policy outlook.',
    url: `https://example.com/breaking-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    source: 'Reuters',
    author: 'Breaking News Desk',
  };

  // Insert at beginning of mock data
  MOCK_ARTICLES.unshift(newArticle);
  
  // Keep only the most recent articles
  if (MOCK_ARTICLES.length > 50) {
    MOCK_ARTICLES.splice(50);
  }
  
  console.log('📰 Simulated news update - new article added');
}

// Simulate rate-limited API responses
export function simulateRateLimit(): void {
  console.log('📰 Simulating rate limit - news API temporarily unavailable');
  // In a real implementation, this would be handled by the external API
}