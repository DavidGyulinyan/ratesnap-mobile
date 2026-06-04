import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./themed-text";
import CurrencyFlag from "./CurrencyFlag";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSavedRates } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTimeDDMMYY } from "@/lib/dateFormat";
import { crossRateForPair } from "@/lib/exchangeRateResolve";
import type { CachedExchangeRates } from "@/lib/liveExchangeRates";
import { formatGroupedNumber } from "@/lib/numberFormat";
import {
  formatSavedConversionAmount,
  resolveSavedConversionAmounts,
} from "@/lib/savedRateFormat";
import { Layout, hexToRgba } from "@/constants/theme";

interface SavedRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  from_amount?: number | null;
  to_amount?: number | null;
  created_at: string;
  updated_at: string;
}

interface SavedRatesProps {
  savedRates?: SavedRate[];
  showSavedRates: boolean;
  onToggleVisibility: () => void;
  onSelectRate?: (from: string, to: string) => void;
  onDeleteRate?: (id: string | number) => void;
  onDeleteAll?: () => void;
  showMoreEnabled?: boolean;
  onShowMore?: () => void;
  maxVisibleItems?: number;
  containerStyle?: object;
  title?: string;
  inModal?: boolean;
  forceUseHook?: boolean;
  /** Tap cards to select; shows action bar (delete, open converter). Default: true in modal. */
  enableSelection?: boolean;
  showDeleteButtons?: boolean;
  onShareableMessageChange?: (message: string | null) => void;
  ratesData?: Pick<
    CachedExchangeRates,
    "conversion_rates" | "cba_conversion_rates"
  > | null;
}

export default function SavedRates({
  savedRates: propSavedRates,
  showSavedRates,
  onToggleVisibility,
  onSelectRate,
  onDeleteRate,
  onDeleteAll,
  showMoreEnabled = false,
  onShowMore,
  maxVisibleItems = 10,
  containerStyle,
  title,
  inModal = false,
  forceUseHook = false,
  enableSelection: enableSelectionProp,
  showDeleteButtons = false,
  onShareableMessageChange,
  ratesData,
}: SavedRatesProps) {
  const { t, tWithParams } = useLanguage();
  const enableSelection = enableSelectionProp ?? inModal;
  const { user } = useAuth();
  const { savedRates: hookSavedRates, deleteRate, loading } = useSavedRates();

  const surfaceColor = useThemeColor({}, "surface");
  const surfaceSecondaryColor = useThemeColor({}, "surfaceSecondary");
  const borderColor = useThemeColor({}, "border");
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const errorColor = useThemeColor({}, "error");

  const savedRates = forceUseHook
    ? hookSavedRates
    : propSavedRates || (user ? hookSavedRates : []);

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(
        savedRates.map((r) => r.id).filter((id) => prev.has(id))
      );
      return valid.size === prev.size ? prev : valid;
    });
  }, [savedRates]);

  const displayTitle = title || `⭐ ${t("saved.shortTitle")}`;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginTop: inModal ? 0 : 20,
          marginBottom: inModal ? 0 : 20,
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: Layout.spaceSm,
        },
        title: {
          fontSize: 16,
          fontWeight: "600",
          color: textColor,
        },
        toggle: {
          fontSize: 15,
          fontWeight: "600",
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        list: {
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
        cardTop: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: Layout.spaceSm,
        },
        flagsRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flex: 1,
          flexShrink: 1,
          minWidth: 0,
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
        openHint: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: hexToRgba(primaryColor, 0.1),
          alignItems: "center",
          justifyContent: "center",
        },
        conversionBlock: {
          marginBottom: Layout.spaceSm,
        },
        conversionRow: {
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          width: "100%",
        },
        amountFrom: {
          fontSize: inModal ? 20 : 17,
          fontWeight: "700",
          color: textColor,
        },
        amountTo: {
          fontSize: inModal ? 20 : 17,
          fontWeight: "700",
          color: primaryColor,
        },
        conversionArrow: {
          fontSize: 18,
          fontWeight: "600",
          color: textSecondaryColor,
        },
        noAmount: {
          fontSize: 14,
          color: textSecondaryColor,
          fontStyle: "italic",
          lineHeight: 20,
        },
        statsRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: Layout.spaceSm,
        },
        statPill: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: surfaceSecondaryColor,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: Layout.radiusSm,
          borderWidth: 1,
          borderColor: hexToRgba(borderColor, 0.6),
        },
        statPillLiveUp: {
          backgroundColor: hexToRgba("#16a34a", 0.1),
          borderColor: hexToRgba("#16a34a", 0.25),
        },
        statPillLiveDown: {
          backgroundColor: hexToRgba(errorColor, 0.08),
          borderColor: hexToRgba(errorColor, 0.2),
        },
        statLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: textSecondaryColor,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        },
        statValue: {
          fontSize: 13,
          fontWeight: "700",
          color: textColor,
        },
        statValueUp: { color: "#16a34a" },
        statValueDown: { color: errorColor },
        footer: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        footerText: {
          fontSize: 12,
          color: textSecondaryColor,
        },
        deleteBtn: {
          position: "absolute",
          top: Layout.spaceSm,
          right: Layout.spaceSm,
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: hexToRgba(errorColor, 0.1),
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: hexToRgba(errorColor, 0.2),
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
        loadingWrap: {
          paddingVertical: Layout.spaceXl,
          alignItems: "center",
          gap: Layout.spaceSm,
        },
        loadingText: {
          fontSize: 14,
          color: textSecondaryColor,
        },
        panel: {
          borderWidth: inModal ? 0 : 2,
          borderRadius: Layout.radiusLg,
          padding: inModal ? 0 : Layout.spaceMd,
          borderColor: primaryColor,
        },
        showMoreBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginTop: Layout.spaceMd,
          paddingVertical: 12,
          borderRadius: Layout.radiusMd,
          borderWidth: 1,
          borderColor: hexToRgba(primaryColor, 0.35),
          backgroundColor: hexToRgba(primaryColor, 0.06),
        },
        showMoreText: {
          fontSize: 14,
          fontWeight: "600",
          color: primaryColor,
        },
        selectionToolbar: {
          marginBottom: Layout.spaceSm,
          gap: Layout.spaceSm,
        },
        selectionHint: {
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
        linkBtn: {
          paddingVertical: 6,
          paddingHorizontal: 4,
        },
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
        },
        cardSelected: {
          borderColor: primaryColor,
          borderWidth: 2,
          backgroundColor: hexToRgba(primaryColor, 0.06),
        },
        cardRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: Layout.spaceSm,
        },
        cardBody: {
          flex: 1,
          minWidth: 0,
        },
        checkbox: {
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: hexToRgba(borderColor, 0.9),
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
          backgroundColor: surfaceColor,
        },
        checkboxSelected: {
          borderColor: primaryColor,
          backgroundColor: primaryColor,
        },
        openBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: hexToRgba(primaryColor, 0.1),
          alignItems: "center",
          justifyContent: "center",
        },
        topActionBtnSecondary: {
          backgroundColor: hexToRgba(primaryColor, 0.1),
        },
        topActionBtnDanger: {
          backgroundColor: hexToRgba(errorColor, 0.12),
        },
      }),
    [
      inModal,
      surfaceColor,
      surfaceSecondaryColor,
      borderColor,
      primaryColor,
      textColor,
      textSecondaryColor,
      errorColor,
    ]
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectAllVisible = (rates: SavedRate[]) => {
    setSelectedIds(new Set(rates.map((r) => r.id)));
  };

  const runDeleteById = async (id: string): Promise<boolean> => {
    if (onDeleteRate) {
      await onDeleteRate(id);
      return true;
    }
    setDeletingId(id);
    try {
      return await deleteRate(id);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmAndDeleteOne = (id: string) => {
    Alert.alert(
      t("saved.deleteRateTitle"),
      t("saved.deleteRateMessage"),
      [
        { text: t("saved.deleteRateCancel"), style: "cancel" },
        {
          text: t("saved.deleteRateConfirm"),
          style: "destructive",
          onPress: () => void runDeleteById(id).then(() => clearSelection()),
        },
      ]
    );
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    Alert.alert(
      t("saved.deleteSelectedTitle"),
      tWithParams("saved.deleteSelectedMessage", { count: ids.length }),
      [
        { text: t("saved.deleteRateCancel"), style: "cancel" },
        {
          text: t("saved.delete"),
          style: "destructive",
          onPress: async () => {
            setBulkDeleting(true);
            try {
              for (const id of ids) {
                await runDeleteById(id);
              }
              clearSelection();
            } finally {
              setBulkDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenSelected = (rates: SavedRate[]) => {
    const selected = rates.filter((r) => selectedIds.has(r.id));
    if (selected.length !== 1 || !onSelectRate) return;
    const rate = selected[0];
    onSelectRate(rate.from_currency, rate.to_currency);
    clearSelection();
  };

  const formatRateChange = (saved: number, live: number): string | null => {
    if (!Number.isFinite(saved) || saved <= 0 || !Number.isFinite(live)) {
      return null;
    }
    const pct = ((live - saved) / saved) * 100;
    const sign = pct >= 0 ? "+" : "";
    return `${sign}${pct.toFixed(2)}%`;
  };

  const liveRateForPair = (from: string, to: string): number | null => {
    if (!ratesData?.conversion_rates) return null;
    return crossRateForPair(from, to, ratesData);
  };

  useEffect(() => {
    if (!inModal || !onShareableMessageChange) return;
    const list = forceUseHook
      ? hookSavedRates
      : propSavedRates || (user ? hookSavedRates : []);
    if (!list.length) {
      onShareableMessageChange(null);
      return;
    }
    const lines = [
      t("saved.title"),
      ...list.map((r) => {
        const saved = Number(r.rate);
        const live = liveRateForPair(r.from_currency, r.to_currency);
        const savedStr = formatGroupedNumber(saved, 4);
        const conversion = formatSavedConversionAmount(r);
        let line = `• ${r.from_currency} → ${r.to_currency}: ${savedStr}`;
        if (conversion) line += ` — ${conversion}`;
        if (live != null) {
          const change = formatRateChange(saved, live);
          line += ` (${t("saved.now")}: ${formatGroupedNumber(live, 4)}`;
          if (change) line += `, ${change}`;
          line += ")";
        }
        return line;
      }),
    ];
    onShareableMessageChange(lines.join("\n"));
  }, [
    inModal,
    onShareableMessageChange,
    forceUseHook,
    hookSavedRates,
    propSavedRates,
    user,
    t,
    ratesData,
  ]);

  const handleDeleteRate = (id: string) => {
    confirmAndDeleteOne(id);
  };

  const renderSavedRateItem = (rate: SavedRate, index: number) => {
    const saved = Number(rate.rate);
    const live = liveRateForPair(rate.from_currency, rate.to_currency);
    const change = live != null ? formatRateChange(saved, live) : null;
    const changeUp = change != null && live != null && live >= saved;
    const amounts = resolveSavedConversionAmounts(rate);
    const isSelected = selectedIds.has(rate.id);

    const onCardPress = () => {
      if (enableSelection) {
        toggleSelection(rate.id);
      } else if (onSelectRate) {
        onSelectRate(rate.from_currency, rate.to_currency);
      }
    };

    return (
      <TouchableOpacity
        key={rate.id || index}
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={onCardPress}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={
          amounts
            ? `${formatGroupedNumber(amounts.from)} ${rate.from_currency} to ${formatGroupedNumber(amounts.to)} ${rate.to_currency}`
            : `${rate.from_currency} to ${rate.to_currency}`
        }
      >
        {showDeleteButtons && !enableSelection ? (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteRate(rate.id)}
            disabled={deletingId === rate.id}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t("saved.deleteRateConfirm")}
          >
            {deletingId === rate.id ? (
              <ActivityIndicator size="small" color={errorColor} />
            ) : (
              <Ionicons name="trash-outline" size={16} color={errorColor} />
            )}
          </TouchableOpacity>
        ) : null}

        <View style={enableSelection ? styles.cardRow : undefined}>
          {enableSelection ? (
            <View
              style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected,
              ]}
            >
              {isSelected ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : null}
            </View>
          ) : null}

          <View style={enableSelection ? styles.cardBody : undefined}>
            <View style={styles.cardTop}>
              <View style={styles.flagsRow}>
                <CurrencyFlag currency={rate.from_currency} size={28} />
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={textSecondaryColor}
                />
                <CurrencyFlag currency={rate.to_currency} size={28} />
                <View style={styles.pairBadge}>
                  <ThemedText style={styles.pairBadgeText}>
                    {rate.from_currency}/{rate.to_currency}
                  </ThemedText>
                </View>
              </View>
              {onSelectRate && enableSelection ? (
                <TouchableOpacity
                  style={styles.openBtn}
                  onPress={() =>
                    onSelectRate(rate.from_currency, rate.to_currency)
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t("saved.openInConverter")}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={18}
                    color={primaryColor}
                  />
                </TouchableOpacity>
              ) : onSelectRate && !enableSelection ? (
                <View style={styles.openHint}>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={primaryColor}
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.conversionBlock}>
              {amounts ? (
                <View style={styles.conversionRow}>
                  <ThemedText style={styles.amountFrom}>
                    {`${formatGroupedNumber(amounts.from)} ${rate.from_currency}`}
                  </ThemedText>
                  <ThemedText style={styles.conversionArrow}>→</ThemedText>
                  <ThemedText style={styles.amountTo}>
                    {`${formatGroupedNumber(amounts.to)} ${rate.to_currency}`}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.noAmount}>
                  {t("saved.noConversionAmount")}
                </ThemedText>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <ThemedText style={styles.statLabel}>
                  {t("saved.pairAt")}
                </ThemedText>
                <ThemedText style={styles.statValue}>
                  {formatGroupedNumber(saved, 4)}
                </ThemedText>
              </View>
              {live != null ? (
                <View
                  style={[
                    styles.statPill,
                    changeUp ? styles.statPillLiveUp : styles.statPillLiveDown,
                  ]}
                >
                  <Ionicons
                    name={changeUp ? "trending-up" : "trending-down"}
                    size={14}
                    color={changeUp ? "#16a34a" : errorColor}
                  />
                  <ThemedText style={styles.statLabel}>
                    {t("saved.now")}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.statValue,
                      changeUp ? styles.statValueUp : styles.statValueDown,
                    ]}
                  >
                    {formatGroupedNumber(live, 4)}
                    {change ? ` ${change}` : ""}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={styles.footer}>
              <Ionicons
                name="time-outline"
                size={14}
                color={textSecondaryColor}
              />
              <ThemedText style={styles.footerText}>
                {formatDateTimeDDMMYY(rate.created_at)}
              </ThemedText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const selectedCount = selectedIds.size;

  const visibleRates =
    showMoreEnabled && savedRates.length > maxVisibleItems
      ? savedRates.slice(0, maxVisibleItems)
      : savedRates;

  if (loading) {
    return (
      <View style={[styles.section, containerStyle]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={primaryColor} />
          <ThemedText style={styles.loadingText}>
            {t("saved.loadingText")}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.section, containerStyle]}>
      {!inModal && (
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            {displayTitle} ({savedRates.length})
          </ThemedText>
          {savedRates.length > 0 && (
            <TouchableOpacity onPress={onToggleVisibility}>
              <ThemedText
                style={[
                  styles.toggle,
                  { color: showSavedRates ? primaryColor : textColor },
                ]}
              >
                {showSavedRates ? t("saved.hideIcon") : `▶ ${t("common.more")}`}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}

      {showSavedRates && (
        <View style={styles.panel}>
          {savedRates.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons
                name="bookmark-outline"
                size={40}
                color={textSecondaryColor}
                style={styles.emptyIcon}
              />
              <ThemedText style={styles.emptyText}>
                {!user ? t("saved.signInPrompt") : t("saved.emptyState")}
              </ThemedText>
            </View>
          ) : (
            <>
              {enableSelection ? (
                selectedCount > 0 ? (
                  <View style={styles.topActionBar}>
                    <ThemedText
                      style={styles.topActionCount}
                      numberOfLines={2}
                    >
                      {tWithParams("saved.selectedCount", {
                        count: selectedCount,
                      })}
                    </ThemedText>
                    <View style={styles.topActionButtons}>
                      <TouchableOpacity
                        style={[
                          styles.topActionBtn,
                          styles.topActionBtnDanger,
                        ]}
                        onPress={handleDeleteSelected}
                        disabled={bulkDeleting}
                        accessibilityRole="button"
                        accessibilityLabel={t("saved.delete")}
                      >
                        {bulkDeleting ? (
                          <ActivityIndicator
                            size="small"
                            color={errorColor}
                          />
                        ) : (
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color={errorColor}
                          />
                        )}
                        <ThemedText
                          style={[
                            styles.topActionBtnLabel,
                            { color: errorColor },
                          ]}
                          numberOfLines={1}
                        >
                          {t("saved.delete")}
                        </ThemedText>
                      </TouchableOpacity>
                      {selectedCount === 1 && onSelectRate ? (
                        <TouchableOpacity
                          style={[
                            styles.topActionBtn,
                            styles.topActionBtnSecondary,
                          ]}
                          onPress={() => handleOpenSelected(visibleRates)}
                          disabled={bulkDeleting}
                          accessibilityRole="button"
                          accessibilityLabel={t("saved.openInConverter")}
                        >
                          <Ionicons
                            name="swap-horizontal"
                            size={20}
                            color={primaryColor}
                          />
                          <ThemedText
                            style={[
                              styles.topActionBtnLabel,
                              { color: primaryColor },
                            ]}
                            numberOfLines={1}
                          >
                            {t("saved.openInConverterShort")}
                          </ThemedText>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity
                        style={styles.linkBtn}
                        onPress={clearSelection}
                        disabled={bulkDeleting}
                        accessibilityRole="button"
                        accessibilityLabel={t("common.cancel")}
                      >
                        <ThemedText
                          style={[
                            styles.linkBtnText,
                            { color: textSecondaryColor },
                          ]}
                          numberOfLines={1}
                        >
                          {t("common.cancel")}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.selectionToolbar}>
                    <ThemedText
                      style={styles.selectionHint}
                      numberOfLines={2}
                    >
                      {t("saved.tapToSelect")}
                    </ThemedText>
                    <View style={styles.selectionToolbarActions}>
                      <TouchableOpacity
                        style={styles.linkBtn}
                        onPress={() => selectAllVisible(visibleRates)}
                        accessibilityRole="button"
                        accessibilityLabel={t("saved.selectAll")}
                      >
                        <ThemedText
                          style={styles.linkBtnText}
                          numberOfLines={1}
                        >
                          {t("saved.selectAll")}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              ) : null}

              <View style={styles.list}>
                {visibleRates.map((rate, index) =>
                  renderSavedRateItem(rate, index)
                )}
              </View>

              {showMoreEnabled && savedRates.length > maxVisibleItems && (
                <TouchableOpacity
                  style={styles.showMoreBtn}
                  onPress={onShowMore}
                  activeOpacity={0.85}
                >
                  <ThemedText style={styles.showMoreText}>
                    {t("common.showMore").replace(
                      "more",
                      `${savedRates.length} ${t("saved.rates")}`
                    )}
                  </ThemedText>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={primaryColor}
                  />
                </TouchableOpacity>
              )}

            </>
          )}
        </View>
      )}
    </View>
  );
}
