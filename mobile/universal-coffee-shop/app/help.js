/**
 * Help & Support screen — LoyalCup accurate FAQ + contact
 */
import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Linking, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    category: 'Orders',
    items: [
      {
        q: 'How do I place a mobile order?',
        a: "Browse shops on the home screen, tap a shop to open its menu, add items to your cart, then tap \"View Cart\" and proceed to checkout. Your card is charged only when the order is sent to the shop.",
      },
      {
        q: 'When will my order be ready?',
        a: "Right after you order, you'll see an estimated time — usually around 10 minutes, but each shop sets their own. Your order is sent straight to the shop's counter, so just head over and pick it up when it's ready.",
      },
      {
        q: 'Can I cancel an order after placing it?',
        a: "You can cancel right after placing it, while it's still showing as \"Placed\". Go to Order History, tap the order, and hit Cancel. Once the shop has started making it, cancellation may no longer be available — contact the shop directly.",
      },
      {
        q: "My card was charged but I got an error — what happened?",
        a: "This is rare but can happen if your connection drops at the wrong moment. If you were charged and don't see an order in your Order History, email us at support@loyalcupapp.com with your email and approximate order time.",
      },
      {
        q: 'How do I know the shop got my order?',
        a: "As soon as you check out, your order prints at the shop's counter marked \"MOBILE\" and you'll get a confirmation with your pickup time. If something goes wrong sending it, we'll tell you right away and you won't be charged.",
      },
    ],
  },
  {
    category: 'Loyalty Points',
    items: [
      {
        q: 'How do I earn loyalty points?',
        a: "Points are awarded automatically after each mobile order. Each shop runs its own loyalty program and sets its own earn rate — for example, 10 points per dollar spent. You can see a shop's loyalty details on its menu page.",
      },
      {
        q: 'How do I redeem points?',
        a: "At checkout, if you have enough points at that shop, you'll see a \"Redeem Points\" option. Toggle it on and choose how many points to apply — they'll reduce your total at that shop.",
      },
      {
        q: 'Do my points expire?',
        a: "Point expiration is set by each individual shop. Check the Rewards screen for details specific to each shop you've earned points at.",
      },
      {
        q: 'Why do I have different point balances at different shops?',
        a: "Each shop runs its own separate loyalty program. Points you earn at one shop can only be redeemed at that same shop — they don't transfer between shops. The Rewards screen shows your balance at each shop, and your profile shows the combined total across all of them for reference.",
      },
    ],
  },
  {
    category: 'Account & App',
    items: [
      {
        q: 'How do I update my name or email?',
        a: "Go to Profile → Settings → Edit Profile to update your display name. Email changes aren't supported in-app right now — email us at support@loyalcupapp.com and we'll help.",
      },
      {
        q: 'I forgot my password — how do I reset it?',
        a: "On the login screen tap \"Forgot password?\" and enter your email. You'll receive a reset link. Check your spam folder if it doesn't arrive within a few minutes.",
      },
      {
        q: 'Which payment methods are supported?',
        a: 'LoyalCup accepts all major credit and debit cards (Visa, Mastercard, Amex, Discover) processed securely through Square.',
      },
      {
        q: 'How do I find shops near me?',
        a: "On the home screen tap the \"Nearby\" filter chip. The app will ask for location permission — grant it and shops within your area will be sorted by distance.",
      },
    ],
  },
  {
    category: 'Refunds & Issues',
    items: [
      {
        q: 'How do I get a refund?',
        a: "Refunds are handled by each shop individually — LoyalCup processes the payment but the shop owner approves refunds. Tap the order in Order History and use \"Contact Shop\" or reach out to us at support@loyalcupapp.com.",
      },
      {
        q: 'My order was wrong or incomplete — what do I do?',
        a: "Contact the shop directly first — most issues get resolved on the spot. If the shop isn't responsive, email us at support@loyalcupapp.com with your order number and we'll step in.",
      },
    ],
  },
];

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen(v => !v);
      }}
      activeOpacity={0.75}
    >
      <View style={styles.faqRow}>
        <Text style={styles.faqQ}>{q}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#999" />
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
};

export default function HelpScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {FAQS.map(section => (
          <View key={section.category} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.category}</Text>
            <View style={styles.card}>
              {section.items.map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:support@loyalcupapp.com')}>
              <View style={styles.contactIcon}><Feather name="mail" size={20} color="#00704A" /></View>
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@loyalcupapp.com</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#CCC" />
            </TouchableOpacity>

            <View style={styles.contactDivider} />

            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('https://loyalcupapp.com')}>
              <View style={styles.contactIcon}><Feather name="globe" size={20} color="#00704A" /></View>
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>loyalcupapp.com</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#CCC" />
            </TouchableOpacity>

            <View style={styles.contactDivider} />

            <View style={styles.contactRow}>
              <View style={styles.contactIcon}><Feather name="clock" size={20} color="#00704A" /></View>
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Response Time</Text>
                <Text style={styles.contactValue}>Within 24 hours · Mon–Fri</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.version}>LoyalCup LLC · © 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F5F5F5' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerSide:     { width: 40, padding: 4 },
  headerTitle:    { fontSize: 18, fontWeight: '800', color: '#000' },
  scroll:         { paddingVertical: 20, paddingHorizontal: 16, paddingBottom: 40 },
  section:        { marginBottom: 24 },
  sectionTitle:   { fontSize: 11, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
  card:           { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  faqItem:        { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  faqRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  faqQ:           { fontSize: 15, fontWeight: '600', color: '#000', flex: 1, lineHeight: 21 },
  faqA:           { marginTop: 10, fontSize: 14, color: '#555', lineHeight: 22 },
  contactRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  contactDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 66 },
  contactIcon:    { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  contactText:    { flex: 1 },
  contactLabel:   { fontSize: 12, color: '#999', fontWeight: '600', marginBottom: 2 },
  contactValue:   { fontSize: 15, fontWeight: '600', color: '#000' },
  version:        { textAlign: 'center', fontSize: 12, color: '#CCC', marginTop: 8 },
});