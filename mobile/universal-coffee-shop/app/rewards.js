import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  const shops = data?.shops || [];
  const txns  = data?.transactions || [];

  const totalAvailable = shops.reduce((sum, s) => sum + (s.current_balance || 0), 0);
  const totalPending   = shops.reduce((sum, s) => sum + (s.pending_balance || 0), 0);
  const totalPts       = totalAvailable + totalPending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Feather name="refresh-cw" size={20} color="#101828" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <LinearGradient
          colors={['#0F172A', '#1D4ED8', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryGlow} />

          <View style={styles.summaryTop}>
            <View style={styles.iconWrap}>
              <Feather name="award" size={22} color="#fff" />
            </View>
            <Text style={styles.summaryLabel}>LOYALCUP BALANCE</Text>
          </View>

          <Text style={styles.balanceBig}>{totalPts.toLocaleString()}</Text>

          <Text style={styles.balanceSub}>
            {totalAvailable.toLocaleString()} available
            {totalPending > 0 ? ` · ${totalPending.toLocaleString()} pending` : ''}
          </Text>

          <View style={styles.summaryMetaRow}>
            <View style={styles.summaryMetaPill}>
              <Text style={styles.summaryMetaValue}>{shops.length}</Text>
              <Text style={styles.summaryMetaLabel}>programs</Text>
            </View>

            <View style={styles.summaryMetaPill}>
              <Text style={styles.summaryMetaValue}>{txns.length}</Text>
              <Text style={styles.summaryMetaLabel}>activities</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Rewards</Text>

          {shops.length === 0 ? (
            <View style={styles.emptyTxn}>
              <Feather name="award" size={32} color="#CBD5E1" />
              <Text style={styles.emptyTxnText}>
                No points yet. Order from a shop to start earning rewards there!
              </Text>
            </View>
          ) : shops.map(sp => {
            const available = sp.current_balance || 0;
            const pending   = sp.pending_balance || 0;
            const total     = available + pending;

            return (
              <TouchableOpacity
                key={sp.shop_id || sp.id}
                style={styles.shopRow}
                onPress={() => sp.shop_id && router.push(`/shop/${sp.shop_id}`)}
              >
                {sp.shops?.logo_url
                  ? <Image source={{ uri: sp.shops.logo_url }} style={styles.shopLogo} />
                  : (
                    <View style={[styles.shopLogo, styles.shopLogoPh]}>
                      <Feather name="coffee" size={20} color="#F97316" />
                    </View>
                  )
                }

                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>{sp.shops?.name || 'Shop'}</Text>
                  <Text style={styles.shopSub}>
                    {available.toLocaleString()} available
                    {pending > 0 ? ` · ${pending.toLocaleString()} pending` : ''}
                  </Text>
                  {total > 0 && (
                    <Text style={styles.shopTiny}>
                      {total.toLocaleString()} total pts at this shop
                    </Text>
                  )}
                </View>

                <Feather name="chevron-right" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          {txns.length === 0 ? (
            <View style={styles.emptyTxn}>
              <Feather name="clock" size={32} color="#CBD5E1" />
              <Text style={styles.emptyTxnText}>
                No transactions yet. Place an order to start earning!
              </Text>
            </View>
          ) : txns.map(t => {
            const earned  = t.type === 'earned';
            const pending = t.status === 'pending';

            return (
              <View key={t.id} style={styles.txnRow}>
                <View style={[
                  styles.txnIcon,
                  { backgroundColor: earned ? '#dcfce7' : '#fee2e2' },
                ]}>
                  <Feather
                    name={earned ? 'plus' : 'minus'}
                    size={14}
                    color={earned ? '#16a34a' : '#dc2626'}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.txnTitle}>{t.shops?.name || 'Shop rewards'}</Text>
                  <Text style={styles.txnSub}>
                    {pending
                      ? 'Pending · available in about 15 minutes'
                      : t.description || (earned ? 'Earned' : 'Redeemed')}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.txnAmount, { color: earned ? '#16a34a' : '#dc2626' }]}>
                    {earned ? '+' : ''}{t.amount} pts
                  </Text>
                  {pending && <Text style={styles.pendingTag}>pending</Text>}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How it works</Text>
          <Text style={styles.howLine}>· Each shop runs its own loyalty program</Text>
          <Text style={styles.howLine}>· Earn points automatically on every order</Text>
          <Text style={styles.howLine}>· New points show as pending for about 15 minutes</Text>
          <Text style={styles.howLine}>· Redeem available points for a discount at that shop's checkout</Text>
          <Text style={styles.howLine}>· Points are only usable at the shop where you earned them</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8FAFC' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#F8FAFC' },
  headerTitle:    { fontSize: 20, fontWeight: '900', color: '#101828' },
  summaryCard:    { margin: 16, borderRadius: 30, padding: 24, overflow: 'hidden', shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.22, shadowRadius: 28, elevation: 9 },
  summaryGlow:    { position: 'absolute', right: -56, top: -64, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.16)' },
  summaryTop:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconWrap:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  summaryLabel:   { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  balanceBig:     { color: '#FFF', fontSize: 58, fontWeight: '900' },
  balanceSub:     { color: 'rgba(255,255,255,0.95)', fontSize: 14, fontWeight: '800', marginTop: 2 },
  summaryMetaRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  summaryMetaPill:{ flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 12 },
  summaryMetaValue:{ color: '#FFF', fontSize: 18, fontWeight: '900' },
  summaryMetaLabel:{ color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700', marginTop: 2 },
  section:        { marginHorizontal: 16, marginTop: 20 },
  sectionTitle:   { fontSize: 17, fontWeight: '900', color: '#101828', marginBottom: 10 },
  shopRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  shopLogo:       { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F8FAFC' },
  shopLogoPh:     { justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF6FF' },
  shopName:       { fontSize: 14, fontWeight: '700', color: '#101828' },
  shopSub:        { fontSize: 12, color: '#64748B', marginTop: 2 },
  shopTiny:       { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  txnRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  txnIcon:        { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  txnTitle:       { fontSize: 14, fontWeight: '700', color: '#101828' },
  txnSub:         { fontSize: 12, color: '#64748B', marginTop: 2 },
  txnAmount:      { fontSize: 14, fontWeight: '800' },
  pendingTag:     { fontSize: 10, fontWeight: '800', color: '#F59E0B', marginTop: 2, textTransform: 'uppercase' },
  emptyTxn:       { alignItems: 'center', paddingVertical: 24 },
  emptyTxnText:   { color: '#94A3B8', marginTop: 8, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  howCard:        { margin: 16, marginTop: 24, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  howTitle:       { fontSize: 14, fontWeight: '900', color: '#101828', marginBottom: 8 },
  howLine:        { fontSize: 13, color: '#64748B', lineHeight: 22 },
});
