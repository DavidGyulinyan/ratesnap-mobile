import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { fetchNews, NewsArticle } from '@/utils/newsService';

interface NewsFeedProps {
  widgetId: string;
  keywords?: string[];
  sourceFilters?: string[];
  maxItems?: number;
  refreshInterval?: number; // in milliseconds
  onWidgetChange?: (props: any) => void;
}

interface SettingsState {
  keywords: string[];
  sourceFilters: string[];
  maxItems: number;
  showSettings: boolean;
}

export function NewsFeed({ 
  widgetId, 
  keywords = ['currency', 'forex', 'USD', 'EUR'],
  sourceFilters = [],
  maxItems = 10,
  refreshInterval = 30 * 60 * 1000, // 30 minutes
  onWidgetChange 
}: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsState>({
    keywords,
    sourceFilters,
    maxItems,
    showSettings: false,
  });

  useEffect(() => {
    fetchNewsData();
  }, [settings.keywords, settings.sourceFilters, settings.maxItems]);

  const fetchNewsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const newsData = await fetchNews({
        keywords: settings.keywords,
        sources: settings.sourceFilters,
        limit: settings.maxItems,
      });

      setArticles(newsData.articles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNewsData();
  };

  const handleOpenArticle = async (url: string, title: string) => {
    try {
      // Show confirmation alert before opening external link
      Alert.alert(
        'Open Article',
        `Open "${title}" in browser?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => Linking.openURL(url) },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Could not open article link');
    }
  };

  const formatTimeAgo = (dateString: string): string => {
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
  };

  const updateSettings = (newSettings: Partial<SettingsState>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    // Notify parent component about changes
    onWidgetChange?.({
      keywords: updated.keywords,
      sourceFilters: updated.sourceFilters,
      maxItems: updated.maxItems,
    });
  };

  const availableSources = [
    'Reuters',
    'Bloomberg',
    'Financial Times',
    'CNBC',
    'MarketWatch',
    'Yahoo Finance',
    'Investopedia',
  ];

  const commonKeywords = [
    'currency', 'forex', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD',
    'exchange rate', 'interest rate', 'inflation', 'central bank',
    'Federal Reserve', 'ECB', 'BoE', 'BoJ', 'trading', 'investing'
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>📰</Text>
          <ThemedText style={styles.title}>Financial News</ThemedText>
        </View>
        
        <View style={styles.headerRight}>
          {/* Settings Button */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => updateSettings({ showSettings: !settings.showSettings })}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
          
          {/* Refresh Button */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.refreshButtonText}>↻</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Panel */}
      {settings.showSettings && (
        <View style={styles.settingsPanel}>
          <ThemedText style={styles.settingsTitle}>News Settings</ThemedText>
          
          {/* Keywords */}
          <View style={styles.settingGroup}>
            <ThemedText style={styles.settingLabel}>Keywords:</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.keywordList}
            >
              {commonKeywords.map((keyword) => (
                <TouchableOpacity
                  key={keyword}
                  style={[
                    styles.keywordChip,
                    settings.keywords.includes(keyword) && styles.keywordChipActive
                  ]}
                  onPress={() => {
                    const newKeywords = settings.keywords.includes(keyword)
                      ? settings.keywords.filter(k => k !== keyword)
                      : [...settings.keywords, keyword];
                    updateSettings({ keywords: newKeywords });
                  }}
                >
                  <Text style={[
                    styles.keywordText,
                    settings.keywords.includes(keyword) && styles.keywordTextActive
                  ]}>
                    {keyword}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Max Items */}
          <View style={styles.settingGroup}>
            <ThemedText style={styles.settingLabel}>Max Articles:</ThemedText>
            <View style={styles.maxItemsContainer}>
              {[5, 10, 15, 20].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.maxItemButton,
                    settings.maxItems === count && styles.maxItemButtonActive
                  ]}
                  onPress={() => updateSettings({ maxItems: count })}
                >
                  <Text style={[
                    styles.maxItemText,
                    settings.maxItems === count && styles.maxItemTextActive
                  ]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNewsData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* News Articles */}
      <ScrollView 
        style={styles.articlesContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && articles.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <ThemedText style={styles.loadingText}>Loading news...</ThemedText>
          </View>
        ) : articles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <ThemedText style={styles.emptyText}>
              No articles found. Try adjusting keywords or check your internet connection.
            </ThemedText>
            <TouchableOpacity style={styles.tryAgainButton} onPress={fetchNewsData}>
              <Text style={styles.tryAgainButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          articles.map((article, index) => (
            <TouchableOpacity
              key={article.id || index}
              style={styles.articleItem}
              onPress={() => handleOpenArticle(article.url, article.title)}
            >
              <View style={styles.articleContent}>
                <ThemedText style={styles.articleTitle} numberOfLines={2}>
                  {article.title}
                </ThemedText>
                
                {article.description && (
                  <ThemedText style={styles.articleDescription} numberOfLines={2}>
                    {article.description}
                  </ThemedText>
                )}
                
                <View style={styles.articleMeta}>
                  <View style={styles.articleSource}>
                    <Text style={styles.articleSourceIcon}>📰</Text>
                    <ThemedText style={styles.articleSourceText}>
                      {article.source}
                    </ThemedText>
                  </View>
                  
                  <ThemedText style={styles.articleTime}>
                    {formatTimeAgo(article.publishedAt)}
                  </ThemedText>
                </View>
              </View>
              
              {article.imageUrl && (
                <View style={styles.articleImageContainer}>
                  {/* In a real implementation, you'd load the image here */}
                  <View style={styles.articleImagePlaceholder}>
                    <Text style={styles.articleImageIcon}>🖼️</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Updated {formatTimeAgo(new Date().toISOString())}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 16,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  settingsPanel: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingGroup: {
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  keywordList: {
    gap: 8,
  },
  keywordChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 8,
  },
  keywordChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  keywordText: {
    fontSize: 12,
    color: '#000',
  },
  keywordTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  maxItemsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  maxItemButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  maxItemButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  maxItemText: {
    fontSize: 14,
    color: '#000',
  },
  maxItemTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF2F2',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  articlesContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  tryAgainButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  tryAgainButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  articleItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  articleContent: {
    flex: 1,
    marginRight: 12,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  articleDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    lineHeight: 18,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleSource: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleSourceIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  articleSourceText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  articleTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  articleImageContainer: {
    width: 80,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
  },
  articleImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleImageIcon: {
    fontSize: 24,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});