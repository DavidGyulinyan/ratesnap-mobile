import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { useDashboardStore } from '@/stores/dashboardStore';
import {
  exportToFile,
  importFromJSON,
  validateDashboardExport,
  createDashboardExport,
  DashboardExport,
} from '@/utils/dashboardExportImport';

interface DashboardExportImportProps {
  visible: boolean;
  onClose: () => void;
}

export function DashboardExportImport({ visible, onClose }: DashboardExportImportProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [exportName, setExportName] = useState('My Dashboard');
  const [isValidating, setIsValidating] = useState(false);
  const { widgets, addWidget, clearLayout } = useDashboardStore();

  const handleExport = () => {
    try {
      const exportData = createDashboardExport(exportName, widgets, {
        notes: 'Exported from RateSnap Mobile Dashboard',
      });
      
      exportToFile(exportData);
      
      Alert.alert(
        'Export Successful',
        'Your dashboard has been exported successfully!',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert(
        'Export Failed',
        `Failed to export dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      Alert.alert('Error', 'Please paste a valid dashboard JSON');
      return;
    }

    setIsValidating(true);

    try {
      const importedData = importFromJSON(importText.trim());
      
      Alert.alert(
        'Import Preview',
        `Found ${importedData.widgets.length} widgets in "${importedData.name}" dashboard.\n\nDo you want to replace your current dashboard?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace Current',
            style: 'destructive',
            onPress: () => {
              clearLayout();
              
              // Add all imported widgets
              importedData.widgets.forEach((widget) => {
                addWidget({
                  type: widget.type,
                  x: widget.x,
                  y: widget.y,
                  w: widget.w,
                  h: widget.h,
                  props: widget.props,
                });
              });
              
              Alert.alert(
                'Import Successful',
                `Imported ${importedData.widgets.length} widgets from "${importedData.name}"`,
                [{ text: 'OK', onPress: onClose }]
              );
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Import Failed',
        `Invalid dashboard JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearImportText = () => {
    setImportText('');
  };

  const handlePasteFromClipboard = async () => {
    // In a real app, you'd use Clipboard API
    // For now, we'll just show a placeholder
    Alert.alert('Info', 'Copy dashboard JSON to clipboard and paste it manually');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <ThemedText style={styles.title}>Dashboard Export/Import</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'export' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('export')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'export' && styles.activeTabText,
              ]}
            >
              📤 Export
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'import' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('import')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'import' && styles.activeTabText,
              ]}
            >
              📥 Import
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {activeTab === 'export' ? (
            <View>
              <ThemedText style={styles.sectionTitle}>Export Dashboard</ThemedText>
              <ThemedText style={styles.description}>
                Save your current dashboard layout as a JSON file that you can share or backup.
              </ThemedText>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Dashboard Name</ThemedText>
                <TextInput
                  style={styles.input}
                  value={exportName}
                  onChangeText={setExportName}
                  placeholder="Enter dashboard name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <ThemedText style={styles.infoText}>
                  <ThemedText style={styles.infoBold}>Export includes:</ThemedText>
                  {'\n'}• Widget layout and positions{'\n'}• Widget configurations{'\n'}• Export timestamp and version
                </ThemedText>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleExport}>
                <Text style={styles.primaryButtonText}>📤 Export Dashboard</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <ThemedText style={styles.sectionTitle}>Import Dashboard</ThemedText>
              <ThemedText style={styles.description}>
                Paste a dashboard JSON export to restore a saved layout or import a shared dashboard.
              </ThemedText>

              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <ThemedText style={styles.label}>Dashboard JSON</ThemedText>
                  <TouchableOpacity onPress={handlePasteFromClipboard}>
                    <Text style={styles.pasteButton}>📋 Paste</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={importText}
                  onChangeText={setImportText}
                  placeholder="Paste dashboard JSON here..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
                {importText.length > 0 && (
                  <TouchableOpacity onPress={handleClearImportText} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.warningBox}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <ThemedText style={styles.warningText}>
                  <ThemedText style={styles.warningBold}>Warning:</ThemedText>
                  {'\n'}Importing will replace your current dashboard layout.
                </ThemedText>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!importText.trim() || isValidating) && styles.disabledButton,
                ]}
                onPress={handleImport}
                disabled={!importText.trim() || isValidating}
              >
                <Text style={styles.primaryButtonText}>
                  {isValidating ? '⏳ Validating...' : '📥 Import Dashboard'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </Modal>
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
    borderBottomColor: '#E5E5EA',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  pasteButton: {
    fontSize: 14,
    color: '#007AFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 200,
    textAlignVertical: 'top',
  },
  clearButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  infoBold: {
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  warningBold: {
    fontWeight: '600',
    color: '#FF3B30',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#D1D1D6',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});