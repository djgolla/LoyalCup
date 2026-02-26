import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, TextInput, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, { full_name: name.trim() });
      Alert.alert('Success!', 'Account created successfully', [
        { text: 'OK', onPress: () => router.replace('/home') }
      ]);
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Feather name="coffee" size={32} color="#00704A" />
            </View>
            <Text style={styles.title}>Join LoyalCup</Text>
            <Text style={styles.subtitle}>Start earning rewards today</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.signupButton, loading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.signupButtonText}>Create Account</Text>
                  <Feather name="arrow-right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.terms}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#00704A',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00704A',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  terms: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: -8,
  },
  termsLink: {
    color: '#00704A',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 15,
    color: '#666',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00704A',
  },
});