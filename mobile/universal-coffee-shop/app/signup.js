// signup screen
// universal-coffee-shop/app/signup.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !name) {
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
      await signUp(email, password, { name });
      Alert.alert(
        'Success', 
        'Account created! Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error) {
      Alert.alert('Signup Failed', error.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CREATE</Text>
        <Text style={styles.stylizedTitle}>ACCOUNT</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.buttonDisabled]} 
          onPress={handleSignup}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>SIGN UP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.back()}
          disabled={loading}>
          <Text style={styles.secondaryButtonText}>
            ALREADY HAVE AN ACCOUNT? LOG IN
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    color: '#000',
    fontFamily: 'Anton-Regular',
    textAlign: 'center',
    lineHeight: 50,
  },
  stylizedTitle: {
    fontSize: 54,
    fontFamily: 'Canopee',
    textAlign: 'center',
  },
  formContainer: {
    flex: 2,
    width: '100%',
    paddingTop: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#FFF',
  },
  primaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#000',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Anton-Regular',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Anton-Regular',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
