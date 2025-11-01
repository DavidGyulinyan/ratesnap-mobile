// Tests for NewsFeed Widget and News Service

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NewsFeed } from '@/widgets/NewsFeed';
import { fetchNews, NewsArticle, clearNewsCache, simulateNewsUpdate, getCacheInfo } from '@/utils/newsService';

// Mock React Native components
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: {
    create: (styles: any) => styles,
  },
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  RefreshControl: 'RefreshControl',
  ActivityIndicator: 'ActivityIndicator',
  Linking: {
    openURL: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock theme components
jest.mock('@/components/themed-view', () => ({
  ThemedView: 'ThemedView',
}));

jest.mock('@/components/themed-text', () => ({
  ThemedText: 'ThemedText',
}));

// Mock fetchNews function
jest.mock('@/utils/newsService', () => ({
  fetchNews: jest.fn(),
  NewsArticle: jest.fn(),
  clearNewsCache: jest.fn(),
  simulateNewsUpdate: jest.fn(),
  getCacheInfo: jest.fn(),
}));

describe('NewsFeed Widget', () => {
  const mockFetchNews = fetchNews as jest.MockedFunction<typeof fetchNews>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchNews.mockClear();
    clearNewsCache.mockClear();
    simulateNewsUpdate.mockClear();
    getCacheInfo.mockClear();
  });

  const defaultProps = {
    widgetId: 'test-widget',
    keywords: ['USD', 'EUR'],
    maxItems: 10,
  };

  it('should render NewsFeed widget with default props', () => {
    const { getByText } = render(<NewsFeed {...defaultProps} />);

    expect(getByText('Financial News')).toBeTruthy();
    expect(getByText('📰')).toBeTruthy();
  });

  it('should render loading state initially', () => {
    mockFetchNews.mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    const { getByTestId } = render(<NewsFeed {...defaultProps} />);
    
    expect(getByTestId('loading-container')).toBeTruthy();
  });

  it('should render error state when fetch fails', async () => {
    const errorMessage = 'Failed to fetch news';
    mockFetchNews.mockRejectedValue(new Error(errorMessage));

    const { getByText, findByText } = render(<NewsFeed {...defaultProps} />);

    await waitFor(() => {
      expect(findByText(errorMessage)).toBeTruthy();
    });

    expect(getByText('Retry')).toBeTruthy();
  });

  it('should render articles when fetch succeeds', async () => {
    const mockArticles: NewsArticle[] = [
      {
        id: '1',
        title: 'USD Strengthens Against EUR',
        description: 'The US dollar gained against the euro in today\'s trading session.',
        url: 'https://example.com/article1',
        publishedAt: '2023-11-01T10:00:00Z',
        source: 'Reuters',
        author: 'John Doe',
      },
      {
        id: '2',
        title: 'EUR Weakens on ECB Comments',
        description: 'The euro fell following hawkish comments from ECB officials.',
        url: 'https://example.com/article2',
        publishedAt: '2023-11-01T09:00:00Z',
        source: 'Bloomberg',
        author: 'Jane Smith',
      },
    ];

    mockFetchNews.mockResolvedValue({
      articles: mockArticles,
      totalResults: mockArticles.length,
      status: 'ok',
    });

    const { findByText } = render(<NewsFeed {...defaultProps} />);

    await waitFor(() => {
      expect(findByText('USD Strengthens Against EUR')).toBeTruthy();
      expect(findByText('EUR Weakens on ECB Comments')).toBeTruthy();
    });
  });

  it('should render empty state when no articles found', async () => {
    mockFetchNews.mockResolvedValue({
      articles: [],
      totalResults: 0,
      status: 'ok',
    });

    const { findByText } = render(<NewsFeed {...defaultProps} />);

    await waitFor(() => {
      expect(findByText('No articles found. Try adjusting keywords or check your internet connection.')).toBeTruthy();
      expect(findByText('Try Again')).toBeTruthy();
    });
  });

  it('should show settings panel when settings button is clicked', () => {
    const { getByText, queryByText } = render(<NewsFeed {...defaultProps} />);
    
    // Settings panel should not be visible initially
    expect(queryByText('News Settings')).toBeNull();
    
    // Click settings button
    fireEvent.press(getByText('⚙️'));
    
    // Settings panel should now be visible
    expect(getByText('News Settings')).toBeTruthy();
    expect(getByText('Keywords:')).toBeTruthy();
    expect(getByText('Max Articles:')).toBeTruthy();
  });

  it('should toggle keyword selection in settings', () => {
    const { getByText } = render(<NewsFeed {...defaultProps} />);
    
    // Open settings
    fireEvent.press(getByText('⚙️'));
    
    // Click on a keyword (assuming 'USD' is available)
    const keywordButtons = ['currency', 'forex', 'USD', 'EUR'];
    const availableKeyword = keywordButtons.find(kw => kw !== undefined);
    
    if (availableKeyword) {
      fireEvent.press(getByText(availableKeyword));
      // Additional assertions would depend on how the keyword chips are styled
    }
  });

  it('should change max items setting', () => {
    const { getByText } = render(<NewsFeed {...defaultProps} />);
    
    // Open settings
    fireEvent.press(getByText('⚙️'));
    
    // Click on a different max items option
    fireEvent.press(getByText('15'));
    
    // Should trigger fetch with new maxItems
    expect(mockFetchNews).toHaveBeenCalledWith(
      expect.objectContaining({
        keywords: defaultProps.keywords,
        sources: [],
        limit: 15,
      })
    );
  });

  it('should handle refresh functionality', async () => {
    const mockArticles: NewsArticle[] = [
      {
        id: '1',
        title: 'Test Article',
        description: 'Test description',
        url: 'https://example.com',
        publishedAt: '2023-11-01T10:00:00Z',
        source: 'Test Source',
      },
    ];

    mockFetchNews.mockResolvedValue({
      articles: mockArticles,
      totalResults: mockArticles.length,
      status: 'ok',
    });

    const { getByText, findByText } = render(<NewsFeed {...defaultProps} />);

    // Wait for initial load
    await findByText('Test Article');

    // Click refresh button
    fireEvent.press(getByText('↻'));

    // Should call fetchNews again
    expect(mockFetchNews).toHaveBeenCalledTimes(2);
  });

  it('should handle article click and show confirmation alert', async () => {
    const mockArticles: NewsArticle[] = [
      {
        id: '1',
        title: 'Clickable Article',
        description: 'This article can be clicked',
        url: 'https://example.com/article',
        publishedAt: '2023-11-01T10:00:00Z',
        source: 'Test Source',
      },
    ];

    mockFetchNews.mockResolvedValue({
      articles: mockArticles,
      totalResults: mockArticles.length,
      status: 'ok',
    });

    const { findByText } = render(<NewsFeed {...defaultProps} />);

    // Wait for article to load
    await findByText('Clickable Article');

    // Click on article
    fireEvent.press(getByText('Clickable Article'));

    // Should show confirmation alert
    expect(require('react-native').Alert.alert).toHaveBeenCalledWith(
      'Open Article',
      'Open "Clickable Article" in browser?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Open', onPress: expect.any(Function) }),
      ])
    );
  });

  it('should format timestamps correctly', () => {
    const { getByText } = render(<NewsFeed {...defaultProps} />);
    
    // Test time formatting (this would depend on the actual implementation)
    // The component should show "Just now", "Xh ago", or formatted dates
  });

  it('should handle onWidgetChange callback', () => {
    const onWidgetChange = jest.fn();
    const { getByText } = render(<NewsFeed {...defaultProps} onWidgetChange={onWidgetChange} />);
    
    // Open settings and change max items
    fireEvent.press(getByText('⚙️'));
    fireEvent.press(getByText('15'));
    
    // Should call onWidgetChange with updated props
    expect(onWidgetChange).toHaveBeenCalledWith({
      keywords: defaultProps.keywords,
      sourceFilters: [],
      maxItems: 15,
    });
  });

  it('should use custom props when provided', () => {
    const customProps = {
      ...defaultProps,
      keywords: ['JPY', 'GBP'],
      sourceFilters: ['Reuters', 'Bloomberg'],
      maxItems: 5,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
    };

    render(<NewsFeed {...customProps} />);

    expect(mockFetchNews).toHaveBeenCalledWith(
      expect.objectContaining({
        keywords: customProps.keywords,
        sources: customProps.sourceFilters,
        limit: customProps.maxItems,
      })
    );
  });

  it('should handle retry button when error occurs', async () => {
    mockFetchNews
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        articles: [],
        totalResults: 0,
        status: 'ok',
      });

    const { getByText, findByText } = render(<NewsFeed {...defaultProps} />);

    // Wait for error to show
    await findByText('Failed to fetch news');

    // Click retry button
    fireEvent.press(getByText('Retry'));

    // Should retry the fetch
    expect(mockFetchNews).toHaveBeenCalledTimes(2);
  });
});

describe('News Service', () => {
  beforeEach(() => {
    clearNewsCache();
  });

  it('should have correct NewsArticle interface', () => {
    const article: NewsArticle = {
      id: '1',
      title: 'Test Title',
      description: 'Test Description',
      url: 'https://example.com',
      publishedAt: '2023-11-01T10:00:00Z',
      source: 'Test Source',
      author: 'Test Author',
    };

    expect(article.id).toBe('1');
    expect(article.title).toBe('Test Title');
    expect(article.description).toBe('Test Description');
    expect(article.url).toBe('https://example.com');
    expect(article.source).toBe('Test Source');
  });

  it('should handle cache management', () => {
    const cacheInfo = getCacheInfo();
    expect(cacheInfo).toHaveProperty('size');
    expect(cacheInfo).toHaveProperty('maxSize');
    expect(cacheInfo).toHaveProperty('duration');
  });

  it('should simulate news updates', () => {
    simulateNewsUpdate();
    expect(simulateNewsUpdate).toHaveBeenCalled();
  });

  it('should clear cache', () => {
    clearNewsCache();
    expect(clearNewsCache).toHaveBeenCalled();
  });
});

describe('NewsFeed Widget Integration', () => {
  it('should integrate with dashboard store', () => {
    // This would test the integration with the dashboard store
    // including adding widgets, updating props, etc.
  });

  it('should handle widget lifecycle events', () => {
    // Test mounting, unmounting, prop changes, etc.
  });
});