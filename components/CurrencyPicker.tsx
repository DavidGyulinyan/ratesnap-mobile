import React, { useState, useMemo } from "react";
import {
  View,
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

// Comprehensive currency to country mapping
const CURRENCY_TO_COUNTRIES: { [key: string]: string[] } = {
  'USD': ['United States', 'America', 'US', 'USA'],
  'EUR': ['Eurozone', 'European Union', 'EU', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Finland', 'Ireland', 'Portugal', 'Greece', 'Luxembourg', 'Cyprus', 'Malta', 'Slovakia', 'Slovenia', 'Estonia', 'Latvia', 'Lithuania', 'Croatia'],
  'GBP': ['United Kingdom', 'Britain', 'UK', 'England', 'Scotland', 'Wales', 'Northern Ireland'],
  'JPY': ['Japan', 'Japanese'],
  'CAD': ['Canada', 'Canadian'],
  'AUD': ['Australia', 'Australian'],
  'CHF': ['Switzerland', 'Swiss'],
  'CNY': ['China', 'Chinese', 'Renminbi', 'Yuan'],
  'SEK': ['Sweden', 'Swedish', 'Krona'],
  'NZD': ['New Zealand', 'NZ'],
  'MXN': ['Mexico', 'Mexican', 'Peso'],
  'SGD': ['Singapore', 'Singaporean', 'Dollar'],
  'HKD': ['Hong Kong', 'HK'],
  'NOK': ['Norway', 'Norwegian', 'Krone'],
  'KRW': ['South Korea', 'Korean', 'Won'],
  'TRY': ['Turkey', 'Turkish', 'Lira'],
  'RUB': ['Russia', 'Russian', 'Ruble'],
  'INR': ['India', 'Indian', 'Rupee'],
  'BRL': ['Brazil', 'Brazilian', 'Real'],
  'ZAR': ['South Africa', 'South African', 'Rand'],
  'AED': ['United Arab Emirates', 'UAE', 'Dubai', 'Emirates', 'Dirham'],
  'PLN': ['Poland', 'Polish', 'Zloty'],
  'CZK': ['Czech Republic', 'Czech', 'Koruna'],
  'HUF': ['Hungary', 'Hungarian', 'Forint'],
  'RON': ['Romania', 'Romanian', 'Leu'],
  'BGN': ['Bulgaria', 'Bulgarian', 'Lev'],
  'ISK': ['Iceland', 'Icelandic', 'Krona'],
  'DKK': ['Denmark', 'Danish', 'Krone'],
  'THB': ['Thailand', 'Thai', 'Baht'],
  'MYR': ['Malaysia', 'Malaysian', 'Ringgit'],
  'PHP': ['Philippines', 'Philippine', 'Peso'],
  'IDR': ['Indonesia', 'Indonesian', 'Rupiah'],
  'VND': ['Vietnam', 'Vietnamese', 'Dong'],
  'SAR': ['Saudi Arabia', 'Saudi', 'Riyal'],
  'ILS': ['Israel', 'Israeli', 'Shekel'],
  'CLP': ['Chile', 'Chilean', 'Peso'],
  'COP': ['Colombia', 'Colombian', 'Peso'],
  'PEN': ['Peru', 'Peruvian', 'Sol'],
  'ARS': ['Argentina', 'Argentine', 'Peso'],
  'UYU': ['Uruguay', 'Uruguayan', 'Peso'],
  'EGP': ['Egypt', 'Egyptian', 'Pound'],
  'MAD': ['Morocco', 'Moroccan', 'Dirham'],
  'NGN': ['Nigeria', 'Nigerian', 'Naira'],
  'KES': ['Kenya', 'Kenyan', 'Shilling'],
  'GHS': ['Ghana', 'Ghanaian', 'Cedi'],
  'TWD': ['Taiwan', 'Taiwanese', 'Dollar'],
  'PKR': ['Pakistan', 'Pakistani', 'Rupee'],
  'BDT': ['Bangladesh', 'Bangladeshi', 'Taka'],
  'LKR': ['Sri Lanka', 'Sri Lankan', 'Rupee'],
  'NPR': ['Nepal', 'Nepalese', 'Rupee'],
  'AFN': ['Afghanistan', 'Afghan', 'Afghani'],
  'IRR': ['Iran', 'Iranian', 'Rial'],
  'IQD': ['Iraq', 'Iraqi', 'Dinar'],
  'KWD': ['Kuwait', 'Kuwaiti', 'Dinar'],
  'BHD': ['Bahrain', 'Bahraini', 'Dinar'],
  'OMR': ['Oman', 'Omani', 'Rial'],
  'JOD': ['Jordan', 'Jordanian', 'Dinar'],
  'LBP': ['Lebanon', 'Lebanese', 'Pound'],
  'SYP': ['Syria', 'Syrian', 'Pound'],
  'AMD': ['Armenia', 'Armenian', 'Dram'],
  'GEL': ['Georgia', 'Georgian', 'Lari'],
  'AZN': ['Azerbaijan', 'Azerbaijani', 'Manat'],
  'UZS': ['Uzbekistan', 'Uzbek', 'Som'],
  'KZT': ['Kazakhstan', 'Kazakh', 'Tenge'],
  'KGS': ['Kyrgyzstan', 'Kyrgyz', 'Som'],
  'TJS': ['Tajikistan', 'Tajik', 'Somoni'],
  'TMT': ['Turkmenistan', 'Turkmen', 'Manat'],
};

// Currency codes to their full currency names
const CURRENCY_TO_FULL_NAMES: { [key: string]: string } = {
  'USD': 'US Dollar',
  'EUR': 'Euro',
  'GBP': 'British Pound',
  'JPY': 'Japanese Yen',
  'CAD': 'Canadian Dollar',
  'AUD': 'Australian Dollar',
  'CHF': 'Swiss Franc',
  'CNY': 'Chinese Yuan',
  'SEK': 'Swedish Krona',
  'NZD': 'New Zealand Dollar',
  'MXN': 'Mexican Peso',
  'SGD': 'Singapore Dollar',
  'HKD': 'Hong Kong Dollar',
  'NOK': 'Norwegian Krone',
  'KRW': 'South Korean Won',
  'TRY': 'Turkish Lira',
  'RUB': 'Russian Ruble',
  'INR': 'Indian Rupee',
  'BRL': 'Brazilian Real',
  'ZAR': 'South African Rand',
  'AED': 'UAE Dirham',
  'PLN': 'Polish Zloty',
  'CZK': 'Czech Koruna',
  'HUF': 'Hungarian Forint',
  'RON': 'Romanian Leu',
  'BGN': 'Bulgarian Lev',
  'ISK': 'Icelandic Krona',
  'DKK': 'Danish Krone',
  'THB': 'Thai Baht',
  'MYR': 'Malaysian Ringgit',
  'PHP': 'Philippine Peso',
  'IDR': 'Indonesian Rupiah',
  'VND': 'Vietnamese Dong',
  'SAR': 'Saudi Riyal',
  'ILS': 'Israeli Shekel',
  'CLP': 'Chilean Peso',
  'COP': 'Colombian Peso',
  'PEN': 'Peruvian Sol',
  'ARS': 'Argentine Peso',
  'UYU': 'Uruguayan Peso',
  'EGP': 'Egyptian Pound',
  'MAD': 'Moroccan Dirham',
  'NGN': 'Nigerian Naira',
  'KES': 'Kenyan Shilling',
  'GHS': 'Ghanaian Cedi',
  'TWD': 'New Taiwan Dollar',
  'PKR': 'Pakistani Rupee',
  'BDT': 'Bangladeshi Taka',
  'LKR': 'Sri Lankan Rupee',
  'NPR': 'Nepalese Rupee',
  'AFN': 'Afghan Afghani',
  'IRR': 'Iranian Rial',
  'IQD': 'Iraqi Dinar',
  'KWD': 'Kuwaiti Dinar',
  'BHD': 'Bahraini Dinar',
  'OMR': 'Omani Rial',
  'JOD': 'Jordanian Dinar',
  'LBP': 'Lebanese Pound',
  'SYP': 'Syrian Pound',
  'AMD': 'Armenian Dram',
  'GEL': 'Georgian Lari',
  'AZN': 'Azerbaijani Manat',
  'UZS': 'Uzbekistan Som',
  'KZT': 'Kazakhstani Tenge',
  'KGS': 'Kyrgyzstani Som',
  'TJS': 'Tajikistani Somoni',
  'TMT': 'Turkmenistani Manat',
};

export default function CurrencyPicker({
  visible,
  currencies,
  selectedCurrency,
  onSelect,
  onClose,
}: CurrencyPickerProps) {
  const [search, setSearch] = useState("");

  const enhancedCurrencies = useMemo(() => {
    // Filter out non-currency items - only keep items that have valid currency mappings
    const validCurrencies = currencies.filter(currency =>
      CURRENCY_TO_COUNTRIES.hasOwnProperty(currency) &&
      CURRENCY_TO_COUNTRIES[currency].length > 0
    );
    
    // Sort currencies alphabetically
    const sortedCurrencies = validCurrencies.sort((a, b) => a.localeCompare(b));
    
    return sortedCurrencies.map(currency => {
      const countries = CURRENCY_TO_COUNTRIES[currency] || [];
      return {
        code: currency,
        countries: countries,
        searchText: `${currency} ${countries.join(' ')}`.toLowerCase()
      };
    });
  }, [currencies]);

  const filteredCurrencies = useMemo(() => {
    if (!search.trim()) return enhancedCurrencies;
    
    return enhancedCurrencies.filter(item =>
      item.searchText.includes(search.toLowerCase())
    );
  }, [enhancedCurrencies, search]);

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
          placeholder="Search currencies"
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          data={filteredCurrencies}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.currencyItem,
                item.code === selectedCurrency && styles.selectedItem,
              ]}
              onPress={() => handleSelect(item.code)}
            >
              <View style={styles.currencyItemContent}>
                <CurrencyFlag currency={item.code} size={20} />
                <View style={styles.currencyInfo}>
                  <ThemedText
                    style={
                      item.code === selectedCurrency ? styles.selectedText : styles.currencyCode
                    }
                  >
                    {item.code}
                  </ThemedText>
                  {item.countries.length > 0 && (
                    <ThemedText style={styles.countryNames}>
                      {(() => {
                        // Format as "Country, Full Currency Name" for better readability
                        const countryName = item.countries[0] || '';
                        const currencyFullName = CURRENCY_TO_FULL_NAMES[item.code] || '';
                        
                        if (currencyFullName) {
                          return `${countryName}, ${currencyFullName}`;
                        } else {
                          // If no currency name found, just show country name with currency code
                          return `${countryName} (${item.code})`;
                        }
                      })()}
                    </ThemedText>
                  )}
                </View>
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
    backgroundColor: "#fafbfc",
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
    color: "#059669",
    fontWeight: "500",
  },
  title: {
    fontSize: 20,
    color: "#374151",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginBottom: 20,
    color: "#374151",
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currencyItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  selectedItem: {
    backgroundColor: "#f0fdf4",
    borderBottomColor: "#dcfce7",
  },
  currencyItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  countryNames: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  selectedText: {
    fontWeight: "600",
    color: "#059669",
  },
});
