import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [resetSent,    setResetSent]    = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Info', 'Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/home');
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: was a dead button — now actually sends a password reset email via Supabase
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter Your Email', 'Type your email address above, then tap Forgot Password.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'loyalcup://reset-password',
      });
      if (error) throw error;
      setResetSent(true);
      Alert.alert(
        'Check Your Email 📬',
        `We sent a password reset link to ${email.trim()}. Check your inbox (and spam folder).`
      );
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Feather name="coffee" size={32} color="#00704A" />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
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
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* FIXED: was a dead button, now sends Supabase password reset email */}
            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword} disabled={loading}>
              <Text style={[styles.forgotPasswordText, resetSent && { color: '#10B981' }]}>
                {resetSent ? '✓ Reset email sent' : 'Forgot Password?'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <Feather name="arrow-right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#FFF' },
  keyboardView:         { flex: 1 },
  scrollContent:        { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  backButton:           { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  header:               { alignItems: 'center', marginBottom: 40 },
  iconCircle:           { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 3, borderColor: '#00704A' },
  title:                { fontSize: 32, fontWeight: '800', color: '#000', marginBottom: 8 },
  subtitle:             { fontSize: 16, color: '#666' },
  form:                 { gap: 20 },
  inputGroup:           { gap: 8 },
  label:                { fontSize: 15, fontWeight: '600', color: '#000' },
  inputContainer:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  input:                { flex: 1, fontSize: 16, color: '#000' },
  forgotPassword:       { alignSelf: 'flex-end', marginTop: -8 },
  forgotPasswordText:   { fontSize: 14, fontWeight: '600', color: '#00704A' },
  loginButton:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00704A', paddingVertical: 18, borderRadius: 12, gap: 8, marginTop: 8 },
  loginButtonDisabled:  { opacity: 0.6 },
  loginButtonText:      { fontSize: 18, fontWeight: '700', color: '#FFF' },
  footer:               { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  footerText:           { fontSize: 15, color: '#666' },
  footerLink:           { fontSize: 15, fontWeight: '700', color: '#00704A' },
});