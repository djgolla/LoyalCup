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

  const g       = data?.global || { current_balance: 0, total_earned: 0, total_spent: 0, config: {} };
  const cfg     = g.config || {};
  const step    = cfg.min_redemption_points || 200;
  const ptVal   = cfg.points_to_dollar_value || 0.005;
  const bal     = g.current_balance || 0;
  const toNext  = bal >= step ? 0 : (step - bal);
  const progPct = Math.min(100, Math.round((bal / step) * 100));
  const usdNow  = (bal * ptVal).toFixed(2);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
        <TouchableOpacity onPress={onRefresh}><Feather name="refresh-cw" size={20} color="#000" /></TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Global card */}
        <View style={styles.globalCard}>
          <View style={styles.globalTop}>
            <View style={styles.iconWrap}><Feather name="award" size={22} color="#fff" /></View>
            <Text style={styles.globalLabel}>GLOBAL REWARDS</Text>
          </View>
          <Text style={styles.balanceBig}>{bal.toLocaleString()}</Text>
          <Text style={styles.balanceSub}>≈ ${usdNow} value · {cfg.points_per_dollar || 10} pts per $1 spent</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progPct}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {toNext > 0
              ? `${toNext} pts to your next $${(step * ptVal).toFixed(2)} reward`
              : `🎉 You can redeem $${(Math.floor(bal / step) * step * ptVal).toFixed(2)} at checkout!`}
          </Text>

          <View style={styles.statRow}>
            <View style={styles.stat}><Text style={styles.statN}>{(g.total_earned || 0).toLocaleString()}</Text><Text style={styles.statL}>Earned</Text></View>
            <View style={styles.statDivide} />
            <View style={styles.stat}><Text style={styles.statN}>{(g.total_spent || 0).toLocaleString()}</Text><Text style={styles.statL}>Spent</Text></View>
          </View>
        </View>

        {/* Per-shop */}
        {(data?.shops?.length || 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Rewards</Text>
            {data.shops.map(sp => (
              <TouchableOpacity key={sp.shop_id || sp.id} style={styles.shopRow}
                onPress={() => sp.shop_id && router.push(`/shop/${sp.shop_id}`)}>
                {sp.shops?.logo_url
                  ? <Image source={{ uri: sp.shops.logo_url }} style={styles.shopLogo} />
                  : <View style={[styles.shopLogo, styles.shopLogoPh]}><Feather name="coffee" size={20} color="#00704A" /></View>}
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>{sp.shops?.name || 'Shop'}</Text>
                  <Text style={styles.shopSub}>{sp.current_balance} pts</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#CCC" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {(data?.transactions?.length || 0) === 0 ? (
            <View style={styles.emptyTxn}>
              <Feather name="clock" size={32} color="#DDD" />
              <Text style={styles.emptyTxnText}>No transactions yet. Place an order to start earning!</Text>
            </View>
          ) : data.transactions.map(t => {
            const earned = t.type === 'earned';
            return (
              <View key={t.id} style={styles.txnRow}>
                <View style={[styles.txnIcon, { backgroundColor: earned ? '#dcfce7' : '#fee2e2' }]}>
                  <Feather name={earned ? 'plus' : 'minus'} size={14} color={earned ? '#16a34a' : '#dc2626'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txnTitle}>
                    {t.shops?.name || (t.points_type === 'global' ? 'Global rewards' : 'Shop rewards')}
                  </Text>
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
          <Text style={styles.howLine}>· Earn {cfg.points_per_dollar || 10} pts per $1 spent</Text>
          <Text style={styles.howLine}>· Redeem in {step}-pt steps at checkout</Text>
          <Text style={styles.howLine}>· {step} pts = ${(step * ptVal).toFixed(2)} off your order</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FAFAFA' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle:    { fontSize: 20, fontWeight: '800', color: '#000' },
  globalCard:     { backgroundColor: '#00704A', margin: 16, borderRadius: 20, padding: 22 },
  globalTop:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconWrap:       { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  globalLabel:    { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  balanceBig:     { color: '#FFF', fontSize: 52, fontWeight: '900', letterSpacing: -1 },
  balanceSub:     { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginBottom: 16 },
  progressTrack:  { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill:   { height: '100%', backgroundColor: '#FFF', borderRadius: 4 },
  progressLabel:  { color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: '600', marginBottom: 16 },
  statRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12 },
  stat:           { flex: 1, alignItems: 'center' },
  statN:          { color: '#FFF', fontSize: 20, fontWeight: '800' },
  statL:          { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivide:     { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },
  section:        { marginHorizontal: 16, marginTop: 20 },
  sectionTitle:   { fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 10 },
  shopRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0' },
  shopLogo:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5' },
  shopLogoPh:     { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F5E9' },
  shopName:      { fontSize: 14, fontWeight: '700', color: '#000' },
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