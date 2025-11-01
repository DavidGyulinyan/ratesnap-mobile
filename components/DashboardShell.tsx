import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { DashboardGrid } from './DashboardGrid';

interface DashboardShellProps {
  children?: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Custom Dashboard</ThemedText>
        <Link href="/" style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </Link>
      </View>

      {/* Dashboard Grid Container */}
      <View style={styles.dashboardContent}>
        {children || <DashboardGrid />}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  dashboardContent: {
    flex: 1,
  },
});