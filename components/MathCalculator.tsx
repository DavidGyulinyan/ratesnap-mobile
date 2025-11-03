import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";

interface MathCalculatorProps {
  visible: boolean;
  onClose: () => void;
  onResult?: (result: number) => void;
}

export default function MathCalculator({
  visible,
  onClose,
  onResult,
}: MathCalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(`${parseFloat(newValue.toFixed(7))}`);
      setPreviousValue(newValue);
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
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      const result = parseFloat(newValue.toFixed(7));

      setDisplay(`${result}`);
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);

      // Pass result to parent if callback provided
      if (onResult) {
        onResult(result);
      }
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const deleteLastDigit = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const renderButton = (text: string, onPress: () => void, style: any = {}) => {
    let buttonTextStyle = styles.buttonText;
    
    if (style === styles.operationButton) {
      buttonTextStyle = styles.operationButtonText;
    } else if (style === styles.clearButton) {
      buttonTextStyle = styles.clearButtonText;
    } else if (style === styles.deleteButton) {
      buttonTextStyle = styles.deleteButtonText;
    } else if (style === styles.equalsButton) {
      buttonTextStyle = styles.equalsButtonText;
    }
    
    return (
      <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
        <Text style={buttonTextStyle}>{text}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <ThemedText style={styles.closeButton}>Close</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Calculator
          </ThemedText>
        </View>

        <View style={styles.display}>
          <Text style={styles.displayText}>{display}</Text>
        </View>

        <View style={styles.buttonRow}>
          {renderButton("C", clear, styles.clearButton)}
          {renderButton("⌫", deleteLastDigit, styles.deleteButton)}
          {renderButton("÷", () => inputOperation("/"), styles.operationButton)}
        </View>

        <View style={styles.buttonRow}>
          {renderButton("7", () => inputNumber("7"))}
          {renderButton("8", () => inputNumber("8"))}
          {renderButton("9", () => inputNumber("9"))}
          {renderButton("×", () => inputOperation("*"), styles.operationButton)}
        </View>

        <View style={styles.buttonRow}>
          {renderButton("4", () => inputNumber("4"))}
          {renderButton("5", () => inputNumber("5"))}
          {renderButton("6", () => inputNumber("6"))}
          {renderButton("-", () => inputOperation("-"), styles.operationButton)}
        </View>

        <View style={styles.buttonRow}>
          {renderButton("1", () => inputNumber("1"))}
          {renderButton("2", () => inputNumber("2"))}
          {renderButton("3", () => inputNumber("3"))}
          {renderButton("+", () => inputOperation("+"), styles.operationButton)}
        </View>

        <View style={styles.buttonRow}>
          {renderButton("0", () => inputNumber("0"), styles.zeroButton)}
          {renderButton(".", inputDecimal)}
          {renderButton("=", performCalculation, styles.equalsButton)}
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  closeButton: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "bold",
  },
  display: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    borderWidth: 0,
    minHeight: 100,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  displayText: {
    fontSize: 36,
    fontWeight: "300",
    textAlign: "right",
    color: "#1a1a1a",
  },
  buttonRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  button: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 20,
    margin: 3,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: "500",
    color: "#2d3748",
  },
  zeroButton: {
    flex: 2,
  },
  operationButton: {
    backgroundColor: "rgba(255, 193, 7, 0.9)",
  },
  operationButtonText: {
    fontSize: 22,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  clearButton: {
    backgroundColor: "rgba(239, 68, 68, 0.9)",
  },
  clearButtonText: {
    fontSize: 22,
    color: "#ffffff",
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: "rgba(251, 191, 36, 0.9)",
  },
  deleteButtonText: {
    fontSize: 22,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  equalsButton: {
    backgroundColor: "rgba(16, 185, 129, 0.9)",
  },
  equalsButtonText: {
    fontSize: 22,
    color: "#ffffff",
    fontWeight: "500",
  },
});
