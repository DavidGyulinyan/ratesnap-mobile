import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { ThemedText } from "./themed-text";
import { useUserData } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { UserDataService } from "@/lib/userDataService";

interface UserDataManagementProps {
  visible: boolean;
  onClose: () => void;
}

export default function UserDataManagement({
  visible,
  onClose,
}: UserDataManagementProps) {
  const { user } = useAuth();
  const {
    savedRates,
    rateAlerts,
    converterHistory,
    calculatorHistory,
    pickedRates,
    clearAllData
  } = useUserData();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllData = async () => {
    if (!user) return;
    
    setIsClearing(true);
    try {
      const success = await clearAllData();
      if (success) {
        Alert.alert('Success', 'All user data has been cleared successfully');
        setShowDeleteConfirm(false);
      } else {
        Alert.alert('Error', 'Failed to clear user data');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while clearing data');
    } finally {
      setIsClearing(false);
    }
  };

  const exportUserData = () => {
    if (!user) return;

    const data = {
      savedRates: savedRates.savedRates,
      rateAlerts: rateAlerts.rateAlerts,
      converterHistory: converterHistory.converterHistory,
      calculatorHistory: calculatorHistory.calculatorHistory,
      pickedRates: pickedRates.pickedRates,
      exportedAt: new Date().toISOString(),
      userId: user.id,
    };

    // In a real app, you would export this data as a file or send it to a server
    console.log('User data export:', JSON.stringify(data, null, 2));
    Alert.alert('Export Complete', 'User data has been exported to console');
  };

  const getDataStats = () => {
    return {
      savedRates: savedRates.savedRates.length,
      rateAlerts: rateAlerts.rateAlerts.length,
      converterHistory: converterHistory.converterHistory.length,
      calculatorHistory: calculatorHistory.calculatorHistory.length,
      pickedRates: pickedRates.pickedRates.length,
    };
  };

  const stats = getDataStats();
  const totalDataPoints = Object.values(stats).reduce((sum, count) => sum + count, 0);

  if (!user) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.title}>User Data Management</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Sign in to manage your data across all features!
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.title}>User Data Management</Text>
          <TouchableOpacity onPress={exportUserData} style={styles.exportButton}>
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Overview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Data Overview</Text>
            <View style={styles.overviewCard}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Total Data Points:</Text>
                <Text style={styles.overviewValue}>{totalDataPoints}</Text>
              </View>
              <View style={styles.overviewGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.savedRates}</Text>
                  <Text style={styles.statLabel}>Saved Rates</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.rateAlerts}</Text>
                  <Text style={styles.statLabel}>Rate Alerts</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.converterHistory}</Text>
                  <Text style={styles.statLabel}>Conversions</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.calculatorHistory}</Text>
                  <Text style={styles.statLabel}>Calculations</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Data Features</Text>
            
            <View style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureTitle}>⭐ Saved Rates</Text>
                <Text style={styles.featureCount}>{stats.savedRates} items</Text>
              </View>
              <Text style={styles.featureDescription}>
                Currency rate pairs you've saved for quick access
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureTitle}>🔔 Rate Alerts</Text>
                <Text style={styles.featureCount}>{stats.rateAlerts} alerts</Text>
              </View>
              <Text style={styles.featureDescription}>
                Notifications when rates reach your target levels
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureTitle}>🔄 Conversion History</Text>
                <Text style={styles.featureCount}>{stats.converterHistory} records</Text>
              </View>
              <Text style={styles.featureDescription}>
                Multi-currency conversion history and results
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureTitle}>🧮 Calculator History</Text>
                <Text style={styles.featureCount}>{stats.calculatorHistory} calculations</Text>
              </View>
              <Text style={styles.featureDescription}>
                Mathematical calculations and results
              </Text>
            </View>
          </View>

          {/* Data Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Data Management</Text>
            
            <View style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <Text style={styles.actionTitle}>Export Data</Text>
                <Text style={styles.actionStatus}>Available</Text>
              </View>
              <Text style={styles.actionDescription}>
                Download all your data as a JSON file
              </Text>
              <TouchableOpacity style={styles.actionButton} onPress={exportUserData}>
                <Text style={styles.actionButtonText}>Export Data</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.actionCard, styles.dangerCard]}>
              <View style={styles.actionHeader}>
                <Text style={styles.actionTitle}>Clear All Data</Text>
                <Text style={styles.actionStatus}>Permanent</Text>
              </View>
              <Text style={styles.actionDescription}>
                Permanently delete all your saved data across all features
              </Text>
              <TouchableOpacity 
                style={[styles.actionButton, styles.dangerButton]} 
                onPress={() => setShowDeleteConfirm(true)}
                disabled={isClearing}
              >
                <Text style={styles.dangerButtonText}>
                  {isClearing ? 'Clearing...' : 'Clear All Data'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ About Your Data</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Your data is securely stored and synced across your devices when you're signed in.
                All information is encrypted and only accessible to you.
              </Text>
            </View>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModal}>
              <Text style={styles.confirmTitle}>⚠️ Clear All Data?</Text>
              <Text style={styles.confirmMessage}>
                This action will permanently delete all your saved rates, rate alerts, 
                conversion history, calculator history, and picked rates. This cannot be undone.
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.dangerButton]}
                  onPress={handleClearAllData}
                  disabled={isClearing}
                >
                  <Text style={styles.dangerButtonText}>
                    {isClearing ? 'Clearing...' : 'Delete Everything'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  exportButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  overviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomColor: '#f3f4f6',
  },
  overviewLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  featureCount: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dangerCard: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionStatus: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});