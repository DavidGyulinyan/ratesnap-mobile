import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedView } from "../themed-view";
import { ThemedText } from "../themed-text";

interface BaseWidgetProps {
  widgetId: string;
  title: string;
  onRemove: () => void;
  onToggle?: () => void;
  isEditMode?: boolean;
  children: React.ReactNode;
}

export default function BaseWidget({
  widgetId,
  title,
  onRemove,
  onToggle,
  isEditMode = false,
  children
}: BaseWidgetProps) {
  return (
    <ThemedView style={styles.widget}>
      {/* Widget Header */}
      <View style={styles.widgetHeader}>
        <ThemedText style={styles.widgetTitle}>{title}</ThemedText>
        <View style={styles.widgetActions}>
          {onToggle && (
            <TouchableOpacity onPress={onToggle} style={styles.widgetAction}>
              <ThemedText style={styles.toggleText}>👁️</ThemedText>
            </TouchableOpacity>
          )}
          {isEditMode && (
            <TouchableOpacity onPress={onRemove} style={styles.widgetAction}>
              <ThemedText style={styles.removeButton}>×</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Widget Content */}
      <View style={styles.widgetContent}>
        {children}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  widget: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  widgetActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetAction: {
    padding: 4,
    marginLeft: 8,
  },
  removeButton: {
    fontSize: 20,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  toggleText: {
    fontSize: 14,
  },
  widgetContent: {
    padding: 12,
  },
});