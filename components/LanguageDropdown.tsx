import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface LanguageDropdownProps {
  showFlag?: boolean;
  style?: any;
  textStyle?: any;
  compact?: boolean;
}

const languageData = {
  en: { name: 'English', fullName: 'English', code: 'EN', flag: '🇺🇸' },
  hy: { name: 'Հայերեն', fullName: 'Armenian', code: 'HY', flag: '🇦🇲' },
  ru: { name: 'Русский', fullName: 'Russian', code: 'RU', flag: '🇷🇺' },
  es: { name: 'Español', fullName: 'Spanish', code: 'ES', flag: '🇪🇸' },
  zh: { name: '中文', fullName: 'Chinese', code: 'ZH', flag: '🇨🇳' },
};

export default function LanguageDropdown({ 
  showFlag = true, 
  style, 
  textStyle,
  compact = false
}: LanguageDropdownProps) {
  const { language, setLanguage, t } = useLanguage();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const currentLanguage = languageData[language];

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setIsDropdownVisible(false);
  };

  const renderLanguageItem = ({ item }: { item: { key: Language; data: { name: string; fullName: string; code: string; flag: string } } }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        { borderBottomColor: colors.icon, borderBottomWidth: 0.5 }
      ]}
      onPress={() => handleLanguageSelect(item.key)}
    >
      <View style={styles.dropdownItemContent}>
        {showFlag && <Text style={styles.dropdownFlag}>{item.data.flag}</Text>}
        <View style={styles.languageInfo}>
          <Text
            style={[
              styles.languageName,
              { color: colors.text }
            ]}
          >
            {item.data.name}
          </Text>
          {!compact && (
            <Text
              style={[
                styles.languageSubtext,
                { color: colors.icon }
              ]}
            >
              {item.data.fullName}
            </Text>
          )}
        </View>
        {language === item.key && (
          <Text style={[styles.checkMark, { color: colors.tint }]}>✓</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          { 
            backgroundColor: colors.background,
            borderColor: colors.icon
          },
          style
        ]}
        onPress={() => setIsDropdownVisible(true)}
      >
        <View style={styles.dropdownButtonContent}>
          {showFlag && <Text style={styles.buttonFlag}>{currentLanguage.flag}</Text>}
          <Text
            style={[
              compact ? styles.compactText : styles.buttonText,
              { color: colors.text },
              textStyle
            ]}
          >
            {compact ? currentLanguage.code : currentLanguage.name}
          </Text>
          <Text style={[styles.dropdownArrow, { color: colors.icon }]}>
            ▼
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownVisible(false)}
        >
          <View
            style={[
              styles.dropdownModal,
              { 
                backgroundColor: colors.background,
                borderColor: colors.icon
              }
            ]}
          >
            <View style={styles.dropdownHeader}>
              <Text style={[styles.dropdownTitle, { color: colors.text }]}>
                {t('settings.language')}
              </Text>
              <TouchableOpacity onPress={() => setIsDropdownVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.tint }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={Object.entries(languageData).map(([key, data]) => ({ 
                key: key as Language, 
                data: {
                  name: data.name,
                  fullName: data.fullName,
                  code: data.code,
                  flag: data.flag
                }
              }))}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.key}
              scrollEnabled={false}
              style={styles.languageList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
    flexDirection: 'row',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonFlag: {
    fontSize: 14,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownArrow: {
    fontSize: 10,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: '85%',
    maxWidth: 280,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  languageList: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownFlag: {
    fontSize: 18,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  checkMark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});