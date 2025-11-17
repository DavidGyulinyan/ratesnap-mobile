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
} from "react-native";
import { ThemedText } from "./themed-text";
import CurrencyFlag from "./CurrencyFlag";
import CurrencyPicker from "./CurrencyPicker";
import { useThemeColor } from "@/hooks/use-theme-color";
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
  fromCurrency: string;
  toCurrency: string;
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

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceSecondaryColor = useThemeColor({}, 'surfaceSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const shadowColor = '#000000'; // Use black for shadows

  // Extract currencies list from currenciesData
  const currencies = currenciesData?.conversion_rates ? Object.keys(currenciesData.conversion_rates) : [];
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [showFromCurrencyPicker, setShowFromCurrencyPicker] = useState(false);
  const [showToCurrencyPicker, setShowToCurrencyPicker] = useState(false);
  const [formData, setFormData] = useState<AlertFormData>({
    fromCurrency: 'USD',
    toCurrency: 'AMD',
    targetRate: '',
    direction: 'above',
    isActive: true,
  });

  const handleCreateAlert = () => {
    setEditingAlertId(null);
    setFormData({
      fromCurrency: 'USD',
      toCurrency: 'AMD',
      targetRate: '1.0',
      direction: 'above',
      isActive: true,
    });
    setShowAlertModal(true);
  };

  const handleEditAlert = (alert: RateAlert) => {
    setEditingAlertId(alert.id);
    setFormData({
      fromCurrency: alert.from_currency,
      toCurrency: alert.to_currency,
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
        // Create new alert with selected currencies
        const success = await createAlert(formData.fromCurrency, formData.toCurrency, targetRate, formData.direction);
        if (!success) {
          Alert.alert('Error', 'Failed to create rate alert');
          return;
        }
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
    if (!alert.is_active) return textSecondaryColor;
    return successColor;
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
            style={[{ backgroundColor: successColor, shadowColor: successColor }, styles.createButton]}
            onPress={handleCreateAlert}
          >
            <ThemedText style={[{ color: textColor }, styles.createButtonText]}>+ Create Alert</ThemedText>
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
            <View key={alert.id} style={[{ backgroundColor: surfaceColor, borderColor: borderColor, shadowColor: shadowColor }, styles.alertCard]}>
              <View style={styles.alertHeader}>
                <View style={styles.currencyPair}>
                  <CurrencyFlag currency={alert.from_currency} size={20} />
                  <ThemedText style={[{ color: textSecondaryColor }, styles.arrow]}>→</ThemedText>
                  <CurrencyFlag currency={alert.to_currency} size={20} />
                  <ThemedText style={[{ color: textColor }, styles.currencyText]}>
                    {alert.from_currency} → {alert.to_currency}
                  </ThemedText>
                </View>
                <View style={styles.alertControls}>
                  <ThemedText style={[{ color: textColor }, styles.switchLabel]}>Active</ThemedText>
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
                  <ThemedText style={[{ color: textSecondaryColor }, styles.alertLabel]}>Target:</ThemedText>
                  <ThemedText style={[{ color: textColor }, styles.alertValue]}>
                    {alert.condition} {alert.target_rate.toFixed(6)}
                  </ThemedText>
                </View>
                <View style={styles.alertRow}>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.alertLabel]}>Status:</ThemedText>
                  <ThemedText style={[styles.statusText, { color: getAlertStatusColor(alert) }]}>
                    {getAlertStatusText(alert)}
                  </ThemedText>
                </View>
                <View style={styles.alertRow}>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.alertLabel]}>Created:</ThemedText>
                  <ThemedText style={[{ color: textColor }, styles.alertValue]}>
                    {new Date(alert.created_at).toLocaleDateString()}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.alertActions}>
                <TouchableOpacity
                  style={[{ backgroundColor: primaryColor, shadowColor: primaryColor }, styles.editButton]}
                  onPress={() => handleEditAlert(alert)}
                >
                  <ThemedText style={[{ color: textColor }, styles.editButtonText]}>Edit</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[{ backgroundColor: errorColor, shadowColor: errorColor }, styles.deleteButton]}
                  onPress={() => handleDeleteAlert(alert.id)}
                >
                  <ThemedText style={[{ color: textColor }, styles.deleteButtonText]}>Delete</ThemedText>
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
        <View style={[{ backgroundColor: backgroundColor }, styles.modalContainer]}>
          <View style={[{ backgroundColor: surfaceColor, borderBottomColor: borderColor }, styles.modalHeader]}>
            <TouchableOpacity
              onPress={() => setShowAlertModal(false)}
              style={[{ backgroundColor: surfaceSecondaryColor }, styles.cancelButton]}
            >
              <ThemedText style={[{ color: textSecondaryColor }, styles.cancelButtonText]}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitle" style={[{ color: textColor }, styles.modalTitle]}>
              {editingAlertId ? 'Edit Alert' : 'Create Alert'}
            </ThemedText>
            <TouchableOpacity onPress={handleSaveAlert} style={[{ backgroundColor: successColor, shadowColor: successColor }, styles.saveButton]}>
              <ThemedText style={[{ color: textColor }, styles.saveButtonText]}>Save</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <ThemedText style={[{ color: textColor }, styles.label]}>From Currency</ThemedText>
              <TouchableOpacity
                style={[{ backgroundColor: surfaceColor, borderColor: borderColor }, styles.currencySelector]}
                onPress={() => setShowFromCurrencyPicker(true)}
              >
                <View style={styles.currencySelectorContent}>
                  <CurrencyFlag currency={formData.fromCurrency} size={24} />
                  <ThemedText style={[{ color: textColor }, styles.currencySelectorText]}>
                    {formData.fromCurrency}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.arrowText]}>▼</ThemedText>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={[{ color: textColor }, styles.label]}>To Currency</ThemedText>
              <TouchableOpacity
                style={[{ backgroundColor: surfaceColor, borderColor: borderColor }, styles.currencySelector]}
                onPress={() => setShowToCurrencyPicker(true)}
              >
                <View style={styles.currencySelectorContent}>
                  <CurrencyFlag currency={formData.toCurrency} size={24} />
                  <ThemedText style={[{ color: textColor }, styles.currencySelectorText]}>
                    {formData.toCurrency}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.arrowText]}>▼</ThemedText>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={[{ color: textColor }, styles.label]}>
                Target Rate (1 {formData.fromCurrency} = X {formData.toCurrency})
              </ThemedText>
              <TextInput
                style={[{ backgroundColor: surfaceColor, borderColor: borderColor, color: textColor }, styles.input]}
                value={formData.targetRate}
                onChangeText={(text) => setFormData({ ...formData, targetRate: text })}
                keyboardType="numeric"
                placeholder={`Enter rate for ${formData.fromCurrency} → ${formData.toCurrency}`}
                placeholderTextColor={textSecondaryColor}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={[{ color: textColor }, styles.label]}>Direction</ThemedText>
              <View style={styles.directionButtons}>
                {(['above', 'below'] as const).map((direction) => (
                  <TouchableOpacity
                    key={direction}
                    style={[
                      { backgroundColor: surfaceSecondaryColor, borderColor: borderColor },
                      styles.directionButton,
                      formData.direction === direction && { backgroundColor: primaryColor, borderColor: primaryColor },
                    ]}
                    onPress={() => setFormData({ ...formData, direction })}
                  >
                    <ThemedText
                      style={[
                        { color: textColor },
                        styles.directionButtonText,
                        formData.direction === direction && { color: textColor },
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
                <ThemedText style={[{ color: textColor }, styles.label]}>Activate Alert</ThemedText>
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

      {/* From Currency Picker */}
      <CurrencyPicker
        visible={showFromCurrencyPicker}
        currencies={currencies}
        selectedCurrency={formData.fromCurrency}
        onSelect={(currency) => {
          setFormData({ ...formData, fromCurrency: currency });
          setShowFromCurrencyPicker(false);
        }}
        onClose={() => setShowFromCurrencyPicker(false)}
      />

      {/* To Currency Picker */}
      <CurrencyPicker
        visible={showToCurrencyPicker}
        currencies={currencies}
        selectedCurrency={formData.toCurrency}
        onSelect={(currency) => {
          setFormData({ ...formData, toCurrency: currency });
          setShowToCurrencyPicker(false);
        }}
        onClose={() => setShowToCurrencyPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
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
    textAlign: 'center',
    fontStyle: 'italic',
  },
  alertCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
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
    fontWeight: 'bold',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  alertControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
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
    fontWeight: '500',
    minWidth: 70,
  },
  alertValue: {
    fontSize: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  directionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  directionButton: {
    flex: 1,
    padding: 12,
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
  },
  directionButtonTextActive: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencySelector: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
  },
  currencySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencySelectorText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  arrowText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});