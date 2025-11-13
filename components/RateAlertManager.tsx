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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "./themed-text";
import CurrencyFlag from "./CurrencyFlag";
import { useLanguage } from "@/contexts/LanguageContext";
import notificationService, { RateAlert } from "@/lib/expoGoSafeNotificationService";

interface AlertSettings {
  targetRate: number;
  direction: 'above' | 'below' | 'equals';
  isActive: boolean;
  frequency: 'hourly' | 'daily';
  lastChecked?: number;
  triggered?: boolean;
  triggeredAt?: number;
  message?: string;
}

interface SavedRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: number;
  hasAlert?: boolean;
  alertSettings?: AlertSettings;
}

interface RateAlertManagerProps {
  savedRates: SavedRate[];
  onRatesUpdate: () => void;
  currenciesData?: any;
}

interface AlertFormData {
  targetRate: string;
  direction: 'above' | 'below' | 'equals';
  isActive: boolean;
  frequency: 'hourly' | 'daily';
}

export default function RateAlertManager({
  savedRates,
  onRatesUpdate,
  currenciesData,
}: RateAlertManagerProps) {
  const { t } = useLanguage();
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AlertFormData>({
    targetRate: '',
    direction: 'above',
    isActive: true,
    frequency: 'hourly',
  });

  const handleCreateAlert = (rate: SavedRate) => {
    setEditingRateId(rate.id);
    
    const currentRate = rate.rate;
    setFormData({
      targetRate: currentRate.toString(),
      direction: 'above',
      isActive: true,
      frequency: 'hourly',
    });
    setShowAlertModal(true);
  };

  const handleEditAlert = (rate: SavedRate) => {
    if (!rate.alertSettings) return;
    
    setEditingRateId(rate.id);
    setFormData({
      targetRate: rate.alertSettings.targetRate.toString(),
      direction: rate.alertSettings.direction,
      isActive: rate.alertSettings.isActive,
      frequency: rate.alertSettings.frequency,
    });
    setShowAlertModal(true);
  };

  const handleSaveAlert = async () => {
    if (!editingRateId) return;

    const targetRate = parseFloat(formData.targetRate);
    if (isNaN(targetRate) || targetRate <= 0) {
      Alert.alert(t('error.invalidInput'), 'Please enter a valid target rate');
      return;
    }

    try {
      const updatedRates = savedRates.map(rate => {
        if (rate.id === editingRateId) {
          const alertSettings: AlertSettings = {
            targetRate,
            direction: formData.direction,
            isActive: formData.isActive,
            frequency: formData.frequency,
            lastChecked: Date.now(),
            triggered: false,
          };

          // Create notification alert
          const rateAlert: RateAlert = {
            id: rate.id,
            fromCurrency: rate.fromCurrency,
            toCurrency: rate.toCurrency,
            targetRate,
            direction: formData.direction,
            isActive: formData.isActive,
            lastChecked: Date.now(),
            triggered: false,
          };

          if (formData.isActive) {
            notificationService.scheduleRateAlert(rateAlert);
          } else {
            notificationService.cancelRateAlert(rate.id);
          }

          return {
            ...rate,
            hasAlert: true,
            alertSettings,
          };
        }
        return rate;
      });

      // Save to storage
      await AsyncStorage.setItem("savedRates", JSON.stringify(updatedRates));
      await onRatesUpdate();
      
      setShowAlertModal(false);
      setEditingRateId(null);
      
      Alert.alert('Success', 'Rate alert has been saved successfully!');
    } catch (error) {
      console.error('Error saving alert:', error);
      Alert.alert('Error', 'Failed to save rate alert');
    }
  };

  const handleDeleteAlert = async (rateId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this rate alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.cancelRateAlert(rateId);
              
              const updatedRates = savedRates.map(rate => {
                if (rate.id === rateId) {
                  return {
                    ...rate,
                    hasAlert: false,
                    alertSettings: undefined,
                  };
                }
                return rate;
              });

              await AsyncStorage.setItem("savedRates", JSON.stringify(updatedRates));
              await onRatesUpdate();
              
              Alert.alert('Success', 'Rate alert has been deleted');
            } catch (error) {
              console.error('Error deleting alert:', error);
              Alert.alert('Error', 'Failed to delete rate alert');
            }
          },
        },
      ]
    );
  };

  const toggleAlertActive = async (rateId: string, isActive: boolean) => {
    try {
      const rate = savedRates.find(r => r.id === rateId);
      if (!rate || !rate.alertSettings) return;

      const updatedRates = savedRates.map(r => {
        if (r.id === rateId) {
          return {
            ...r,
            alertSettings: {
              ...r.alertSettings!,
              isActive,
              lastChecked: Date.now(),
            },
          };
        }
        return r;
      });

      // Update notification service
      const rateAlert: RateAlert = {
        id: rateId,
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        targetRate: rate.alertSettings.targetRate,
        direction: rate.alertSettings.direction,
        isActive,
        lastChecked: Date.now(),
        triggered: false,
      };

      if (isActive) {
        await notificationService.scheduleRateAlert(rateAlert);
      } else {
        await notificationService.cancelRateAlert(rateId);
      }

      await AsyncStorage.setItem("savedRates", JSON.stringify(updatedRates));
      await onRatesUpdate();
      
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const getAlertStatusText = (rate: SavedRate): string => {
    if (!rate.hasAlert || !rate.alertSettings) return 'No Alert';
    
    if (!rate.alertSettings.isActive) return 'Inactive';
    if (rate.alertSettings.triggered) return 'Triggered!';
    
    const lastChecked = rate.alertSettings.lastChecked
      ? new Date(rate.alertSettings.lastChecked).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      : 'Never';
    
    return `Active (${lastChecked})`;
  };

  const getAlertStatusColor = (rate: SavedRate): string => {
    if (!rate.hasAlert || !rate.alertSettings) return '#6b7280';
    if (!rate.alertSettings.isActive) return '#9ca3af';
    if (rate.alertSettings.triggered) return '#dc2626';
    return '#10b981';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
           Rate Alerts
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {savedRates.filter(rate => rate.hasAlert).length} active alerts
        </ThemedText>
      </View>

      <ScrollView style={styles.ratesList}>
        {savedRates.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>
              No saved rates available. Save some rates first to set up alerts!
            </ThemedText>
          </View>
        ) : (
          savedRates.map((rate) => (
            <View key={rate.id} style={styles.rateCard}>
              <View style={styles.rateHeader}>
                <View style={styles.currencyPair}>
                  <CurrencyFlag currency={rate.fromCurrency} size={20} />
                  <ThemedText style={styles.arrow}>→</ThemedText>
                  <CurrencyFlag currency={rate.toCurrency} size={20} />
                  <ThemedText style={styles.currencyText} numberOfLines={1} ellipsizeMode="tail">
                    {rate.fromCurrency} → {rate.toCurrency}
                  </ThemedText>
                </View>
                <ThemedText style={styles.rateValue} numberOfLines={1} ellipsizeMode="tail">
                  {rate.rate.toFixed(6)}
                </ThemedText>
              </View>

              {rate.hasAlert && rate.alertSettings ? (
                <View style={styles.alertSection}>
                  <View style={styles.alertInfo}>
                    <View style={styles.alertRow}>
                      <ThemedText style={styles.alertLabel}>Target:</ThemedText>
                      <ThemedText style={styles.alertValue}>
                        {rate.alertSettings.direction} {rate.alertSettings.targetRate.toFixed(6)}
                      </ThemedText>
                    </View>
                    <View style={styles.alertRow}>
                      <ThemedText style={styles.alertLabel}>Status:</ThemedText>
                      <ThemedText style={[styles.statusText, { color: getAlertStatusColor(rate) }]}>
                        {getAlertStatusText(rate)}
                      </ThemedText>
                    </View>
                    <View style={styles.alertRow}>
                      <ThemedText style={styles.alertLabel}>Frequency:</ThemedText>
                      <ThemedText style={styles.alertValue}>
                        {rate.alertSettings.frequency}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.alertControls}>
                    <View style={styles.switchContainer}>
                      <ThemedText style={styles.switchLabel}>Active</ThemedText>
                      <Switch
                        value={rate.alertSettings.isActive}
                        onValueChange={(value) => toggleAlertActive(rate.id, value)}
                        trackColor={{ false: '#ec1c1cff', true: '#10b981' }}
                        thumbColor='#ffffff'
                      />
                    </View>
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditAlert(rate)}
                      >
                        <ThemedText style={styles.editButtonText}>Edit</ThemedText>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteAlert(rate.id)}
                      >
                        <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.createAlertButton}
                  onPress={() => handleCreateAlert(rate)}
                >
                  <ThemedText style={styles.createAlertButtonText}>
                    Create Alert
                  </ThemedText>
                </TouchableOpacity>
              )}
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
              {editingRateId ? 'Edit Alert' : 'Create Alert'}
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
                {(['above', 'below', 'equals'] as const).map((direction) => (
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
              <ThemedText style={styles.label}>Frequency</ThemedText>
              <View style={styles.frequencyButtons}>
                {(['hourly', 'daily'] as const).map((frequency) => (
                  <TouchableOpacity
                    key={frequency}
                    style={[
                      styles.frequencyButton,
                      formData.frequency === frequency && styles.frequencyButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, frequency })}
                  >
                    <ThemedText
                      style={[
                        styles.frequencyButtonText,
                        formData.frequency === frequency && styles.frequencyButtonTextActive,
                      ]}
                    >
                      {frequency}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  ratesList: {
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
  rateCard: {
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
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  rateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    minWidth: 80,
    textAlign: 'right',
  },
  alertSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
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
  alertControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
    marginRight: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
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
  createAlertButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createAlertButtonText: {
    color: 'white',
    fontSize: 16,
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
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frequencyButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  frequencyButtonTextActive: {
    color: 'white',
  },
});