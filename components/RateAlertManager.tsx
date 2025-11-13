import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Modal,
  Switch,
  Platform,
} from "react-native";
import { ThemedText } from "./themed-text";
import CurrencyFlag from "./CurrencyFlag";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRateAlerts } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";

interface RateAlert {
  id: string;
  user_id: string;
  from_currency: string;
  to_currency: string;
  target_rate: number;
  condition: 'above' | 'below';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RateAlertManagerProps {
  savedRates: any[];
  onRatesUpdate: () => void;
  currenciesData?: any;
}

interface AlertFormData {
  targetRate: string;
  direction: 'above' | 'below';
  isActive: boolean;
}

export default function RateAlertManager({
  savedRates,
  onRatesUpdate,
  currenciesData,
}: RateAlertManagerProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { rateAlerts, loading, createAlert, updateAlert, deleteAlert, error } = useRateAlerts();
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AlertFormData>({
    targetRate: '',
    direction: 'above',
    isActive: true,
  });

  const handleCreateAlert = () => {
    setEditingAlertId(null);
    setFormData({
      targetRate: '1.0',
      direction: 'above',
      isActive: true,
    });
    setShowAlertModal(true);
  };

  const handleEditAlert = (alert: RateAlert) => {
    setEditingAlertId(alert.id);
    setFormData({
      targetRate: alert.target_rate.toString(),
      direction: alert.condition,
      isActive: alert.is_active,
    });
    setShowAlertModal(true);
  };

  const handleSaveAlert = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to create rate alerts');
      return;
    }

    const targetRate = parseFloat(formData.targetRate);
    if (isNaN(targetRate) || targetRate <= 0) {
      Alert.alert(t('error.invalidInput'), 'Please enter a valid target rate');
      return;
    }

    try {
      if (editingAlertId) {
        // Update existing alert
        const success = await updateAlert(editingAlertId, {
          target_rate: targetRate,
          condition: formData.direction,
          is_active: formData.isActive,
        });

        if (!success) {
          Alert.alert('Error', 'Failed to update rate alert');
          return;
        }
      } else {
        // Create new alert - need to select currencies first
        Alert.alert(
          'Select Currencies',
          'Please select the currency pair for this alert:',
          [
            {
              text: 'EUR/USD',
              onPress: async () => {
                const success = await createAlert('EUR', 'USD', targetRate, formData.direction);
                if (!success) {
                  Alert.alert('Error', 'Failed to create rate alert');
                  return;
                }
                onRatesUpdate();
              }
            },
            {
              text: 'GBP/USD',
              onPress: async () => {
                const success = await createAlert('GBP', 'USD', targetRate, formData.direction);
                if (!success) {
                  Alert.alert('Error', 'Failed to create rate alert');
                  return;
                }
                onRatesUpdate();
              }
            },
            {
              text: 'USD/JPY',
              onPress: async () => {
                const success = await createAlert('USD', 'JPY', targetRate, formData.direction);
                if (!success) {
                  Alert.alert('Error', 'Failed to create rate alert');
                  return;
                }
                onRatesUpdate();
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        setShowAlertModal(false);
        return;
      }

      setShowAlertModal(false);
      setEditingAlertId(null);
      onRatesUpdate();
      
      Alert.alert('Success', 'Rate alert has been saved successfully!');
    } catch (error) {
      console.error('Error saving alert:', error);
      Alert.alert('Error', 'Failed to save rate alert');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this rate alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteAlert(alertId);
            if (!success) {
              Alert.alert('Error', 'Failed to delete rate alert');
            }
            onRatesUpdate();
          }
        }
      ]
    );
  };

  const toggleAlertActive = async (alertId: string, isActive: boolean) => {
    const success = await updateAlert(alertId, { is_active: isActive });
    if (!success) {
      Alert.alert('Error', 'Failed to update alert status');
    }
    onRatesUpdate();
  };

  const getAlertStatusText = (alert: RateAlert): string => {
    if (!alert.is_active) return 'Inactive';
    return 'Active';
  };

  const getAlertStatusColor = (alert: RateAlert): string => {
    if (!alert.is_active) return '#9ca3af';
    return '#10b981';
  };

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Rate Alerts
          </ThemedText>
        </View>

        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyStateText}>
            Sign in to create and manage currency rate alerts!
          </ThemedText>
        </View>
      </View>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Rate Alerts
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Loading...
          </ThemedText>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Rate Alerts
          </ThemedText>
        </View>
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyStateText}>
            Error: {error}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Rate Alerts
        </ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateAlert}
          >
            <ThemedText style={styles.createButtonText}>+ Create Alert</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.subtitle}>
          {rateAlerts.filter(alert => alert.is_active).length} active alerts
        </ThemedText>
      </View>

      <ScrollView style={styles.alertsList}>
        {rateAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>
              No rate alerts yet. Create your first alert to get notified when rates reach your target!
            </ThemedText>
          </View>
        ) : (
          rateAlerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={styles.currencyPair}>
                  <CurrencyFlag currency={alert.from_currency} size={20} />
                  <ThemedText style={styles.arrow}>→</ThemedText>
                  <CurrencyFlag currency={alert.to_currency} size={20} />
                  <ThemedText style={styles.currencyText}>
                    {alert.from_currency} → {alert.to_currency}
                  </ThemedText>
                </View>
                <View style={styles.alertControls}>
                  <ThemedText style={styles.switchLabel}>Active</ThemedText>
                  <Switch
                    value={alert.is_active}
                    onValueChange={(value) => toggleAlertActive(alert.id, value)}
                    trackColor={{ false: '#ec1c1cff', true: '#10b981' }}
                    thumbColor='#ffffff'
                  />
                </View>
              </View>

              <View style={styles.alertInfo}>
                <View style={styles.alertRow}>
                  <ThemedText style={styles.alertLabel}>Target:</ThemedText>
                  <ThemedText style={styles.alertValue}>
                    {alert.condition} {alert.target_rate.toFixed(6)}
                  </ThemedText>
                </View>
                <View style={styles.alertRow}>
                  <ThemedText style={styles.alertLabel}>Status:</ThemedText>
                  <ThemedText style={[styles.statusText, { color: getAlertStatusColor(alert) }]}>
                    {getAlertStatusText(alert)}
                  </ThemedText>
                </View>
                <View style={styles.alertRow}>
                  <ThemedText style={styles.alertLabel}>Created:</ThemedText>
                  <ThemedText style={styles.alertValue}>
                    {new Date(alert.created_at).toLocaleDateString()}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.alertActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditAlert(alert)}
                >
                  <ThemedText style={styles.editButtonText}>Edit</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAlert(alert.id)}
                >
                  <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Alert Configuration Modal */}
      <Modal
        visible={showAlertModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAlertModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAlertModal(false)}
              style={styles.cancelButton}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {editingAlertId ? 'Edit Alert' : 'Create Alert'}
            </ThemedText>
            <TouchableOpacity onPress={handleSaveAlert} style={styles.saveButton}>
              <ThemedText style={styles.saveButtonText}>Save</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Target Rate</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.targetRate}
                onChangeText={(text) => setFormData({ ...formData, targetRate: text })}
                keyboardType="numeric"
                placeholder="Enter target rate"
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Direction</ThemedText>
              <View style={styles.directionButtons}>
                {(['above', 'below'] as const).map((direction) => (
                  <TouchableOpacity
                    key={direction}
                    style={[
                      styles.directionButton,
                      formData.direction === direction && styles.directionButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, direction })}
                  >
                    <ThemedText
                      style={[
                        styles.directionButtonText,
                        formData.direction === direction && styles.directionButtonTextActive,
                      ]}
                    >
                      {direction}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <ThemedText style={styles.label}>Activate Alert</ThemedText>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                  trackColor={{ false: '#d1d5db', true: '#10b981' }}
                  thumbColor={formData.isActive ? '#ffffff' : '#ffffff'}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  createButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  alertsList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currencyPair: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  arrow: {
    marginHorizontal: 6,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 6,
    flex: 1,
  },
  alertControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
    fontWeight: '500',
  },
  alertInfo: {
    marginBottom: 16,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    minWidth: 70,
  },
  alertValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  directionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  directionButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  directionButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  directionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  directionButtonTextActive: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});