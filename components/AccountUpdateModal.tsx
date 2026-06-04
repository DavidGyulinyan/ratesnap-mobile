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
  ScrollView,
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

type ModalPasswordFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  visible: boolean;
  onToggleVisible: () => void;
  placeholderTextColor: string;
  iconColor: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  wrapStyle: object;
  inputStyle: object;
  eyeButtonStyle: object;
  editable: boolean;
  onSubmitEditing?: () => void;
};

function ModalPasswordField({
  value,
  onChangeText,
  placeholder,
  visible,
  onToggleVisible,
  placeholderTextColor,
  iconColor,
  showPasswordLabel,
  hidePasswordLabel,
  wrapStyle,
  inputStyle,
  eyeButtonStyle,
  editable,
  onSubmitEditing,
}: ModalPasswordFieldProps) {
  return (
    <View style={wrapStyle}>
      <AppTextInput
        style={inputStyle}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        editable={editable}
        onSubmitEditing={onSubmitEditing}
      />
      <TouchableOpacity
        style={eyeButtonStyle}
        onPress={onToggleVisible}
        disabled={!editable}
        accessibilityRole="button"
        accessibilityLabel={visible ? hidePasswordLabel : showPasswordLabel}
      >
        <Ionicons
          name={visible ? "eye-off" : "eye"}
          size={20}
          color={iconColor}
        />
      </TouchableOpacity>
    </View>
  );
}

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
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [emailPasswordVisible, setEmailPasswordVisible] = useState(false);

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
      setCurrentPasswordVisible(false);
      setNewPasswordVisible(false);
      setConfirmPasswordVisible(false);
      setEmailPasswordVisible(false);
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
        keyboardRoot: {
          flex: 1,
        },
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-start",
          paddingTop: insets.top + Layout.spaceSm,
          paddingBottom: insets.bottom + Layout.spaceSm,
          paddingHorizontal: Layout.spaceMd,
        },
        card: {
          alignSelf: "stretch",
          backgroundColor: surfaceColor,
          borderRadius: Layout.radiusLg,
          borderWidth: 1,
          borderColor: borderColor,
          maxHeight: "92%",
          flexShrink: 1,
          overflow: "hidden",
        },
        cardScroll: {
          flexGrow: 0,
        },
        cardScrollContent: {
          padding: Layout.spaceMd,
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
        passwordInputWrap: {
          position: "relative",
          marginBottom: 12,
        },
        passwordInput: {
          borderWidth: 1,
          borderColor: borderColor,
          borderRadius: FormField.radiusInput,
          paddingVertical: 12,
          paddingHorizontal: 14,
          paddingRight: 48,
          fontSize: 16,
          color: textColor,
          backgroundColor: surfaceSecondaryColor,
        },
        eyeButton: {
          position: "absolute",
          right: 10,
          top: 0,
          bottom: 0,
          justifyContent: "center",
          paddingHorizontal: 6,
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
      if (cur === next) {
        setLocalError(t("settings.passwordSameAsCurrent"));
        return;
      }
      setBusy(true);
      const { errorMessage } = await onChangePassword(cur, next);
      setBusy(false);
      if (errorMessage) {
        setLocalError(errorMessage);
        return;
      }
      onClose();
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

  const keyboardVerticalOffset =
    Platform.OS === "ios" ? insets.top + Layout.spaceSm : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={busy ? undefined : onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardRoot}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <Pressable style={styles.overlay} onPress={busy ? undefined : onClose}>
          <View
            style={styles.card}
            onStartShouldSetResponder={() => true}
          >
            <ScrollView
              style={styles.cardScroll}
              contentContainerStyle={styles.cardScrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              bounces={false}
              nestedScrollEnabled
            >
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
                <ModalPasswordField
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder={t("settings.deleteAccountPasswordPlaceholder")}
                  visible={currentPasswordVisible}
                  onToggleVisible={() =>
                    setCurrentPasswordVisible((v) => !v)
                  }
                  placeholderTextColor={textSecondaryColor}
                  iconColor={textSecondaryColor}
                  showPasswordLabel={t("auth.showPassword")}
                  hidePasswordLabel={t("auth.hidePassword")}
                  wrapStyle={styles.passwordInputWrap}
                  inputStyle={styles.passwordInput}
                  eyeButtonStyle={styles.eyeButton}
                  editable={!busy}
                />
                <ThemedText style={styles.label}>
                  {t("settings.newPassword")}
                </ThemedText>
                <ModalPasswordField
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={t("settings.newPassword")}
                  visible={newPasswordVisible}
                  onToggleVisible={() => setNewPasswordVisible((v) => !v)}
                  placeholderTextColor={textSecondaryColor}
                  iconColor={textSecondaryColor}
                  showPasswordLabel={t("auth.showPassword")}
                  hidePasswordLabel={t("auth.hidePassword")}
                  wrapStyle={styles.passwordInputWrap}
                  inputStyle={styles.passwordInput}
                  eyeButtonStyle={styles.eyeButton}
                  editable={!busy}
                />
                <ThemedText style={styles.label}>
                  {t("settings.confirmNewPassword")}
                </ThemedText>
                <ModalPasswordField
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t("settings.confirmNewPassword")}
                  visible={confirmPasswordVisible}
                  onToggleVisible={() =>
                    setConfirmPasswordVisible((v) => !v)
                  }
                  placeholderTextColor={textSecondaryColor}
                  iconColor={textSecondaryColor}
                  showPasswordLabel={t("auth.showPassword")}
                  hidePasswordLabel={t("auth.hidePassword")}
                  wrapStyle={styles.passwordInputWrap}
                  inputStyle={styles.passwordInput}
                  eyeButtonStyle={styles.eyeButton}
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
                    <ModalPasswordField
                      value={emailPassword}
                      onChangeText={setEmailPassword}
                      placeholder={t(
                        "settings.deleteAccountPasswordPlaceholder"
                      )}
                      visible={emailPasswordVisible}
                      onToggleVisible={() =>
                        setEmailPasswordVisible((v) => !v)
                      }
                      placeholderTextColor={textSecondaryColor}
                      iconColor={textSecondaryColor}
                      showPasswordLabel={t("auth.showPassword")}
                      hidePasswordLabel={t("auth.hidePassword")}
                      wrapStyle={styles.passwordInputWrap}
                      inputStyle={styles.passwordInput}
                      eyeButtonStyle={styles.eyeButton}
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
            </ScrollView>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
