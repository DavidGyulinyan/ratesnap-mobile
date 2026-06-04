import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Modal,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppTextInput } from "./AppTextInput";
import { ThemedText } from "./themed-text";
import CurrencyFlag from "./CurrencyFlag";
import CurrencyPicker from "./CurrencyPicker";
import AuthPromptModal from "./AuthPromptModal";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRateAlerts } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { getAsyncStorage } from "@/lib/storage";
import { FormField, Layout, hexToRgba } from "@/constants/theme";
import { fiatKeysFromConversionRates } from "@/constants/fiatCurrencyCodes";
import { formatDateDDMMYY } from "@/lib/dateFormat";
import { formatGroupedNumber } from "@/lib/numberFormat";

interface RateAlert {
  id: string;
  user_id: string;
  from_currency: string;
  to_currency: string;
  target_rate: number;
  condition: 'above' | 'below';
  is_active: boolean;
  notified: boolean;
  created_at: string;
  updated_at: string;
}

interface RateAlertManagerProps {
  savedRates: any[];
  onRatesUpdate: () => void;
  currenciesData?: any;
  inModal?: boolean; // Hide header when used inside DashboardModal
  onShareableMessageChange?: (message: string | null) => void;
  /** Tap alerts to select; actions on top bar. Default: true in modal. */
  enableSelection?: boolean;
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
  inModal = false,
  onShareableMessageChange,
  enableSelection: enableSelectionProp,
}: RateAlertManagerProps) {
  const enableSelection = enableSelectionProp ?? inModal;
  const { t, tWithParams } = useLanguage();
  const { user } = useAuth();
  const { rateAlerts, loading, createAlert, updateAlert, deleteAlert, error } = useRateAlerts();

  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceSecondaryColor = useThemeColor({}, 'surfaceSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const textInverseColor = useThemeColor({}, 'textInverse');

  // Extract currencies list from currenciesData
  const currencies = fiatKeysFromConversionRates(
    currenciesData?.conversion_rates
  );
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [showFromCurrencyPicker, setShowFromCurrencyPicker] = useState(false);
  const [showToCurrencyPicker, setShowToCurrencyPicker] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [formData, setFormData] = useState<AlertFormData>({
    fromCurrency: 'USD',
    toCurrency: 'AMD',
    targetRate: '',
    direction: 'above',
    isActive: true,
  });
  const [selectedAlertIds, setSelectedAlertIds] = useState<Set<string>>(
    new Set()
  );
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    setSelectedAlertIds((prev) => {
      const valid = new Set(
        rateAlerts.map((a) => a.id).filter((id) => prev.has(id))
      );
      return valid.size === prev.size ? prev : valid;
    });
  }, [rateAlerts]);

  useEffect(() => {
    if (!inModal || !onShareableMessageChange) return;
    if (!rateAlerts.length) {
      onShareableMessageChange(null);
      return;
    }
    const lines = [
      t('rateAlerts.title'),
      ...rateAlerts.map((a) => {
        const dir =
          a.condition === 'above'
            ? t('rateAlerts.direction.above')
            : t('rateAlerts.direction.below');
        const status = a.is_active ? t('rateAlerts.active') : t('common.disabled');
        return `• ${a.from_currency}→${a.to_currency}: ${dir} ${a.target_rate} — ${status}`;
      }),
    ];
    onShareableMessageChange(lines.join('\n'));
  }, [inModal, onShareableMessageChange, rateAlerts, t]);

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
    const targetRate = parseFloat(formData.targetRate);
    if (isNaN(targetRate) || targetRate <= 0) {
      Alert.alert(t('error.invalidInput'), 'Please enter a valid target rate');
      return;
    }

    try {
      // Check if alert condition is already met
      const currentRate = await getCurrentRateForAlert(formData.fromCurrency, formData.toCurrency);
      const conditionAlreadyMet = checkIfConditionMet(currentRate, targetRate, formData.direction);

      if (conditionAlreadyMet && !editingAlertId) {
        // Show warning that condition is already met
        const shouldContinue = await new Promise<boolean>((resolve) => {
          Alert.alert(
            t('rateAlerts.conditionAlreadyMetTitle'),
            tWithParams('rateAlerts.conditionAlreadyMetMessage', {
              fromCurrency: formData.fromCurrency,
              toCurrency: formData.toCurrency,
              currentRate: formatGroupedNumber(currentRate, 4),
              targetRate: formatGroupedNumber(targetRate, 4),
              condition: t(`rateAlerts.direction.${formData.direction}`)
            }),
            [
              { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
              { text: t('rateAlerts.createAnyway'), onPress: () => resolve(true) }
            ]
          );
        });

        if (!shouldContinue) {
          return;
        }
      }

      if (editingAlertId) {
        // Update existing alert
        const success = await updateAlert(editingAlertId, {
          target_rate: targetRate,
          condition: formData.direction,
          is_active: formData.isActive,
        });

        if (!success) {
          Alert.alert(t('rateAlerts.error'), t('rateAlerts.updateFailed'));
          return;
        }
      } else {
        // Create new alert with selected currencies
        const success = await createAlert(formData.fromCurrency, formData.toCurrency, targetRate, formData.direction);
        if (!success) {
          Alert.alert(t('rateAlerts.error'), t('rateAlerts.createFailed'));
          return;
        }
      }

      setShowAlertModal(false);
      setEditingAlertId(null);
      onRatesUpdate();

      Alert.alert(t('rateAlerts.success'), t('rateAlerts.savedSuccessfully'));
    } catch (error) {
      console.error('Error saving alert:', error);
      Alert.alert('Error', 'Failed to save rate alert');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    Alert.alert(
      t('rateAlerts.deleteTitle'),
      t('rateAlerts.deleteMessage'),
      [
        { text: t('rateAlerts.cancelButton'), style: 'cancel' },
        {
          text: t('rateAlerts.deleteButton'),
          style: 'destructive',
          onPress: async () => {
            const success = await deleteAlert(alertId);
            if (!success) {
              Alert.alert(t('rateAlerts.error'), t('rateAlerts.deleteFailed'));
            }
            onRatesUpdate();
          }
        }
      ]
    );
  };

  const handleResetAlert = async (alertId: string) => {
    Alert.alert(
      t('rateAlerts.resetTitle'),
      t('rateAlerts.resetMessage'),
      [
        { text: t('rateAlerts.cancelButton'), style: 'cancel' },
        {
          text: t('rateAlerts.resetButton'),
          style: 'default',
          onPress: async () => {
            const success = await updateAlert(alertId, { notified: false, is_active: true });
            if (!success) {
              Alert.alert(t('rateAlerts.error'), t('rateAlerts.resetFailed'));
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
      Alert.alert(t('rateAlerts.error'), t('rateAlerts.updateStatusFailed'));
    }
    onRatesUpdate();
  };

  const getAlertStatusText = (alert: RateAlert): string => {
    if (alert.notified) return t('rateAlerts.status.notified');
    if (!alert.is_active) return t('rateAlerts.status.inactive');
    return t('rateAlerts.status.active');
  };

  const getAlertStatusColor = (alert: RateAlert): string => {
    if (alert.notified) return primaryColor;
    if (!alert.is_active) return textSecondaryColor;
    return successColor;
  };

  const getAlertStatusIcon = (
    alert: RateAlert
  ): keyof typeof Ionicons.glyphMap => {
    if (alert.notified) return "notifications-outline";
    if (!alert.is_active) return "pause-circle-outline";
    return "checkmark-circle-outline";
  };

  const getDirectionIcon = (
    condition: RateAlert["condition"]
  ): keyof typeof Ionicons.glyphMap =>
    condition === "above" ? "trending-up" : "trending-down";

  const getDirectionColor = (condition: RateAlert["condition"]) =>
    condition === "above" ? successColor : errorColor;

  const getCurrentRateForAlert = async (fromCurrency: string, toCurrency: string): Promise<number> => {
    try {
      const storage = getAsyncStorage();
      const cachedData = await storage.getItem('cachedExchangeRates');
      if (cachedData) {
        const data = JSON.parse(cachedData);
        const fromRate = data.conversion_rates[fromCurrency];
        const toRate = data.conversion_rates[toCurrency];

        if (fromRate && toRate) {
          return toRate / fromRate;
        }
      }
      throw new Error('No cached rates available');
    } catch (error) {
      console.error('Error getting current rate for alert:', error);
      throw error;
    }
  };

  const checkIfConditionMet = (currentRate: number, targetRate: number, direction: 'above' | 'below'): boolean => {
    const tolerance = 0.0001; // Small tolerance for floating point comparison

    switch (direction) {
      case 'above':
        return currentRate > targetRate + tolerance;
      case 'below':
        return currentRate < targetRate - tolerance;
      default:
        return false;
    }
  };

  const handleCreateAlert = () => {
    if (!user) {
      // Show auth prompt for non-authenticated users
      setShowAuthPrompt(true);
      return;
    }

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

  const selectedCount = selectedAlertIds.size;

  const uiStyles = useMemo(
    () =>
      StyleSheet.create({
        selectionToolbar: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: Layout.spaceSm,
        },
        selectionHint: {
          flex: 1,
          minWidth: 100,
          fontSize: 13,
          lineHeight: 18,
          color: textSecondaryColor,
        },
        selectionToolbarActions: {
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
        },
        linkBtn: { paddingVertical: 6, paddingHorizontal: 4 },
        linkBtnText: {
          fontSize: 13,
          fontWeight: "600",
          color: primaryColor,
        },
        topActionBar: {
          marginBottom: Layout.spaceSm,
          padding: Layout.spaceSm,
          borderRadius: Layout.radiusMd,
          backgroundColor: surfaceColor,
          borderWidth: 1,
          borderColor: hexToRgba(primaryColor, 0.3),
          gap: Layout.spaceSm,
        },
        topActionCount: {
          fontSize: 14,
          fontWeight: "600",
          color: textColor,
          lineHeight: 20,
        },
        topActionButtons: {
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
        },
        topActionBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: Layout.radiusSm,
          minHeight: 44,
        },
        topActionBtnLabel: {
          fontSize: 13,
          fontWeight: "600",
          flexShrink: 1,
          maxWidth: 96,
        },
        topActionBtnDanger: {
          backgroundColor: hexToRgba(errorColor, 0.12),
        },
        topActionBtnSecondary: {
          backgroundColor: hexToRgba(primaryColor, 0.1),
        },
        topActionBtnSuccess: {
          backgroundColor: hexToRgba(successColor, 0.12),
        },
        scrollContent: {
          paddingBottom: Layout.spaceLg,
          ...(inModal ? { paddingHorizontal: Layout.spaceMd } : {}),
        },
        listContent: {
          gap: Layout.spaceSm,
        },
        card: {
          backgroundColor: surfaceColor,
          borderRadius: Layout.radiusMd,
          borderWidth: 1,
          borderColor: hexToRgba(borderColor, 0.9),
          padding: Layout.spaceMd,
          overflow: "hidden",
        },
        alertCardRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: Layout.spaceSm,
        },
        alertCardBody: { flex: 1, minWidth: 0 },
        checkbox: {
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: hexToRgba(borderColor, 0.9),
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: surfaceColor,
          marginTop: 4,
        },
        checkboxSelected: {
          borderColor: primaryColor,
          backgroundColor: primaryColor,
        },
        cardSelected: {
          borderColor: primaryColor,
          borderWidth: 2,
          backgroundColor: hexToRgba(primaryColor, 0.06),
        },
        cardTop: {
          marginBottom: Layout.spaceSm,
        },
        flagsRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
          width: "100%",
        },
        pairBadge: {
          flexShrink: 1,
          backgroundColor: hexToRgba(primaryColor, 0.12),
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: Layout.radiusSm,
        },
        pairBadgeText: {
          fontSize: 12,
          fontWeight: "700",
          color: primaryColor,
          letterSpacing: 0.3,
        },
        directionChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: Layout.radiusSm,
          borderWidth: 1,
          alignSelf: "flex-start",
        },
        directionChipText: {
          fontSize: 12,
          fontWeight: "700",
        },
        targetBlock: {
          backgroundColor: hexToRgba(surfaceSecondaryColor, 0.65),
          borderRadius: Layout.radiusSm,
          borderWidth: 1,
          borderColor: hexToRgba(borderColor, 0.5),
          padding: Layout.spaceSm,
          marginBottom: Layout.spaceSm,
        },
        targetRow: {
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: Layout.spaceSm,
        },
        targetLeft: {
          flex: 1,
          minWidth: 0,
          flexDirection: "column",
          gap: 6,
        },
        targetLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: textSecondaryColor,
        },
        targetValue: {
          fontSize: inModal ? 20 : 22,
          fontWeight: "800",
          color: textColor,
          letterSpacing: -0.3,
          flexShrink: 0,
          textAlign: "right",
          maxWidth: "52%",
        },
        metaRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: Layout.spaceSm,
        },
        metaPill: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: Layout.radiusSm,
          borderWidth: 1,
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: "48%",
          minWidth: 0,
        },
        metaPillText: {
          fontSize: 12,
          fontWeight: "600",
          flexShrink: 1,
        },
        footerRow: {
          paddingTop: Layout.spaceXs,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: hexToRgba(borderColor, 0.6),
        },
        activePill: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          width: "100%",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: Layout.radiusSm,
          backgroundColor: hexToRgba(surfaceSecondaryColor, 0.8),
          borderWidth: 1,
          borderColor: hexToRgba(borderColor, 0.5),
        },
        activeLabel: {
          fontSize: 13,
          fontWeight: "600",
          color: textColor,
        },
        actionIconRow: {
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: Layout.spaceSm,
        },
        actionIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
        },
        createBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 11,
          borderRadius: Layout.radiusMd,
          alignSelf: "flex-start",
        },
        createBtnText: {
          fontSize: 14,
          fontWeight: "700",
          color: textInverseColor,
        },
        emptyWrap: {
          alignItems: "center",
          paddingVertical: Layout.spaceXl,
          paddingHorizontal: Layout.spaceMd,
          backgroundColor: hexToRgba(surfaceSecondaryColor, 0.5),
          borderRadius: Layout.radiusMd,
          borderWidth: 1,
          borderColor: hexToRgba(borderColor, 0.5),
          borderStyle: "dashed",
        },
        emptyIcon: {
          marginBottom: Layout.spaceSm,
          opacity: 0.45,
        },
        emptyText: {
          fontSize: 14,
          textAlign: "center",
          lineHeight: 21,
          color: textSecondaryColor,
        },
        modalCreateBar: {
          marginBottom: Layout.spaceSm,
        },
      }),
    [
      textSecondaryColor,
      primaryColor,
      textColor,
      textInverseColor,
      surfaceColor,
      surfaceSecondaryColor,
      borderColor,
      errorColor,
      successColor,
      inModal,
    ]
  );

  const toggleAlertSelection = (id: string) => {
    setSelectedAlertIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedAlertIds(new Set());

  const selectAllAlerts = () => {
    setSelectedAlertIds(new Set(rateAlerts.map((a) => a.id)));
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedAlertIds);
    if (ids.length === 0) return;
    Alert.alert(
      t("rateAlerts.deleteSelectedTitle"),
      tWithParams("rateAlerts.deleteSelectedMessage", { count: ids.length }),
      [
        { text: t("rateAlerts.cancelButton"), style: "cancel" },
        {
          text: t("saved.delete"),
          style: "destructive",
          onPress: async () => {
            setBulkBusy(true);
            try {
              for (const id of ids) {
                await deleteAlert(id);
              }
              clearSelection();
              onRatesUpdate();
            } finally {
              setBulkBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleResetSelected = () => {
    const ids = Array.from(selectedAlertIds);
    const notified = rateAlerts.filter(
      (a) => ids.includes(a.id) && a.notified
    );
    if (notified.length === 0) return;
    Alert.alert(
      t("rateAlerts.resetTitle"),
      tWithParams("rateAlerts.resetSelectedMessage", {
        count: notified.length,
      }),
      [
        { text: t("rateAlerts.cancelButton"), style: "cancel" },
        {
          text: t("rateAlerts.resetButton"),
          onPress: async () => {
            setBulkBusy(true);
            try {
              for (const a of notified) {
                await updateAlert(a.id, { notified: false, is_active: true });
              }
              clearSelection();
              onRatesUpdate();
            } finally {
              setBulkBusy(false);
            }
          },
        },
      ]
    );
  };

  const selectedAlerts = () =>
    rateAlerts.filter((a) => selectedAlertIds.has(a.id));

  const renderSelectionHeader = () => {
    if (!enableSelection || !user || rateAlerts.length === 0) return null;

    if (selectedCount > 0) {
      const selected = selectedAlerts();
      const canReset = selected.some((a) => a.notified);
      return (
        <View style={uiStyles.topActionBar}>
          <ThemedText style={uiStyles.topActionCount} numberOfLines={2}>
            {tWithParams("saved.selectedCount", { count: selectedCount })}
          </ThemedText>
          <View style={uiStyles.topActionButtons}>
            <TouchableOpacity
              style={[uiStyles.topActionBtn, uiStyles.topActionBtnDanger]}
              onPress={handleDeleteSelected}
              disabled={bulkBusy}
              accessibilityLabel={t("saved.delete")}
            >
              {bulkBusy ? (
                <ActivityIndicator size="small" color={errorColor} />
              ) : (
                <Ionicons name="trash-outline" size={20} color={errorColor} />
              )}
              <ThemedText
                style={[uiStyles.topActionBtnLabel, { color: errorColor }]}
                numberOfLines={1}
              >
                {t("saved.delete")}
              </ThemedText>
            </TouchableOpacity>
            {selectedCount === 1 ? (
              <>
                <TouchableOpacity
                  style={[uiStyles.topActionBtn, uiStyles.topActionBtnSecondary]}
                  onPress={() => handleEditAlert(selected[0])}
                  disabled={bulkBusy}
                  accessibilityLabel={t("rateAlerts.edit")}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={primaryColor}
                  />
                  <ThemedText
                    style={[uiStyles.topActionBtnLabel, { color: primaryColor }]}
                    numberOfLines={1}
                  >
                    {t("rateAlerts.editShort")}
                  </ThemedText>
                </TouchableOpacity>
                {selected[0].notified ? (
                  <TouchableOpacity
                    style={[uiStyles.topActionBtn, uiStyles.topActionBtnSuccess]}
                    onPress={() => handleResetAlert(selected[0].id)}
                    disabled={bulkBusy}
                    accessibilityLabel={t("rateAlerts.reset")}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={20}
                      color={successColor}
                    />
                    <ThemedText
                      style={[uiStyles.topActionBtnLabel, { color: successColor }]}
                      numberOfLines={1}
                    >
                      {t("rateAlerts.resetShort")}
                    </ThemedText>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : canReset ? (
              <TouchableOpacity
                style={[uiStyles.topActionBtn, uiStyles.topActionBtnSuccess]}
                onPress={handleResetSelected}
                disabled={bulkBusy}
                accessibilityLabel={t("rateAlerts.reset")}
              >
                <Ionicons name="refresh-outline" size={20} color={successColor} />
                <ThemedText
                  style={[uiStyles.topActionBtnLabel, { color: successColor }]}
                  numberOfLines={1}
                >
                  {t("rateAlerts.resetShort")}
                </ThemedText>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={uiStyles.linkBtn}
              onPress={clearSelection}
              disabled={bulkBusy}
            >
              <ThemedText
                style={[uiStyles.linkBtnText, { color: textSecondaryColor }]}
                numberOfLines={1}
              >
                {t("common.cancel")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={uiStyles.selectionToolbar}>
        <ThemedText style={uiStyles.selectionHint} numberOfLines={2}>
          {t("rateAlerts.tapToSelect")}
        </ThemedText>
        <View style={uiStyles.selectionToolbarActions}>
          <TouchableOpacity style={uiStyles.linkBtn} onPress={selectAllAlerts}>
            <ThemedText style={uiStyles.linkBtnText} numberOfLines={1}>
              {t("saved.selectAll")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCreateButton = (shortLabel: boolean) => (
    <TouchableOpacity
      style={[
        uiStyles.createBtn,
        { backgroundColor: successColor, shadowColor: successColor },
      ]}
      onPress={handleCreateAlert}
      accessibilityRole="button"
      accessibilityLabel={
        shortLabel ? t("rateAlerts.createButtonShort") : t("rateAlerts.createButton")
      }
    >
      <Ionicons name="add-circle-outline" size={20} color={textInverseColor} />
      <ThemedText style={uiStyles.createBtnText} numberOfLines={1}>
        {shortLabel ? t("rateAlerts.createButtonShort") : t("rateAlerts.createButton")}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderEmptyState = (message: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={uiStyles.emptyWrap}>
      <Ionicons
        name={icon}
        size={40}
        color={textSecondaryColor}
        style={uiStyles.emptyIcon}
      />
      <ThemedText style={uiStyles.emptyText}>{message}</ThemedText>
    </View>
  );

  const renderAlertCard = (alert: RateAlert) => {
    const isSelected = selectedAlertIds.has(alert.id);
    const statusColor = getAlertStatusColor(alert);
    const directionColor = getDirectionColor(alert.condition);
    const flagSize = inModal ? 24 : 28;
    const onCardPress = () => {
      if (enableSelection) {
        toggleAlertSelection(alert.id);
      } else {
        handleEditAlert(alert);
      }
    };

    return (
      <TouchableOpacity
        key={alert.id}
        activeOpacity={0.82}
        onPress={onCardPress}
        style={[uiStyles.card, isSelected && uiStyles.cardSelected]}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${alert.from_currency} ${alert.to_currency} ${getAlertStatusText(alert)}`}
      >
        <View style={enableSelection ? uiStyles.alertCardRow : undefined}>
          {enableSelection ? (
            <View
              style={[
                uiStyles.checkbox,
                isSelected && uiStyles.checkboxSelected,
              ]}
            >
              {isSelected ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : null}
            </View>
          ) : null}

          <View style={uiStyles.alertCardBody}>
            <View style={uiStyles.cardTop}>
              <View style={uiStyles.flagsRow}>
                <CurrencyFlag currency={alert.from_currency} size={flagSize} />
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={textSecondaryColor}
                />
                <CurrencyFlag currency={alert.to_currency} size={flagSize} />
                <View style={uiStyles.pairBadge}>
                  <ThemedText style={uiStyles.pairBadgeText} numberOfLines={1}>
                    {alert.from_currency}/{alert.to_currency}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={uiStyles.targetBlock}>
              <View style={uiStyles.targetRow}>
                <View style={uiStyles.targetLeft}>
                  <View
                    style={[
                      uiStyles.directionChip,
                      {
                        backgroundColor: hexToRgba(directionColor, 0.1),
                        borderColor: hexToRgba(directionColor, 0.28),
                      },
                    ]}
                  >
                    <Ionicons
                      name={getDirectionIcon(alert.condition)}
                      size={14}
                      color={directionColor}
                    />
                    <ThemedText
                      style={[
                        uiStyles.directionChipText,
                        { color: directionColor },
                      ]}
                      numberOfLines={1}
                    >
                      {t(`rateAlerts.direction.${alert.condition}`)}
                    </ThemedText>
                  </View>
                  <ThemedText style={uiStyles.targetLabel} numberOfLines={1}>
                    {t("rateAlerts.target")}
                  </ThemedText>
                </View>
                <ThemedText
                  style={uiStyles.targetValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {formatGroupedNumber(alert.target_rate, 6)}
                </ThemedText>
              </View>
            </View>

            <View style={uiStyles.metaRow}>
              <View
                style={[
                  uiStyles.metaPill,
                  {
                    backgroundColor: hexToRgba(statusColor, 0.1),
                    borderColor: hexToRgba(statusColor, 0.25),
                  },
                ]}
              >
                <Ionicons
                  name={getAlertStatusIcon(alert)}
                  size={14}
                  color={statusColor}
                />
                <ThemedText
                  style={[uiStyles.metaPillText, { color: statusColor }]}
                  numberOfLines={1}
                >
                  {getAlertStatusText(alert)}
                </ThemedText>
              </View>
              <View
                style={[
                  uiStyles.metaPill,
                  {
                    backgroundColor: hexToRgba(surfaceSecondaryColor, 0.9),
                    borderColor: hexToRgba(borderColor, 0.5),
                  },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={textSecondaryColor}
                />
                <ThemedText
                  style={[uiStyles.metaPillText, { color: textSecondaryColor }]}
                  numberOfLines={1}
                >
                  {formatDateDDMMYY(alert.created_at)}
                </ThemedText>
              </View>
            </View>

            <View style={uiStyles.footerRow}>
              <View
                style={uiStyles.activePill}
                onStartShouldSetResponder={() => true}
              >
                <ThemedText style={uiStyles.activeLabel} numberOfLines={1}>
                  {t("rateAlerts.active")}
                </ThemedText>
                <Switch
                  value={alert.is_active}
                  onValueChange={(value) =>
                    toggleAlertActive(alert.id, value)
                  }
                  disabled={alert.notified}
                  trackColor={{ false: borderColor, true: primaryColor }}
                  thumbColor={textInverseColor}
                />
              </View>
            </View>

            {!enableSelection ? (
              <View style={uiStyles.actionIconRow}>
                <TouchableOpacity
                  style={[
                    uiStyles.actionIcon,
                    {
                      backgroundColor: hexToRgba(primaryColor, 0.1),
                      borderColor: hexToRgba(primaryColor, 0.25),
                    },
                  ]}
                  onPress={() => handleEditAlert(alert)}
                  accessibilityLabel={t("rateAlerts.edit")}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={primaryColor}
                  />
                </TouchableOpacity>
                {alert.notified ? (
                  <TouchableOpacity
                    style={[
                      uiStyles.actionIcon,
                      {
                        backgroundColor: hexToRgba(successColor, 0.1),
                        borderColor: hexToRgba(successColor, 0.25),
                      },
                    ]}
                    onPress={() => handleResetAlert(alert.id)}
                    accessibilityLabel={t("rateAlerts.reset")}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={18}
                      color={successColor}
                    />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={[
                    uiStyles.actionIcon,
                    {
                      backgroundColor: hexToRgba(errorColor, 0.1),
                      borderColor: hexToRgba(errorColor, 0.25),
                    },
                  ]}
                  onPress={() => handleDeleteAlert(alert.id)}
                  accessibilityLabel={t("rateAlerts.delete")}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={errorColor}
                  />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAlertsScrollBody = () => (
    <>
      {inModal ? (
        <View style={uiStyles.modalCreateBar}>{renderCreateButton(true)}</View>
      ) : null}
      {renderSelectionHeader()}
      {!user ? (
        renderEmptyState(t("rateAlerts.signInPrompt"), "person-outline")
      ) : rateAlerts.length === 0 ? (
        renderEmptyState(t("rateAlerts.emptyState"), "notifications-outline")
      ) : (
        rateAlerts.map((alert) => renderAlertCard(alert))
      )}
    </>
  );

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, inModal && styles.containerInModal]}>
        {!inModal && (
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              {t('alerts.title')}
            </ThemedText>
            <View style={styles.headerActions}>
              {renderCreateButton(false)}
            </View>
            <ThemedText style={styles.subtitle}>
              {t('rateAlerts.loading')}
            </ThemedText>
          </View>
        )}

        <View
          style={[
            styles.alertsList,
            inModal && styles.alertsListInModal,
            uiStyles.scrollContent,
          ]}
        >
          {inModal ? (
            <View style={uiStyles.modalCreateBar}>{renderCreateButton(true)}</View>
          ) : null}
          <View style={uiStyles.emptyWrap}>
            <ActivityIndicator size="small" color={primaryColor} />
            <ThemedText style={[uiStyles.emptyText, { marginTop: Layout.spaceSm }]}>
              {t("rateAlerts.loading")}
            </ThemedText>
          </View>
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
            {tWithParams('rateAlerts.errorPrefix', { error })}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, inModal && styles.containerInModal]}>
      {!inModal && (
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            {t('alerts.title')}
          </ThemedText>
          <View style={styles.headerActions}>
            {renderCreateButton(false)}
          </View>
          {user && (
            <ThemedText style={styles.subtitle}>
              {tWithParams('rateAlerts.activeCount', { count: rateAlerts.filter(alert => alert.is_active).length })}
            </ThemedText>
          )}
        </View>
      )}

      <View
        style={[
          styles.alertsList,
          inModal && styles.alertsListInModal,
          uiStyles.scrollContent,
          rateAlerts.length > 0 ? uiStyles.listContent : null,
        ]}
      >
        {renderAlertsScrollBody()}
      </View>

      {/* Alert Configuration Modal */}
      <Modal
        visible={showAlertModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAlertModal(false)}
      >
        <View style={[{ backgroundColor: backgroundColor }, styles.modalContainer]}>
          <View style={[{ backgroundColor: surfaceColor, borderBottomColor: borderColor }, styles.modalTitleSection]}>
            <ThemedText type="subtitle" style={[{ color: textColor }, styles.modalTitle]}>
              {editingAlertId ? t('rateAlerts.editAlert') : t('rateAlerts.createAlert')}
            </ThemedText>
          </View>
          <View style={[{ backgroundColor: surfaceColor, borderBottomColor: borderColor }, styles.modalHeader]}>
            <TouchableOpacity
              onPress={() => setShowAlertModal(false)}
              style={[
                {
                  backgroundColor: surfaceSecondaryColor,
                  borderColor,
                  borderWidth: StyleSheet.hairlineWidth,
                },
                styles.cancelButton,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('rateAlerts.cancel')}
            >
              <Ionicons name="arrow-back" size={22} color={textSecondaryColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveAlert} style={[{ backgroundColor: successColor, shadowColor: successColor }, styles.saveButton]}>
              <ThemedText style={[{ color: textInverseColor }, styles.saveButtonText]}>{t('rateAlerts.save')}</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGroup}>
              <ThemedText style={[{ color: textColor }, styles.label]}>{t('rateAlerts.fromCurrency')}</ThemedText>
              <TouchableOpacity
                style={[{ backgroundColor: surfaceColor, borderColor: borderColor }, styles.currencySelector]}
                onPress={() => setShowFromCurrencyPicker(true)}
              >
                <View style={styles.currencySelectorContent}>
                  <CurrencyFlag currency={formData.fromCurrency} size={24} />
                  <ThemedText style={[{ color: textColor }, styles.currencySelectorText]}>
                    {formData.fromCurrency}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={18} color={textSecondaryColor} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={[{ color: textColor }, styles.label]}>{t('rateAlerts.toCurrency')}</ThemedText>
              <TouchableOpacity
                style={[{ backgroundColor: surfaceColor, borderColor: borderColor }, styles.currencySelector]}
                onPress={() => setShowToCurrencyPicker(true)}
              >
                <View style={styles.currencySelectorContent}>
                  <CurrencyFlag currency={formData.toCurrency} size={24} />
                  <ThemedText style={[{ color: textColor }, styles.currencySelectorText]}>
                    {formData.toCurrency}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={18} color={textSecondaryColor} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={[{ color: textColor }, styles.label]}>
                {tWithParams('rateAlerts.targetRate', { fromCurrency: formData.fromCurrency, toCurrency: formData.toCurrency })}
              </ThemedText>
              <AppTextInput
                style={[{ backgroundColor: surfaceColor, borderColor: borderColor, color: textColor }, styles.input]}
                value={formData.targetRate}
                onChangeText={(text) => setFormData({ ...formData, targetRate: text })}
                keyboardType="numeric"
                placeholder={tWithParams('rateAlerts.enterRate', { fromCurrency: formData.fromCurrency, toCurrency: formData.toCurrency })}
                placeholderTextColor={textSecondaryColor}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={[{ color: textColor }, styles.label]}>{t('rateAlerts.direction')}</ThemedText>
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
                        styles.directionButtonText,
                        {
                          color:
                            formData.direction === direction ? textInverseColor : textColor,
                        },
                      ]}
                    >
                      {t(`rateAlerts.direction.${direction}`)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <ThemedText style={[{ color: textColor }, styles.label]}>{t('rateAlerts.activateAlert')}</ThemedText>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                  trackColor={{ false: borderColor, true: primaryColor }}
                  thumbColor={textInverseColor}
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

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        title="Authorize to sync your data"
        message="Create an account to save and sync your rate alerts across devices"
        feature="alerts"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerInModal: {
    flex: 1,
    paddingTop: 0,
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
  debugButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  debugButtonText: {
    fontWeight: '600',
    fontSize: 12,
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
    padding: Layout.spaceMd,
  },
  alertsListInModal: {
    flex: 1,
    padding: 0,
    backgroundColor: "transparent",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
  alertCard: {
    borderRadius: Layout.radiusMd,
    padding: Layout.spaceMd,
    marginBottom: Layout.spaceSm,
    borderWidth: 1,
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
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
    minWidth: 35,
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
    gap: 6,
    flexWrap: 'wrap',
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
    minWidth: 50,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
    minWidth: 50,
  },
  deleteButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resetButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
    minWidth: 50,
  },
  resetButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalTitleSection: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCreateButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 0,
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
    fontSize: FormField.labelSize,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: FormField.radiusInput,
    paddingHorizontal: FormField.padH,
    paddingVertical: FormField.padV,
    fontSize: FormField.fontSize,
    fontWeight: FormField.fontWeight,
  },
  directionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  directionButton: {
    flex: 1,
    paddingVertical: FormField.padV,
    paddingHorizontal: FormField.padH,
    borderRadius: FormField.radiusInput,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  directionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencySelector: {
    borderWidth: 1,
    borderRadius: FormField.radiusInput,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
});