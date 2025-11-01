import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useDashboardStore } from '@/stores/dashboardStore';

interface CalculatorProps {
  widgetId: string;
  initialValue?: number;
  precision?: number;
  maxHistory?: number;
  onWidgetChange?: (props: any) => void;
}

interface CalculationHistory {
  id: string;
  expression: string;
  result: number;
  timestamp: number;
}

interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: string | null;
  waitingForOperand: boolean;
  history: CalculationHistory[];
}

export function Calculator({
  widgetId,
  initialValue = 0,
  precision = 2,
  maxHistory = 5,
  onWidgetChange,
}: CalculatorProps) {
  const { widgets, updateWidget } = useDashboardStore();
  
  const [state, setState] = useState<CalculatorState>({
    display: initialValue.toString(),
    previousValue: null,
    operation: null,
    waitingForOperand: false,
    history: [],
  });

  // Load widget props from dashboard store
  useEffect(() => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget && widget.props.history) {
      setState(prev => ({
        ...prev,
        history: widget.props.history,
      }));
    }
  }, [widgetId, widgets]);

  // Save history to widget props
  useEffect(() => {
    onWidgetChange?.({
      initialValue,
      precision,
      maxHistory,
      history: state.history,
    });
  }, [state.history, initialValue, precision, maxHistory, onWidgetChange]);

  // Add calculation to history
  const addToHistory = useCallback((expression: string, result: number) => {
    setState(prev => {
      const newHistory = [
        {
          id: Date.now().toString(),
          expression,
          result,
          timestamp: Date.now(),
        },
        ...prev.history,
      ].slice(0, maxHistory);

      return {
        ...prev,
        history: newHistory,
      };
    });
  }, [maxHistory]);

  // Update display
  const updateDisplay = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      display: value,
      waitingForOperand: false,
    }));
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      display: '0',
      previousValue: null,
      operation: null,
      waitingForOperand: false,
    }));
  }, []);

  // Clear entry
  const clearEntry = useCallback(() => {
    setState(prev => ({
      ...prev,
      display: '0',
      waitingForOperand: false,
    }));
  }, []);

  // Input digit
  const inputDigit = useCallback((digit: string) => {
    setState(prev => {
      if (prev.waitingForOperand) {
        return {
          ...prev,
          display: digit,
          waitingForOperand: false,
        };
      } else {
        const newDisplay = prev.display === '0' ? digit : prev.display + digit;
        return {
          ...prev,
          display: newDisplay,
        };
      }
    });
  }, []);

  // Input decimal point
  const inputDecimal = useCallback(() => {
    setState(prev => {
      if (prev.waitingForOperand) {
        return {
          ...prev,
          display: '0.',
          waitingForOperand: false,
        };
      } else if (prev.display.indexOf('.') === -1) {
        return {
          ...prev,
          display: prev.display + '.',
        };
      }
      return prev;
    });
  }, []);

  // Perform calculation
  const performCalculation = useCallback((nextOperation: string) => {
    setState(prev => {
      const inputValue = parseFloat(prev.display);

      if (prev.previousValue === null) {
        return {
          ...prev,
          previousValue: inputValue,
          operation: nextOperation,
          waitingForOperand: true,
        };
      }

      if (prev.operation && !prev.waitingForOperand) {
        const currentValue = prev.previousValue || 0;
        const newValue = calculate(currentValue, inputValue, prev.operation);

        if (newValue !== null) {
          // Add to history
          addToHistory(
            `${currentValue} ${prev.operation} ${inputValue} = ${newValue.toFixed(precision)}`,
            newValue
          );

          if (nextOperation === '=') {
            return {
              ...prev,
              display: newValue.toFixed(precision),
              previousValue: null,
              operation: null,
              waitingForOperand: true,
            };
          } else {
            return {
              ...prev,
              display: newValue.toFixed(precision),
              previousValue: newValue,
              operation: nextOperation,
              waitingForOperand: true,
            };
          }
        }
      }

      return {
        ...prev,
        operation: nextOperation,
        waitingForOperand: true,
      };
    });
  }, [addToHistory, precision]);

  // Calculate function
  const calculate = (firstValue: number, secondValue: number, operation: string): number | null => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '−':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : null;
      default:
        return secondValue;
    }
  };

  // Handle keyboard input
  const handleKeyPress = useCallback((key: string) => {
    if (/[0-9]/.test(key)) {
      inputDigit(key);
    } else if (key === '.') {
      inputDecimal();
    } else if (key === '+') {
      performCalculation('+');
    } else if (key === '-') {
      performCalculation('−');
    } else if (key === '*') {
      performCalculation('×');
    } else if (key === '/') {
      performCalculation('÷');
    } else if (key === '=' || key === 'Enter') {
      performCalculation('=');
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
      clearAll();
    } else if (key === 'Backspace') {
      clearEntry();
    }
  }, [inputDigit, inputDecimal, performCalculation, clearAll, clearEntry]);

  // Use result in converter
  const useInConverter = useCallback(() => {
    const result = parseFloat(state.display);
    if (!isNaN(result)) {
      // Find adjacent currency converter widget
      const currentWidget = widgets.find(w => w.id === widgetId);
      if (currentWidget) {
        // Update the nearest currency converter widget
        const converterWidgets = widgets.filter(w => w.type === 'currency-converter');
        if (converterWidgets.length > 0) {
          const targetWidget = converterWidgets[0]; // Use first converter for now
          const updatedProps = {
            ...targetWidget.props,
            amount: result,
          };
          
          updateWidget(targetWidget.id, { props: updatedProps });
          
          Alert.alert(
            'Result Used',
            `Value ${result} sent to currency converter`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'No Converter Found',
            'No currency converter widget found to use this result',
            [{ text: 'OK' }]
          );
        }
      }
    }
  }, [state.display, widgets, widgetId, updateWidget]);

  // Keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      handleKeyPress(event.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  // Button layout
  const buttons = [
    [
      { text: 'C', type: 'function', onPress: clearAll },
      { text: 'CE', type: 'function', onPress: clearEntry },
      { text: '÷', type: 'operator', onPress: () => performCalculation('÷') },
      { text: '×', type: 'operator', onPress: () => performCalculation('×') },
    ],
    [
      { text: '7', type: 'number', onPress: () => inputDigit('7') },
      { text: '8', type: 'number', onPress: () => inputDigit('8') },
      { text: '9', type: 'number', onPress: () => inputDigit('9') },
      { text: '−', type: 'operator', onPress: () => performCalculation('−') },
    ],
    [
      { text: '4', type: 'number', onPress: () => inputDigit('4') },
      { text: '5', type: 'number', onPress: () => inputDigit('5') },
      { text: '6', type: 'number', onPress: () => inputDigit('6') },
      { text: '+', type: 'operator', onPress: () => performCalculation('+') },
    ],
    [
      { text: '1', type: 'number', onPress: () => inputDigit('1') },
      { text: '2', type: 'number', onPress: () => inputDigit('2') },
      { text: '3', type: 'number', onPress: () => inputDigit('3') },
      { text: '=', type: 'equals', onPress: () => performCalculation('='), span: 1 },
    ],
    [
      { text: '0', type: 'number', onPress: () => inputDigit('0'), span: 2 },
      { text: '.', type: 'number', onPress: inputDecimal },
    ],
  ];

  const getButtonStyle = (type: string) => {
    switch (type) {
      case 'operator':
        return styles.operatorButton;
      case 'equals':
        return styles.equalsButton;
      case 'function':
        return styles.functionButton;
      default:
        return styles.numberButton;
    }
  };

  const getButtonTextStyle = (type: string) => {
    switch (type) {
      case 'operator':
      case 'equals':
        return styles.operatorButtonText;
      case 'function':
        return styles.functionButtonText;
      default:
        return styles.numberButtonText;
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🧮</Text>
        <ThemedText style={styles.title}>Calculator</ThemedText>
        <TouchableOpacity style={styles.converterButton} onPress={useInConverter}>
          <Text style={styles.converterButtonText}>📱</Text>
        </TouchableOpacity>
      </View>

      {/* Display */}
      <View style={styles.display}>
        <TextInput
          style={styles.displayInput}
          value={state.display}
          editable={false}
          textAlign="right"
        />
      </View>

      {/* Buttons Grid */}
      <View style={styles.buttonGrid}>
        {buttons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.buttonRow}>
            {row.map((button, buttonIndex) => (
              <TouchableOpacity
                key={buttonIndex}
                style={[
                  styles.button,
                  getButtonStyle(button.type),
                  button.span === 2 && styles.buttonSpan2,
                ]}
                onPress={button.onPress}
                accessibilityLabel={`Calculator button ${button.text}`}
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, getButtonTextStyle(button.type)]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* History */}
      {state.history.length > 0 && (
        <View style={styles.historyContainer}>
          <ThemedText style={styles.historyTitle}>History</ThemedText>
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {state.history.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyItem}
                onPress={() => updateDisplay(item.result.toString())}
              >
                <ThemedText style={styles.historyExpression}>
                  {item.expression}
                </ThemedText>
                <ThemedText style={styles.historyResult}>
                  {item.result.toFixed(precision)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Keyboard hint */}
      <View style={styles.keyboardHint}>
        <ThemedText style={styles.keyboardHintText}>
          Press keys or tap buttons. Use Enter for =, Esc for clear.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },
  converterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  converterButtonText: {
    fontSize: 16,
  },
  display: {
    padding: 16,
    backgroundColor: '#F2F2F7',
  },
  displayInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'right',
    paddingVertical: 8,
  },
  buttonGrid: {
    flex: 1,
    padding: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  button: {
    flex: 1,
    height: 60,
    marginHorizontal: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonSpan2: {
    flex: 2,
  },
  numberButton: {
    backgroundColor: '#FFFFFF',
  },
  operatorButton: {
    backgroundColor: '#007AFF',
  },
  equalsButton: {
    backgroundColor: '#34C759',
  },
  functionButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  numberButtonText: {
    color: '#000000',
  },
  operatorButtonText: {
    color: '#FFFFFF',
  },
  equalsButtonText: {
    color: '#FFFFFF',
  },
  functionButtonText: {
    color: '#FFFFFF',
  },
  historyContainer: {
    maxHeight: 200,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#F2F2F7',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    padding: 12,
    paddingBottom: 8,
  },
  historyList: {
    maxHeight: 150,
  },
  historyItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  historyExpression: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  historyResult: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  keyboardHint: {
    padding: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  keyboardHintText: {
    fontSize: 10,
    color: '#8E8E93',
  },
});