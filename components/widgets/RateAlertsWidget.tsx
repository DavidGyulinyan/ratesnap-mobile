import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Modal, StyleSheet, FlatList, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "../themed-view";
import { ThemedText } from "../themed-text";
import CurrencyFlag from "../CurrencyFlag";
import BaseWidget from "./BaseWidget";

interface RateAlert {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  targetRate: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
}

interface RateAlertsWidgetProps {
  widgetId: string;
  onRemove: () => void;
  onToggle?: () => void;
  isEditMode?: boolean;
}

export default function RateAlertsWidget({
  widgetId,
  onRemove,
  onToggle,
  isEditMode = false
}: RateAlertsWidgetProps) {
  const [alerts, setAlerts] = useState<RateAlert[]>([]);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [newAlert, setNewAlert] = useState({
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    targetRate: '',
    condition: 'below' as 'above' | 'below'
  });

  useEffect(() => {
    loadAlerts();
    checkAlertTriggers();
    
    // Check alerts every 5 minutes
    const interval = setInterval(checkAlertTriggers, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const stored = await AsyncStorage.getItem('rateAlerts');
      if (stored) {
        setAlerts(JSON.parse(stored));
      } else {
        // Add demo alerts for demonstration - REMOVE IN PRODUCTION
        const demoAlerts: RateAlert[] = [
          {
            id: 'demo-1',
            fromCurrency: 'USD',
            toCurrency: 'EUR',
            targetRate: 0.85,
            condition: 'below',
            isActive: true,
            createdAt: Date.now() - 1000 * 60 * 60 * 24 // 1 day ago
          },
          {
            id: 'demo-2',
            fromCurrency: 'EUR',
            toCurrency: 'GBP',
            targetRate: 0.85,
            condition: 'above',
            isActive: false,
            createdAt: Date.now() - 1000 * 60 * 60 * 12 // 12 hours ago
          }
        ];
        setAlerts(demoAlerts);
        // Store demo alerts so they persist
        await AsyncStorage.setItem('rateAlerts', JSON.stringify(demoAlerts));
      }
    } catch (error) {
      console.error('Error loading rate alerts:', error);
    }
  };

  const saveAlerts = async (updatedAlerts: RateAlert[]) => {
    try {
      await AsyncStorage.setItem('rateAlerts', JSON.stringify(updatedAlerts));
      setAlerts(updatedAlerts);
    } catch (error) {
      console.error('Error saving rate alerts:', error);
    }
  };

  const addAlert = async () => {
    if (!newAlert.targetRate || parseFloat(newAlert.targetRate) <= 0) {
      Alert.alert('Error', 'Please enter a valid target rate');
      return;
    }

    const alert: RateAlert = {
      id: `alert-${Date.now()}`,
      fromCurrency: newAlert.fromCurrency,
      toCurrency: newAlert.toCurrency,
      targetRate: parseFloat(newAlert.targetRate),
      condition: newAlert.condition,
      isActive: true,
      createdAt: Date.now()
    };

    const updatedAlerts = [alert, ...alerts];
    await saveAlerts(updatedAlerts);
    
    setNewAlert({
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      targetRate: '',
      condition: 'below'
    });
    setShowAddAlert(false);
    
    Alert.alert('Success', 'Rate alert created successfully!');
  };

  const deleteAlert = async (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this rate alert?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
            await saveAlerts(updatedAlerts);
          },
        },
      ]
    );
  };

  const deleteAllAlerts = async () => {
    if (alerts.length === 0) return;
    
    Alert.alert(
      'Delete All Alerts',
      `Are you sure you want to delete all ${alerts.length} rate alerts? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await saveAlerts([]);
            setShowDetailedView(false); // Close detailed view if open
          },
        },
      ]
    );
  };

  const toggleAlert = async (alertId: string) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
    );
    await saveAlerts(updatedAlerts);
  };

  const checkAlertTriggers = async () => {
    // This would typically check current rates against alerts
    // For now, we'll simulate checking (in a real app, you'd fetch current rates)
    console.log('Checking rate alert triggers...');
    
    // In a real implementation, you would:
    // 1. Fetch current exchange rates
    // 2. Compare with each active alert
    // 3. Trigger notifications for matching alerts
    // 4. Update alert status and timestamp
  };

  const renderAlert = ({ item }: { item: RateAlert }) => (
    <View style={[styles.alertItem, !item.isActive && styles.inactiveAlert]}>
      <View style={styles.alertContent}>
        <View style={styles.alertInfo}>
          <View style={styles.alertCurrencies}>
            <CurrencyFlag currency={item.fromCurrency} size={16} />
            <ThemedText style={styles.alertArrow}>→</ThemedText>
            <CurrencyFlag currency={item.toCurrency} size={16} />
          </View>
          <ThemedText style={styles.alertCondition}>
            {item.condition === 'below' ? '↓' : '↑'} {item.targetRate}
          </ThemedText>
        </View>
        <View style={styles.alertStatus}>
          <ThemedText style={[
            styles.alertStatusText,
            item.isActive ? styles.activeStatus : styles.inactiveStatus
          ]}>
            {item.isActive ? 'Active' : 'Paused'}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.alertActions}>
        <TouchableOpacity
          style={[styles.alertAction, styles.alertActionPause]}
          onPress={() => toggleAlert(item.id)}
        >
          <ThemedText style={styles.alertActionText}>
            {item.isActive ? '⏸️' : '▶️'}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.alertAction, styles.alertActionDelete]}
          onPress={() => deleteAlert(item.id)}
        >
          <ThemedText style={styles.alertActionText}>🗑️ DELETE</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDetailedViewModal = () => (
    <Modal 
      visible={showDetailedView} 
      animationType="slide" 
      onRequestClose={() => setShowDetailedView(false)}
    >
      <ThemedView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowDetailedView(false)}>
            <ThemedText style={styles.closeButton}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.modalTitle}>
            📋 All Rate Alerts ({alerts.length})
          </ThemedText>
          <TouchableOpacity onPress={() => setShowDetailedView(false)}>
            <ThemedText style={styles.closeButton}>×</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          {/* Delete All Button at Top */}
          {alerts.length > 0 && (
            <TouchableOpacity
              style={styles.deleteAllButtonModal}
              onPress={deleteAllAlerts}
            >
              <ThemedText style={styles.deleteAllButtonModalText}>
                🗑️ DELETE ALL ALERTS ({alerts.length})
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* All Alerts List */}
          {alerts.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>
                No rate alerts set
              </ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>
                Get notified when rates reach your targets
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={alerts}
              renderItem={renderAlert}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.alertsListModal}
            />
          )}

          {/* Add New Alert Button */}
          <TouchableOpacity 
            style={styles.addAlertButtonModal} 
            onPress={() => {
              setShowDetailedView(false);
              setShowAddAlert(true);
            }}
          >
            <ThemedText style={styles.addAlertButtonModalText}>
              ➕ Add New Alert
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </Modal>
  );

  const renderAddAlertModal = () => (
    <Modal 
      visible={showAddAlert} 
      animationType="slide" 
      onRequestClose={() => setShowAddAlert(false)}
    >
      <ThemedView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddAlert(false)}>
            <ThemedText style={styles.closeButton}>Close</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.modalTitle}>
            Add Rate Alert
          </ThemedText>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>From Currency</ThemedText>
            <TextInput
              style={styles.input}
              value={newAlert.fromCurrency}
              onChangeText={(text) => setNewAlert({...newAlert, fromCurrency: text.toUpperCase()})}
              placeholder="USD"
              maxLength={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>To Currency</ThemedText>
            <TextInput
              style={styles.input}
              value={newAlert.toCurrency}
              onChangeText={(text) => setNewAlert({...newAlert, toCurrency: text.toUpperCase()})}
              placeholder="EUR"
              maxLength={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Target Rate</ThemedText>
            <TextInput
              style={styles.input}
              value={newAlert.targetRate}
              onChangeText={(text) => setNewAlert({...newAlert, targetRate: text})}
              placeholder="0.8500"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Condition</ThemedText>
            <View style={styles.conditionButtons}>
              <TouchableOpacity
                style={[
                  styles.conditionButton,
                  newAlert.condition === 'below' && styles.conditionButtonActive
                ]}
                onPress={() => setNewAlert({...newAlert, condition: 'below'})}
              >
                <ThemedText style={[
                  styles.conditionButtonText,
                  newAlert.condition === 'below' && styles.conditionButtonTextActive
                ]}>
                  ↓ Below
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.conditionButton,
                  newAlert.condition === 'above' && styles.conditionButtonActive
                ]}
                onPress={() => setNewAlert({...newAlert, condition: 'above'})}
              >
                <ThemedText style={[
                  styles.conditionButtonText,
                  newAlert.condition === 'above' && styles.conditionButtonTextActive
                ]}>
                  ↑ Above
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.addAlertButton} onPress={addAlert}>
            <ThemedText style={styles.addAlertButtonText}>Create Alert</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </Modal>
  );

  return (
    <>
      <BaseWidget
        widgetId={widgetId}
        title="Rate Alerts"
        onRemove={onRemove}
        onToggle={onToggle}
        isEditMode={isEditMode}
      >
        {/* Click to open detailed view */}
        <TouchableOpacity 
          style={styles.widgetClickArea} 
          onPress={() => setShowDetailedView(true)}
          activeOpacity={0.7}
        >
          {alerts.length > 0 && (
            <View style={styles.widgetHeader}>
              <TouchableOpacity
                style={styles.deleteAllButtonHeader}
                onPress={deleteAllAlerts}
              >
                <ThemedText style={styles.deleteAllButtonHeaderText}>
                  🗑️ Delete All ({alerts.length})
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.alertsContainer}>
            {alerts.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>
                  No rate alerts set
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  Get notified when rates reach your targets
                </ThemedText>
              </View>
            ) : (
              <View style={styles.alertsList}>
                <FlatList
                  data={alerts.slice(0, 2)} // Show only first 2 in widget
                  renderItem={renderAlert}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
                
                {alerts.length > 2 && (
                  <ThemedText style={styles.showMoreText}>
                    {alerts.length - 2} more alerts...
                  </ThemedText>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.addAlertButtonWidget}
              onPress={() => setShowAddAlert(true)}
            >
              <ThemedText style={styles.addAlertButtonWidgetText}>
                {alerts.length === 0 ? '+ Create Your First Alert' : '+ Add Alert'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </BaseWidget>

      {/* Detailed View Modal */}
      {renderDetailedViewModal()}

      {renderAddAlertModal()}
    </>
  );
}

const styles = StyleSheet.create({
  widgetClickArea: {
    // Make the entire widget clickable
  },
  widgetHeader: {
    marginBottom: 12,
  },
  alertsContainer: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  alertsList: {
    maxHeight: 120,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 6,
  },
  inactiveAlert: {
    opacity: 0.6,
  },
  alertContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertCurrencies: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  alertArrow: {
    marginHorizontal: 6,
    fontSize: 12,
    color: '#6b7280',
  },
  alertCondition: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  alertStatus: {
    marginLeft: 8,
  },
  alertStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeStatus: {
    color: '#10b981',
  },
  inactiveStatus: {
    color: '#6b7280',
  },
  alertActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertAction: {
    padding: 10,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertActionPause: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  alertActionDelete: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertActionText: {
    fontSize: 16,
  },
  showMoreText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  addAlertButtonWidget: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  addAlertButtonWidgetText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteAllButtonWidget: {
    backgroundColor: '#dc2626',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteAllButtonWidgetText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteAllButtonHeader: {
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dc2626',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deleteAllButtonHeaderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 10,
  },
  closeButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  deleteAllButtonModal: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#b91c1c',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  deleteAllButtonModalText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  alertsListModal: {
    paddingBottom: 20,
  },
  addAlertButtonModal: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  addAlertButtonModalText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  conditionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  conditionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  conditionButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  conditionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  conditionButtonTextActive: {
    color: 'white',
  },
  addAlertButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addAlertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});