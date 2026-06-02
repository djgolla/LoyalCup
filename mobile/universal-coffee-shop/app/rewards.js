import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getMyLoyalty } from '../services/loyaltyService';

export default function RewardsScreen() {
  const router = useRouter();
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData]             = useState(null);

  const load = async () => {
    try {
      const d = await getMyLoyalty();
      setData(d);
    } catch (e) {
      console.error('rewards load:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color="#00704A" /></View>
      </SafeAreaView>
    );
  }

  const shops    = data?.shops || [];
  const totalPts = shops.reduce((sum, s) => sum + (s.current_balance || 0), 0);
  const txns     = data?.transactions || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
        <TouchableOpacity onPress={onRefresh}><Feather name="refresh-cw" size={20} color="#000" /></TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Summary card — total across all shops */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.iconWrap}><Feather name="award" size={22} color="#fff" /></View>
            <Text style={styles.summaryLabel}>YOUR POINTS</Text>
          </View>
          <Text style={styles.balanceBig}>{totalPts.toLocaleString()}</Text>
          <Text style={styles.balanceSub}>
            across {shops.length} shop{shops.length === 1 ? '' : 's'} · each shop has its own program
          </Text>
        </View>

        {/* Per-shop balances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Rewards</Text>
          {shops.length === 0 ? (
            <View style={styles.emptyTxn}>
              <Feather name="coffee" size={32} color="#DDD" />
              <Text style={styles.emptyTxnText}>No points yet. Order from a shop to start earning rewards there!</Text>
            </View>
          ) : shops.map(sp => {
            const cfg   = {}; // per-shop config not included in /me; shown on shop page
            const bal   = sp.current_balance || 0;
            return (
              <TouchableOpacity key={sp.shop_id || sp.id} style={styles.shopRow}
                onPress={() => sp.shop_id && router.push(`/shop/${sp.shop_id}`)}>
                {sp.shops?.logo_url
                  ? <Image source={{ uri: sp.shops.logo_url }} style={styles.shopLogo} />
                  : <View style={[styles.shopLogo, styles.shopLogoPh]}><Feather name="coffee" size={20} color="#00704A" /></View>}
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>{sp.shops?.name || 'Shop'}</Text>
                  <Text style={styles.shopSub}>{bal.toLocaleString()} pts · redeem at checkout</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#CCC" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {txns.length === 0 ? (
            <View style={styles.emptyTxn}>
              <Feather name="clock" size={32} color="#DDD" />
              <Text style={styles.emptyTxnText}>No transactions yet. Place an order to start earning!</Text>
            </View>
          ) : txns.map(t => {
            const earned = t.type === 'earned';
            return (
              <View key={t.id} style={styles.txnRow}>
                <View style={[styles.txnIcon, { backgroundColor: earned ? '#dcfce7' : '#fee2e2' }]}>
                  <Feather name={earned ? 'plus' : 'minus'} size={14} color={earned ? '#16a34a' : '#dc2626'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txnTitle}>{t.shops?.name || 'Shop rewards'}</Text>
                  <Text style={styles.txnSub}>{t.description || (earned ? 'Earned' : 'Redeemed')}</Text>
                </View>
                <Text style={[styles.txnAmount, { color: earned ? '#16a34a' : '#dc2626' }]}>
                  {earned ? '+' : ''}{t.amount} pts
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How it works</Text>
          <Text style={styles.howLine}>· Each shop runs its own loyalty program</Text>
          <Text style={styles.howLine}>· Earn points automatically on every order</Text>
          <Text style={styles.howLine}>· Redeem your points for a discount at that shop's checkout</Text>
          <Text style={styles.howLine}>· Points are only usable at the shop where you earned them</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FAFAFA' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle:    { fontSize: 20, fontWeight: '800', color: '#000' },
  summaryCard:    { backgroundColor: '#00704A', margin: 16, borderRadius: 20, padding: 22 },
  summaryTop:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconWrap:       { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  summaryLabel:   { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  balanceBig:     { color: '#FFF', fontSize: 52, fontWeight: '900', letterSpacing: -1 },
  balanceSub:     { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  section:        { marginHorizontal: 16, marginTop: 20 },
  sectionTitle:   { fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 10 },
  shopRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0' },
  shopLogo:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5' },
  shopLogoPh:     { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F5E9' },
  shopName:       { fontSize: 14, fontWeight: '700', color: '#000' },
  shopSub:        { fontSize: 12, color: '#666', marginTop: 2 },
  txnRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#F0F0F0' },
  txnIcon:        { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  txnTitle:       { fontSize: 14, fontWeight: '700', color: '#000' },
  txnSub:         { fontSize: 12, color: '#888', marginTop: 2 },
  txnAmount:      { fontSize: 14, fontWeight: '800' },
  emptyTxn:       { alignItems: 'center', paddingVertical: 24 },
  emptyTxnText:   { color: '#999', marginTop: 8, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  howCard:        { margin: 16, marginTop: 24, backgroundColor: '#FFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#F0F0F0' },
  howTitle:       { fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 8 },
  howLine:        { fontSize: 13, color: '#666', lineHeight: 22 },
});