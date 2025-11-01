import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
} from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { useDashboardStore } from '@/stores/dashboardStoreWeb';

// Widget definitions
export interface WidgetDefinition {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  category: 'conversion' | 'analysis' | 'tools' | 'information';
}

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  {
    id: 'converter',
    type: 'currency-converter',
    name: 'Currency Converter',
    description: 'Convert between different currencies with real-time rates',
    icon: '💱',
    defaultWidth: 6,
    defaultHeight: 3,
    category: 'conversion',
  },
  {
    id: 'chart',
    type: 'chart',
    name: 'Historical Chart',
    description: 'Visualize currency rate trends over time',
    icon: '📈',
    defaultWidth: 12,
    defaultHeight: 6,
    category: 'analysis',
  },

  {
    id: 'rate-alert',
    type: 'rate-alert',
    name: 'Rate Alerts',
    description: 'Get notified when rates reach your targets',
    icon: '🔔',
    defaultWidth: 8,
    defaultHeight: 10,
    category: 'tools',
  },

  {
    id: 'comparison',
    type: 'comparison',
    name: 'Rate Comparison',
    description: 'Compare rates across multiple providers',
    icon: '⚖️',
    defaultWidth: 12,
    defaultHeight: 8,
    category: 'analysis',
  },
  {
    id: 'alerts',
    type: 'alerts',
    name: 'Rate Alerts',
    description: 'Set up notifications for rate thresholds',
    icon: '🔔',
    defaultWidth: 4,
    defaultHeight: 3,
    category: 'tools',
  },
  {
    id: 'comparison',
    type: 'comparison',
    name: 'Currency Comparison',
    description: 'Compare multiple currencies side by side',
    icon: '⚖️',
    defaultWidth: 12,
    defaultHeight: 4,
    category: 'conversion',
  },
  {
    id: 'news',
    type: 'news',
    name: 'Financial News',
    description: 'Latest news and market updates',
    icon: '📰',
    defaultWidth: 6,
    defaultHeight: 5,
    category: 'information',
  },
  {
    id: 'calculator',
    type: 'calculator',
    name: 'Calculator',
    description: 'Built-in calculator for complex calculations',
    icon: '🧮',
    defaultWidth: 4,
    defaultHeight: 4,
    category: 'tools',
  },
  {
    id: 'rate-table',
    type: 'rate-table',
    name: 'Rate Table',
    description: 'Comprehensive table of exchange rates',
    icon: '📋',
    defaultWidth: 12,
    defaultHeight: 6,
    category: 'analysis',
  },
  {
    id: 'portfolio',
    type: 'portfolio',
    name: 'Portfolio Tracker',
    description: 'Track your currency investments',
    icon: '💼',
    defaultWidth: 8,
    defaultHeight: 5,
    category: 'analysis',
  },
  {
    id: 'trends',
    type: 'trends',
    name: 'Market Trends',
    description: 'Trending currencies and market insights',
    icon: '📈',
    defaultWidth: 6,
    defaultHeight: 4,
    category: 'information',
  },
  {
    id: 'converter-advanced',
    type: 'converter-advanced',
    name: 'Advanced Converter',
    description: 'Converter with historical rates and graphs',
    icon: '🔄',
    defaultWidth: 8,
    defaultHeight: 5,
    category: 'conversion',
  },
];

interface WidgetLibraryProps {
  visible: boolean;
  onClose: () => void;
}

export function WidgetLibrary({ visible, onClose }: WidgetLibraryProps) {
  const { addWidget: addWidgetToStore } = useDashboardStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter widgets by category
  const filteredWidgets = selectedCategory === 'all' 
    ? AVAILABLE_WIDGETS 
    : AVAILABLE_WIDGETS.filter(widget => widget.category === selectedCategory);

  // Categories for filter tabs
  const categories = [
    { id: 'all', name: 'All', icon: '📱' },
    { id: 'conversion', name: 'Conversion', icon: '💱' },
    { id: 'analysis', name: 'Analysis', icon: '📊' },
    { id: 'tools', name: 'Tools', icon: '🔧' },
    { id: 'information', name: 'Information', icon: 'ℹ️' },
  ];

  // Add widget to dashboard
  const handleAddWidget = (widgetDef: WidgetDefinition) => {
    // Create default props based on widget type
    const defaultProps = getDefaultWidgetProps(widgetDef.type);
    
    // Find the next available position
    const position = findNextAvailablePosition(widgetDef.defaultWidth, widgetDef.defaultHeight);
    
    addWidgetToStore({
      type: widgetDef.type,
      x: position.x,
      y: position.y,
      w: widgetDef.defaultWidth,
      h: widgetDef.defaultHeight,
      props: defaultProps,
    });
    
    onClose();
  };

  // Get default props for widget type
  const getDefaultWidgetProps = (type: string) => {
    switch (type) {
      case 'currency-converter':
        return {
          title: 'Currency Converter',
          sourceCurrency: 'USD',
          targetCurrency: 'EUR',
          amount: 100,
          showHistorical: false,
        };
      case 'chart':
        return {
          title: 'Exchange Rate Chart',
          baseCurrency: 'USD',
          quoteCurrency: 'EUR',
          timeRange: '30d',
          chartType: 'line',
          timeframe: '7d',
          showVolume: false,
        };
      case 'alerts':
        return {
          title: 'Rate Alerts',
          alertCurrency: 'USD',
          targetCurrency: 'EUR',
          thresholdValue: 1.1,
          thresholdDirection: 'above',
          isActive: true,
        };
      case 'comparison':
        return {
          title: 'Currency Comparison',
          baseCurrency: 'USD',
          compareCurrencies: ['EUR', 'GBP', 'JPY', 'CAD'],
          showPercentage: true,
          sortBy: 'value',
        };
      case 'news':
        return {
          title: 'Financial News',
          newsCategory: 'forex',
          showImages: true,
          maxItems: 5,
          refreshInterval: 300000, // 5 minutes
        };
      case 'calculator':
        return {
          title: 'Calculator',
          calculatorType: 'standard',
          precision: 2,
          showHistory: true,
        };
      case 'rate-table':
        return {
          title: 'Exchange Rate Table',
          baseCurrency: 'USD',
          showColumns: ['code', 'name', 'rate', 'change'],
          sortBy: 'code',
          limit: 10,
        };
      case 'portfolio':
        return {
          title: 'Portfolio Tracker',
          portfolioCurrencies: ['USD', 'EUR', 'GBP'],
          showProfit: true,
          showAllocation: true,
        };
      case 'trends':
        return {
          title: 'Market Trends',
          trendType: 'gainers',
          timeframe: '24h',
          limit: 10,
          showPercentages: true,
        };
      case 'converter-advanced':
        return {
          title: 'Advanced Converter',
          defaultPair: 'USD/EUR',
          showHistorical: true,
          showGraph: true,
          precision: 4,
        };
      default:
        return { title: `${type} Widget` };
    }
  };

  // Find next available position for widget
  const findNextAvailablePosition = (width: number, height: number) => {
    // This is a simplified grid positioning algorithm
    // In a real implementation, you'd check for collisions
    const gridCols = 12;
    const position = { x: 0, y: 0 };
    
    // Simple algorithm: try to place at next available row
    position.x = 0;
    position.y = Math.floor(Math.random() * 10); // Random row for demo
    
    // Ensure it doesn't go beyond grid boundaries
    if (position.x + width > gridCols) {
      position.x = 0;
      position.y += 1;
    }
    
    return position;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <ThemedText style={styles.title}>Add Widget</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Category Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabs}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <ThemedText
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Widget List */}
        <ScrollView style={styles.widgetList} contentContainerStyle={styles.widgetListContent}>
          {filteredWidgets.map((widget) => (
            <TouchableOpacity
              key={widget.id}
              style={styles.widgetItem}
              onPress={() => handleAddWidget(widget)}
            >
              <View style={styles.widgetIconContainer}>
                <Text style={styles.widgetIcon}>{widget.icon}</Text>
              </View>
              <View style={styles.widgetInfo}>
                <ThemedText style={styles.widgetName}>{widget.name}</ThemedText>
                <ThemedText style={styles.widgetDescription}>
                  {widget.description}
                </ThemedText>
                <View style={styles.widgetMeta}>
                  <Text style={styles.widgetSize}>
                    {widget.defaultWidth}×{widget.defaultHeight}
                  </Text>
                  <Text style={styles.widgetCategory}>
                    {categories.find(c => c.id === widget.category)?.name}
                  </Text>
                </View>
              </View>
              <View style={styles.addButton}>
                <Text style={styles.addButtonText}>+</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingTop: 50, // Account for status bar
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 32,
  },
  categoryTabs: {
    maxHeight: 60,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    gap: 8,
  },
  categoryTabActive: {
    backgroundColor: '#007AFF',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  categoryTextActive: {
    color: 'white',
  },
  widgetList: {
    flex: 1,
  },
  widgetListContent: {
    padding: 16,
    gap: 12,
  },
  widgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    gap: 12,
  },
  widgetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  widgetIcon: {
    fontSize: 24,
  },
  widgetInfo: {
    flex: 1,
    gap: 4,
  },
  widgetName: {
    fontSize: 16,
    fontWeight: '600',
  },
  widgetDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  widgetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  widgetSize: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  widgetCategory: {
    fontSize: 12,
    color: '#8E8E93',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});