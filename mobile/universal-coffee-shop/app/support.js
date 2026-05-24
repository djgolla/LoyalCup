/**
 * Help & Support screen
 * - FAQ accordion (no network needed, baked in)
 * - Email support button
 * - Link to privacy/terms
 */
import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const FAQS = [
  {
    q: 'How do I place an order?',
    a: 'Browse shops on the home screen, tap a shop to view the menu, add items to your cart, then tap "Checkout." Your card is charged securely through Square and your order prints on the shop\'s terminal instantly.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover) processed securely through Square. Apple Pay and Google Pay support is coming soon.',
  },
  {
    q: 'How do I earn loyalty points?',
    a: 'You automatically earn points on every completed order. Points accumulate per shop and can be redeemed at checkout for a discount. 100 points = $1 off.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'You can cancel a confirmed order before the shop accepts it. Once a barista accepts it, it can no longer be cancelled through the app — contact the shop directly if you need help.',
  },
  {
    q: 'How do I know when my order is ready?',
    a: 'You\'ll receive a push notification when your order is marked ready. Make sure notifications are enabled in your phone\'s settings for LoyalCup. You\'ll also see a "Ready!" status on the order tracking screen.',
  },
  {
    q: 'I was charged but didn\'t receive my order. What do I do?',
    a: 'Contact us at support@loyalcup.com with your order number (shown in Order History). We\'ll work with the shop to resolve it. Refunds are processed through Square and typically appear in 3–5 business days.',
  },
  {
    q: 'Why can\'t I see a shop near me?',
    a: 'LoyalCup is growing! Shops must sign up and complete Square setup before appearing. If your local shop isn\'t listed, share the app with them — they can sign up at loyalcup.com.',
  },
  {
    q: 'How do I update my email or password?',
    a: 'Tap your profile icon, then go to Settings. You can update your email and password there. If you signed up with Google, your password is managed through Google.',
  },
  {
    q: 'Is my payment info stored in the app?',
    a: 'No. We never store card numbers. All payment info is handled by Square\'s PCI-compliant infrastructure. We only receive a confirmation token after payment succeeds.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Email support@loyalcup.com with the subject "Delete My Account." We\'ll process it within 48 hours and send confirmation. All your data will be permanently removed.',
  },
];

const CONTACT_EMAIL = 'support@loyalcup.com';

const FAQItem = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.faqItem, open && styles.faqItemOpen]}
      onPress={() => setOpen(o => !o)}
      activeOpacity={0.8}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={open ? '#00704A' : '#9ca3af'} />
      </View>
      {open && <Text style={styles.faqA}>{item.a}</Text>}
    </TouchableOpacity>
  );
};

export default function SupportScreen() {
  const router = useRouter();

  const handleEmail = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=LoyalCup Support`).catch(() => {
      Alert.alert('Email', `Reach us at ${CONTACT_EMAIL}`);
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name="help-circle" size={32} color="#00704A" />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Find answers below or reach out directly.</Text>
        </View>

        {/* Contact card */}
        <View style={styles.contactCard}>
          <View style={styles.contactCardLeft}>
            <Text style={styles.contactCardTitle}>Talk to us</Text>
            <Text style={styles.contactCardSub}>We typically reply within a few hours.</Text>
          </View>
          <TouchableOpacity style={styles.emailBtn} onPress={handleEmail}>
            <Feather name="mail" size={16} color="#FFF" />
            <Text style={styles.emailBtnText}>Email Us</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.faqSectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
          {FAQS.map((item, i) => <FAQItem key={i} item={item} />)}
        </View>

        {/* Footer links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://loyalcup.com/privacy')}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://loyalcup.com/terms')}>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>LoyalCup · © 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#FAFAFA' },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle:        { fontSize: 20, fontWeight: '800', color: '#000' },
  hero:               { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  heroIcon:           { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  heroTitle:          { fontSize: 26, fontWeight: '900', color: '#000', marginBottom: 6 },
  heroSub:            { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  contactCard:        { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 24, backgroundColor: '#FFF', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#E8F5E9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  contactCardLeft:    { flex: 1 },
  contactCardTitle:   { fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 3 },
  contactCardSub:     { fontSize: 12, color: '#9ca3af', lineHeight: 17 },
  emailBtn:           { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#00704A', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12 },
  emailBtnText:       { color: '#FFF', fontWeight: '700', fontSize: 14 },
  faqSection:         { paddingHorizontal: 16 },
  faqSectionLabel:    { fontSize: 11, fontWeight: '800', color: '#9ca3af', letterSpacing: 1.2, marginBottom: 12 },
  faqItem:            { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1.5, borderColor: '#F0F0F0' },
  faqItemOpen:        { borderColor: '#00704A', backgroundColor: '#f0faf5' },
  faqHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  faqQ:               { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 20 },
  faqA:               { fontSize: 13, color: '#6b7280', lineHeight: 20, marginTop: 10 },
  footerLinks:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 28, marginBottom: 8 },
  footerLink:         { fontSize: 13, color: '#00704A', fontWeight: '600' },
  footerDivider:      { color: '#d1d5db' },
  versionText:        { textAlign: 'center', fontSize: 11, color: '#d1d5db', marginTop: 4 },
});