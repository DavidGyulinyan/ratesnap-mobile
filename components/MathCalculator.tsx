import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, useWindowDimensions, ScrollView } from "react-native";
import { ThemedView } from "./themed-view";
import { useCalculatorHistory } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";

interface MathCalculatorProps {
  visible: boolean;
  onClose: () => void;
  onResult?: (result: number) => void;
  onAddToConverter?: (result: number) => void;
  autoCloseAfterCalculation?: boolean;
  inModal?: boolean; // Hide header when used inside DashboardModal
}

export default function MathCalculator({
  visible,
  onClose,
  onResult,
  onAddToConverter,
  autoCloseAfterCalculation = true,
  inModal = false,
}: MathCalculatorProps) {
  const { user } = useAuth();
  const { calculatorHistory: supabaseHistory, saveCalculation, loading: historyLoading } = useCalculatorHistory();
  
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [equation, setEquation] = useState<string>("");
  const [calculationComplete, setCalculationComplete] = useState(false);
  
  // Memory and advanced features state
  const [memory, setMemory] = useState<number>(0);
  const [calculationHistory, setCalculationHistory] = useState<string[]>([]);
  const [roundingDecimalPlaces, setRoundingDecimalPlaces] = useState<number>(2);
  const [showHistory, setShowHistory] = useState(false);
  const [showRoundingOptions, setShowRoundingOptions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { width, height } = useWindowDimensions();
  const isSmallScreen = height < 700;
  const isMediumScreen = height >= 700 && height < 800;

  // Initialize local history with Supabase history when component becomes visible
  useEffect(() => {
    if (visible && user && supabaseHistory.length > 0) {
      const formattedHistory = supabaseHistory.map(record => {
        // Handle both old 'expression' field and new 'calculation_expression' field
        const expression = record.calculation_expression || record.expression || 'Unknown calculation';
        // If expression already contains "= result", use it as-is, otherwise add result
        if (expression.includes('=')) {
          return expression;
        } else {
          return `${expression} = ${record.result}`;
        }
      });
      setCalculationHistory(prev => {
        // Merge Supabase history with any existing local history, avoiding duplicates
        const merged = [...formattedHistory];
        prev.forEach(localCalc => {
          if (!merged.includes(localCalc)) {
            merged.push(localCalc);
          }
        });
        return merged.slice(0, 15); // Keep only 15 most recent
      });
    } else if (visible && !user) {
      // For non-authenticated users, keep local history
      setCalculationHistory(prev => prev);
    }
  }, [visible, user, supabaseHistory]);

  const getResponsiveValue = (small: number, medium: number, large: number) => {
    if (isSmallScreen) return small;
    if (isMediumScreen) return medium;
    return large;
  };

  const inputNumber = (num: string) => {
    if (calculationComplete) {
      setDisplay(num);
      setEquation(num);
      setCalculationComplete(false);
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(false);
    } else if (waitingForOperand) {
      setDisplay(num);
      setEquation(prev => prev + num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
      setEquation(prev => prev === "0" ? num : prev + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);
    const operationSymbol = nextOperation === "/" ? "÷" : nextOperation === "*" ? "×" : nextOperation;

    if (calculationComplete) {
      setEquation(display + " " + operationSymbol);
      setCalculationComplete(false);
      setPreviousValue(inputValue);
    } else if (previousValue === null) {
      setPreviousValue(inputValue);
      setEquation(prev => prev + " " + operationSymbol);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      const result = parseFloat(newValue.toFixed(roundingDecimalPlaces));

      setDisplay(`${result}`);
      setPreviousValue(newValue);
      setEquation(prev => prev + " " + operationSymbol);
      
      // Show result immediately in history
      const intermediateResult = `${currentValue} ${operation === "/" ? "÷" : operation === "*" ? "×" : operation} ${inputValue} = ${result}`;
      addToHistory(intermediateResult);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (
    firstValue: number,
    secondValue: number,
    operation: string
  ): number => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "*":
        return firstValue * secondValue;
      case "/":
        return firstValue / secondValue;
      case "%":
        return (firstValue * secondValue) / 100;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = async () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      const result = parseFloat(newValue.toFixed(roundingDecimalPlaces));

      const fullEquation = `${equation} = ${result}`;
      setEquation(fullEquation);
      setDisplay(`${result}`);
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
      setCalculationComplete(true);

      // Add to local history
      addToHistory(fullEquation);

      // Save to user history if authenticated
      if (user) {
        try {
          const calculationType = operation === '%' ? 'percentage' :
                                 ['+', '-', '*', '/'].includes(operation) ? 'basic' : 'advanced';
          
          await saveCalculation(fullEquation, result, calculationType, {
            memory,
            roundingDecimalPlaces,
            operation,
            previousValue,
            inputValue
          });
        } catch (error) {
          console.error('Error saving calculation to history:', error);
        }
      }

      // Pass result to parent if callback provided
      if (onResult) {
        onResult(result);
      }

      // Automatically add to converter after calculation
      if (onAddToConverter) {
        onAddToConverter(result);
        // Only close if auto-close is enabled
        if (autoCloseAfterCalculation) {
          onClose();
          // Reset calculator state
          clear();
        }
      } else {
        // If no converter callback, don't close automatically
        // This allows users to do multiple calculations
      }
    }
  };

  // Memory functions
  const memoryAdd = () => {
    const currentValue = parseFloat(display);
    setMemory(prev => prev + currentValue);
    setEquation(`M+ (${currentValue})`);
    setCalculationComplete(false);
  };

  const memorySubtract = () => {
    const currentValue = parseFloat(display);
    setMemory(prev => prev - currentValue);
    setEquation(`M- (${currentValue})`);
    setCalculationComplete(false);
  };

  const memoryRecall = () => {
    setDisplay(memory.toString());
    setEquation(`MR (${memory})`);
    setCalculationComplete(false);
  };

  const memoryClear = () => {
    setMemory(0);
    setEquation("MC");
    setCalculationComplete(false);
  };

  // Tax and tip calculations
  const applyTip = (percentage: number) => {
    const currentValue = parseFloat(display);
    const tipAmount = (currentValue * percentage) / 100;
    const totalWithTip = currentValue + tipAmount;
    setDisplay(totalWithTip.toString());
    setEquation(`${currentValue} + ${percentage}% tip`);
    setCalculationComplete(false);
    addToHistory(`${currentValue} + ${percentage}% tip = ${totalWithTip.toFixed(roundingDecimalPlaces)}`);
  };

  const applyDiscount = (percentage: number) => {
    const currentValue = parseFloat(display);
    const discountAmount = (currentValue * percentage) / 100;
    const finalPrice = currentValue - discountAmount;
    setDisplay(finalPrice.toString());
    setEquation(`${currentValue} - ${percentage}%`);
    setCalculationComplete(false);
    addToHistory(`${currentValue} - ${percentage}% = ${finalPrice.toFixed(roundingDecimalPlaces)}`);
  };

  const applyTax = (percentage: number) => {
    const currentValue = parseFloat(display);
    const taxAmount = (currentValue * percentage) / 100;
    const totalWithTax = currentValue + taxAmount;
    setDisplay(totalWithTax.toString());
    setEquation(`${currentValue} + ${percentage}% tax`);
    setCalculationComplete(false);
    addToHistory(`${currentValue} + ${percentage}% tax = ${totalWithTax.toFixed(roundingDecimalPlaces)}`);
  };

  // History functions
  const addToHistory = (calculation: string) => {
    setCalculationHistory(prev => [calculation, ...prev.slice(0, 14)]); // Keep last 15 calculations
  };

  const clear = () => {
    setDisplay("0");
    setEquation("");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setCalculationComplete(false);
  };

  const clearAll = () => {
    setDisplay("0");
    setEquation("");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setCalculationComplete(false);
    setMemory(0);
    setCalculationHistory([]);
  };

  const inputDecimal = () => {
    if (calculationComplete) {
      setDisplay("0.");
      setEquation("0.");
      setCalculationComplete(false);
    } else if (waitingForOperand) {
      setDisplay("0.");
      setEquation(prev => prev + "0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
      setEquation(prev => prev + ".");
    }
  };

  const inputPercentage = () => {
    if (calculationComplete) {
      const percentageValue = parseFloat(display) / 100;
      setDisplay(percentageValue.toString());
      setEquation(percentageValue.toString());
      setCalculationComplete(false);
    } else if (waitingForOperand) {
      const percentageValue = parseFloat(display) / 100;
      setDisplay(percentageValue.toString());
      setEquation(prev => prev + "%");
      setWaitingForOperand(false);
    } else {
      const percentageValue = parseFloat(display) / 100;
      setDisplay(percentageValue.toString());
      setEquation(prev => prev + "%");
    }
  };

  const toggleSign = () => {
    const currentValue = parseFloat(display);
    const toggledValue = -currentValue;
    setDisplay(toggledValue.toString());
    setEquation(toggledValue.toString());
  };

  const deleteLastDigit = () => {
    if (calculationComplete) {
      return; // Don't allow deletion after calculation is complete
    }
    
    if (display.length > 1) {
      const newDisplay = display.slice(0, -1);
      const newEquation = equation.slice(0, -1);
      setDisplay(newDisplay);
      setEquation(newEquation);
    } else {
      setDisplay("0");
      setEquation("0");
    }
  };

  const renderButton = (text: string, onPress: () => void, buttonType: string = "default", flex?: number) => {
    let style = { ...styles.button, ...(flex && { flex }) };

    switch (buttonType) {
      case "operation":
        style = { ...styles.button, ...styles.operationButton, ...(flex && { flex }) };
        break;
      case "clear":
        style = { ...styles.button, ...styles.clearButton, ...(flex && { flex }) };
        break;
      case "delete":
        style = { ...styles.button, ...styles.deleteButton, ...(flex && { flex }) };
        break;
      case "equals":
        style = { ...styles.button, ...styles.equalsButton, ...(flex && { flex }) };
        break;
      case "memory":
        style = { ...styles.button, ...styles.memoryButton, ...(flex && { flex }) };
        break;
      case "financial":
        style = { ...styles.button, ...styles.financialButton, ...(flex && { flex }) };
        break;
      case "utility":
        style = { ...styles.button, ...styles.utilityButton, ...(flex && { flex }) };
        break;
      case "history":
        style = { ...styles.button, ...styles.historyButton, ...(flex && { flex }) };
        break;
      default:
        if (flex) style.flex = flex;
        break;
    }

    const renderButtonText = () => {
      switch (buttonType) {
        case "operation":
          return <Text style={styles.operationButtonText}>{text}</Text>;
        case "clear":
          return <Text style={styles.clearButtonText}>{text}</Text>;
        case "delete":
          return <Text style={styles.deleteButtonText}>{text}</Text>;
        case "equals":
          return <Text style={styles.equalsButtonText}>{text}</Text>;
        case "memory":
        case "financial":
        case "utility":
        case "history":
          return <Text style={styles.specialButtonText}>{text}</Text>;
        default:
          return <Text style={styles.buttonText}>{text}</Text>;
      }
    };

    return (
      <TouchableOpacity 
        style={style}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={calculationComplete && !["equals", "clear", "utility", "history"].includes(buttonType)}
      >
        {renderButtonText()}
      </TouchableOpacity>
    );
  };

  const getDisplayText = () => {
    // Always show current display value (which includes intermediate results)
    if (calculationComplete) {
      return equation;
    }
    
    // Show the current calculation with result preview
    if (equation && operation && !waitingForOperand && previousValue !== null) {
      const currentValue = parseFloat(display);
      if (!isNaN(currentValue)) {
        const previewResult = calculate(previousValue, currentValue, operation);
        const result = parseFloat(previewResult.toFixed(roundingDecimalPlaces));
        return `${equation} = ${result}`;
      }
    }
    
    // Show equation in real-time when building calculation
    if (equation && (operation || waitingForOperand)) {
      return equation;
    }
    
    return display;
  };

  const getDisplayFontSize = () => {
    const textLength = getDisplayText().length;
    if (textLength > 15) return getResponsiveValue(16, 20, 24);
    if (textLength > 10) return getResponsiveValue(20, 24, 28);
    return getResponsiveValue(32, 40, 48);
  };

  const RoundingOptions = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.optionsTitle}>Rounding Options</Text>
      <View style={styles.optionsRow}>
        {[0, 1, 2, 3, 4].map(decimals => (
          <TouchableOpacity
            key={decimals}
            style={[
              styles.optionButton,
              roundingDecimalPlaces === decimals && styles.optionButtonActive
            ]}
            onPress={() => setRoundingDecimalPlaces(decimals)}
          >
            <Text style={[
              styles.optionButtonText,
              roundingDecimalPlaces === decimals && styles.optionButtonTextActive
            ]}>
              {decimals}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const HistoryView = () => {
    // Combine Supabase history with local history for display
    const displayHistory = user && supabaseHistory.length > 0
      ? supabaseHistory.map(record => {
          // Handle both old 'expression' field and new 'calculation_expression' field
          const expression = record.calculation_expression || record.expression || 'Unknown calculation';
          // If expression already contains "= result", use it as-is, otherwise add result
          if (expression.includes('=')) {
            return expression;
          } else {
            return `${expression} = ${record.result}`;
          }
        })
      : calculationHistory;

    return (
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Calculation History</Text>
        <ScrollView style={styles.historyList}>
          {displayHistory.length === 0 ? (
            <Text style={styles.historyEmpty}>No calculations yet</Text>
          ) : (
            displayHistory.map((calc, index) => (
              <View key={index}>
                <Text style={styles.historyItem}>{calc}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        {!inModal && (
          <View style={[
            styles.header,
            {
              paddingTop: getResponsiveValue(20, 30, 40),
              marginBottom: getResponsiveValue(16, 24, 32),
            }
          ]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>x</Text>
            </TouchableOpacity>
            <Text style={[
              styles.title,
              {
                fontSize: getResponsiveValue(20, 24, 28),
              }
            ]}>Calculator</Text>
            <View style={{ width: 60 }} />
          </View>
        )}

        <View style={[
          styles.displayContainer,
          {
            marginBottom: getResponsiveValue(16, 24, 32),
          }
        ]}>
          <View style={[
            styles.display,
            {
              minHeight: getResponsiveValue(100, 120, 140),
              padding: getResponsiveValue(20, 26, 32),
              borderRadius: getResponsiveValue(16, 20, 24),
            }
          ]}>
            <Text style={[
              styles.displayText,
              {
                fontSize: getDisplayFontSize(),
                lineHeight: getDisplayFontSize() * 1.2,
              }
            ]}>{getDisplayText()}</Text>
          </View>
        </View>

        {/* Quick access toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Text style={styles.toolbarButtonText}>{showAdvanced ? "Basic" : "Advanced"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setShowHistory(!showHistory)}
          >
            <Text style={styles.toolbarButtonText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setShowRoundingOptions(!showRoundingOptions)}
          >
            <Text style={styles.toolbarButtonText}>Rounding: {roundingDecimalPlaces}</Text>
          </TouchableOpacity>
          {onAddToConverter && (
            <TouchableOpacity
              style={[styles.toolbarButton, styles.addToConverterButton]}
              onPress={() => {
                const result = parseFloat(display);
                if (!isNaN(result) && result !== 0) {
                  onAddToConverter(result);
                  onClose();
                  clear();
                }
              }}
            >
              <Text style={styles.addToConverterButtonText}>Add to Converter</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Conditional views */}
        {showRoundingOptions && <RoundingOptions />}
        {showHistory && <HistoryView />}

        <ScrollView
          style={[
            styles.buttonGrid,
            {
              paddingHorizontal: getResponsiveValue(12, 16, 20),
              flex: showHistory || showRoundingOptions ? 0 : 1,
            }
          ]}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!showAdvanced ? (
            // Basic Calculator Layout
            <>
              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("C", clear, "clear")}
                {renderButton("⌫", deleteLastDigit, "delete")}
                {renderButton("%", inputPercentage)}
                {renderButton("÷", () => inputOperation("/"), "operation")}
              </View>

              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("7", () => inputNumber("7"))}
                {renderButton("8", () => inputNumber("8"))}
                {renderButton("9", () => inputNumber("9"))}
                {renderButton("×", () => inputOperation("*"), "operation")}
              </View>

              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("4", () => inputNumber("4"))}
                {renderButton("5", () => inputNumber("5"))}
                {renderButton("6", () => inputNumber("6"))}
                {renderButton("-", () => inputOperation("-"), "operation")}
              </View>

              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("1", () => inputNumber("1"))}
                {renderButton("2", () => inputNumber("2"))}
                {renderButton("3", () => inputNumber("3"))}
                {renderButton("+", () => inputOperation("+"), "operation")}
              </View>

              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("0", () => inputNumber("0"), "default", 2)}
                {renderButton(".", inputDecimal)}
                {renderButton("=", performCalculation, "equals")}
              </View>
            </>
          ) : (
            // Advanced Calculator Layout
            <>
              {/* Memory Row */}
              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("MC", memoryClear, "memory")}
                {renderButton("MR", memoryRecall, "memory")}
                {renderButton("M+", memoryAdd, "memory")}
                {renderButton("M-", memorySubtract, "memory")}
              </View>

              {/* Financial Tools Row */}
              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("10% Tip", () => applyTip(10), "financial")}
                {renderButton("15% Tip", () => applyTip(15), "financial")}
                {renderButton("20% Tax", () => applyTax(20), "financial")}
                {renderButton("10% Disc", () => applyDiscount(10), "financial")}
              </View>

              {/* Additional Financial Tools Row */}
              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("25% Disc", () => applyDiscount(25), "financial")}
              </View>

              {/* Quick Calculations Row */}
              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("C", clear, "clear")}
                {renderButton("⌫", deleteLastDigit, "delete")}
                {renderButton("%", inputPercentage)}
                {renderButton("÷", () => inputOperation("/"), "operation")}
              </View>

              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("7", () => inputNumber("7"))}
                {renderButton("8", () => inputNumber("8"))}
                {renderButton("9", () => inputNumber("9"))}
                {renderButton("×", () => inputOperation("*"), "operation")}
              </View>

              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("4", () => inputNumber("4"))}
                {renderButton("5", () => inputNumber("5"))}
                {renderButton("6", () => inputNumber("6"))}
                {renderButton("-", () => inputOperation("-"), "operation")}
              </View>

              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("1", () => inputNumber("1"))}
                {renderButton("2", () => inputNumber("2"))}
                {renderButton("3", () => inputNumber("3"))}
                {renderButton("+", () => inputOperation("+"), "operation")}
              </View>

              <View style={[
                styles.buttonRow,
                {
                  marginBottom: getResponsiveValue(8, 12, 16),
                  gap: getResponsiveValue(6, 8, 12),
                }
              ]}>
                {renderButton("0", () => inputNumber("0"), "default", 2)}
                {renderButton(".", inputDecimal)}
                {renderButton("=", performCalculation, "equals")}
              </View>
            </>
          )}
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  title: {
    color: "#ffffff",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  displayContainer: {
    paddingHorizontal: 8,
  },
  display: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  displayText: {
    color: "#ffffff",
    fontWeight: "300",
    textAlign: "right",
    letterSpacing: 1,
    includeFontPadding: false,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 16,
  },
  toolbarButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  toolbarButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  optionsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 20,
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
    backgroundColor: "rgba(52, 199, 89, 0.8)",
    borderColor: "rgba(52, 199, 89, 1)",
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
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    maxHeight: 200,
  },
  historyTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
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
  historyItem: {
    color: "#ffffff",
    fontSize: 12,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonGrid: {
    flex: 1,
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
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 50,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "400",
    includeFontPadding: false,
  },
  operationButton: {
    backgroundColor: "rgba(255, 149, 0, 0.9)",
    borderColor: "rgba(255, 149, 0, 0.6)",
  },
  operationButtonText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "600",
    includeFontPadding: false,
  },
  clearButton: {
    backgroundColor: "rgba(255, 69, 58, 0.9)",
    borderColor: "rgba(255, 69, 58, 0.6)",
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
    includeFontPadding: false,
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
  equalsButton: {
    backgroundColor: "rgba(52, 199, 89, 0.9)",
    borderColor: "rgba(52, 199, 89, 0.6)",
  },
  equalsButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    includeFontPadding: false,
    textAlign: "center",
  },
  memoryButton: {
    backgroundColor: "rgba(147, 112, 219, 0.9)",
    borderColor: "rgba(147, 112, 219, 0.6)",
  },
  financialButton: {
    backgroundColor: "rgba(30, 144, 255, 0.9)",
    borderColor: "rgba(30, 144, 255, 0.6)",
  },
  utilityButton: {
    backgroundColor: "rgba(255, 20, 147, 0.9)",
    borderColor: "rgba(255, 20, 147, 0.6)",
  },
  historyButton: {
    backgroundColor: "rgba(255, 215, 0, 0.9)",
    borderColor: "rgba(255, 215, 0, 0.6)",
  },
  specialButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    includeFontPadding: false,
    textAlign: "center",
  },
  addToConverterButton: {
    backgroundColor: "#10b981",
    borderColor: "#059669",
  },
  addToConverterButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});
