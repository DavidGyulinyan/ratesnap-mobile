import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageDropdown from '@/components/LanguageDropdown';

interface BurgerMenuProps {
  style?: any;
}

export default function BurgerMenu({ style }: BurgerMenuProps) {
   const { t } = useLanguage();
   const router = useRouter();
   const { user, signOut } = useAuth();
   const [isVisible, setIsVisible] = useState(false);

   // Helper function to add opacity to hex colors
   const addOpacity = (hexColor: string, opacity: number) => {
     const r = parseInt(hexColor.slice(1, 3), 16);
     const g = parseInt(hexColor.slice(3, 5), 16);
     const b = parseInt(hexColor.slice(5, 7), 16);
     return `rgba(${r}, ${g}, ${b}, ${opacity})`;
   };

   // Theme colors
   const primaryColor = useThemeColor({}, 'primary');
   const surfaceColor = useThemeColor({}, 'surface');
   const surfaceSecondaryColor = useThemeColor({}, 'surfaceSecondary');
   const textColor = useThemeColor({}, 'text');
   const textSecondaryColor = useThemeColor({}, 'textSecondary');
   const borderColor = useThemeColor({}, 'border');
   const modalBackgroundColor = addOpacity(useThemeColor({}, 'background'), 0.8);
   const errorColor = useThemeColor({}, 'error');

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsVisible(false);
      Alert.alert(t('auth.signoutSuccess'));
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const menuItems = [
    {
      id: 'settings',
      title: '⚙️ ' + t('settings.title'),
      onPress: () => {
        setIsVisible(false);
        router.push('/(tabs)/settings');
      },
    },
    {
      id: 'language',
      title: '🌍 ' + t('settings.language'),
      component: (
        <View style={{ marginTop: 12 }}>
          <LanguageDropdown
            compact={false}
            style={{}}
          />
        </View>
      ),
    },
    ...(user ? [
      {
        id: 'converter',
        title: '💱 ' + t('auth.converter'),
        onPress: () => {
          setIsVisible(false);
          router.push('/guide');
        },
      },
      {
        id: 'user-info',
        title: `👤 ${user.user_metadata?.username || user.email?.split('@')[0] || 'User'}`,
        subtitle: user.email,
        onPress: () => {
          setIsVisible(false);
          router.push('/(tabs)/settings');
        },
      },
    ] : []),
    ...(user ? [
      {
        id: 'signout',
        title: '🚪 ' + t('auth.signout'),
        onPress: handleSignOut,
        danger: true,
      },
    ] : [
      {
        id: 'signin',
        title: '🔐 ' + t('auth.signin'),
        onPress: () => {
          setIsVisible(false);
          router.push('/signin');
        },
      },
      {
        id: 'signup',
        title: '✨ ' + t('auth.signup'),
        onPress: () => {
          setIsVisible(false);
          router.push('/signup');
        },
      },
    ]),
  ];

  return (
    <>
      {/* Burger Menu Button */}
      <TouchableOpacity
        style={[{
          flexDirection: 'column',
          justifyContent: 'space-around',
          width: 24,
          height: 24,
          paddingHorizontal: 2,
        }, style]}
        onPress={() => setIsVisible(true)}
      >
        <View style={{ height: 2, backgroundColor: "#1894EE", borderRadius: 1 }} />
        <View style={{ height: 2, backgroundColor: "#1894EE", borderRadius: 1 }} />
        <View style={{ height: 2, backgroundColor: "#1894EE", borderRadius: 1 }} />
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: modalBackgroundColor, justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: surfaceColor,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: '80%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 5,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 20,
              borderBottomColor: borderColor,
            }}>
              <ThemedText style={{ fontSize: 20, fontWeight: '700' }}>
                RateSnap Menu
              </ThemedText>
              <TouchableOpacity
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: surfaceSecondaryColor,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setIsVisible(false)}
              >
                <ThemedText style={{ fontSize: 16, fontWeight: '500' }}>×</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    marginBottom: 8,
                    backgroundColor: item.danger ? addOpacity(errorColor, 0.20) : surfaceSecondaryColor,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: borderColor,
                  }}
                  onPress={item.onPress}
                >
                  <ThemedText
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: item.danger ? errorColor : textColor,
                    }}
                  >
                    {item.title}
                  </ThemedText>
                  {item.subtitle && (
                    <ThemedText style={{
                      fontSize: 14,
                      color: textSecondaryColor,
                      marginTop: 4,
                    }}>
                      {item.subtitle}
                    </ThemedText>
                  )}
                  {item.component}
                </TouchableOpacity>
              ))}

              {/* App Info */}
              <View style={{
                alignItems: 'center',
                marginTop: 20,
                paddingTop: 20,
                borderTopWidth: 1,
                borderTopColor: "#1894EE",
              }}>
                <ThemedText style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: textSecondaryColor,
                }}>
                  RateSnap v1.0
                </ThemedText>
                <ThemedText style={{
                  fontSize: 12,
                  color: textSecondaryColor,
                  marginTop: 4,
                  textAlign: 'center',
                }}>
                  {t('app.subtitle')}
                </ThemedText>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
