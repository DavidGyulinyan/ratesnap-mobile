import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import * as MailComposer from "expo-mail-composer";

interface ContactSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ContactSupportModal({
  visible,
  onClose,
}: ContactSupportModalProps) {
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert(t("common.error"), t("contactSupport.emptyMessage"));
      return;
    }

    setLoading(true);
    try {
      const isAvailable = await MailComposer.composeAsync({
        recipients: ["davidguiyn@gmail.com"],
        subject: "ExRatio Support Request",
        body: `From: ${user?.email || userEmail || "Anonymous User"}\n\n${message}`,
      });

      if (isAvailable) {
        Alert.alert(t("common.save"), t("contactSupport.messageSent"));
        setMessage("");
        setUserEmail("");
        onClose();
      } else {
        Alert.alert(
          t("common.error"),
          "Email composer is not available on this device"
        );
      }
    } catch (error) {
      console.error("Email composer error:", error);
      Alert.alert(t("common.error"), t("contactSupport.sendError"));
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    container: {
      backgroundColor: surfaceColor,
      borderRadius: 12,
      padding: 20,
      width: "100%",
      maxWidth: 400,
      position: "relative",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      paddingRight: 2,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: textColor,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: textSecondaryColor + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    closeButtonText: {
      fontSize: 18,
      color: textSecondaryColor,
      fontWeight: "600",
    },
    input: {
      borderWidth: 1,
      borderColor: textSecondaryColor + "30",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: textColor,
      backgroundColor: backgroundColor,
      height: 120,
      textAlignVertical: "top",
    },
    button: {
      backgroundColor: primaryColor,
      borderRadius: 8,
      padding: 14,
      alignItems: "center",
      marginTop: 16,
    },
    buttonText: {
      color: textColor,
      fontSize: 16,
      fontWeight: "600",
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: textColor,
      marginBottom: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              {t("contactSupport.title")}
            </ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={loading}
            >
              <ThemedText style={styles.closeButtonText}>×</ThemedText>
            </TouchableOpacity>
          </View>

          {!user && (
            <>
              <ThemedText style={styles.label}>
                {t("contactSupport.yourEmail")}
              </ThemedText>
              <TextInput
                style={[styles.input, { height: 50, marginBottom: 16 }]}
                value={userEmail}
                onChangeText={setUserEmail}
                placeholder="your.email@example.com"
                placeholderTextColor={textSecondaryColor}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </>
          )}

          <ThemedText style={styles.label}>
            {t("contactSupport.describeIssue")}
          </ThemedText>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder={t("contactSupport.describeIssue")}
            placeholderTextColor={textSecondaryColor}
            multiline
            numberOfLines={4}
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSend}
            disabled={loading || !message.trim()}
          >
            {loading ? (
              <ActivityIndicator color={textColor} />
            ) : (
              <ThemedText style={styles.buttonText}>
                {t("contactSupport.sendMessage")}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
