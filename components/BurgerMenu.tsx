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

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsVisible(false);
      Alert.alert('Success', 'You have been signed out successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const menuItems = [
    {
      id: 'settings',
      title: '⚙️ Settings',
      onPress: () => {
        setIsVisible(false);
        router.push('/(tabs)/settings');
      },
    },
    {
      id: 'language',
      title: '🌍 Language',
      component: (
        <View style={styles.languageContainer}>
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
        title: '💱 Currency Converter',
        onPress: () => {
          setIsVisible(false);
          router.replace('/');
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
        title: '🚪 Sign Out',
        onPress: handleSignOut,
        danger: true,
      },
    ] : [
      {
        id: 'signin',
        title: '🔐 Sign In',
        onPress: () => {
          setIsVisible(false);
          router.push('/signin');
        },
      },
      {
        id: 'signup',
        title: '✨ Sign Up',
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
        style={[styles.burgerButton, style]}
        onPress={() => setIsVisible(true)}
      >
        <View style={styles.burgerLine} />
        <View style={styles.burgerLine} />
        <View style={styles.burgerLine} />
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            {/* Header */}
            <View style={styles.menuHeader}>
              <ThemedText style={styles.menuTitle}>
                RateSnap Menu
              </ThemedText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <ThemedText style={styles.closeButtonText}>×</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <ScrollView
              style={styles.menuItems}
              contentContainerStyle={styles.menuItemsContent}
              showsVerticalScrollIndicator={false}
            >
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    item.danger && styles.menuItemDanger,
                  ]}
                  onPress={item.onPress}
                >
                  <ThemedText
                    style={[
                      styles.menuItemText,
                      item.danger && styles.menuItemTextDanger,
                    ]}
                  >
                    {item.title}
                  </ThemedText>
                  {item.subtitle && (
                    <ThemedText style={styles.menuItemSubtitle}>
                      {item.subtitle}
                    </ThemedText>
                  )}
                  {item.component}
                </TouchableOpacity>
              ))}

              {/* App Info */}
              <View style={styles.appInfo}>
                <ThemedText style={styles.appInfoText}>
                  RateSnap v1.0
                </ThemedText>
                <ThemedText style={styles.appInfoSubtext}>
                  Professional Currency Converter
                </ThemedText>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  burgerButton: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: 24,
    height: 24,
    paddingHorizontal: 2,
  },
  burgerLine: {
    height: 2,
    backgroundColor: '#6366f1',
    borderRadius: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f3f4f6',
    borderRadius: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  menuItems: {
    flex: 1,
  },
  menuItemsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  menuItemDanger: {
    backgroundColor: 'rgba(254, 242, 242, 0.8)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuItemTextDanger: {
    color: '#dc2626',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  languageContainer: {
    marginTop: 12,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.4)',
  },
  appInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  appInfoSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});