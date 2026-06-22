// About screen
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {
      console.error('Failed to open URL');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#101828" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ABOUT</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCard}>
              <Image
                source={require('../assets/images/LOGO.PNG')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>LOYAL CUP</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OUR MISSION</Text>
            <Text style={styles.description}>
              LoyalCup connects coffee lovers with their favorite local coffee shops.
              We believe in supporting local businesses and making it easy for you to
              discover, order, and stay loyal to the shops you love.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FEATURES</Text>
            <View style={styles.featureList}>
              {[
                'Order ahead for pickup',
                'Earn loyalty points with every purchase',
                'Discover local coffee shops near you',
                'Save your favorite shops',
                'Track your order history',
              ].map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <Feather name="check-circle" size={20} color="#F97316" />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COMPANY</Text>
            <TouchableOpacity style={styles.linkItem} onPress={() => openLink('https://loyalcupapp.com')}>
              <Text style={styles.linkText}>Website</Text>
              <Feather name="external-link" size={18} color="#F97316" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkItem} onPress={() => openLink('https://loyalcupapp.com/privacy')}>
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Feather name="external-link" size={18} color="#F97316" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkItem} onPress={() => openLink('https://loyalcupapp.com/terms')}>
              <Text style={styles.linkText}>Terms of Service</Text>
              <Feather name="external-link" size={18} color="#F97316" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FOLLOW US</Text>
            <View style={styles.socialLinks}>
              <TouchableOpacity style={styles.socialButton} onPress={() => openLink('https://twitter.com/loyalcup')}>
                <Feather name="twitter" size={24} color="#101828" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} onPress={() => openLink('https://instagram.com/loyalcup')}>
                <Feather name="instagram" size={24} color="#101828" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} onPress={() => openLink('https://facebook.com/loyalcup')}>
                <Feather name="facebook" size={24} color="#101828" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 LoyalCup. All rights reserved.</Text>
            <Text style={styles.footerText}>Made with ❤️ for coffee lovers everywhere</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView:   { flex: 1 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton:   { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle:  { fontSize: 20, fontWeight: '900', color: '#101828' },
  content:      { padding: 20 },
  logoContainer:{ alignItems: 'center', paddingVertical: 30 },
  logoCard:     { width: 142, height: 142, borderRadius: 34, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  logoImage:    { width: 122, height: 122 },
  appName:      { fontSize: 32, fontWeight: '900', color: '#101828', marginBottom: 5 },
  version:      { fontSize: 14, color: '#64748B' },
  section:      { marginTop: 30 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#94A3B8', marginBottom: 15, letterSpacing: 1.2 },
  description:  { fontSize: 16, lineHeight: 24, color: '#475569' },
  featureList:  { gap: 12 },
  featureItem:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText:  { fontSize: 16, flex: 1, color: '#101828', fontWeight: '700' },
  linkItem:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  linkText:     { fontSize: 16, fontWeight: '800', color: '#101828' },
  socialLinks:  { flexDirection: 'row', gap: 15 },
  socialButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  footer:       { marginTop: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', alignItems: 'center' },
  footerText:   { fontSize: 14, color: '#64748B', textAlign: 'center', marginVertical: 5 },
});
