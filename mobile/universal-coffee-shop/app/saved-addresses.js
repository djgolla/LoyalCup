/**
 * Saved Addresses — coming in a future update.
 */
import React from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SavedAddressesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Feather name="map-pin" size={48} color="#F97316" />
        </View>
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          Saved addresses will be available in an upcoming update. For now, shops are pickup-only — just head to the counter when your order is ready!
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8FAFC' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton:  { padding: 8, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#101828' },
  body:        { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  iconWrap:    { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title:       { fontSize: 24, fontWeight: '800', color: '#101828', marginBottom: 12 },
  subtitle:    { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  button:      { paddingHorizontal: 32, paddingVertical: 14, backgroundColor: '#F97316', borderRadius: 25 },
  buttonText:  { color: '#FFF', fontSize: 16, fontWeight: '700' },
});