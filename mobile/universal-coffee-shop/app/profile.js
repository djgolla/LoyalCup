import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getMyLoyalty } from '../services/loyaltyService';
import { apiClient } from '../services/apiClient';

export default function ProfileScreen() {
  const router            = useRouter();
  const { user, signOut } = useAuth();

  const [profile,       setProfile]       = useState(null);
  const [totalPoints,   setTotalPoints]   = useState(0);
  const [totalAvailable,setTotalAvailable]= useState(0);
  const [totalPending,  setTotalPending]  = useState(0);
  const [shopBreakdown, setShopBreakdown] = useState([]);
  const [orderCount,    setOrderCount]    = useState(0);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => { if (user?.id) loadData(); }, [user?.id]);

  const loadData = async () => {
    try {
      const [profileResp, loyaltyResp, orderResp] = await Promise.all([
        apiClient.get('/api/v1/users/profile'),
        getMyLoyalty(),
        apiClient.get('/api/v1/users/order-count'),
      ]);

      setProfile(profileResp);
      setOrderCount(orderResp.count || 0);

      const rows = loyaltyResp?.shops || [];

      const available = rows.reduce((sum, r) => sum + (r.current_balance || 0), 0);
      const pending   = rows.reduce((sum, r) => sum + (r.pending_balance || 0), 0);

      setTotalAvailable(available);
      setTotalPending(pending);
      setTotalPoints(available + pending);

      setShopBreakdown(rows.slice(0, 3).map(b => ({
        shopName: b.shops?.name || 'Shop',
        balance: b.current_balance || 0,
        pending: b.pending_balance || 0,
      })));
    } catch (e) {
      console.error('[Profile] loadData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try { await signOut(); router.replace('/launch'); }
          catch { Alert.alert('Error', 'Failed to sign out'); }
        },
      },
    ]);
  };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>
    </SafeAreaView>
  );

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'You';
  const initials    = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#101828" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.profileSection}>
          {profile?.avatar_url
            ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            : <View style={styles.avatar}><Text style={styles.avatarInitials}>{initials}</Text></View>
          }
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {profile?.phone && <Text style={styles.userPhone}>{profile.phone}</Text>}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{orderCount}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalPoints.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>

        <LinearGradient
          colors={['#0F172A', '#111827', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loyaltyCard}
        >
          <View style={styles.loyaltyCardHeader}>
            <Feather name="award" size={20} color="#fff" />
            <Text style={styles.loyaltyCardLabel}>LOYALTY POINTS</Text>
          </View>
          <Text style={styles.loyaltyCardPoints}>{totalPoints.toLocaleString()}</Text>
          <Text style={styles.loyaltyCardSub}>
            {totalAvailable.toLocaleString()} available
            {totalPending > 0 ? ` · ${totalPending.toLocaleString()} pending` : ''}
          </Text>

          {shopBreakdown.length > 0 && (
            <View style={styles.loyaltyBreakdown}>
              <Text style={styles.loyaltyBreakdownTitle}>BY SHOP</Text>
              {shopBreakdown.map((b, i) => (
                <View key={i} style={styles.loyaltyBreakdownRow}>
                  <Text style={styles.loyaltyBreakdownShop} numberOfLines={1}>{b.shopName}</Text>
                  <Text style={styles.loyaltyBreakdownPts}>
                    {b.balance.toLocaleString()} pts
                    {b.pending > 0 ? ` · ${b.pending.toLocaleString()} pending` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.loyaltyViewBtn} onPress={() => router.push('/rewards')}>
            <Text style={styles.loyaltyViewBtnText}>VIEW REWARDS</Text>
            <Feather name="arrow-right" size={14} color="#2563EB" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.menuSection}>
          {[
            { icon: 'list',        label: 'Order History',  route: '/order-history' },
            { icon: 'award',       label: 'Rewards',        route: '/rewards'       },
            { icon: 'heart',       label: 'Favorite Shops', route: '/favorites'     },
            { icon: 'help-circle', label: 'Help & Support', route: '/help'          },
            { icon: 'settings',    label: 'Settings',       route: '/settings'      },
          ].map(({ icon, label, route }) => (
            <TouchableOpacity key={route} style={styles.menuRow} onPress={() => router.push(route)}>
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconWrap}><Feather name={icon} size={18} color="#F97316" /></View>
                <Text style={styles.menuRowText}>{label}</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.menuRow, styles.logoutRow]} onPress={handleLogout}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#FEE2E2' }]}>
                <Feather name="log-out" size={18} color="#EF4444" />
              </View>
              <Text style={[styles.menuRowText, { color: '#EF4444' }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>LoyalCup LLC · © 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:             { flex: 1, backgroundColor: '#F8FAFC' },
  centered:              { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle:           { fontSize: 20, fontWeight: '900', color: '#101828' },
  profileSection:        { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20, backgroundColor: '#F8FAFC' },
  avatar:                { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 4, borderColor: '#FFFFFF' },
  avatarInitials:        { fontSize: 32, fontWeight: '800', color: '#FFF' },
  userName:              { fontSize: 24, fontWeight: '900', color: '#101828', marginBottom: 3 },
  userEmail:             { fontSize: 13, color: '#94A3B8', marginBottom: 2 },
  userPhone:             { fontSize: 13, color: '#94A3B8', marginBottom: 14 },
  statsRow:              { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#FFFFFF', borderRadius: 24, paddingVertical: 18, paddingHorizontal: 40, gap: 0, borderWidth: 1, borderColor: '#E5E7EB' },
  statItem:              { flex: 1, alignItems: 'center' },
  statValue:             { fontSize: 28, fontWeight: '900', color: '#101828' },
  statLabel:             { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 3 },
  statDivider:           { width: 1, height: 36, backgroundColor: '#E5E7EB' },
  loyaltyCard:           { margin: 16, padding: 24, borderRadius: 26, shadowColor: '#101828', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 8 },
  loyaltyCardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  loyaltyCardLabel:      { color: 'rgba(255,255,255,0.70)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  loyaltyCardPoints:     { color: '#FFF', fontSize: 52, fontWeight: '900', marginBottom: 2 },
  loyaltyCardSub:        { color: 'rgba(255,255,255,0.82)', fontSize: 13, marginBottom: 14 },
  loyaltyBreakdown:      { marginBottom: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 12, gap: 6 },
  loyaltyBreakdownTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  loyaltyBreakdownRow:   { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  loyaltyBreakdownShop:  { color: 'rgba(255,255,255,0.78)', fontSize: 13, flex: 1 },
  loyaltyBreakdownPts:   { color: '#FFF', fontSize: 13, fontWeight: '700' },
  loyaltyViewBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11, backgroundColor: '#FFFFFF', borderRadius: 22 },
  loyaltyViewBtnText:    { color: '#2563EB', fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
  menuSection:           { margin: 16, gap: 8 },
  menuRow:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 15, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  menuRowLeft:           { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIconWrap:          { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  menuRowText:           { fontSize: 15, fontWeight: '600', color: '#101828' },
  logoutRow:             { backgroundColor: '#FEF2F2', marginTop: 8 },
  version:               { textAlign: 'center', fontSize: 12, color: '#CBD5E1', paddingBottom: 8 },
});
