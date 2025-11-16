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
import { Ionicons } from '@expo/vector-icons';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { signIn, signInWithGoogle, signInWithApple, resendConfirmationEmail } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setEmailNotConfirmed(false);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        // Check if it's an email confirmation error
        if (error.name === 'EmailNotConfirmedError') {
          setEmailNotConfirmed(true);
        } else {
          Alert.alert('Sign In Error', error.message);
        }
      } else {
        // Navigation will be handled by the auth state change
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setResendLoading(true);
    try {
      const { error } = await resendConfirmationEmail(email);
      if (error) {
        Alert.alert('Error', 'Failed to resend confirmation email. Please try again.');
      } else {
        Alert.alert('Success', 'Confirmation email sent! Please check your inbox and click the confirmation link.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Google Sign In Error', error instanceof Error ? error.message : 'An unexpected error occurred with Google sign in');
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS === 'ios') {
      try {
        const { error } = await signInWithApple();
        if (error) {
          Alert.alert('Apple Sign In Error', error.message);
        }
      } catch (error) {
        Alert.alert('Error', 'An unexpected error occurred with Apple sign in');
      }
    } else {
      Alert.alert('Not Available', 'Apple Sign In is only available on iOS');
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to sync your data</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
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
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email Confirmation Error */}
          {emailNotConfirmed && (
            <View style={styles.confirmationError}>
              <Text style={styles.confirmationErrorTitle}>📧 Email Not Confirmed</Text>
              <Text style={styles.confirmationErrorText}>
                Please check your email and click the confirmation link before signing in.
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.resendButton, resendLoading && styles.buttonDisabled]}
                onPress={handleResendConfirmation}
                disabled={resendLoading}
              >
                <Text style={styles.resendButtonText}>
                  {resendLoading ? 'Sending...' : '📤 Resend Confirmation Email'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={handleGoogleSignIn}
            >
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.button, styles.appleButton]}
                onPress={handleAppleSignIn}
              >
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
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
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flexWrap: 'wrap',
    flex: 1,
    textAlign: 'center',
  },
  appleButton: {
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  appleButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flexWrap: 'wrap',
    flex: 1,
    textAlign: 'center',
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.6)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  socialButtons: {
    width: '100%',
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
});