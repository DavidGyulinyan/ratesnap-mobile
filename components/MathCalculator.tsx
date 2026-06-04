import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CopyableDisplayField } from "./AppTextInput";
import { ThemedView } from "./themed-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useCalculatorHistory } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { shareLines } from "@/lib/shareText";
import type { QuickActionModalMenuItem } from "@/components/QuickActionModal";
import * as Haptics from "expo-haptics";
import {
  formatCalculatorMainDisplay,
  formatEmbeddedNumericTokens,
  formatGroupedNumber,
} from "@/lib/numberFormat";
import {
  appendCalculatorDigit,
  appendCalculatorOperator,
  applyAndroidPercent,
  evaluateCalculatorExpression,
  formatCalculatorExpressionForDisplay,
  roundCalculatorResult,
} from "@/lib/calculatorEvaluate";

const DISPLAY_DECIMALS = 10;

interface MathCalculatorProps {
  visible: boolean;
  onClose: () => void;
  onResult?: (result: number) => void;
  onAddToConverter?: (result: number) => void;
  autoCloseAfterCalculation?: boolean;
  inModal?: boolean; // Hide header when used inside DashboardModal
  /** Extra entries appended under the in-calculator menu (e.g. other app modals). */
  toolsMenuItems?: QuickActionModalMenuItem[];
}

const LOAN_HISTORY_ARROW = "\u2192";

/** Safe single-line label for calculator history (Supabase rows or local strings). */
function formatCalculatorHistoryDisplay(record: {
  expression?: unknown;
  result?: unknown;
  calculation_type?: string | null;
}): string {
  const rawExpr = record?.expression;
  const expression =
    typeof rawExpr === "string"
      ? rawExpr
      : rawExpr != null && rawExpr !== ""
        ? String(rawExpr)
        : "Unknown calculation";
  const trimExpr = expression.trim() || "Unknown calculation";
  const type = record?.calculation_type;

  if (type === "loan" || trimExpr.includes(LOAN_HISTORY_ARROW)) {
    return trimExpr;
  }
  if (trimExpr.includes("=")) {
    return trimExpr;
  }
  const r = record?.result;
  if (r != null && r !== "") {
    return `${trimExpr} = ${String(r)}`;
  }
  return trimExpr;
}

export default function MathCalculator({
  visible,
  onClose,
  onResult,
  onAddToConverter,
  autoCloseAfterCalculation = true,
  inModal = false,
  toolsMenuItems,
}: MathCalculatorProps) {
  const { user } = useAuth();
  const {
    calculatorHistory: supabaseHistory,
    saveCalculation,
    clearAllCalculations,
    loading: historyLoading,
  } = useCalculatorHistory();
  const { t } = useLanguage();
  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const surfaceSecondaryColor = useThemeColor({}, "surfaceSecondary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");
  const primaryColor = useThemeColor({}, "primary");
  const errorColor = useThemeColor({}, "error");
  const successColor = useThemeColor({}, "success");
  const textInverseColor = useThemeColor({}, "textInverse");

  /** Completed expression segments ending before the current entry (e.g. "12+3"). */
  const [expression, setExpression] = useState("");
  /** Number currently being entered (e.g. "4"). */
  const [entry, setEntry] = useState("");
  /** Shown equation line after "=" or while typing. */
  const [equation, setEquation] = useState("");
  const [justEvaluated, setJustEvaluated] = useState(false);

  const [calculationHistory, setCalculationHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [calcError, setCalcError] = useState(false);

  const { height } = useWindowDimensions();
  const isSmallScreen = height < 700;
  const isMediumScreen = height >= 700 && height < 800;

  // Sync local history with Supabase when logged in
  useEffect(() => {
    if (!visible || !user || historyLoading) return;

    if (supabaseHistory.length > 0) {
      const formattedHistory = supabaseHistory
        .filter((record): record is NonNullable<typeof record> => record != null)
        .map((record) => formatCalculatorHistoryDisplay(record));
      setCalculationHistory((prev) => {
        const merged = [...formattedHistory];
        prev.forEach((localCalc) => {
          if (!merged.includes(localCalc)) {
            merged.push(localCalc);
          }
        });
        return merged.slice(0, 15);
      });
    } else {
      setCalculationHistory([]);
    }
  }, [visible, user, supabaseHistory, historyLoading]);

  const getResponsiveValue = (small: number, medium: number, large: number) => {
    if (isSmallScreen) return small;
    if (isMediumScreen) return medium;
    return large;
  };
  const sidePad = getResponsiveValue(12, 16, 20);

  const safeHaptic = (kind: "light" | "success" | "error" = "light") => {
    try {
      if (kind === "success") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      if (kind === "error") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      void Haptics.selectionAsync();
    } catch {
      // ignore
    }
  };

  type CalcOperator = "+" | "-" | "*" | "/";

  const toCalcOperator = (nextOperation: string): CalcOperator => {
    if (nextOperation === "/") return "/";
    if (nextOperation === "*") return "*";
    if (nextOperation === "-") return "-";
    return "+";
  };

  const buildFullExpression = (expr: string, ent: string) => {
    if (!ent) return expr;
    return expr ? `${expr}${ent}` : ent;
  };

  const dismissError = () => {
    if (calcError) setCalcError(false);
  };

  const getEvalExpression = () => buildFullExpression(expression, entry);

  const getDisplayExpressionText = (): string => {
    const full = getEvalExpression();
    if (!full) return "";
    return formatCalculatorExpressionForDisplay(full);
  };

  const getLiveResult = (): number | null => {
    const evaluated = evaluateCalculatorExpression(getEvalExpression());
    if (evaluated === null) return null;
    return roundCalculatorResult(evaluated, DISPLAY_DECIMALS);
  };

  const stripGroupedNumber = (raw: string) =>
    raw.replace(/\s/g, "").replace(/,/g, "");

  const restoreFromHistory = (line: string) => {
    safeHaptic("light");
    dismissError();
    const eqIdx = line.lastIndexOf("=");
    if (eqIdx < 0) return;
    const resultPart = stripGroupedNumber(line.slice(eqIdx + 1));
    const result = parseFloat(resultPart);
    if (Number.isNaN(result)) return;
    setExpression("");
    setEntry(String(result));
    setEquation(line);
    setJustEvaluated(true);
    setShowHistory(false);
  };

  const inputNumber = (num: string) => {
    safeHaptic("light");
    dismissError();
    if (justEvaluated) {
      const nextEntry = appendCalculatorDigit("", num);
      setExpression("");
      setEntry(nextEntry);
      setJustEvaluated(false);
    } else {
      const nextEntry = appendCalculatorDigit(entry, num);
      setEntry(nextEntry);
    }
  };

  const inputOperation = (nextOperation: string) => {
    safeHaptic("light");
    dismissError();
    const op = toCalcOperator(nextOperation);

    if (justEvaluated) {
      const nextExpr = appendCalculatorOperator(entry, op);
      setExpression(nextExpr);
      setEntry("");
      setJustEvaluated(false);
      return;
    }

    const combined = buildFullExpression(expression, entry);
    const nextExpr = appendCalculatorOperator(combined, op);
    setExpression(nextExpr);
    setEntry("");
  };

  const performCalculation = async () => {
    safeHaptic("success");
    const full = getEvalExpression();
    const evaluated = evaluateCalculatorExpression(full);

    if (evaluated === null) {
      safeHaptic("error");
      setCalcError(true);
      return;
    }

    dismissError();
    const result = roundCalculatorResult(evaluated, DISPLAY_DECIMALS);
    const resultText = String(result);
    const displayExpr = getDisplayExpressionText();
    const fullEquation = `${displayExpr} = ${formatGroupedNumber(result, DISPLAY_DECIMALS)}`;

    setExpression("");
    setEntry(resultText);
    setEquation(fullEquation);
    setJustEvaluated(true);

    addToHistory(fullEquation);

    if (user && fullEquation.trim() !== "") {
      try {
        await saveCalculation(fullEquation, result, "basic", {
          roundingDecimalPlaces: DISPLAY_DECIMALS,
          expression: full,
        });
      } catch (error) {
        console.error("Error saving calculation to history:", error);
      }
    }

    if (onAddToConverter) {
      onAddToConverter(result);
      if (autoCloseAfterCalculation) {
        onClose();
        clear();
      }
    }
  };

  // History functions
  const addToHistory = (calculation: string) => {
    setCalculationHistory(prev => [calculation, ...prev.slice(0, 14)]); // Keep last 15 calculations
  };

  const clear = () => {
    safeHaptic("light");
    setExpression("");
    setEntry("");
    setEquation("");
    setJustEvaluated(false);
    dismissError();
  };

  const inputDecimal = () => {
    safeHaptic("light");
    dismissError();
    if (justEvaluated) {
      setExpression("");
      setEntry("0.");
      setJustEvaluated(false);
    } else {
      const nextEntry = appendCalculatorDigit(entry, ".");
      setEntry(nextEntry);
    }
  };

  const inputPercentage = () => {
    safeHaptic("light");
    dismissError();
    const applied = applyAndroidPercent(expression, entry);
    if (applied === null) {
      safeHaptic("error");
      setCalcError(true);
      return;
    }
    if (justEvaluated) {
      setJustEvaluated(false);
    }
    setExpression(applied.expression);
    setEntry(applied.entry);
  };

  const toggleSign = () => {
    safeHaptic("light");
    dismissError();
    const currentValue = parseFloat(entry);
    if (Number.isNaN(currentValue)) return;
    const nextEntry = String(-currentValue);
    if (justEvaluated) {
      setExpression("");
      setJustEvaluated(false);
    }
    setEntry(nextEntry);
  };

  const deleteLastDigit = () => {
    safeHaptic("light");
    dismissError();
    if (justEvaluated) {
      setEntry("");
      setEquation("");
      setJustEvaluated(false);
      return;
    }

    if (entry.length > 1) {
      setEntry(entry.slice(0, -1));
      return;
    }

    if (expression.length > 0) {
      const trimmed = expression.slice(0, -1);
      const lastOperand = trimmed.match(/([0-9]+\.?[0-9]*|\.[0-9]+)$/)?.[1] ?? "";
      const exprWithoutOperand = trimmed.slice(0, trimmed.length - lastOperand.length);
      setExpression(exprWithoutOperand);
      setEntry(lastOperand);
      return;
    }

    setEntry("");
  };

  const clearEntry = () => {
    safeHaptic("light");
    dismissError();
    setEntry("");
    setJustEvaluated(false);
  };

  const applyCurrentResult = () => {
    const result = parseFloat(entry);
    if (Number.isNaN(result)) return;
    safeHaptic("success");
    if (onAddToConverter) {
      onAddToConverter(result);
    } else if (onResult) {
      onResult(result);
    }
    onClose();
    clear();
  };

  const renderButton = (
    text: string,
    onPress: () => void,
    buttonType: string = "default",
    flex?: number,
    compact: boolean = false,
    onLongPress?: () => void
  ) => {
    const flexStyle = flex ? { flex } : {};
    let style: Record<string, unknown> = {
      ...styles.button,
      ...flexStyle,
      backgroundColor: surfaceColor,
      borderColor,
    };

    switch (buttonType) {
      case "operation":
        style = {
          ...styles.button,
          ...styles.operationButton,
          ...flexStyle,
          backgroundColor: primaryColor,
          borderColor: primaryColor,
        };
        break;
      case "clear":
        style = {
          ...styles.button,
          ...styles.clearButton,
          ...flexStyle,
          backgroundColor: errorColor,
          borderColor: errorColor,
        };
        break;
      case "delete":
        style = {
          ...styles.button,
          ...styles.deleteButton,
          ...flexStyle,
          backgroundColor: surfaceSecondaryColor,
          borderColor,
        };
        break;
      case "equals":
        style = {
          ...styles.button,
          ...styles.equalsButton,
          ...flexStyle,
          backgroundColor: successColor,
          borderColor: successColor,
        };
        break;
      case "scientific":
        style = {
          ...styles.button,
          ...styles.scientificButton,
          ...flexStyle,
        };
        break;
      case "financial":
        style = {
          ...styles.button,
          ...styles.financialButton,
          ...flexStyle,
        };
        break;
      case "advancedTool":
        style = {
          ...styles.button,
          ...flexStyle,
          backgroundColor: surfaceColor,
          borderColor,
        };
        break;
      case "utility":
        style = {
          ...styles.button,
          ...styles.utilityButton,
          ...flexStyle,
        };
        break;
      case "history":
        style = {
          ...styles.button,
          ...styles.historyButton,
          ...flexStyle,
        };
        break;
      default:
        break;
    }

    if (compact) {
      style = { ...style, ...styles.buttonCompact };
    }

    const renderButtonText = () => {
      switch (buttonType) {
        case "operation":
          return (
            <Text
              style={[styles.operationButtonText, compact && styles.operationButtonTextCompact]}
              numberOfLines={compact ? 1 : undefined}
              adjustsFontSizeToFit={compact}
              minimumFontScale={compact ? 0.55 : undefined}
            >
              {text}
            </Text>
          );
        case "clear":
          return (
            <Text
              style={[styles.clearButtonText, compact && styles.clearButtonTextCompact]}
              numberOfLines={compact ? 1 : undefined}
              adjustsFontSizeToFit={compact}
              minimumFontScale={compact ? 0.55 : undefined}
            >
              {text}
            </Text>
          );
        case "delete":
          return (
            <Ionicons
              name="backspace-outline"
              size={compact ? 22 : 26}
              color={textColor}
            />
          );
        case "equals":
          return (
            <Text
              style={[styles.equalsButtonText, compact && styles.equalsButtonTextCompact]}
              numberOfLines={compact ? 1 : undefined}
              adjustsFontSizeToFit={compact}
              minimumFontScale={compact ? 0.55 : undefined}
            >
              {text}
            </Text>
          );
        case "advancedTool":
          return (
            <Text
              style={[
                styles.buttonText,
                compact && styles.buttonTextCompact,
                { color: textColor },
              ]}
              numberOfLines={compact ? 1 : undefined}
              adjustsFontSizeToFit={compact}
              minimumFontScale={compact ? 0.55 : undefined}
            >
              {text}
            </Text>
          );
        case "financial":
        case "scientific":
        case "utility":
        case "history":
          return (
            <Text
              style={[styles.specialButtonText, compact && styles.specialButtonTextCompact]}
              numberOfLines={compact ? 1 : undefined}
              adjustsFontSizeToFit={compact}
              minimumFontScale={compact ? 0.55 : undefined}
            >
              {text}
            </Text>
          );
        default:
          return (
            <Text
              style={[styles.buttonText, compact && styles.buttonTextCompact, { color: textColor }]}
              numberOfLines={compact ? 1 : undefined}
              adjustsFontSizeToFit={compact}
              minimumFontScale={compact ? 0.55 : undefined}
            >
              {text}
            </Text>
          );
      }
    };

    return (
      <TouchableOpacity 
        style={style}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={onLongPress ? 320 : undefined}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        {renderButtonText()}
      </TouchableOpacity>
    );
  };

  const getEquationPreviewText = () => {
    if (calcError) return "";
    if (justEvaluated) {
      return formatEmbeddedNumericTokens(equation, DISPLAY_DECIMALS);
    }

    const displayExpr = getDisplayExpressionText();
    if (!displayExpr) return "";

    return formatEmbeddedNumericTokens(displayExpr, DISPLAY_DECIMALS);
  };

  const getMainValueText = () => {
    if (calcError) return t("calculator.error");

    if (justEvaluated) {
      return formatCalculatorMainDisplay(entry || "0");
    }

    const live = getLiveResult();
    const hasOperatorChain = /[+\-*/]/.test(expression);
    if (live !== null && hasOperatorChain) {
      return formatCalculatorMainDisplay(String(live));
    }

    return formatCalculatorMainDisplay(entry || "0");
  };

  const getDisplayFontSize = () => {
    const textLength = getMainValueText().length;
    if (textLength > 15) return getResponsiveValue(13, 15, 17);
    if (textLength > 10) return getResponsiveValue(16, 18, 21);
    return getResponsiveValue(24, 28, 32);
  };

  const buttonRowStyle = {
    marginBottom: getResponsiveValue(8, 12, 16),
    gap: getResponsiveValue(6, 8, 12),
  };

  const renderStandardKeypad = () => (
    <>
      <View style={[styles.buttonRow, buttonRowStyle]}>
        {renderButton(t("calculator.buttonC"), clear, "clear")}
        {renderButton(
          t("calculator.buttonBackspace"),
          deleteLastDigit,
          "delete",
          undefined,
          false,
          clearEntry
        )}
        {renderButton(t("calculator.buttonPercent"), inputPercentage)}
        {renderButton(
          t("calculator.buttonDivide"),
          () => inputOperation("/"),
          "operation"
        )}
      </View>
      <View style={[styles.buttonRow, buttonRowStyle]}>
        {renderButton("7", () => inputNumber("7"))}
        {renderButton("8", () => inputNumber("8"))}
        {renderButton("9", () => inputNumber("9"))}
        {renderButton(
          t("calculator.buttonMultiply"),
          () => inputOperation("*"),
          "operation"
        )}
      </View>
      <View style={[styles.buttonRow, buttonRowStyle]}>
        {renderButton("4", () => inputNumber("4"))}
        {renderButton("5", () => inputNumber("5"))}
        {renderButton("6", () => inputNumber("6"))}
        {renderButton(
          t("calculator.buttonSubtract"),
          () => inputOperation("-"),
          "operation"
        )}
      </View>
      <View style={[styles.buttonRow, buttonRowStyle]}>
        {renderButton("1", () => inputNumber("1"))}
        {renderButton("2", () => inputNumber("2"))}
        {renderButton("3", () => inputNumber("3"))}
        {renderButton(
          t("calculator.buttonAdd"),
          () => inputOperation("+"),
          "operation"
        )}
      </View>
      <View style={[styles.buttonRow, buttonRowStyle]}>
        {renderButton(
          "0",
          () => inputNumber("0"),
          "default",
          2,
          false,
          toggleSign
        )}
        {renderButton(t("calculator.buttonDecimal"), inputDecimal)}
        {renderButton(t("calculator.buttonEquals"), performCalculation, "equals")}
      </View>
    </>
  );

  const clearHistory = async () => {
    setCalculationHistory([]);
    if (!user) return;

    try {
      await clearAllCalculations();
    } catch (error) {
      console.error("Error clearing calculator history:", error);
    }
  };

  const HistoryView = () => {
    // Combine Supabase history with local history for display
    const displayHistory = user
      ? supabaseHistory
          .filter((record): record is NonNullable<typeof record> => record != null)
          .map((record) => formatCalculatorHistoryDisplay(record))
      : calculationHistory;

    return (
      <View
        style={[
          styles.historyContainer,
          { backgroundColor: surfaceSecondaryColor, borderColor, marginHorizontal: sidePad },
        ]}
      >
        <View style={styles.historyHeader}>
          <Text
            style={[styles.historyTitle, { color: textColor }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {t('calculator.calculationHistory')}
          </Text>
          {displayHistory.length > 0 && (
            <TouchableOpacity
              style={[styles.clearHistoryButton, { backgroundColor: errorColor, borderColor: errorColor }]}
              onPress={clearHistory}
              activeOpacity={0.8}
            >
              <Text
                style={styles.clearHistoryButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {t('calculator.clear')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView style={styles.historyList}>
          {displayHistory.length === 0 ? (
            <Text style={[styles.historyEmpty, { color: textSecondaryColor }]}>{t('calculator.noCalculations')}</Text>
          ) : (
            displayHistory.map((calc, index) => {
              const line =
                typeof calc === "string" ? calc : String(calc ?? "");
              return (
                <TouchableOpacity
                  key={`${line}-${index}`}
                  style={[
                    styles.historyItemRow,
                    { borderBottomColor: borderColor },
                  ]}
                  onPress={() => restoreFromHistory(line)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={line}
                >
                  <Text
                    style={[styles.historyItem, { color: textColor }]}
                    numberOfLines={2}
                  >
                    {formatEmbeddedNumericTokens(line, DISPLAY_DECIMALS)}
                  </Text>
                  <Ionicons
                    name="arrow-redo-outline"
                    size={16}
                    color={textSecondaryColor}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor }}
        edges={["top", "left", "right", "bottom"]}
      >
      <ThemedView style={[styles.container, { backgroundColor }]}>
        {!inModal && (
          <View style={[
            styles.header,
            {
              paddingTop: getResponsiveValue(20, 30, 40),
              paddingHorizontal: sidePad,
              marginBottom: getResponsiveValue(16, 24, 32),
            }
          ]}>
            <View style={styles.headerSide}>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: surfaceSecondaryColor,
                    borderColor,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={22} color={textSecondaryColor} />
              </TouchableOpacity>
            </View>
            <Text style={[
              styles.title,
              {
                fontSize: getResponsiveValue(20, 24, 28),
                color: textColor,
              }
            ]}>{t('calculator.title')}</Text>
            <View style={styles.headerSideRight}>
              <TouchableOpacity
                onPress={() => {
                  setShowHistory((v) => !v);
                  setShowQuickMenu(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={t("calculator.history")}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: showHistory
                      ? primaryColor
                      : surfaceSecondaryColor,
                    borderColor,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={22}
                  color={showHistory ? textInverseColor : textSecondaryColor}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowQuickMenu(true)}
                accessibilityRole="button"
                accessibilityLabel="Menu"
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: surfaceSecondaryColor,
                    borderColor,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons name="menu-outline" size={22} color={textSecondaryColor} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  void shareLines([
                    t("calculator.title"),
                    getEquationPreviewText() || getMainValueText(),
                  ])
                }
                accessibilityRole="button"
                accessibilityLabel={t("common.share")}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: surfaceSecondaryColor,
                    borderColor,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons name="share-outline" size={22} color={primaryColor} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Modal
          visible={showQuickMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQuickMenu(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowQuickMenu(false)}
            style={styles.menuBackdrop}
          >
            <View
              style={[
                styles.menuSheet,
                { backgroundColor: surfaceSecondaryColor, borderColor },
              ]}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  toggleSign();
                  setShowQuickMenu(false);
                }}
              >
                <Ionicons name="swap-vertical-outline" size={18} color={textSecondaryColor} />
                <Text style={[styles.menuItemText, { color: textColor }]}>
                  {t("calculator.buttonPlusMinus")}
                </Text>
              </TouchableOpacity>
              {(toolsMenuItems ?? []).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => {
                    setShowQuickMenu(false);
                    item.onPress();
                  }}
                >
                  <Ionicons name={item.icon} size={18} color={primaryColor} />
                  <Text style={[styles.menuItemText, { color: textColor }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={[
          styles.displayContainer,
          {
            paddingHorizontal: sidePad,
            marginBottom: getResponsiveValue(10, 12, 14),
          }
        ]}>
          <View style={[
            styles.display,
            {
              minHeight: getResponsiveValue(68, 78, 88),
              paddingVertical: getResponsiveValue(12, 14, 16),
              paddingHorizontal: getResponsiveValue(14, 16, 18),
              borderRadius: getResponsiveValue(12, 14, 16),
              backgroundColor: surfaceSecondaryColor,
              borderColor,
            }
          ]}>
            {getEquationPreviewText() ? (
              <CopyableDisplayField
                multiline
                numberOfLines={2}
                value={getEquationPreviewText()}
                style={[
                  styles.equationText,
                  styles.copyableDisplayInput,
                  { color: textSecondaryColor },
                ]}
              />
            ) : null}
            <CopyableDisplayField
              multiline
              numberOfLines={4}
              value={getMainValueText()}
              style={[
                styles.displayText,
                styles.copyableDisplayInput,
                {
                  fontSize: getDisplayFontSize(),
                  lineHeight: getDisplayFontSize() * 1.15,
                  color: calcError ? errorColor : textColor,
                  textAlign: "right",
                },
              ]}
            />
          </View>
        </View>

        {(onAddToConverter || onResult) && (
          <View style={[styles.toolbar, { paddingHorizontal: sidePad }]}>
            <TouchableOpacity
              style={[
                styles.applyResultButton,
                { backgroundColor: successColor, borderColor: successColor },
              ]}
              onPress={applyCurrentResult}
              disabled={entry === "" || Number.isNaN(parseFloat(entry))}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={
                onAddToConverter
                  ? t("calculator.addToConverter")
                  : t("calculator.applyResult")
              }
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color={textInverseColor}
              />
              <Text
                style={[styles.applyResultText, { color: textInverseColor }]}
                numberOfLines={1}
              >
                {onAddToConverter
                  ? t("calculator.addToConverter")
                  : t("calculator.applyResult")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.mainColumn}>
          {showHistory ? <HistoryView /> : null}

          <View
            style={[styles.buttonGrid, { paddingHorizontal: sidePad }]}
          >
            {renderStandardKeypad()}
          </View>
        </View>
      </ThemedView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 0,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  headerSide: {
    width: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerSideRight: {
    width: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: "#ffffff",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  displayContainer: {
    paddingHorizontal: 0,
  },
  display: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.28)",
    elevation: 4,
  },
  displayText: {
    color: "#ffffff",
    fontWeight: "300",
    textAlign: "right",
    letterSpacing: 0.35,
    includeFontPadding: false,
  },
  equationText: {
    width: "100%",
    textAlign: "right",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginBottom: 6,
    includeFontPadding: false,
  },
  displayError: {
    width: "100%",
    textAlign: "right",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    includeFontPadding: false,
  },
  livePreviewLabel: {
    width: "100%",
    textAlign: "right",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    includeFontPadding: false,
  },
  quickToolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: "600",
    includeFontPadding: false,
  },
  mainColumn: {
    flex: 1,
    minHeight: 0,
  },
  applyResultButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    width: "100%",
  },
  applyResultText: {
    fontSize: 15,
    fontWeight: "700",
    includeFontPadding: false,
  },
  copyableDisplayInput: {
    width: "100%",
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 72,
    paddingRight: 14,
  },
  menuSheet: {
    width: 260,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "600",
    includeFontPadding: false,
  },
  toolbar: {
    paddingHorizontal: 0,
    paddingVertical: 2,
    marginBottom: 8,
  },
  toolbarRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    rowGap: 10,
  },
  toolbarIconButton: {
    width: 52,
    height: 52,
    minWidth: 52,
    minHeight: 52,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
  },
  optionsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  optionsTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  optionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  optionButtonActive: {
    backgroundColor: "rgba(63, 63, 70, 0.35)",
    borderColor: "rgba(82, 82, 91, 0.9)",
  },
  optionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  optionButtonTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  historyContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    maxHeight: 200,
    overflow: "hidden",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
    minWidth: 0,
  },
  historyTitle: {
    flex: 1,
    minWidth: 0,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    paddingRight: 4,
  },
  clearHistoryButton: {
    flexShrink: 0,
    backgroundColor: "rgba(63, 63, 70, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(63, 63, 70, 0.65)",
    maxWidth: "42%",
  },
  clearHistoryButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    includeFontPadding: false,
  },
  historyList: {
    maxHeight: 120,
  },
  historyEmpty: {
    color: "#8e8e93",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  historyItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyItem: {
    flex: 1,
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    includeFontPadding: false,
  },
  buttonGrid: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
  },
  button: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.25)",
    elevation: 3,
    minHeight: 50,
  },
  buttonCompact: {
    paddingVertical: 6,
    paddingHorizontal: 3,
    minHeight: 34,
    borderRadius: 10,
    elevation: 1,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "400",
    includeFontPadding: false,
  },
  buttonTextCompact: {
    fontSize: 14,
    fontWeight: "500",
  },
  operationButton: {
    backgroundColor: "rgba(82, 82, 91, 0.92)",
    borderColor: "rgba(82, 82, 91, 0.65)",
  },
  operationButtonText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "600",
    includeFontPadding: false,
  },
  operationButtonTextCompact: {
    fontSize: 17,
  },
  clearButton: {
    backgroundColor: "rgba(64, 64, 64, 0.9)",
    borderColor: "rgba(64, 64, 64, 0.65)",
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
    includeFontPadding: false,
  },
  clearButtonTextCompact: {
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: "rgba(142, 142, 147, 0.8)",
    borderColor: "rgba(142, 142, 147, 0.5)",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
    includeFontPadding: false,
  },
  deleteButtonTextCompact: {
    fontSize: 14,
  },
  equalsButton: {
    backgroundColor: "rgba(82, 82, 91, 0.88)",
    borderColor: "rgba(82, 82, 91, 0.6)",
  },
  equalsButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    includeFontPadding: false,
    textAlign: "center",
  },
  equalsButtonTextCompact: {
    fontSize: 14,
  },
  scientificButton: {
    backgroundColor: "rgba(82, 82, 91, 0.88)",
    borderColor: "rgba(82, 82, 91, 0.58)",
  },
  financialButton: {
    backgroundColor: "rgba(82, 82, 91, 0.88)",
    borderColor: "rgba(82, 82, 91, 0.58)",
  },
  utilityButton: {
    backgroundColor: "rgba(82, 82, 91, 0.88)",
    borderColor: "rgba(82, 82, 91, 0.58)",
  },
  historyButton: {
    backgroundColor: "rgba(82, 82, 91, 0.88)",
    borderColor: "rgba(82, 82, 91, 0.58)",
  },
  specialButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    includeFontPadding: false,
    textAlign: "center",
  },
  specialButtonTextCompact: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 1,
  },
  advancedPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  advancedPanelBelowKeypad: {
    marginTop: 4,
  },
  advancedSectionBlock: {
    marginBottom: 14,
  },
  advancedSectionBlockLast: {
    marginBottom: 0,
  },
  advancedPanelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  advancedPanelTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  advancedPanelTitle: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  advancedSectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.15,
    marginBottom: 8,
    marginTop: 0,
  },
});
