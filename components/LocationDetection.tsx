import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

// Mapping of country codes to currency codes (common ones)
const countryToCurrency: { [key: string]: string } = {
  'US': 'USD',
  'GB': 'GBP',
  'EU': 'EUR', // For EU countries
  'CA': 'CAD',
  'AU': 'AUD',
  'JP': 'JPY',
  'CN': 'CNY',
  'IN': 'INR',
  'BR': 'BRL',
  'MX': 'MXN',
  'AR': 'ARS',
  'CL': 'CLP',
  'CO': 'COP',
  'PE': 'PEN',
  'VE': 'VES',
  'UY': 'UYU',
  'PY': 'PYG',
  'BO': 'BOB',
  'EC': 'USD', // Ecuador uses USD
  'GY': 'GYD',
  'SR': 'SRD',
  'FK': 'FKP',
  'GS': 'GBP', // South Georgia
  'AQ': 'USD', // Antarctica, but unlikely
  'RU': 'RUB',
  'UA': 'UAH',
  'BY': 'BYN',
  'KZ': 'KZT',
  'UZ': 'UZS',
  'TJ': 'TJS',
  'KG': 'KGS',
  'TM': 'TMT',
  'AZ': 'AZN',
  'GE': 'GEL',
  'AM': 'AMD',
  'TR': 'TRY',
  'IR': 'IRR',
  'IQ': 'IQD',
  'SY': 'SYP',
  'LB': 'LBP',
  'JO': 'JOD',
  'SA': 'SAR',
  'YE': 'YER',
  'OM': 'OMR',
  'AE': 'AED',
  'KW': 'KWD',
  'BH': 'BHD',
  'QA': 'QAR',
  'IL': 'ILS',
  'EG': 'EGP',
  'LY': 'LYD',
  'TN': 'TND',
  'DZ': 'DZD',
  'MA': 'MAD',
  'ZA': 'ZAR',
  'ZW': 'ZWL',
  'BW': 'BWP',
  'MZ': 'MZN',
  'AO': 'AOA',
  'NA': 'NAD',
  'ZM': 'ZMW',
  'TZ': 'TZS',
  'KE': 'KES',
  'UG': 'UGX',
  'RW': 'RWF',
  'BI': 'BIF',
  'CD': 'CDF',
  'CG': 'XAF',
  'GA': 'XAF',
  'CM': 'XAF',
  'TD': 'XAF',
  'CF': 'XAF',
  'GQ': 'XAF',
  'SN': 'XOF',
  'ML': 'XOF',
  'GN': 'GNF',
  'SL': 'SLL',
  'LR': 'LRD',
  'CI': 'XOF',
  'BF': 'XOF',
  'TG': 'XOF',
  'BJ': 'XOF',
  'NE': 'XOF',
  'NG': 'NGN',
  'GH': 'GHS',
  'ET': 'ETB',
  'DJ': 'DJF',
  'ER': 'ERN',
  'SD': 'SDG',
  'SS': 'SSP',
  'SO': 'SOS',
  'MG': 'MGA',
  'MW': 'MWK',
  'LS': 'LSL',
  'SZ': 'SZL',
  'KM': 'KMF',
  'SC': 'SCR',
  'MU': 'MUR',
  'RE': 'EUR', // Reunion
  'YT': 'EUR', // Mayotte
  'TH': 'THB',
  'VN': 'VND',
  'MY': 'MYR',
  'SG': 'SGD',
  'ID': 'IDR',
  'PH': 'PHP',
  'BN': 'BND',
  'KH': 'KHR',
  'LA': 'LAK',
  'MM': 'MMK',
  'KR': 'KRW',
  'KP': 'KPW',
  'TW': 'TWD',
  'HK': 'HKD',
  'MO': 'MOP',
  'MN': 'MNT',
  'AF': 'AFN',
  'PK': 'PKR',
  'BD': 'BDT',
  'NP': 'NPR',
  'LK': 'LKR',
  'MV': 'MVR',
  'BT': 'BTN',
  'NZ': 'NZD',
  'FJ': 'FJD',
  'PG': 'PGK',
  'SB': 'SBD',
  'VU': 'VUV',
  'NC': 'XPF',
  'PF': 'XPF',
  'WS': 'WST',
  'TO': 'TOP',
  'TV': 'AUD', // Tuvalu
  'KI': 'AUD', // Kiribati
  'NR': 'AUD', // Nauru
  'MH': 'USD', // Marshall Islands
  'FM': 'USD', // Micronesia
  'PW': 'USD', // Palau
  'MP': 'USD', // Northern Mariana Islands
  'GU': 'USD', // Guam
  'AS': 'USD', // American Samoa
  'VI': 'USD', // US Virgin Islands
  'PR': 'USD', // Puerto Rico
  'DO': 'DOP',
  'HT': 'HTG',
  'JM': 'JMD',
  'TT': 'TTD',
  'BB': 'BBD',
  'LC': 'XCD',
  'VC': 'XCD',
  'GD': 'XCD',
  'AG': 'XCD',
  'DM': 'XCD',
  'KN': 'XCD',
  'MS': 'XCD',
  'BZ': 'BZD',
  'GT': 'GTQ',
  'SV': 'SVC',
  'HN': 'HNL',
  'NI': 'NIO',
  'CR': 'CRC',
  'PA': 'PAB',
  'CU': 'CUP',
  'BS': 'BSD',
  'KY': 'KYD',
  'TC': 'USD', // Turks and Caicos
  'VG': 'USD', // British Virgin Islands
  'AI': 'XCD', // Anguilla
  'BM': 'BMD',
  'GL': 'DKK', // Greenland
  'IS': 'ISK',
  'NO': 'NOK',
  'SE': 'SEK',
  'DK': 'DKK',
  'FI': 'EUR',
  'EE': 'EUR',
  'LV': 'EUR',
  'LT': 'EUR',
  'PL': 'PLN',
  'DE': 'EUR',
  'NL': 'EUR',
  'BE': 'EUR',
  'LU': 'EUR',
  'FR': 'EUR',
  'CH': 'CHF',
  'AT': 'EUR',
  'IT': 'EUR',
  'MT': 'EUR',
  'CY': 'EUR',
  'GR': 'EUR',
  'PT': 'EUR',
  'ES': 'EUR',
  'SI': 'EUR',
  'HR': 'EUR',
  'BA': 'BAM',
  'ME': 'EUR',
  'RS': 'RSD',
  'MK': 'MKD',
  'AL': 'ALL',
  'XK': 'EUR', // Kosovo
  'RO': 'RON',
  'BG': 'BGN',
  'HU': 'HUF',
  'SK': 'EUR',
  'CZ': 'CZK',
  'MD': 'MDL',
  'IE': 'EUR',
  'JE': 'GBP', // Jersey
  'GG': 'GBP', // Guernsey
  'IM': 'GBP', // Isle of Man
  'FO': 'DKK', // Faroe Islands
  'SJ': 'NOK', // Svalbard
  'AX': 'EUR', // Aland Islands
  'SM': 'EUR', // San Marino
  'VA': 'EUR', // Vatican
  'MC': 'EUR', // Monaco
  'LI': 'CHF', // Liechtenstein
  'AD': 'EUR', // Andorra
  'GI': 'GIP',
};

interface LocationDetectionProps {
  onCurrencyDetected?: (currency: string) => void;
  visible?: boolean;
}

export default function LocationDetection({ onCurrencyDetected, visible = true }: LocationDetectionProps) {
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');

  const detectLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get country code
      const address = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address.length > 0) {
        const countryCode = address[0].isoCountryCode;
        const currency = countryCode ? (countryToCurrency[countryCode] || 'USD') : 'USD'; // Default to USD

        setDetectedCurrency(currency);
        if (onCurrencyDetected) {
          onCurrencyDetected(currency);
        }
      } else {
        setError('Could not determine location');
      }
    } catch (err) {
      console.error('Location detection error:', err);
      setError('Failed to detect location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      detectLocation();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={{ padding: 10, alignItems: 'center' }}>
      {loading && <ThemedText style={{ color: textColor }}>Detecting location...</ThemedText>}
      {error && (
        <View style={{ alignItems: 'center' }}>
          <ThemedText style={{ color: 'red', marginBottom: 10 }}>{error}</ThemedText>
          <TouchableOpacity onPress={detectLocation}>
            <ThemedText style={{ color: textColor, textDecorationLine: 'underline' }}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      {detectedCurrency && !loading && !error && (
        <ThemedText style={{ color: textColor }}>
          Detected currency: {detectedCurrency}
        </ThemedText>
      )}
    </View>
  );
}

// Hook version for easier integration
export const useLocationCurrency = () => {
  const [currency, setCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState(false);

  const detectCurrency = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const address = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address.length > 0) {
        const countryCode = address[0].isoCountryCode;
        const detectedCurrency = countryCode ? (countryToCurrency[countryCode] || 'USD') : 'USD';
        setCurrency(detectedCurrency);
      }
    } catch (err) {
      console.error('Location detection error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectCurrency();
  }, []);

  return { currency, loading, detectCurrency };
};