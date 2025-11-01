import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Switch,
  Modal,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RateAlert {
  id: string;
  pair: string;
  target_rate: number;
  direction: '>=' | '<=' | 'above' | 'below';
  active: boolean;
  notified: boolean;
  triggered_at?: string;
  created_at: string;
}

interface AlertFormData {
  pair: string;
  target_rate: string;
  direction: '>=' | '<=' | 'above' | 'below';
  active: boolean;
}

interface RateAlertProps {
  widgetId?: string;
  onWidgetChange?: (props: Record<string, any>) => void;
}

const POPULAR_PAIRS = [
  { code: 'USD_EUR', label: 'USD/EUR', flag: '🇺🇸🇪🇺' },
  { code: 'USD_GBP', label: 'USD/GBP', flag: '🇺🇸🇬🇧' },
  { code: 'USD_JPY', label: 'USD/JPY', flag: '🇺🇸🇯🇵' },
  { code: 'USD_CAD', label: 'USD/CAD', flag: '🇺🇸🇨🇦' },
  { code: 'USD_AUD', label: 'USD/AUD', flag: '🇺🇸🇦🇺' },
  { code: 'EUR_GBP', label: 'EUR/GBP', flag: '🇪🇺🇬🇧' },
];

const DIRECTION_OPTIONS = [
  { value: '>=', label: '≥ Greater than or equal', icon: '🔺' },
  { value: '<=', label: '≤ Less than or equal', icon: '🔻' },
  { value: 'above', label: '↑ Above (strict)', icon: '⬆️' },
  { value: 'below', label: '↓ Below (strict)', icon: '⬇️' },
];

export function RateAlert({ widgetId, onWidgetChange }: RateAlertProps) {
  const [alerts, setAlerts] = useState<RateAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<RateAlert | null>(null);
  const [formData, setFormData] = useState<AlertFormData>({
    pair: 'USD_EUR',
    target_rate: '1.00',
    direction: '>=',
    active: true,
  });

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Current rates for comparison (mock data for demo)
  const getCurrentRate = (pair: string): number => {
    const rates: Record<string, number> = {
      'USD_EUR': 0.85,
      'USD_GBP': 0.73,
      'USD_JPY': 110.0,
      'USD_CAD': 1.25,
      'USD_AUD': 1.35,
      'EUR_GBP': 0.86,
    };
    return rates[pair] || 1.0;
  };

  // Check if an alert is triggered
  const isAlertTriggered = (alert: RateAlert): boolean => {
    const currentRate = getCurrentRate(alert.pair);
    switch (alert.direction) {
      case '>=':
        return currentRate >= alert.target_rate;
      case '<=':
        return currentRate <= alert.target_rate;
      case 'above':
        return currentRate > alert.target_rate;
      case 'below':
        return currentRate < alert.target_rate;
      default:
        return false;
    }
  };

  // Load alerts from database
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      
      // For demo purposes, we'll use local storage
      // In production, this would be: const { data, error } = await supabase.from('rate_alerts').select('*');
      
      const storedAlerts = await AsyncStorage.getItem('rate_alerts');
      if (storedAlerts) {
        setAlerts(JSON.parse(storedAlerts));
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save alerts to local storage (demo) or database (production)
  const saveAlerts = useCallback(async (newAlerts: RateAlert[]) => {
    try {
      // Production: await supabase.from('rate_alerts').upsert(newAlerts);
      await AsyncStorage.setItem('rate_alerts', JSON.stringify(newAlerts));
      setAlerts(newAlerts);
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  }, []);

  // Create new alert
  const createAlert = useCallback(async () => {
    try {
      const targetRate = parseFloat(formData.target_rate);
      if (isNaN(targetRate) || targetRate <= 0) {
        Alert.alert('Error', 'Please enter a valid target rate');
        return;
      }

      const newAlert: RateAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pair: formData.pair,
        target_rate: targetRate,
        direction: formData.direction,
        active: formData.active,
        notified: false,
        created_at: new Date().toISOString(),
      };

      const updatedAlerts = [...alerts, newAlert];
      await saveAlerts(updatedAlerts);
      
      setShowCreateModal(false);
      setFormData({
        pair: 'USD_EUR',
        target_rate: '1.00',
        direction: '>=',
        active: true,
      });

      Alert.alert('Success', 'Rate alert created successfully!');
    } catch (error) {
      console.error('Failed to create alert:', error);
      Alert.alert('Error', 'Failed to create alert');
    }
  }, [formData, alerts, saveAlerts]);

  // Update alert
  const updateAlert = useCallback(async (updatedAlert: RateAlert) => {
    try {
      const updatedAlerts = alerts.map(alert =>
        alert.id === updatedAlert.id ? updatedAlert : alert
      );
      await saveAlerts(updatedAlerts);
      
      setEditingAlert(null);
      Alert.alert('Success', 'Alert updated successfully!');
    } catch (error) {
      console.error('Failed to update alert:', error);
      Alert.alert('Error', 'Failed to update alert');
    }
  }, [alerts, saveAlerts]);

  // Delete alert
  const deleteAlert = useCallback(async (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
              await saveAlerts(updatedAlerts);
            } catch (error) {
              console.error('Failed to delete alert:', error);
              Alert.alert('Error', 'Failed to delete alert');
            }
          },
        },
      ]
    );
  }, [alerts, saveAlerts]);

  // Toggle alert active status
  const toggleAlertStatus = useCallback(async (alertId: string) => {
    try {
      const updatedAlerts = alerts.map(alert =>
        alert.id === alertId ? { ...alert, active: !alert.active } : alert
      );
      await saveAlerts(updatedAlerts);
    } catch (error) {
      console.error('Failed to toggle alert status:', error);
    }
  }, [alerts, saveAlerts]);

  // Show create/edit modal
  const showAlertModal = (alert?: RateAlert) => {
    if (alert) {
      setEditingAlert(alert);
      setFormData({
        pair: alert.pair,
        target_rate: alert.target_rate.toString(),
        direction: alert.direction,
        active: alert.active,
      });
    } else {
      setEditingAlert(null);
      setFormData({
        pair: 'USD_EUR',
        target_rate: '1.00',
        direction: '>=',
        active: true,
      });
    }
    setShowCreateModal(true);
  };

  // Render alert item
  const renderAlertItem = (alert: RateAlert) => {
    const currentRate = getCurrentRate(alert.pair);
    const triggered = isAlertTriggered(alert);
    const pairInfo = POPULAR_PAIRS.find(p => p.code === alert.pair);
    const directionInfo = DIRECTION_OPTIONS.find(d => d.value === alert.direction);

    return (
      <View
        key={alert.id}
        style={[
          styles.alertItem,
          {
            backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
            borderColor: triggered ? '#34C759' : (alert.active ? '#007AFF' : '#8E8E93'),
          }
        ]}
      >
        {/* Alert Header */}
        <View style={styles.alertHeader}>
          <View style={styles.alertInfo}>
            <Text style={styles.alertPair}>
              {pairInfo?.flag} {alert.pair.replace('_', '/')}
            </Text>
            <View style={styles.rateInfo}>
              <Text style={styles.currentRate}>
                Current: {currentRate.toFixed(4)}
              </Text>
              <Text style={styles.targetRate}>
                Target: {alert.direction} {alert.target_rate.toFixed(4)}
              </Text>
            </View>
          </View>
          
          {/* Alert Status */}
          <View style={styles.alertStatus}>
            {triggered && (
              <View style={styles.triggeredBadge}>
                <Text style={styles.triggeredText}>🔔 TRIGGERED</Text>
              </View>
            )}
            <Switch
              value={alert.active}
              onValueChange={() => toggleAlertStatus(alert.id)}
              trackColor={{ false: '#8E8E93', true: '#007AFF' }}
              thumbColor={alert.active ? '#FFFFFF' : '#F2F2F7'}
            />
          </View>
        </View>

        {/* Alert Details */}
        <View style={styles.alertDetails}>
          <Text style={styles.alertDirection}>
            {directionInfo?.icon} {directionInfo?.label}
          </Text>
          <Text style={styles.alertDate}>
            Created: {new Date(alert.created_at).toLocaleDateString()}
          </Text>
          {alert.triggered_at && (
            <Text style={styles.triggeredDate}>
              Last triggered: {new Date(alert.triggered_at).toLocaleString()}
            </Text>
          )}
        </View>

        {/* Alert Actions */}
        <View style={styles.alertActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => showAlertModal(alert)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteAlert(alert.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render create/edit modal
  const renderAlertModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <ThemedView style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <ThemedText style={styles.modalTitle}>
            {editingAlert ? 'Edit Alert' : 'Create Alert'}
          </ThemedText>
          <TouchableOpacity onPress={editingAlert ? () => updateAlert({
            ...editingAlert,
            pair: formData.pair,
            target_rate: parseFloat(formData.target_rate),
            direction: formData.direction,
            active: formData.active,
          }) : createAlert}>
            <Text style={styles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Currency Pair Selection */}
          <View style={styles.formSection}>
            <ThemedText style={styles.formLabel}>Currency Pair</ThemedText>
            <View style={styles.pairGrid}>
              {POPULAR_PAIRS.map((pair) => (
                <TouchableOpacity
                  key={pair.code}
                  style={[
                    styles.pairButton,
                    formData.pair === pair.code && styles.pairButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, pair: pair.code })}
                >
                  <Text style={styles.pairFlag}>{pair.flag}</Text>
                  <Text style={[
                    styles.pairLabel,
                    formData.pair === pair.code && styles.pairLabelActive,
                  ]}>
                    {pair.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target Rate */}
          <View style={styles.formSection}>
            <ThemedText style={styles.formLabel}>Target Rate</ThemedText>
            <TextInput
              style={[
                styles.rateInput,
                { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }
              ]}
              value={formData.target_rate}
              onChangeText={(text) => setFormData({ ...formData, target_rate: text })}
              keyboardType="numeric"
              placeholder="Enter target rate"
            />
            <Text style={styles.currentRateDisplay}>
              Current {formData.pair.replace('_', '/')}: {getCurrentRate(formData.pair).toFixed(4)}
            </Text>
          </View>

          {/* Direction */}
          <View style={styles.formSection}>
            <ThemedText style={styles.formLabel}>Condition</ThemedText>
            {DIRECTION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.directionButton,
                  formData.direction === option.value && styles.directionButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, direction: option.value as any })}
              >
                <Text style={styles.directionIcon}>{option.icon}</Text>
                <ThemedText style={styles.directionLabel}>{option.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Active Status */}
          <View style={styles.formSection}>
            <View style={styles.switchRow}>
              <ThemedText style={styles.formLabel}>Active</ThemedText>
              <Switch
                value={formData.active}
                onValueChange={(value) => setFormData({ ...formData, active: value })}
                trackColor={{ false: '#8E8E93', true: '#007AFF' }}
                thumbColor={formData.active ? '#FFFFFF' : '#F2F2F7'}
              />
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </Modal>
  );

  // Initialize
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>🔔 Rate Alerts</ThemedText>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => showAlertModal()}
        >
          <Text style={styles.addButtonText}>+ Add Alert</Text>
        </TouchableOpacity>
      </View>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <ThemedText style={styles.emptyTitle}>No Rate Alerts</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Create your first alert to get notified when rates reach your target
          </ThemedText>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => showAlertModal()}
          >
            <Text style={styles.createFirstButtonText}>Create Alert</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
          {alerts.map(renderAlertItem)}
        </ScrollView>
      )}

      {/* Stats Footer */}
      {alerts.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{alerts.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {alerts.filter(a => a.active).length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {alerts.filter(isAlertTriggered).length}
              </Text>
              <Text style={styles.statLabel}>Triggered</Text>
            </View>
          </View>
        </View>
      )}

      {renderAlertModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  createFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  alertsList: {
    flex: 1,
  },
  alertItem: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertPair: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rateInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  currentRate: {
    fontSize: 14,
    color: '#666',
  },
  targetRate: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  alertStatus: {
    alignItems: 'flex-end',
    gap: 8,
  },
  triggeredBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  triggeredText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertDetails: {
    marginBottom: 12,
  },
  alertDirection: {
    fontSize: 14,
    marginBottom: 4,
  },
  alertDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  triggeredDate: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCancel: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalSave: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  pairGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pairButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  pairButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F3FF',
  },
  pairFlag: {
    fontSize: 20,
    marginBottom: 4,
  },
  pairLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  pairLabelActive: {
    color: '#007AFF',
  },
  rateInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  currentRateDisplay: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 8,
    backgroundColor: '#F2F2F7',
  },
  directionButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F3FF',
  },
  directionIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  directionLabel: {
    fontSize: 14,
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});