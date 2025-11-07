import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface LanguageSwitcherButtonProps {
  showFlag?: boolean;
  style?: any;
  textStyle?: any;
  compact?: boolean; // For more compact button style
  variant?: 'button' | 'toggle' | 'segmented'; // Different button styles
}

const languageData = {
  en: { name: 'EN', shortName: 'EN', fullName: 'English', flag: '🇺🇸' },
  hy: { name: 'Հ', shortName: 'ՀԱ', fullName: 'Հայերեն', flag: '🇦🇲' },
  ru: { name: 'RU', shortName: 'РУ', fullName: 'Русский', flag: '🇷🇺' },
  es: { name: 'ES', shortName: 'ES', fullName: 'Español', flag: '🇪🇸' },
  zh: { name: 'ZH', shortName: 'ZH', fullName: '中文', flag: '🇨🇳' },
};

const languageOrder: Language[] = ['en', 'hy', 'ru', 'es', 'zh'];

export default function LanguageSwitcherButton({ 
  showFlag = true, 
  style, 
  textStyle,
  compact = false,
  variant = 'button'
}: LanguageSwitcherButtonProps) {
  const { language, setLanguage, t } = useLanguage();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const currentLanguage = languageData[language];

  const handleLanguageChange = () => {
    const currentIndex = languageOrder.indexOf(language);
    const nextIndex = (currentIndex + 1) % languageOrder.length;
    setLanguage(languageOrder[nextIndex]);
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'toggle':
        return styles.toggleButton;
      case 'segmented':
        return styles.segmentedButton;
      default:
        return styles.button;
    }
  };

  const getContent = () => {
    if (variant === 'segmented') {
      return (
        <View style={styles.segmentedContainer}>
          {languageOrder.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.segmentItem,
                language === lang && styles.segmentItemActive,
                { 
                  borderColor: colors.tint,
                  backgroundColor: language === lang ? colors.tint : 'transparent'
                }
              ]}
              onPress={() => setLanguage(lang)}
            >
              <Text
                style={[
                  styles.segmentText,
                  { 
                    color: language === lang ? 'white' : colors.text 
                  }
                ]}
              >
                {languageData[lang].name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          getButtonStyle(),
          { 
            backgroundColor: colors.tint,
            borderColor: colors.tint
          },
          style
        ]}
        onPress={handleLanguageChange}
      >
        <View style={styles.buttonContent}>
          {showFlag && <Text style={styles.flag}>{currentLanguage.flag}</Text>}
          <Text
            style={[
              compact ? styles.compactText : styles.buttonText,
              { color: 'white' },
              textStyle
            ]}
          >
            {compact ? currentLanguage.shortName : (showFlag ? currentLanguage.shortName : t('settings.language'))}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (variant === 'segmented') {
    return getContent();
  }

  return (
    <View style={styles.container}>
      {getContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Container for single button variants
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 50,
    maxWidth: 120, // Limit max width to prevent overflow
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    maxWidth: 100, // Limit max width
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  compactText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  flag: {
    fontSize: 12,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
  },
  segmentedButton: {
    // Base style for segmented variant
  },
  segmentItem: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRightWidth: 1,
    minWidth: 30,
    maxWidth: 45, // Limit segment width
    alignItems: 'center',
  },
  segmentItemActive: {
    // Active state is handled inline
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '600',
  },
});