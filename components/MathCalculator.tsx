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

  const renderButton = (text: string, onPress: () => void, style: any = {}) => (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );

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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  closeButton: {
    fontSize: 16,
    color: "#2563eb",
  },
  title: {
    fontSize: 24,
  },
  display: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    minHeight: 80,
    justifyContent: "center",
  },
  displayText: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "right",
    color: "#1f2937",
  },
  buttonRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  button: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 15,
    margin: 2,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
  },
  zeroButton: {
    flex: 2,
  },
  operationButton: {
    backgroundColor: "#dbeafe",
  },
  clearButton: {
    backgroundColor: "#fee2e2",
  },
  deleteButton: {
    backgroundColor: "#fef3c7",
  },
  equalsButton: {
    backgroundColor: "#2563eb",
  },
});
