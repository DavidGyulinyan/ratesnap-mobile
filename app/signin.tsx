import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Logo from '@/components/Logo';
import AuthButtons from '@/components/AuthButtons';
import { Ionicons } from '@expo/vector-icons';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { signIn, resendConfirmationEmail } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('signin.fillAllFields'));
      return;
    }

    setLoading(true);
    setEmailNotConfirmed(false);
    setInvalidCredentials(false);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        // Check if it's an email confirmation error
        if (error.name === 'EmailNotConfirmedError') {
          setEmailNotConfirmed(true);
        } else if (error.name === 'InvalidCredentialsError') {
          setInvalidCredentials(true);
        } else {
          Alert.alert(t('auth.signin'), error.message);
        }
      } else {
        // Navigation will be handled by the auth state change
        router.back();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert(t('common.error'), t('error.loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('signup.enterEmail'));
      return;
    }

    setResendLoading(true);
    try {
      const { error } = await resendConfirmationEmail(email);
      if (error) {
        Alert.alert(t('common.error'), t('error.loading'));
      } else {
        Alert.alert(t('common.ok'), t('signin.confirmationSent'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('error.loading'));
    } finally {
      setResendLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Logo size={48} showText={true} textSize={24} />
          <Text style={styles.title}>{t('signin.welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('signin.subtitle')}</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('signin.enterEmail')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('signin.enterPassword')}
                  secureTextEntry={!passwordVisible}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  <Ionicons
                    name={passwordVisible ? "eye-off" : "eye"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? t('signin.signingIn') : t('signin.signIn')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPasswordLink}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>{t('signin.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>

          {/* Email Confirmation Error */}
          {emailNotConfirmed && (
            <View style={styles.confirmationError}>
              <Text style={styles.confirmationErrorTitle}>📧 {t('signin.emailNotConfirmed')}</Text>
              <Text style={styles.confirmationErrorText}>
                {t('signin.checkEmail')}
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.resendButton, resendLoading && styles.buttonDisabled]}
                onPress={handleResendConfirmation}
                disabled={resendLoading}
              >
                <Text style={styles.resendButtonText}>
                  {resendLoading ? t('common.loading') : `📤 ${t('signin.resendConfirmation')}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Invalid Credentials Error */}
          {invalidCredentials && (
            <View style={styles.credentialsError}>
              <Text style={styles.credentialsErrorTitle}>❌ {t('signin.invalidCredentials')}</Text>
              <Text style={styles.credentialsErrorText}>
                {t('signin.invalidCredentialsText')}
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={() => setInvalidCredentials(false)}
              >
                <Text style={styles.retryButtonText}>{t('signin.tryAgain')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <AuthButtons onSuccess={() => router.back()} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.dontHaveAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signUpLink}>{t('signin.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Main containers
  container: {
    flex: 1,
    backgroundColor: '#fafbff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  backgroundPattern: {
    flex: 1,
    backgroundColor: '#fafbff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Card layout
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    backdropFilter: 'blur(10px)',
  },
  
  // Typography
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  
  // Form elements
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    color: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50, // Make room for the eye button
    fontSize: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    color: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  
  // Buttons
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    flexWrap: 'wrap',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  signUpLink: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },

  // Email Confirmation Error Styles
  confirmationError: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  confirmationErrorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationErrorText: {
    fontSize: 14,
    color: '#78350f',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  resendButton: {
    backgroundColor: '#f59e0b',
    borderColor: '#d97706',
  },
  resendButtonText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
  },

  // Invalid Credentials Error Styles
  credentialsError: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  credentialsErrorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  credentialsErrorText: {
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  retryButtonText: {
    color: '#fee2e2',
    fontSize: 14,
    fontWeight: '600',
  },

  // Forgot Password Link
  forgotPasswordLink: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  forgotPasswordText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
});