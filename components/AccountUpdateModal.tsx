import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppTextInput } from "@/components/AppTextInput";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useLanguage } from "@/contexts/LanguageContext";
import { Layout, FormField, hexToRgba } from "@/constants/theme";
import {
  getPasswordPolicyFailureMessageKey,
  isPasswordPolicyValid,
} from "@/lib/passwordPolicy";
import { getAccountDeletionAuthKind } from "@/lib/accountDeletionAuth";
import type { User } from "@supabase/supabase-js";

export type AccountUpdateMode = "password" | "email" | "username";

type AccountUpdateModalProps = {
  visible: boolean;
  mode: AccountUpdateMode;
  user: User | null;
  onClose: () => void;
  onChangePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ errorMessage?: string }>;
  onChangeEmail: (
    newEmail: string,
    password?: string
  ) => Promise<{ errorMessage?: string; successMessage?: string }>;
  onChangeUsername: (
    username: string
  ) => Promise<{ errorMessage?: string }>;
};

export default function AccountUpdateModal({
  visible,
  mode,
  user,
  onClose,
  onChangePassword,
  onChangeEmail,
  onChangeUsername,
}: AccountUpdateModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [username, setUsername] = useState("");

  const surfaceColor = useThemeColor({}, "surface");
  const surfaceSecondaryColor = useThemeColor({}, "surfaceSecondary");
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const textInverseColor = useThemeColor({}, "textInverse");
  const borderColor = useThemeColor({}, "border");
  const errorColor = useThemeColor({}, "error");

  const needsPasswordForEmail =
    user != null && getAccountDeletionAuthKind(user) === "password";

  useEffect(() => {
    if (!visible) {
      setBusy(false);
      setLocalError(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNewEmail("");
      setEmailPassword("");
      setUsername("");
    } else if (mode === "username" && user) {
      const current =
        (user.user_metadata?.username as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "";
      setUsername(current);
    }
  }, [visible, mode, user]);

  const titleKey =
    mode === "password"
      ? "settings.changePassword"
      : mode === "email"
        ? "settings.changeEmail"
        : "settings.changeUsername";

  const subtitleKey =
    mode === "password"
      ? "settings.passwordUpdateDescription"
      : mode === "email"
        ? "settings.emailUpdateDescription"
        : "settings.usernameUpdateDescription";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingHorizontal: Layout.spaceMd,
        },
        card: {
          backgroundColor: surfaceColor,
          borderRadius: Layout.radiusLg,
          borderWidth: 1,
          borderColor: borderColor,
          padding: Layout.spaceMd,
          maxHeight: "90%",
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: Layout.spaceSm,
        },
        title: {
          fontSize: 18,
          fontWeight: "700",
          color: textColor,
          flex: 1,
        },
        closeBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: surfaceSecondaryColor,
          alignItems: "center",
          justifyContent: "center",
        },
        subtitle: {
          fontSize: 14,
          lineHeight: 20,
          color: textSecondaryColor,
          marginBottom: Layout.spaceMd,
        },
        label: {
          fontSize: 14,
          fontWeight: "600",
          color: textColor,
          marginBottom: 6,
        },
        input: {
          borderWidth: 1,
          borderColor: borderColor,
          borderRadius: FormField.radiusInput,
          paddingVertical: 12,
          paddingHorizontal: 14,
          fontSize: 16,
          color: textColor,
          backgroundColor: surfaceSecondaryColor,
          marginBottom: 12,
        },
        errorText: {
          fontSize: 13,
          color: errorColor,
          marginBottom: Layout.spaceSm,
        },
        row: {
          flexDirection: "row",
          gap: 10,
          marginTop: Layout.spaceSm,
        },
        btnCancel: {
          flex: 1,
          paddingVertical: 14,
          borderRadius: Layout.radiusMd,
          borderWidth: 1,
          borderColor: hexToRgba(primaryColor, 0.45),
          alignItems: "center",
        },
        btnCancelText: {
          fontSize: 16,
          fontWeight: "600",
          color: primaryColor,
        },
        btnSave: {
          flex: 1,
          paddingVertical: 14,
          borderRadius: Layout.radiusMd,
          backgroundColor: primaryColor,
          alignItems: "center",
          justifyContent: "center",
        },
        btnSaveText: {
          fontSize: 16,
          fontWeight: "600",
          color: textInverseColor,
        },
      }),
    [
      insets.top,
      insets.bottom,
      surfaceColor,
      borderColor,
      textColor,
      textSecondaryColor,
      surfaceSecondaryColor,
      primaryColor,
      textInverseColor,
      errorColor,
    ]
  );

  const handleSave = async () => {
    setLocalError(null);

    if (mode === "password") {
      const cur = currentPassword.trim();
      const next = newPassword.trim();
      const confirm = confirmPassword.trim();
      if (!cur) {
        setLocalError(t("settings.currentPasswordEmpty"));
        return;
      }
      if (!isPasswordPolicyValid(next)) {
        setLocalError(t(getPasswordPolicyFailureMessageKey(next)));
        return;
      }
      if (next !== confirm) {
        setLocalError(t("settings.passwordMismatch"));
        return;
      }
      setBusy(true);
      const { errorMessage } = await onChangePassword(cur, next);
      setBusy(false);
      if (errorMessage) setLocalError(errorMessage);
      return;
    }

    if (mode === "email") {
      const email = newEmail.trim();
      if (!email) {
        setLocalError(t("signup.enterEmail"));
        return;
      }
      if (needsPasswordForEmail && !emailPassword.trim()) {
        setLocalError(t("settings.currentPasswordEmpty"));
        return;
      }
      setBusy(true);
      const { errorMessage } = await onChangeEmail(
        email,
        needsPasswordForEmail ? emailPassword.trim() : undefined
      );
      setBusy(false);
      if (errorMessage) setLocalError(errorMessage);
      return;
    }

    const name = username.trim();
    if (!name) {
      setLocalError(t("settings.usernameEmpty"));
      return;
    }
    setBusy(true);
    const { errorMessage } = await onChangeUsername(name);
    setBusy(false);
    if (errorMessage) setLocalError(errorMessage);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={busy ? undefined : onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.overlay} onPress={busy ? undefined : onClose}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <ThemedText style={styles.title}>{t(titleKey)}</ThemedText>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
              >
                <Ionicons name="close" size={22} color={textSecondaryColor} />
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.subtitle}>{t(subtitleKey)}</ThemedText>

            {mode === "password" ? (
              <>
                <ThemedText style={styles.label}>
                  {t("settings.currentPassword")}
                </ThemedText>
                <AppTextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder={t("settings.deleteAccountPasswordPlaceholder")}
                  placeholderTextColor={textSecondaryColor}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                />
                <ThemedText style={styles.label}>
                  {t("settings.newPassword")}
                </ThemedText>
                <AppTextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={t("settings.newPassword")}
                  placeholderTextColor={textSecondaryColor}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                />
                <ThemedText style={styles.label}>
                  {t("settings.confirmNewPassword")}
                </ThemedText>
                <AppTextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t("settings.confirmNewPassword")}
                  placeholderTextColor={textSecondaryColor}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                  onSubmitEditing={handleSave}
                />
              </>
            ) : null}

            {mode === "email" ? (
              <>
                <ThemedText style={styles.label}>{t("auth.email")}</ThemedText>
                <AppTextInput
                  style={styles.input}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder={t("signup.enterEmail")}
                  placeholderTextColor={textSecondaryColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                />
                {needsPasswordForEmail ? (
                  <>
                    <ThemedText style={styles.label}>
                      {t("settings.currentPassword")}
                    </ThemedText>
                    <AppTextInput
                      style={styles.input}
                      value={emailPassword}
                      onChangeText={setEmailPassword}
                      placeholder={t("settings.deleteAccountPasswordPlaceholder")}
                      placeholderTextColor={textSecondaryColor}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!busy}
                      onSubmitEditing={handleSave}
                    />
                  </>
                ) : null}
              </>
            ) : null}

            {mode === "username" ? (
              <>
                <ThemedText style={styles.label}>{t("auth.username")}</ThemedText>
                <AppTextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder={t("signup.chooseUsername")}
                  placeholderTextColor={textSecondaryColor}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                  onSubmitEditing={handleSave}
                />
              </>
            ) : null}

            {localError ? (
              <ThemedText style={styles.errorText}>{localError}</ThemedText>
            ) : null}

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={onClose}
                disabled={busy}
              >
                <ThemedText style={styles.btnCancelText}>
                  {t("common.cancel")}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSave}
                onPress={handleSave}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color={textInverseColor} />
                ) : (
                  <ThemedText style={styles.btnSaveText}>
                    {t("common.save")}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
