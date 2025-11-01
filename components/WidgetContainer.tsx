import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { useDashboardStore, Widget } from '@/stores/dashboardStoreWeb';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CurrencyConverter } from '@/widgets/CurrencyConverter';
import { HistoricalChart } from '@/widgets/HistoricalChart';
import { RateAlert } from '@/widgets/RateAlert';
import { Comparison } from '@/widgets/Comparison';
import { NewsFeed } from '@/widgets/NewsFeed';

interface WidgetContainerProps {
  widget: Widget;
  isSelected: boolean;
  isDraggable: boolean;
  isResizable: boolean;
  children?: React.ReactNode;
}

export function WidgetContainer({ 
  widget, 
  isSelected, 
  isDraggable, 
  isResizable,
  children 
}: WidgetContainerProps) {
  const colorScheme = useColorScheme();
  const { selectWidget, removeWidget } = useDashboardStore();
  const isDark = colorScheme === 'dark';
  const [showRemoveButton, setShowRemoveButton] = useState(false);

  const handleSelect = () => {
    selectWidget(widget.id);
    setShowRemoveButton(true);
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Widget',
      `Are you sure you want to remove "${widget.props.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeWidget(widget.id);
            setShowRemoveButton(false);
          },
        },
      ]
    );
  };

  const handleWidgetPress = () => {
    if (isSelected) {
      setShowRemoveButton(!showRemoveButton);
    } else {
      handleSelect();
    }
  };

  const renderWidgetContent = () => {
    if (children) {
      return children;
    }

    // Enhanced widget content based on type
    switch (widget.type) {
      case 'currency-converter':
        return (
          <CurrencyConverter
            widgetId={widget.id}
            initialAmount={widget.props.amount || 100}
            initialFromCurrency={widget.props.sourceCurrency || 'USD'}
            initialToCurrency={widget.props.targetCurrency || 'EUR'}
            decimalPlaces={widget.props.decimalPlaces || 4}
            onWidgetChange={(props) => {
              // Update widget props when they change
              useDashboardStore.getState().updateWidget(widget.id, { props: { ...widget.props, ...props } });
            }}
          />
        );

      case 'chart':
        return (
          <HistoricalChart
            widgetId={widget.id}
            baseCurrency={widget.props.baseCurrency || 'USD'}
            quoteCurrency={widget.props.quoteCurrency || 'EUR'}
            timeRange={widget.props.timeRange || '30d'}
            onWidgetChange={(props) => {
              // Update widget props when they change
              useDashboardStore.getState().updateWidget(widget.id, { props: { ...widget.props, ...props } });
            }}
          />
        );

      case 'rate-alert':
        return (
          <RateAlert
            widgetId={widget.id}
            onWidgetChange={(props) => {
              // Update widget props when they change
              useDashboardStore.getState().updateWidget(widget.id, { props: { ...widget.props, ...props } });
            }}
          />
        );

      case 'comparison':
        return (
          <Comparison
            widgetId={widget.id}
            pair={widget.props.pair || 'USD_EUR'}
            providers={widget.props.providers || ['ratesnap', 'exchangeratesapi']}
            onWidgetChange={(props) => {
              // Update widget props when they change
              useDashboardStore.getState().updateWidget(widget.id, { props: { ...widget.props, ...props } });
            }}
          />
        );

      case 'news':
        return (
          <NewsFeed
            widgetId={widget.id}
            keywords={widget.props.keywords || ['currency', 'forex', 'USD', 'EUR']}
            sourceFilters={widget.props.sourceFilters || []}
            maxItems={widget.props.maxItems || 10}
            refreshInterval={widget.props.refreshInterval || 30 * 60 * 1000}
            onWidgetChange={(props) => {
              // Update widget props when they change
              useDashboardStore.getState().updateWidget(widget.id, { props: { ...widget.props, ...props } });
            }}
          />
        );

      case 'alerts':
        return (
          <View style={styles.widgetContent}>
            <ThemedText style={styles.widgetTitle}>{widget.props.title}</ThemedText>
            <View style={styles.alertPlaceholder}>
              <Text style={styles.alertIcon}>🔔</Text>
              <ThemedText style={styles.alertText}>Rate Alerts</ThemedText>
              <ThemedText style={styles.alertSubtext}>Get notified of rate changes</ThemedText>
            </View>
          </View>
        );

      case 'comparison':
        return (
          <View style={styles.widgetContent}>
            <ThemedText style={styles.widgetTitle}>{widget.props.title}</ThemedText>
            <View style={styles.comparisonPlaceholder}>
              <Text style={styles.comparisonIcon}>⚖️</Text>
              <ThemedText style={styles.comparisonText}>Multi-Currency</ThemedText>
              <ThemedText style={styles.comparisonSubtext}>Compare currencies</ThemedText>
            </View>
          </View>
        );

      case 'news':
        return (
          <View style={styles.widgetContent}>
            <ThemedText style={styles.widgetTitle}>{widget.props.title}</ThemedText>
            <View style={styles.newsPlaceholder}>
              <Text style={styles.newsIcon}>📰</Text>
              <ThemedText style={styles.newsText}>Financial News</ThemedText>
              <ThemedText style={styles.newsSubtext}>Market updates</ThemedText>
            </View>
          </View>
        );

      case 'calculator':
        return (
          <View style={styles.widgetContent}>
            <ThemedText style={styles.widgetTitle}>{widget.props.title}</ThemedText>
            <View style={styles.calculatorPlaceholder}>
              <Text style={styles.calculatorIcon}>🧮</Text>
              <ThemedText style={styles.calculatorText}>Calculator</ThemedText>
              <ThemedText style={styles.calculatorSubtext}>Built-in calculations</ThemedText>
            </View>
          </View>
        );

      case 'rate-table':
        return (
          <View style={styles.widgetContent}>
            <ThemedText style={styles.widgetTitle}>{widget.props.title}</ThemedText>
            <View style={styles.tablePlaceholder}>
              <Text style={styles.tableIcon}>📋</Text>
              <ThemedText style={styles.tableText}>Exchange Rates</ThemedText>
              <ThemedText style={styles.baseCurrency}>Base: {widget.props.baseCurrency || 'USD'}</ThemedText>
            </View>
          </View>
        );

      case 'portfolio':
        return (
          <View style={styles.widgetContent}>
            <ThemedText style={styles.widgetTitle}>{widget.props.title}</ThemedText>
            <View style={styles.portfolioPlaceholder}>
              <Text style={styles.portfolioIcon}>💼</Text>
              <ThemedText style={styles.portfolioText}>Portfolio Tracker</ThemedText>
              <ThemedText style={styles.portfolioSubtext}>Track investments</ThemedText>
            </View>
          </View>
        );

      case 'trends':
        return (
          <View style={styles.widgetContent}>
            <ThemedText style={styles.widgetTitle}>{widget.props.title}</ThemedText>
            <View style={styles.trendsPlaceholder}>
              <Text style={styles.trendsIcon}>📈</Text>
              <ThemedText style={styles.trendsText}>Market Trends</ThemedText>
              <ThemedText style={styles.trendsSubtext}>Trending currencies</ThemedText>
            </View>
          </View>
        );

      case 'converter-advanced':
        return (
          <View style={styles.widgetContent}>
            <ThemedText style={styles.widgetTitle}>{widget.props.title}</ThemedText>
            <View style={styles.advancedPlaceholder}>
              <Text style={styles.advancedIcon}>🔄</Text>
              <ThemedText style={styles.advancedText}>Advanced Converter</ThemedText>
              <ThemedText style={styles.advancedSubtext}>With historical rates</ThemedText>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.widgetContent}>
            <ThemedText style={styles.widgetTitle}>{widget.props.title}</ThemedText>
            <Text style={styles.widgetSubtext}>🔧 Custom Widget ({widget.type})</Text>
          </View>
        );
    }
  };

  return (
    <ThemedView 
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        { borderColor: isSelected ? '#007AFF' : 'transparent' }
      ]}
      onTouchStart={handleWidgetPress}
    >
      {/* Widget Header */}
      <View style={[
        styles.header,
        { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }
      ]}>
        <View style={styles.headerLeft}>
          {/* Drag Handle Indicator */}
          {isDraggable && (
            <View style={styles.dragHandle}>
              <View style={styles.dragHandleDot} />
              <View style={styles.dragHandleDot} />
              <View style={styles.dragHandleDot} />
            </View>
          )}
          <Text style={[
            styles.headerTitle,
            { color: isDark ? '#FFFFFF' : '#000000' }
          ]}>
            {widget.props.title}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          {/* Selection Indicator */}
          {isSelected && (
            <View style={styles.selectionIndicator} />
          )}
          
          {/* Remove Button */}
          {(showRemoveButton || isSelected) && (
            <TouchableOpacity
              onPress={handleRemove}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Widget Content */}
      <View style={styles.content}>
        {renderWidgetContent()}
      </View>

      {/* Resize Handle */}
      {isResizable && (
        <View style={styles.resizeHandle}>
          <View style={styles.resizeHandleCorner} />
          <View style={styles.resizeHandleDots}>
            <View style={styles.resizeDot} />
            <View style={styles.resizeDot} />
            <View style={styles.resizeDot} />
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedContainer: {
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dragHandle: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dragHandleDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#8E8E93',
    marginHorizontal: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  widgetContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  widgetSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencyInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  currencyArrow: {
    fontSize: 16,
    marginHorizontal: 12,
    color: '#8E8E93',
  },
  currencyOutput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  chartPlaceholder: {
    alignItems: 'center',
  },
  chartIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  chartText: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertPlaceholder: {
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  comparisonPlaceholder: {
    alignItems: 'center',
  },
  comparisonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  comparisonText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  comparisonSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  newsPlaceholder: {
    alignItems: 'center',
  },
  newsIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  newsText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  newsSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  calculatorPlaceholder: {
    alignItems: 'center',
  },
  calculatorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  calculatorText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  calculatorSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tablePlaceholder: {
    alignItems: 'center',
  },
  tableIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  tableText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  baseCurrency: {
    fontSize: 12,
    color: '#8E8E93',
  },
  portfolioPlaceholder: {
    alignItems: 'center',
  },
  portfolioIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  portfolioText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  portfolioSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  trendsPlaceholder: {
    alignItems: 'center',
  },
  trendsIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  trendsText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendsSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  advancedPlaceholder: {
    alignItems: 'center',
  },
  advancedIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  advancedText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  advancedSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resizeHandleCorner: {
    width: 12,
    height: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#007AFF',
  },
  resizeHandleDots: {
    position: 'absolute',
    flexDirection: 'row',
    bottom: 2,
    right: 2,
  },
  resizeDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#007AFF',
    marginHorizontal: 1,
  },
});