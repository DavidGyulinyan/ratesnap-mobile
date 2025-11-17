import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getSupabaseClient } from '@/lib/supabase-safe';
import { getAsyncStorage } from '@/lib/storage';

export default function SettingsScreen() {
   const { t, language } = useLanguage();
   const router = useRouter();
   const { user, signOut } = useAuth();
   const { themePreference, setThemePreference } = useTheme();

   // Theme colors
   const backgroundColor = useThemeColor({}, 'background');
   const surfaceColor = useThemeColor({}, 'surface');
   const surfaceSecondaryColor = useThemeColor({}, 'surfaceSecondary');
   const primaryColor = useThemeColor({}, 'primary');
   const textColor = useThemeColor({}, 'text');
   const textSecondaryColor = useThemeColor({}, 'textSecondary');
   const borderColor = useThemeColor({}, 'border');
   const successColor = useThemeColor({}, 'success');
   const errorColor = useThemeColor({}, 'error');
   const warningColor = useThemeColor({}, 'warning');
   const shadowColor = useThemeColor({}, 'text'); // Use text color for shadows in dark mode

   const styles = useMemo(() => StyleSheet.create({
     // ===========================================
     // LAYOUT & CONTAINER STYLES
     // ===========================================
     container: {
       flex: 1,
       backgroundColor: 'transparent',
     },
     scrollView: {
       flex: 1,
     },
     bottomSpacer: {
       height: 40,
     },

     // ===========================================
     // HEADER STYLES
     // ===========================================
     header: {
       padding: 20,
       paddingBottom: 10,
     },
     title: {
       fontSize: 24,
       fontWeight: '700',
       marginBottom: 8,
     },
     subtitle: {
       fontSize: 14,
     },

     // ===========================================
     // SECTION STYLES
     // ===========================================
     section: {
       margin: 16,
       marginBottom: 8,
       padding: 20,
       borderRadius: 16,
       shadowOffset: { width: 2, height: 4 },
       shadowOpacity: 0.04,
       shadowRadius: 3,
       elevation: 1,
     },
     touchableSection: {
       padding: 0,
       paddingVertical: 0,
       backgroundColor: 'transparent',
       borderWidth: 0,
       shadowOpacity: 0,
       elevation: 0,
       marginBottom: 0,
     },
     sectionHeader: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginBottom: 12,
     },
     sectionTitle: {
       fontSize: 18,
       fontWeight: '700',
     },
     sectionDescription: {
       fontSize: 14,
       lineHeight: 20,
     },

     // ===========================================
     // FORM ELEMENTS
     // ===========================================
     form: {
       gap: 16,
     },
     inputGroup: {
       gap: 8,
     },
     inputLabel: {
       fontSize: 14,
       fontWeight: '600',
     },
     input: {
       borderRadius: 10,
       padding: 12,
       fontSize: 14,
     },

     // ===========================================
     // INFO CARDS & DISPLAY
     // ===========================================
     infoCard: {
       borderRadius: 12,
       padding: 16,
     },
     infoRow: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginBottom: 8,
     },
     infoLabel: {
       fontSize: 14,
       fontWeight: '500',
     },
     infoValue: {
       fontSize: 14,
       fontWeight: '600',
       flex: 1,
       textAlign: 'right',
     },

     // ===========================================
     // BUTTONS
     // ===========================================
     editButton: {
       paddingHorizontal: 12,
       paddingVertical: 6,
       borderRadius: 8,
     },
     editButtonText: {
       fontSize: 12,
       fontWeight: '600',
     },
     buttonGroup: {
       flexDirection: 'row',
       gap: 12,
       marginTop: 8,
     },
     button: {
       flex: 1,
       padding: 14,
       borderRadius: 10,
       alignItems: 'center',
     },
     buttonPrimary: {},
     buttonPrimaryText: {
       fontSize: 15,
       fontWeight: '600',
     },
     buttonSecondary: {},
     buttonSecondaryText: {
       fontSize: 15,
       fontWeight: '600',
     },

     // ===========================================
     // SETTINGS ITEMS
     // ===========================================
     settingItem: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       paddingVertical: 16,
       paddingHorizontal: 20,
       marginHorizontal: -20,
     },
     settingItemText: {
       fontSize: 15,
       fontWeight: '500',
     },
     settingValueContainer: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: 8,
     },
     settingValue: {
       fontSize: 14,
       fontWeight: '400',
     },
     arrowText: {
       fontSize: 18,
       fontWeight: '300',
     },

     // ===========================================
     // MODAL & OVERLAY ELEMENTS
     // ===========================================
     closeButton: {
       width: 32,
       height: 32,
       borderRadius: '50%',
       alignItems: 'center',
       justifyContent: 'center',
     },
     closeButtonActive: {},
     closeButtonText: {
       fontSize: 16,
       fontWeight: '500',
       lineHeight: 16,
     },
     closeButtonTextActive: {},

     // ===========================================
     // TERMS & LEGAL CONTENT
     // ===========================================
     termsContent: {
       marginTop: 16,
       flexGrow: 1,
     },
     termsText: {
       fontSize: 14,
       lineHeight: 22,
     },
     termsFullView: {
       margin: 16,
       marginBottom: 8,
       borderRadius: 16,
       shadowOffset: { width: 0, height: 1 },
       shadowOpacity: 0.04,
       shadowRadius: 3,
       elevation: 1,
       maxHeight: '70%',
     },
     termsScrollView: {
       flex: 1,
       padding: 20,
       paddingTop: 0,
     },
     termsContainer: {
       paddingBottom: 20,
     },

     // ===========================================
     // DANGER ZONE & DELETION
     // ===========================================
     dangerSection: {
       borderColor: errorColor + '4d',
       backgroundColor: errorColor + '1a',
     },
     dangerHeader: {
       marginBottom: 16,
     },
     dangerTitle: {
       color: errorColor,
       fontSize: 18,
       fontWeight: '700',
       marginBottom: 4,
     },
     dangerSubtitle: {
       fontSize: 14,
       color: errorColor,
       opacity: 0.8,
     },
     dangerItem: {
       backgroundColor: errorColor + '0d',
       marginHorizontal: -20,
       paddingHorizontal: 20,
       borderRadius: 12,
     },

     // Delete confirmation styles
     deleteConfirmContainer: {
       gap: 20,
     },
     deleteWarningCard: {
       flexDirection: 'row',
       padding: 16,
       backgroundColor: errorColor + '26',
       borderRadius: 12,
       alignItems: 'flex-start',
       gap: 12,
     },
     warningIconContainer: {
       width: 32,
       height: 32,
       borderRadius: 16,
       backgroundColor: errorColor + '1a',
       alignItems: 'center',
       justifyContent: 'center',
     },
     warningIcon: {
       fontSize: 16,
     },
     warningContent: {
       flex: 1,
     },
     deleteWarningTitle: {
       fontSize: 16,
       fontWeight: '700',
       color: errorColor,
       marginBottom: 4,
     },
     deleteWarningDescription: {
       fontSize: 14,
       color: errorColor,
       opacity: 0.9,
       lineHeight: 20,
     },

     // Credential inputs
     credentialInputsContainer: {
       gap: 16,
     },
     credentialInput: {
       borderRadius: 10,
       padding: 14,
       fontSize: 16,
       backgroundColor: surfaceColor,
       color: textColor,
     },

     // Action buttons
     deleteActionButtons: {
       flexDirection: 'row',
       gap: 12,
     },
     actionButton: {
       flex: 1,
       padding: 14,
       borderRadius: 10,
       alignItems: 'center',
       justifyContent: 'center',
     },
     cancelButton: {
       backgroundColor: surfaceSecondaryColor,
     },
     cancelButtonText: {
       color: textSecondaryColor,
       fontSize: 15,
       fontWeight: '600',
     },
     deleteButton: {
       backgroundColor: errorColor,
     },
     deleteButtonText: {
       color: 'white',
       fontSize: 15,
       fontWeight: '600',
     },

     // Delete account button
     deleteAccountButton: {
       backgroundColor: errorColor + '0d',
       borderRadius: 12,
       overflow: 'hidden',
     },
     deleteButtonContent: {
       flexDirection: 'row',
       alignItems: 'center',
       padding: 16,
       gap: 12,
     },
     deleteIconContainer: {
       width: 40,
       height: 40,
       borderRadius: 20,
       backgroundColor: errorColor + '1a',
       alignItems: 'center',
       justifyContent: 'center',
     },
     deleteIcon: {
       fontSize: 18,
     },
     deleteButtonTextContainer: {
       flex: 1,
     },
     deleteButtonTitle: {
       fontSize: 16,
       fontWeight: '600',
       color: errorColor,
       marginBottom: 2,
     },
     deleteButtonSubtitle: {
       fontSize: 14,
       color: errorColor,
       opacity: 0.8,
     },
     deleteArrowIcon: {
       fontSize: 18,
       color: errorColor,
       opacity: 0.6,
     },

     // ===========================================
     // SIGN OUT & ACCOUNT ACTIONS
     // ===========================================
     signOutButton: {
       backgroundColor: surfaceSecondaryColor,
       borderRadius: 12,
       overflow: 'hidden',
     },
     signOutContent: {
       flexDirection: 'row',
       alignItems: 'center',
       padding: 16,
       gap: 12,
     },
     signOutIconContainer: {
       width: 40,
       height: 40,
       borderRadius: 20,
       backgroundColor: primaryColor + '1a',
       alignItems: 'center',
       justifyContent: 'center',
     },
     signOutIcon: {
       fontSize: 18,
     },
     signOutText: {
       fontSize: 16,
       fontWeight: '600',
       color: primaryColor,
     },

     // ===========================================
     // PENDING DELETION STATUS
     // ===========================================
     pendingDeletionSection: {
       borderColor: warningColor + '4d',
       backgroundColor: warningColor + '1a',
     },
     pendingDeletionHeader: {
       flexDirection: 'row',
       alignItems: 'flex-start',
       marginBottom: 16,
       gap: 12,
     },
     pendingIconContainer: {
       width: 32,
       height: 32,
       borderRadius: 16,
       backgroundColor: warningColor + '1a',
       alignItems: 'center',
       justifyContent: 'center',
     },
     pendingIcon: {
       fontSize: 16,
     },
     pendingContent: {
       flex: 1,
     },
     pendingTitle: {
       fontSize: 16,
       fontWeight: '700',
       color: warningColor,
       marginBottom: 4,
     },
     pendingDescription: {
       fontSize: 14,
       color: warningColor,
       opacity: 0.9,
       lineHeight: 20,
     },
     cancelDeletionButton: {
       backgroundColor: warningColor + '0d',
       borderRadius: 12,
       overflow: 'hidden',
     },
     cancelDeletionContent: {
       flexDirection: 'row',
       alignItems: 'center',
       padding: 16,
       gap: 12,
     },
     cancelIconContainer: {
       width: 40,
       height: 40,
       borderRadius: 20,
       backgroundColor: warningColor + '1a',
       alignItems: 'center',
       justifyContent: 'center',
     },
     cancelIcon: {
       fontSize: 18,
     },
     cancelDeletionText: {
       fontSize: 16,
       fontWeight: '600',
       color: warningColor,
     },

     // ===========================================
     // THEME SELECTION
     // ===========================================
     themeOptions: {
       gap: 12,
     },
     themeOption: {
       borderRadius: 12,
       overflow: 'hidden',
     },
     themeOptionSelected: {},
     themeOptionContent: {
       flexDirection: 'row',
       alignItems: 'center',
       padding: 16,
       gap: 12,
     },
     themeIconContainer: {
       width: 40,
       height: 40,
       borderRadius: 20,
       alignItems: 'center',
       justifyContent: 'center',
     },
     themeIcon: {
       fontSize: 18,
     },
     themeTextContainer: {
       flex: 1,
     },
     themeTitle: {
       fontSize: 16,
       fontWeight: '600',
       marginBottom: 2,
     },
     themeDescription: {
       fontSize: 14,
       lineHeight: 18,
     },
     checkmarkContainer: {
       width: 24,
       height: 24,
       borderRadius: 12,
       alignItems: 'center',
       justifyContent: 'center',
     },
     checkmark: {
       fontSize: 14,
       fontWeight: '600',
     },
   }), [backgroundColor, surfaceColor, surfaceSecondaryColor, primaryColor, textColor, textSecondaryColor, borderColor, successColor, errorColor, warningColor, shadowColor]);

   const [showAccountInfo, setShowAccountInfo] = useState(false);
   const [showTerms, setShowTerms] = useState(false);
   const [showThemeSelection, setShowThemeSelection] = useState(false);
  
  // Account info form state
  const [accountInfo, setAccountInfo] = useState({
    username: user?.user_metadata?.username || user?.email?.split('@')[0] || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletionInProgress, setDeletionInProgress] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(false);
  const [closeButtonPressed, setCloseButtonPressed] = useState(false);

  // Exchange rate data state
  const [exchangeRateData, setExchangeRateData] = useState<{
    time_last_update_utc?: string;
    time_next_update_utc?: string;
  } | null>(null);

  // Terms of use - moved to external file for better performance
  const getCurrentTerms = () => {
    try {
      // This will be replaced with actual terms content from external file
      // For now, using a simplified version to avoid large inline text
      const simplifiedTerms = {
        en: `RateSnap Terms of Use

Effective Date: 10.01.2025

Welcome to RateSnap. By using this application, you agree to our Terms of Use.

1. Service Description: RateSnap provides currency conversion tools for personal use.

2. Personal Use Only: This app is for personal, non-commercial use only.

3. Accuracy Disclaimer: Exchange rates may vary. We don't guarantee accuracy.

4. Limitation of Liability: Use at your own risk. We're not liable for damages.

5. Changes: We may update these terms at any time.

Thank you for choosing RateSnap!`,
        es: `Términos de Uso de RateSnap

Fecha: 10.01.2025

Bienvenido a RateSnap. Al usar esta aplicación, aceptas nuestros Términos de Uso.

1. Descripción: RateSnap proporciona herramientas de conversión personal.

2. Uso Personal: Esta app es solo para uso personal, no comercial.

3. Descargo: Las tasas pueden variar. No garantizamos exactitud.

4. Limitación: Usa bajo tu propio riesgo. No somos responsables.

5. Cambios: Podemos actualizar estos términos en cualquier momento.

¡Gracias por elegir RateSnap!`,
        ru: `Условия использования RateSnap

Дата: 10.01.2025

Добро пожаловать в RateSnap. Используя это приложение, вы соглашаетесь с нашими условиями.

1. Описание: RateSnap предоставляет инструменты конвертации для личного использования.

2. Личное использование: Это приложение только для личного, некоммерческого использования.

3. Отказ: Курсы могут варьироваться. Мы не гарантируем точность.

4. Ограничение: Используйте на свой риск. Мы не несем ответственности.

5. Изменения: Мы можем обновлять эти условия в любое время.

Спасибо, что выбрали RateSnap!`,
        zh: `RateSnap 使用条款

日期: 2025年1月10日

欢迎使用RateSnap。使用此应用程序即表示您同意我们的使用条款。

1. 服务说明：RateSnap提供个人货币转换工具。

2. 仅限个人使用：此应用程序仅供个人非商业使用。

3. 免责声明：汇率可能会有所变动。我们不保证准确性。

4. 责任限制：使用风险自负。我们不承担责任。

5. 变更：我们可能会随时更新这些条款。

感谢选择RateSnap！`,
        hi: `RateSnap उपयोग की शर्तें

दिनांक: 10.01.2025

RateSnap में आपका स्वागत है। इस एप्लिकेशन का उपयोग करके, आप हमारी उपयोग की शर्तों से सहमत होते हैं।

1. सेवा विवरण: RateSnap व्यक्तिगत मुद्रा रूपांतरण उपकरण प्रदान करता है।

2. केवल व्यक्तिगत उपयोग: यह एप्लिकेशन केवल व्यक्तिगत, गैर-व्यावसायिक उपयोग के लिए है।

3. अस्वीकरण: विनिमय दरें भिन्न हो सकती हैं। हम सटीकता की गारंटी नहीं देते।

4. सीमित देयता: अपने जोखिम पर उपयोग करें। हम जिम्मेदार नहीं हैं।

5. परिवर्तन: हम इन शर्तों को कभी भी अपडेट कर सकते हैं।

RateSnap चुनने के लिए धन्यवाद!`,
        hy: `RateSnap-ի օգտագործման պայմանները

Ամսաթիվ: 10.01.2025

Բարի գալուստ RateSnap: Այս հավելվածն օգտագործելով՝ դուք համաձայնում եք մեր Օգտագործման Պայմանների հետ:

1. Ծառայության նկարագրություն: RateSnap-ը անհատական արժույթի փոխարկման գործիքներ է տրամադրում:

2. Միայն անհատական օգտագործում: Այս հավելվածը միայն անհատական, ոչ առևտրական օգտագործման համար է:

3. Հրաժարում: Փոխարժեքները կարող են տարբերվել: Մենք չենք երաշխավորում ճշտությունը:

4. Սահմանափակում: Օգտագործեք ձեր ռիսկով: Մենք պատասխանատվություն չենք կրում:

5. Փոփոխություններ: Մենք կարող ենք թարմացնել այս պայմանները ցանկացած պահի:

RateSnap-ն ընտրելու համար շնորհակալություն!`
      };

      const currentTerms = simplifiedTerms[language as keyof typeof simplifiedTerms];
      return currentTerms || simplifiedTerms.en; // Fallback to English
    } catch (error) {
      console.error('Error loading terms of use:', error);
      return 'Terms of use are temporarily unavailable. Please try again later.';
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Success', 'You have been signed out successfully.');
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleUpdateAccountInfo = async () => {
    if (!accountInfo.username.trim() || !accountInfo.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(accountInfo.email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user) {
        throw new Error('Authentication service not available');
      }

      // Check if email is being changed
      const emailChanged = accountInfo.email !== user.email;
      
      const updateData: any = {
        data: {
          username: accountInfo.username,
        }
      };

      // Only update email if it changed
      if (emailChanged) {
        updateData.email = accountInfo.email;
      }

      // Update user metadata
      const { error } = await supabase.auth.updateUser(updateData);

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('already registered')) {
          Alert.alert('Error', 'This email address is already in use by another account.');
        } else if (error.message.includes('Invalid email')) {
          Alert.alert('Error', 'Please enter a valid email address.');
        } else {
          Alert.alert('Error', error.message || 'Failed to update account information.');
        }
      } else {
        Alert.alert('Success', emailChanged
          ? 'Account information updated successfully. You may need to verify your new email address.'
          : 'Account information updated successfully.'
        );
        setShowAccountInfo(false);
      }
    } catch (error: any) {
      console.error('Account update error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update account information. Please check your connection and try again.'
      );
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user) {
        throw new Error('Authentication service not available');
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Password updated successfully.');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordForm(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password.');
    }
  };

  const handleDeleteAccount = () => {
    setDeletePassword('');
    setShowDeletePassword(true);
  };

  const verifyPasswordAndDelete = async () => {
    // Validate inputs
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm account deletion.');
      return;
    }

    if (!confirmEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address to confirm account deletion.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(confirmEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    // Verify email matches user's email
    if (confirmEmail.toLowerCase() !== user?.email?.toLowerCase()) {
      Alert.alert('Error', 'The email address does not match your account. Please try again.');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user) {
        throw new Error('Authentication service not available');
      }

      // Verify password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: deletePassword,
      });

      if (signInError) {
        Alert.alert('Error', 'Incorrect password. Please try again.');
        return;
      }

      // Both password and email verified, proceed with account deletion
      await confirmDeleteAccount();
      setShowDeletePassword(false);
      setDeletePassword('');
      setConfirmEmail('');
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to verify credentials. Please try again.');
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user) {
        throw new Error('Authentication service not available');
      }

      // Set deletion in progress
      setDeletionInProgress(true);

      // Create a pending deletion record to track this request
      const { error: deletionError } = await supabase
        .from('account_deletions')
        .upsert({
          user_id: user.id,
          email: user.email,
          requested_at: new Date().toISOString(),
          status: 'pending'
        });

      if (deletionError) {
        console.warn('Failed to create deletion record:', deletionError);
      }

      // Clean up user data from custom tables
      const { error: savedRatesError } = await supabase
        .from('saved_rates')
        .delete()
        .eq('user_id', user.id);
      
      if (savedRatesError) {
        console.warn('Failed to delete saved rates:', savedRatesError);
      }

      const { error: rateAlertsError } = await supabase
        .from('rate_alerts')
        .delete()
        .eq('user_id', user.id);
      
      if (rateAlertsError) {
        console.warn('Failed to delete rate alerts:', rateAlertsError);
      }
      
      // Sign out the user
      await signOut();
      
      // Set pending deletion flag
      setPendingDeletion(true);
      setDeletionInProgress(false);
      
      Alert.alert(
        'Account Deletion Scheduled',
        'Your account deletion has been scheduled. You have been signed out.\n\nThe deletion will be completed within 24 hours. If you sign back in during this time, the deletion will be automatically cancelled.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (error: any) {
      console.error('Account deletion error:', error);
      setDeletionInProgress(false);
      Alert.alert(
        'Error',
        error.message || 'An error occurred while processing your request. Please contact support if the problem persists.'
      );
    }
  };

  const cancelPendingDeletion = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user) return;

      // Remove the pending deletion record
      const { error } = await supabase
        .from('account_deletions')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.warn('Failed to cancel deletion:', error);
      }

      setPendingDeletion(false);
      setDeletionInProgress(false);
      
      Alert.alert(
        'Deletion Cancelled',
        'Your account deletion request has been cancelled. Your account remains active.'
      );
    } catch (error: any) {
      console.error('Error cancelling deletion:', error);
      Alert.alert('Error', 'Failed to cancel deletion. Please contact support.');
    }
  };

  // Check for pending deletion on component mount
  useEffect(() => {
    const checkPendingDeletion = async () => {
      if (!user) return;

      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        const { data, error } = await supabase
          .from('account_deletions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .single();

        if (data && !error) {
          setPendingDeletion(true);
        }
      } catch (error) {
        console.error('Error checking pending deletion:', error);
      }
    };

    checkPendingDeletion();
  }, [user]);

  // Load exchange rate data on component mount
  useEffect(() => {
    const loadExchangeRateData = async () => {
      try {
        const storage = getAsyncStorage();
        const cachedData = await storage.getItem("cachedExchangeRates");
        if (cachedData) {
          const data = JSON.parse(cachedData);
          setExchangeRateData({
            time_last_update_utc: data.time_last_update_utc,
            time_next_update_utc: data.time_next_update_utc,
          });
        }
      } catch (error) {
        console.error('Error loading exchange rate data:', error);
      }
    };

    loadExchangeRateData();
  }, []);

  const renderAccountInfoSection = () => {
    if (!user) {
      return (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            {t('settings.accountInfo')}
          </ThemedText>
          <ThemedText style={styles.sectionDescription}>
            {t('settings.loginRequired')}
          </ThemedText>
        </View>
      );
    }

    if (showAccountInfo) {
      return (
        <View style={[{ backgroundColor: surfaceColor, borderColor: borderColor, shadowColor: shadowColor }, styles.section]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[{ color: textColor }, styles.sectionTitle]}>
              {t('settings.updateAccountInfo')}
            </ThemedText>
            <TouchableOpacity
              style={[
                { backgroundColor: surfaceSecondaryColor },
                styles.closeButton,
                closeButtonPressed && { backgroundColor: surfaceColor }
              ]}
              onPressIn={() => setCloseButtonPressed(true)}
              onPressOut={() => setCloseButtonPressed(false)}
              onPress={() => {
                setShowAccountInfo(false);
                setCloseButtonPressed(false);
              }}
            >
              <ThemedText style={[
                { color: textSecondaryColor },
                styles.closeButtonText,
                closeButtonPressed && { color: textColor }
              ]}>×</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={[{ color: textColor }, styles.inputLabel]}>
                {t('auth.username')} *
              </ThemedText>
              <TextInput
                style={[{ backgroundColor: surfaceColor, borderColor: borderColor, color: textColor }, styles.input]}
                value={accountInfo.username}
                onChangeText={(text: string) =>
                  setAccountInfo({ ...accountInfo, username: text })
                }
                placeholder={t('auth.username')}
                placeholderTextColor={textSecondaryColor}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[{ color: textColor }, styles.inputLabel]}>
                {t('auth.email')} *
              </ThemedText>
              <TextInput
                style={[{ backgroundColor: surfaceColor, borderColor: borderColor, color: textColor }, styles.input]}
                value={accountInfo.email}
                onChangeText={(text: string) =>
                  setAccountInfo({ ...accountInfo, email: text })
                }
                placeholder={t('auth.email')}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={textSecondaryColor}
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[{ backgroundColor: surfaceSecondaryColor, borderColor: borderColor }, styles.button, styles.buttonSecondary]}
                onPress={() => {
                  console.log('Cancel account info edit');
                  setShowAccountInfo(false);
                }}
              >
                <ThemedText style={[{ color: textSecondaryColor }, styles.buttonSecondaryText]}>
                  {t('common.cancel')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[{ backgroundColor: primaryColor }, styles.button, styles.buttonPrimary]}
                onPress={handleUpdateAccountInfo}
              >
                <ThemedText style={[{ color: textColor }, styles.buttonPrimaryText]}>
                  {t('common.save')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[{ backgroundColor: surfaceColor, borderColor: borderColor, shadowColor: shadowColor }, styles.section]}>
        <View style={styles.sectionHeader}>
          <ThemedText style={[{ color: textColor }, styles.sectionTitle]}>
            {t('settings.accountInfo')}
          </ThemedText>
          <TouchableOpacity
            style={[{ backgroundColor: primaryColor }, styles.editButton]}
            onPress={() => {
              console.log('Edit account info clicked');
              setShowAccountInfo(true);
            }}
          >
            <ThemedText style={[{ color: textColor }, styles.editButtonText]}>
              {t('common.edit')}
            </ThemedText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[{ backgroundColor: surfaceSecondaryColor, borderColor: borderColor }, styles.infoCard]}
          onPress={() => {
            console.log('Edit account info clicked');
            setShowAccountInfo(true);
          }}
        >
          <View style={styles.infoRow}>
            <ThemedText style={[{ color: textSecondaryColor }, styles.infoLabel]}>
              {t('auth.username')}:
            </ThemedText>
            <ThemedText style={[{ color: textColor }, styles.infoValue]}>
              {user?.user_metadata?.username || user?.email?.split('@')[0]}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={[{ color: textSecondaryColor }, styles.infoLabel]}>
              {t('auth.email')}:
            </ThemedText>
            <ThemedText style={[{ color: textColor }, styles.infoValue]}>
              {user?.email}
            </ThemedText>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPasswordSection = () => {
    if (!user) return null;

    if (showPasswordForm) {
      return (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            {t('settings.changePassword')}
          </ThemedText>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                {t('settings.newPassword')} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={passwordForm.newPassword}
                onChangeText={(text: string) =>
                  setPasswordForm({ ...passwordForm, newPassword: text })
                }
                placeholder={t('settings.newPassword')}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                {t('settings.confirmNewPassword')} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={passwordForm.confirmPassword}
                onChangeText={(text: string) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: text })
                }
                placeholder={t('settings.confirmNewPassword')}
                secureTextEntry
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowPasswordForm(false)}
              >
                <ThemedText style={styles.buttonSecondaryText}>
                  {t('common.cancel')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleUpdatePassword}
              >
                <ThemedText style={styles.buttonPrimaryText}>
                  {t('common.update')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[{ backgroundColor: surfaceColor, borderColor: borderColor, shadowColor: shadowColor }, styles.section]}>
        <View style={styles.sectionHeader}>
          <ThemedText style={[{ color: textColor }, styles.sectionTitle]}>
            {t('settings.password')}
          </ThemedText>
          <TouchableOpacity
            style={[{ backgroundColor: primaryColor }, styles.editButton]}
            onPress={() => setShowPasswordForm(true)}
          >
            <ThemedText style={[{ color: textColor }, styles.editButtonText]}>
              {t('common.change')}
            </ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={[{ color: textSecondaryColor }, styles.sectionDescription]}>
          {t('settings.passwordUpdateDescription')}
        </ThemedText>
      </View>
    );
  };

  const renderTermsSection = () => {
    if (showTerms) {
      return (
        <View style={styles.termsFullView}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              {t('settings.termsOfUse')}
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.closeButton,
                closeButtonPressed && styles.closeButtonActive
              ]}
              onPressIn={() => setCloseButtonPressed(true)}
              onPressOut={() => setCloseButtonPressed(false)}
              onPress={() => {
                setShowTerms(false);
                setCloseButtonPressed(false);
              }}
            >
              <ThemedText style={[
                styles.closeButtonText,
                closeButtonPressed && styles.closeButtonTextActive
              ]}>×</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.termsScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <View style={styles.termsContainer}>
              <ThemedText style={styles.termsText}>
                {getCurrentTerms()}
              </ThemedText>
            </View>
          </ScrollView>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.section, styles.touchableSection]}
        onPress={() => setShowTerms(true)}
      >
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>
            {t('settings.termsOfUse')}
          </ThemedText>
          <ThemedText style={styles.arrowText}>›</ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  const renderThemeSelection = () => {
    if (showThemeSelection) {
      return (
        <View style={[{ backgroundColor: surfaceColor, borderColor: borderColor, shadowColor: shadowColor }, styles.section]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[{ color: textColor }, styles.sectionTitle]}>
              {t('settings.theme')}
            </ThemedText>
            <TouchableOpacity
              style={[
                { backgroundColor: surfaceSecondaryColor },
                styles.closeButton,
                closeButtonPressed && { backgroundColor: surfaceColor }
              ]}
              onPressIn={() => setCloseButtonPressed(true)}
              onPressOut={() => setCloseButtonPressed(false)}
              onPress={() => {
                setShowThemeSelection(false);
                setCloseButtonPressed(false);
              }}
            >
              <ThemedText style={[
                { color: textSecondaryColor },
                styles.closeButtonText,
                closeButtonPressed && { color: textColor }
              ]}>×</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                { backgroundColor: surfaceSecondaryColor, borderColor: borderColor },
                styles.themeOption,
                themePreference === 'system' && { backgroundColor: primaryColor, borderColor: primaryColor }
              ]}
              onPress={() => {
                setThemePreference('system');
                setShowThemeSelection(false);
              }}
            >
              <View style={styles.themeOptionContent}>
                <View style={[{ backgroundColor: surfaceColor }, styles.themeIconContainer]}>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.themeIcon]}>📱</ThemedText>
                </View>
                <View style={styles.themeTextContainer}>
                  <ThemedText style={[{ color: textColor }, styles.themeTitle]}>
                    {t('settings.system')}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.themeDescription]}>
                    {t('settings.systemThemeDescription')}
                  </ThemedText>
                </View>
                {themePreference === 'system' && (
                  <View style={[{ backgroundColor: textColor }, styles.checkmarkContainer]}>
                    <ThemedText style={[{ color: surfaceColor }, styles.checkmark]}>✓</ThemedText>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                { backgroundColor: surfaceSecondaryColor, borderColor: borderColor },
                styles.themeOption,
                themePreference === 'light' && { backgroundColor: primaryColor, borderColor: primaryColor }
              ]}
              onPress={() => {
                setThemePreference('light');
                setShowThemeSelection(false);
              }}
            >
              <View style={styles.themeOptionContent}>
                <View style={[{ backgroundColor: surfaceColor }, styles.themeIconContainer]}>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.themeIcon]}>☀️</ThemedText>
                </View>
                <View style={styles.themeTextContainer}>
                  <ThemedText style={[{ color: textColor }, styles.themeTitle]}>
                    {t('settings.light')}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.themeDescription]}>
                    {t('settings.lightThemeDescription')}
                  </ThemedText>
                </View>
                {themePreference === 'light' && (
                  <View style={[{ backgroundColor: textColor }, styles.checkmarkContainer]}>
                    <ThemedText style={[{ color: surfaceColor }, styles.checkmark]}>✓</ThemedText>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                { backgroundColor: surfaceSecondaryColor, borderColor: borderColor },
                styles.themeOption,
                themePreference === 'dark' && { backgroundColor: primaryColor, borderColor: primaryColor }
              ]}
              onPress={() => {
                setThemePreference('dark');
                setShowThemeSelection(false);
              }}
            >
              <View style={styles.themeOptionContent}>
                <View style={styles.themeIconContainer}>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.themeIcon]}>🌙</ThemedText>
                </View>
                <View style={styles.themeTextContainer}>
                  <ThemedText style={[{ color: textColor }, styles.themeTitle]}>
                    {t('settings.dark')}
                  </ThemedText>
                  <ThemedText style={[{ color: textSecondaryColor }, styles.themeDescription]}>
                    {t('settings.darkThemeDescription')}
                  </ThemedText>
                </View>
                {themePreference === 'dark' && (
                  <View style={[{ backgroundColor: textColor }, styles.checkmarkContainer]}>
                    <ThemedText style={[{ color: surfaceColor }, styles.checkmark]}>✓</ThemedText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColor }}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={[{ color: textColor }, styles.title]}>
              ⚙️ {t('settings.title')}
            </ThemedText>
            <ThemedText style={[{ color: textSecondaryColor }, styles.subtitle]}>
              {t('settings.subtitle')}
            </ThemedText>
          </View>

          {/* Account Information Section */}
          {renderAccountInfoSection()}

          {/* Password Section */}
          {renderPasswordSection()}

          {/* Terms of Use Section */}
          {renderTermsSection()}

          {/* Theme Selection Section */}
          {renderThemeSelection()}

          {/* Additional Settings Sections */}
          <View style={[{ backgroundColor: surfaceColor, borderColor: borderColor, shadowColor: shadowColor }, styles.section]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[{ color: textColor }, styles.sectionTitle]}>
                {t('settings.preferences')}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setShowThemeSelection(true)}
            >
              <ThemedText style={[{ color: textColor }, styles.settingItemText]}>
                🎨 {t('settings.theme')}
              </ThemedText>
              <View style={styles.settingValueContainer}>
                <ThemedText style={[{ color: textSecondaryColor }, styles.settingValue]}>
                  {themePreference === 'system' ? t('settings.system') :
                   themePreference === 'light' ? t('settings.light') :
                   t('settings.dark')}
                </ThemedText>
                <ThemedText style={[{ color: textSecondaryColor }, styles.arrowText]}>›</ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => Alert.alert('Info', 'Language settings feature coming soon')}
            >
              <ThemedText style={[{ color: textColor }, styles.settingItemText]}>
                🌍 {t('settings.language')}
              </ThemedText>
              <ThemedText style={[{ color: textSecondaryColor }, styles.arrowText]}>›</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => Alert.alert('Info', 'Notification settings feature coming soon')}
            >
              <ThemedText style={[{ color: textColor }, styles.settingItemText]}>
                {t('settings.notifications')}
              </ThemedText>
              <ThemedText style={[{ color: textSecondaryColor }, styles.arrowText]}>›</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Data Management Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t('settings.dataManagement')}
            </ThemedText>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => Alert.alert('Info', 'Cache cleared successfully')}
            >
              <ThemedText style={[{ color: textColor }, styles.settingItemText]}>
                🗑️ {t('settings.clearCache')}
              </ThemedText>
              <ThemedText style={[{ color: textSecondaryColor }, styles.arrowText]}>›</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => Alert.alert('Info', 'Export feature coming soon')}
            >
              <ThemedText style={[{ color: textColor }, styles.settingItemText]}>
                📊 {t('settings.exportData')}
              </ThemedText>
              <ThemedText style={[{ color: textSecondaryColor }, styles.arrowText]}>›</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Exchange Rate Information Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              📈{t('settings.exchangeRateInfo')}
            </ThemedText>
            <ThemedText style={styles.sectionDescription}>
              {t('settings.exchangeRateInfoDescription')}
            </ThemedText>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>
                  🕒 {t('time.lastUpdate')}:
                </ThemedText>
                <ThemedText style={styles.infoValue}>
                  {exchangeRateData?.time_last_update_utc
                    ? new Date(exchangeRateData.time_last_update_utc).toLocaleString()
                    : 'Not available'}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>
                  ⏰ {t('time.nextUpdate')}:
                </ThemedText>
                <ThemedText style={styles.infoValue}>
                  {exchangeRateData?.time_next_update_utc
                    ? new Date(exchangeRateData.time_next_update_utc).toLocaleString()
                    : 'Not available'}
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => Alert.alert('Exchange Rate Info',
                'Exchange rates are provided by CurrencyFreaks API and updated hourly.\n\n' +
                '• Rates are cached locally for offline use\n' +
                '• Updates occur automatically in the background\n' +
                '• All rates are displayed in real-time when online')}
            >
              <ThemedText style={[{ color: textColor }, styles.settingItemText]}>
                ℹ️ {t('settings.aboutExchangeRates')}
              </ThemedText>
              <ThemedText style={[{ color: textSecondaryColor }, styles.arrowText]}>›</ThemedText>
            </TouchableOpacity>
          </View>

          {/* About & Support Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t('settings.aboutSupport')}
            </ThemedText>
            
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => Alert.alert('About', 'RateSnap v1.0.0\n\nA currency converter app with real-time exchange rates.\n\nDeveloped with ❤️ for global travelers and businesses.')}
            >
              <ThemedText style={[{ color: textColor }, styles.settingItemText]}>
                ℹ️ {t('settings.about')}
              </ThemedText>
              <ThemedText style={[{ color: textSecondaryColor }, styles.arrowText]}>›</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => Alert.alert('Info', 'Email: support@ratesnap.app')}
            >
              <ThemedText style={[{ color: textColor }, styles.settingItemText]}>
                📧 {t('settings.contactSupport')}
              </ThemedText>
              <ThemedText style={[{ color: textSecondaryColor }, styles.arrowText]}>›</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => Alert.alert('Help', 'For assistance, please:\n\n1. Check our FAQ section\n2. Contact support@ratesnap.app\n3. Visit our website for more resources')}
            >
              <ThemedText style={[{ color: textColor }, styles.settingItemText]}>
                ❓ {t('settings.help')}
              </ThemedText>
              <ThemedText style={[{ color: textSecondaryColor }, styles.arrowText]}>›</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Pending Deletion Status */}
          {user && pendingDeletion && (
            <View style={[styles.section, styles.pendingDeletionSection]}>
              <View style={styles.pendingDeletionHeader}>
                <View style={styles.pendingIconContainer}>
                  <ThemedText style={styles.pendingIcon}>⏳</ThemedText>
                </View>
                <View style={styles.pendingContent}>
                  <ThemedText style={styles.pendingTitle}>
                    Account Deletion Pending
                  </ThemedText>
                  <ThemedText style={styles.pendingDescription}>
                    Your account deletion has been scheduled and will be completed within 24 hours.
                    If you wish to cancel this process, you can do so below.
                  </ThemedText>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.cancelDeletionButton}
                onPress={cancelPendingDeletion}
              >
                <View style={styles.cancelDeletionContent}>
                  <View style={styles.cancelIconContainer}>
                    <ThemedText style={styles.cancelIcon}>↩️</ThemedText>
                  </View>
                  <ThemedText style={styles.cancelDeletionText}>
                    Cancel Account Deletion
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign Out Section */}
          {user && !pendingDeletion && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <View style={styles.signOutContent}>
                  <View style={styles.signOutIconContainer}>
                    <ThemedText style={styles.signOutIcon}>🚪</ThemedText>
                  </View>
                  <ThemedText style={styles.signOutText}>
                    {t('auth.signout')}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Delete Account Section */}
          {user && !pendingDeletion && (
            <View style={[styles.section, styles.dangerSection]}>
              <View style={styles.dangerHeader}>
                <ThemedText style={[styles.sectionTitle, styles.dangerTitle]}>
                  ⚠️ {t('settings.dangerZone')}
                </ThemedText>
                <ThemedText style={styles.dangerSubtitle}>
                  Irreversible actions that affect your account
                </ThemedText>
              </View>
              
              {showDeletePassword ? (
                <View style={styles.deleteConfirmContainer}>
                  <View style={styles.deleteWarningCard}>
                    <View style={styles.warningIconContainer}>
                      <ThemedText style={styles.warningIcon}>⚠️</ThemedText>
                    </View>
                    <View style={styles.warningContent}>
                      <ThemedText style={styles.deleteWarningTitle}>
                        Confirm Account Deletion
                      </ThemedText>
                      <ThemedText style={styles.deleteWarningDescription}>
                        To confirm account deletion, please enter both your email address and password. This action cannot be undone.
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.credentialInputsContainer}>
                    <View style={styles.inputGroup}>
                      <ThemedText style={styles.inputLabel}>
                        Email Address *
                      </ThemedText>
                      <TextInput
                        style={styles.credentialInput}
                        value={confirmEmail}
                        onChangeText={setConfirmEmail}
                        placeholder={`Enter ${user?.email}`}
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <ThemedText style={styles.inputLabel}>
                        Password *
                      </ThemedText>
                      <TextInput
                        style={styles.credentialInput}
                        value={deletePassword}
                        onChangeText={setDeletePassword}
                        placeholder="Enter your password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <View style={styles.deleteActionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => {
                        setShowDeletePassword(false);
                        setDeletePassword('');
                        setConfirmEmail('');
                      }}
                    >
                      <ThemedText style={styles.cancelButtonText}>
                        Cancel
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={verifyPasswordAndDelete}
                    >
                      <ThemedText style={styles.deleteButtonText}>
                        Confirm Deletion
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.deleteAccountButton}
                  onPress={handleDeleteAccount}
                >
                  <View style={styles.deleteButtonContent}>
                    <View style={styles.deleteIconContainer}>
                      <ThemedText style={styles.deleteIcon}>🗑️</ThemedText>
                    </View>
                    <View style={styles.deleteButtonTextContainer}>
                      <ThemedText style={styles.deleteButtonTitle}>
                        Delete Account
                      </ThemedText>
                      <ThemedText style={styles.deleteButtonSubtitle}>
                        Permanently remove your account and all data
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.deleteArrowIcon}>›</ThemedText>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
        <Footer />
      </ThemedView>
    </SafeAreaView>
  );
}
