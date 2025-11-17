import React, { useState, useMemo } from 'react';
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
  hi: { name: 'हिंदी', fullName: 'Hindi', code: 'HI', flag: '🇮🇳' },
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

  const styles = useMemo(() => StyleSheet.create({
    dropdownButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
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
      fontSize: 12,
      fontWeight: '600',
      flexWrap: 'wrap',
    },
    compactText: {
      fontSize: 11,
      fontWeight: '700',
      flexWrap: 'wrap',
    },
    dropdownArrow: {
      fontSize: 10,
      marginLeft: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      backdropFilter: 'blur(4px)',
    },
    dropdownModal: {
      width: '90%',
      maxWidth: 320,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    dropdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
    },
    dropdownTitle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: '50%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    languageList: {
      maxHeight: 400,
    },
    dropdownItem: {
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    dropdownItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    dropdownFlag: {
      fontSize: 24,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    languageSubtext: {
      fontSize: 13,
      fontWeight: '400',
    },
    checkMark: {
      fontSize: 18,
      fontWeight: 'bold',
    },
  }), []);

  const currentLanguage = languageData[language];

  const handleLanguageSelect = async (selectedLanguage: Language) => {
    await setLanguage(selectedLanguage);
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
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsDropdownVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={Object.entries(languageData).map(([
                key, data]) => ({
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
              scrollEnabled={true}
              style={styles.languageList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
