import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import CurrencyFlag from "./CurrencyFlag";

interface CurrencyPickerProps {
  visible: boolean;
  currencies: string[];
  selectedCurrency: string;
  onSelect: (currency: string) => void;
  onClose: () => void;
}

export default function CurrencyPicker({
  visible,
  currencies,
  selectedCurrency,
  onSelect,
  onClose,
}: CurrencyPickerProps) {
  const [search, setSearch] = useState("");

  const filteredCurrencies = currencies.filter((currency) =>
    currency.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (currency: string) => {
    onSelect(currency);
    onClose();
    setSearch("");
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <ThemedText style={styles.closeButton}>Close</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Select Currency
          </ThemedText>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search currencies..."
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          data={filteredCurrencies}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.currencyItem,
                item === selectedCurrency && styles.selectedItem,
              ]}
              onPress={() => handleSelect(item)}
            >
              <View style={styles.currencyItemContent}>
                <CurrencyFlag currency={item} size={20} />
                <ThemedText
                  style={
                    item === selectedCurrency ? styles.selectedText : undefined
                  }
                >
                  {item}
                </ThemedText>
              </View>
            </TouchableOpacity>
          )}
          style={styles.list}
        />
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  closeButton: {
    fontSize: 16,
    color: "#2563eb",
  },
  title: {
    fontSize: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#f8fafc",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currencyItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  selectedItem: {
    backgroundColor: "#e0f2fe",
  },
  currencyItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedText: {
    fontWeight: "bold",
    color: "#2563eb",
  },
});
