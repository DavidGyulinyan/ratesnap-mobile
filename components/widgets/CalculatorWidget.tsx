import React, { useState } from "react";
import { View, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { ThemedView } from "../themed-view";
import { ThemedText } from "../themed-text";
import BaseWidget from "./BaseWidget";
import MathCalculator from "../MathCalculator";

interface CalculatorWidgetProps {
  widgetId: string;
  onRemove: () => void;
  onToggle?: () => void;
  isEditMode?: boolean;
}

export default function CalculatorWidget({
  widgetId,
  onRemove,
  onToggle,
  isEditMode = false
}: CalculatorWidgetProps) {
  const [showCalculator, setShowCalculator] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);

  const handleCalculatorResult = (result: number) => {
    setLastResult(result);
    setShowCalculator(false);
  };

  const renderCalculatorModal = () => (
    <Modal 
      visible={showCalculator} 
      animationType="slide" 
      onRequestClose={() => setShowCalculator(false)}
    >
      <MathCalculator
        visible={showCalculator}
        onClose={() => setShowCalculator(false)}
        onResult={handleCalculatorResult}
      />
    </Modal>
  );

  return (
    <>
      <BaseWidget
        widgetId={widgetId}
        title="Calculator"
        onRemove={onRemove}
        onToggle={onToggle}
        isEditMode={isEditMode}
      >
        <View style={styles.calculatorContainer}>
          {/* Display Area */}
          <View style={styles.displayArea}>
            {lastResult !== null ? (
              <ThemedText style={styles.displayText}>
                Last Result: {lastResult}
              </ThemedText>
            ) : (
              <ThemedText style={styles.displayText}>
                Calculator Ready
              </ThemedText>
            )}
          </View>

          {/* Quick Calculator Buttons */}
          <View style={styles.quickButtons}>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => handleCalculatorResult(100)}
            >
              <ThemedText style={styles.quickButtonText}>100</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => handleCalculatorResult(1000)}
            >
              <ThemedText style={styles.quickButtonText}>1K</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => handleCalculatorResult(10000)}
            >
              <ThemedText style={styles.quickButtonText}>10K</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => handleCalculatorResult(100000)}
            >
              <ThemedText style={styles.quickButtonText}>100K</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Main Calculator Button */}
          <TouchableOpacity
            style={styles.mainCalculatorButton}
            onPress={() => setShowCalculator(true)}
          >
            <ThemedText style={styles.mainCalculatorButtonText}>
              🧮 Open Full Calculator
            </ThemedText>
          </TouchableOpacity>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <ThemedText style={styles.tipsText}>
              💡 Use calculator to compute amounts for conversion
            </ThemedText>
          </View>
        </View>
      </BaseWidget>

      {renderCalculatorModal()}
    </>
  );
}

const styles = StyleSheet.create({
  calculatorContainer: {
    gap: 12,
  },
  displayArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 50,
    justifyContent: 'center',
  },
  displayText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#e0f2fe',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  mainCalculatorButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mainCalculatorButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  tipsContainer: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  tipsText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
  },
});