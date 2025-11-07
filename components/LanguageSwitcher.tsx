import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface LanguageSwitcherProps {
  showFlag?: boolean;
  buttonStyle?: any;
  textStyle?: any;
}

const languageData = {
  en: { name: 'English', flag: '🇺🇸' },
  hy: { name: 'Հայերեն', flag: '🇦🇲' },
  ru: { name: 'Русский', flag: '🇷🇺' },
  es: { name: 'Español', flag: '🇪🇸' },
  zh: { name: '中文', flag: '🇨🇳' },
};

export default function LanguageSwitcher({ 
  showFlag = true, 
  buttonStyle, 
  textStyle 
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isModalVisible, setIsModalVisible] = useState(false);

  const currentLanguage = languageData[language];

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setIsModalVisible(false);
  };

  const renderLanguageItem = ({ item }: { item: { key: Language; data: { name: string; flag: string } } }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        { borderBottomColor: colors.icon, borderBottomWidth: 0.5 }
      ]}
      onPress={() => handleLanguageSelect(item.key)}
    >
      <View style={styles.languageItemContent}>
        {showFlag && <Text style={styles.flag}>{item.data.flag}</Text>}
        <Text
          style={[
            styles.languageName,
            { color: colors.text }
          ]}
        >
          {item.data.name}
        </Text>
        {language === item.key && (
          <Text style={[styles.checkMark, { color: colors.tint }]}>✓</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.button, buttonStyle]}
        onPress={() => setIsModalVisible(true)}
      >
        <View style={styles.buttonContent}>
          {showFlag && <Text style={styles.flag}>{currentLanguage.flag}</Text>}
          <Text
            style={[
              styles.buttonText,
              { color: colors.text },
              textStyle
            ]}
          >
            {t('settings.language')}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background, borderColor: colors.icon }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('settings.language')}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.tint }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={Object.entries(languageData).map(([key, data]) => ({ key: key as Language, data }))}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.key}
              scrollEnabled={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  flag: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  languageItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  languageItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
  },
  checkMark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});