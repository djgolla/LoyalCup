import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const router            = useRouter();
  const { user, signOut } = useAuth();

  const [profile,        setProfile]        = useState(null);
  const [globalPoints,   setGlobalPoints]   = useState(0);
  const [shopBreakdown,  setShopBreakdown]  = useState([]);
  const [orderCount,     setOrderCount]     = useState(0);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => { if (user?.id) loadData(); }, [user?.id]);

  const loadData = async () => {
    try {
      const [profileResp, globalPtsResp, shopPtsResp, orderResp] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('id', user.id)
          .single(),

        // FIXED: was querying non-existent 'loyalty_balances' table
        // Global points live in customer_global_points
        supabase
          .from('customer_global_points')
          .select('current_balance')
          .eq('customer_id', user.id)
          .maybeSingle(),

        // Shop-specific breakdown — shows which shops the customer has points at
        supabase
          .from('customer_shop_points')
          .select('current_balance, shops(name)')
          .eq('customer_id', user.id)
          .gt('current_balance', 0)
          .order('current_balance', { ascending: false })
          .limit(3),

        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', user.id)
          .neq('status', 'cancelled'),
      ]);

      setProfile(profileResp.data);
      setOrderCount(orderResp.count || 0);
      setGlobalPoints(globalPtsResp.data?.current_balance || 0);
      setShopBreakdown(
        (shopPtsResp.data || []).map(b => ({
          shopName: b.shops?.name || 'Shop',
          balance:  b.current_balance || 0,
        }))
      );
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
      <View style={styles.centered}><ActivityIndicator size="large" color="#00704A" /></View>
    </SafeAreaView>
  );

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'You';
  const initials    = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Avatar + name */}
        <View style={styles.profileSection}>
          {profile?.avatar_url
            ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            : <View style={styles.avatar}><Text style={styles.avatarInitials}>{initials}</Text></View>
          }
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {profile?.phone && <Text style={styles.userPhone}>{profile.phone}</Text>}

          {/* Quick stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{orderCount}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{globalPoints.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{shopBreakdown.length}</Text>
              <Text style={styles.statLabel}>Shops</Text>
            </View>
          </View>
        </View>

        {/* Loyalty card */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyCardHeader}>
            <Feather name="award" size={20} color="#fff" />
            <Text style={styles.loyaltyCardLabel}>GLOBAL LOYALTY POINTS</Text>
          </View>
          <Text style={styles.loyaltyCardPoints}>{globalPoints.toLocaleString()}</Text>
          <Text style={styles.loyaltyCardSub}>= ${(globalPoints * 0.01).toFixed(2)} in savings</Text>

          {shopBreakdown.length > 0 && (
            <View style={styles.loyaltyBreakdown}>
              <Text style={styles.loyaltyBreakdownTitle}>SHOP POINTS</Text>
              {shopBreakdown.map((b, i) => (
                <View key={i} style={styles.loyaltyBreakdownRow}>
                  <Text style={styles.loyaltyBreakdownShop} numberOfLines={1}>{b.shopName}</Text>
                  <Text style={styles.loyaltyBreakdownPts}>{b.balance.toLocaleString()} pts</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.loyaltyViewBtn} onPress={() => router.push('/rewards')}>
            <Text style={styles.loyaltyViewBtnText}>VIEW REWARDS</Text>
            <Feather name="arrow-right" size={14} color="#00704A" />
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {[
            { icon: 'list',        label: 'Order History',  route: '/order-history' },
            { icon: 'award',       label: 'Rewards',        route: '/rewards' },
            { icon: 'heart',       label: 'Favorite Shops', route: '/favorites' },
            { icon: 'help-circle', label: 'Help & Support', route: '/support' },
          ].map(({ icon, label, route }) => (
            <TouchableOpacity key={route} style={styles.menuRow} onPress={() => router.push(route)}>
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconWrap}><Feather name={icon} size={18} color="#00704A" /></View>
                <Text style={styles.menuRowText}>{label}</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#CCC" />
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

        <Text style={styles.version}>LoyalCup · © 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:             { flex: 1, backgroundColor: '#FAFAFA' },
  centered:              { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle:           { fontSize: 20, fontWeight: '800', color: '#000' },
  profileSection:        { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  avatar:                { width: 90, height: 90, borderRadius: 45, backgroundColor: '#00704A', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarInitials:        { fontSize: 32, fontWeight: '800', color: '#FFF' },
  userName:              { fontSize: 22, fontWeight: '800', color: '#000', marginBottom: 3 },
  userEmail:             { fontSize: 13, color: '#999', marginBottom: 2 },
  userPhone:             { fontSize: 13, color: '#999', marginBottom: 14 },
  statsRow:              { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#F9F9F9', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24 },
  statItem:              { flex: 1, alignItems: 'center' },
  statValue:             { fontSize: 22, fontWeight: '800', color: '#000' },
  statLabel:             { fontSize: 11, color: '#999', fontWeight: '600', marginTop: 2 },
  statDivider:           { width: 1, height: 30, backgroundColor: '#E5E5E5' },
  loyaltyCard:           { margin: 16, padding: 22, backgroundColor: '#00704A', borderRadius: 20 },
  loyaltyCardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  loyaltyCardLabel:      { color: '#A7F3D0', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  loyaltyCardPoints:     { color: '#FFF', fontSize: 52, fontWeight: '900', marginBottom: 2 },
  loyaltyCardSub:        { color: '#A7F3D0', fontSize: 13, marginBottom: 14 },
  loyaltyBreakdown:      { marginBottom: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 12, gap: 6 },
  loyaltyBreakdownTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  loyaltyBreakdownRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  loyaltyBreakdownShop:  { color: '#A7F3D0', fontSize: 13, flex: 1 },
  loyaltyBreakdownPts:   { color: '#FFF', fontSize: 13, fontWeight: '700' },
  loyaltyViewBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11, backgroundColor: '#FFF', borderRadius: 22 },
  loyaltyViewBtnText:    { color: '#00704A', fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
  menuSection:           { margin: 16, gap: 8 },
  menuRow:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 16 },
  menuRowLeft:           { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIconWrap:          { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  menuRowText:           { fontSize: 15, fontWeight: '600', color: '#000' },
  logoutRow:             { backgroundColor: '#FEF2F2', marginTop: 8 },
  version:               { textAlign: 'center', fontSize: 12, color: '#CCC', paddingBottom: 8 },
});