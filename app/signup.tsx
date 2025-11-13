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
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password, username);
      if (error) {
        Alert.alert('Sign Up Error', error.message);
      } else {
        Alert.alert('Success', 'Account created successfully! Please check your email to verify your account.');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Google Sign In Error', error.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred with Google sign in');
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Logo size={48} showText={true} textSize={24} />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join RateSnap to sync your data</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Choose a username"
                  autoCapitalize="none"
                />
              </View>

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
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>

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
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignUpScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40, // Reduced top padding since SafeAreaView handles safe area
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
    maxWidth: 400,
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
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flexWrap: 'wrap',
    includeFontPadding: false,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flexWrap: 'wrap',
    includeFontPadding: false,
    flex: 1,
    textAlign: 'center',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  appleButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flexWrap: 'wrap',
    includeFontPadding: false,
    flex: 1,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    width: '100%',
    maxWidth: 400,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  socialButtons: {
    width: '100%',
    maxWidth: 400,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signInLink: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});