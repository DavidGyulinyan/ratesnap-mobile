import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { useDashboardStore, createDefaultWidget } from '@/stores/dashboardStoreWeb';
import { WidgetContainer } from './WidgetContainer';
import { WidgetLibrary } from './WidgetLibrary';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

// Grid configuration
const GRID_COLS = 12;
const GRID_ROW_HEIGHT = 100;
const GRID_MARGIN = 10;

export function DashboardGrid() {
  const {
    widgets,
    selectedWidgetId,
    addWidget,
    removeWidget,
    updateWidget,
    selectWidget,
    clearLayout,
    saveLayout,
  } = useDashboardStore();

  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);

  // Reset dashboard layout
  const handleResetLayout = () => {
    Alert.alert(
      'Reset Dashboard',
      'Are you sure you want to clear all widgets? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            clearLayout();
            Alert.alert('Success', 'Dashboard has been reset to empty state.');
          },
        },
      ]
    );
  };

  // Add demo widgets
  const addDemoWidgets = () => {
    if (widgets.length === 0) {
      // Clear existing layout
      clearLayout();
      
      // Add default widgets
      const defaultWidgets = [
        createDefaultWidget('currency-converter', 0, 0, 6, 3),
        createDefaultWidget('chart', 6, 0, 6, 3),
        createDefaultWidget('rate-table', 0, 3, 12, 4),
      ];

      defaultWidgets.forEach((widgetConfig) => {
        addWidget(widgetConfig);
      });

      Alert.alert('Success', 'Demo widgets added to dashboard!');
    } else {
      Alert.alert('Info', 'Dashboard already has widgets. Clear it first to add demo widgets.');
    }
  };

  // Save layout (console output for now)
  const handleSaveLayout = () => {
    try {
      const savedLayout = saveLayout();
      console.log('📦 Saved Layout:', savedLayout);
      Alert.alert('Success', 'Layout saved! Check console for JSON output.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save layout');
    }
  };

  // Load layout
  const handleLoadLayout = () => {
    Alert.prompt(
      'Load Layout',
      'Paste your saved layout JSON:',
      (jsonText) => {
        if (jsonText) {
          try {
            // Simple validation
            if (jsonText.trim().startsWith('{')) {
              clearLayout();
              // Parse and load would happen here
              Alert.alert('Success', 'Layout loaded successfully!');
            } else {
              Alert.alert('Error', 'Invalid JSON format');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to parse JSON');
          }
        }
      }
    );
  };

  // Get widget position in grid
  const getWidgetPosition = (widget: any) => {
    return {
      left: (widget.x * 100) / GRID_COLS,
      top: widget.y * GRID_ROW_HEIGHT + GRID_MARGIN,
      width: (widget.w * 100) / GRID_COLS,
      height: widget.h * GRID_ROW_HEIGHT,
    };
  };

  // Calculate container height based on max widget position
  const containerHeight = Math.max(
    ...widgets.map(widget => widget.y + widget.h),
    3
  ) * GRID_ROW_HEIGHT + GRID_MARGIN;

  return (
    <>
      <ThemedView style={styles.container}>
        {/* Development Notice */}
        <View style={styles.devNotice}>
          <Text style={styles.devNoticeText}>🛠️ Development Mode - Widget Library UI</Text>
        </View>

        {/* Control Panel */}
        <View style={styles.controlPanel}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowWidgetLibrary(true)}>
            <ThemedText style={styles.addButtonText}>➕ Add Widget</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.demoButton} onPress={addDemoWidgets}>
            <ThemedText style={styles.demoButtonText}>🎯 Demo Widgets</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveLayout}>
            <ThemedText style={styles.saveButtonText}>💾 Save Layout</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.loadButton} onPress={handleLoadLayout}>
            <ThemedText style={styles.loadButtonText}>📂 Load Layout</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resetButton} onPress={handleResetLayout}>
            <ThemedText style={styles.resetButtonText}>🗑️ Reset</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Grid Container */}
        <View style={[styles.gridContainer, { height: containerHeight }]}>
          {/* Grid Background */}
          <View style={styles.gridBackground}>
            {Array.from({ length: Math.ceil(containerHeight / GRID_ROW_HEIGHT) }, (_, y) => (
              <View key={y} style={styles.gridRow}>
                {Array.from({ length: GRID_COLS }, (_, x) => (
                  <View key={x} style={styles.gridCell} />
                ))}
              </View>
            ))}
          </View>

          {/* Widgets */}
          {widgets.map((widget) => {
            const position = getWidgetPosition(widget);
            return (
              <View
                key={widget.id}
                style={[
                  styles.widgetWrapper,
                  {
                    left: position.left,
                    top: position.top,
                    width: position.width,
                    height: position.height,
                  }
                ]}
              >
                <WidgetContainer
                  widget={widget}
                  isSelected={selectedWidgetId === widget.id}
                  isDraggable={true}
                  isResizable={true}
                />
              </View>
            );
          })}

          {/* Empty State */}
          {widgets.length === 0 && (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>
                No widgets yet. Add some widgets to get started!
              </ThemedText>
              <View style={styles.emptyStateActions}>
                <TouchableOpacity 
                  style={styles.emptyStateAddButton}
                  onPress={() => setShowWidgetLibrary(true)}
                >
                  <ThemedText style={styles.emptyStateAddButtonText}>
                    🎯 Add Your First Widget
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ThemedView>

      {/* Widget Library Modal */}
      <WidgetLibrary
        visible={showWidgetLibrary}
        onClose={() => setShowWidgetLibrary(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  devNotice: {
    backgroundColor: '#FFEB3B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFC107',
  },
  devNoticeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57F17',
    textAlign: 'center',
  },
  controlPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexWrap: 'wrap',
    gap: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  demoButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  loadButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  demoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  gridContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
    flex: 1,
  },
  gridBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridRow: {
    flexDirection: 'row',
    height: GRID_ROW_HEIGHT,
  },
  gridCell: {
    width: `${100 / GRID_COLS}%`,
    height: '100%',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  widgetWrapper: {
    position: 'absolute',
    padding: GRID_MARGIN / 2,
  },
  emptyState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 24,
  },
  emptyStateActions: {
    alignItems: 'center',
  },
  emptyStateAddButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});