import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "./themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

interface DashboardModalProps {
  title: string;
  icon?: string;
  onClose?: () => void;
  children: React.ReactNode;
  style?: any;
}

export default function DashboardModal({
  title,
  icon,
  onClose,
  children,
  style,
}: DashboardModalProps) {
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const shadowColor = '#000000'; // Use black for shadows

  return (
    <View style={[styles.modalContainer, style]}>
      <View style={[{ backgroundColor: surfaceColor, borderColor: borderColor, shadowColor }, styles.modalCard]}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleContainer}>
            {icon && <ThemedText style={styles.modalIcon}>{icon}</ThemedText>}
            <ThemedText style={[{ color: textColor }, styles.modalTitle]}>
              {title}
            </ThemedText>
          </View>
          {onClose && (
            <TouchableOpacity
              style={[{ backgroundColor: backgroundColor, borderColor: borderColor }, styles.closeButton]}
              onPress={onClose}
            >
              <ThemedText style={[{ color: textSecondaryColor }, styles.closeButtonText]}>×</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Modal Content */}
        <View style={styles.modalContent}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    marginBottom: 24,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalContent: {
    // Content area - children will be rendered here
  },
});