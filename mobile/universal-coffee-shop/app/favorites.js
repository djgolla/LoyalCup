/**
 * Favorites screen — reads customer_favorites from Supabase,
 * shows full shop details, allows removing via heart button.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  FlatList, ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useFavorites } from '../hooks/useFavorites';

export default function FavoritesScreen() {
  const router              = useRouter();
  const { user }            = useAuth();
  const { favoriteIds, toggle, loading: favLoading, reload } = useFavorites();

  const [shops,      setShops]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadShops = useCallback(async () => {
    if (!user?.id || favLoading) return;

    const ids = [...favoriteIds];
    if (ids.length === 0) {
      setShops([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name, description, address, city, state, logo_url, hours, avg_rating')
        .in('id', ids)
        .eq('status', 'active');

      if (error) throw error;
      setShops(data || []);
    } catch (e) {
      console.error('[Favorites] loadShops error:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, favoriteIds, favLoading]);

  // Reload shops whenever the set of favoriteIds changes
  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload();          // refreshes favoriteIds from Supabase
    await loadShops();
    setRefreshing(false);
  };

  const handleRemove = async (shopId) => {
    await toggle(shopId);
    // Remove from local list immediately
    setShops(prev => prev.filter(s => s.id !== shopId));
  };

  const isOpen = (shop) => {
    const DAYS_FULL  = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const DAYS_SHORT = ['sun','mon','tue','wed','thu','fri','sat'];
    const hours = shop?.hours;
    if (!hours) return null;
    try {
      const now    = new Date();
      const idx    = now.getDay();
      const h      = hours[DAYS_FULL[idx]] || hours[DAYS_SHORT[idx]];
      if (!h || h.closed) return false;
      const [oH, oM] = (h.open  || '00:00').split(':').map(Number);
      const [cH, cM] = (h.close || '23:59').split(':').map(Number);
      const cur = now.getHours() * 60 + now.getMinutes();
      return cur >= oH * 60 + oM && cur <= cH * 60 + cM;
    } catch { return null; }
  };

  if (loading || favLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favorites</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#00704A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.backButton} />
      </View>

      {shops.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="heart" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart on any shop to save it here
          </Text>
          <TouchableOpacity style={styles.exploreButton} onPress={() => router.back()}>
            <Text style={styles.exploreButtonText}>Explore Shops</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00704A" />
          }
          renderItem={({ item }) => {
            const open   = isOpen(item);
            const rating = item.avg_rating ? parseFloat(item.avg_rating).toFixed(1) : null;

            return (
              <TouchableOpacity
                style={styles.shopCard}
                onPress={() => router.push(`/shop/${item.id}`)}
                activeOpacity={0.75}
              >
                {/* Logo */}
                <View style={styles.logoWrap}>
                  {item.logo_url
                    ? <Image source={{ uri: item.logo_url }} style={styles.logo} />
                    : <View style={[styles.logo, styles.logoPlaceholder]}>
                        <Feather name="coffee" size={28} color="#00704A" />
                      </View>
                  }
                </View>

                {/* Info */}
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>

                  {item.address && (
                    <View style={styles.row}>
                      <Feather name="map-pin" size={12} color="#999" />
                      <Text style={styles.shopAddress} numberOfLines={1}>{item.address}</Text>
                    </View>
                  )}

                  <View style={styles.row}>
                    {open !== null && (
                      <View style={[styles.openDot, { backgroundColor: open ? '#00704A' : '#9ca3af' }]} />
                    )}
                    {open !== null && (
                      <Text style={[styles.openText, { color: open ? '#00704A' : '#9ca3af' }]}>
                        {open ? 'Open' : 'Closed'}
                      </Text>
                    )}
                    {rating && (
                      <>
                        <Feather name="star" size={11} color="#f59e0b" style={{ marginLeft: open !== null ? 10 : 0 }} />
                        <Text style={styles.rating}>{rating}</Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Remove from favorites */}
                <TouchableOpacity
                  style={styles.heartButton}
                  onPress={() => handleRemove(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="heart" size={22} color="#ef4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#FAFAFA' },
  centered:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton:      { padding: 8, width: 40 },
  headerTitle:     { fontSize: 20, fontWeight: '700', color: '#000' },
  list:            { padding: 16, paddingBottom: 40 },
  emptyState:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle:      { fontSize: 20, fontWeight: '700', color: '#000', marginTop: 16, marginBottom: 8 },
  emptyText:       { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  exploreButton:   { paddingHorizontal: 32, paddingVertical: 14, backgroundColor: '#00704A', borderRadius: 25 },
  exploreButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  shopCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  logoWrap:        { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', marginRight: 14 },
  logo:            { width: '100%', height: '100%' },
  logoPlaceholder: { backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  shopInfo:        { flex: 1, gap: 4 },
  shopName:        { fontSize: 16, fontWeight: '700', color: '#000' },
  row:             { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopAddress:     { fontSize: 12, color: '#999', flex: 1 },
  openDot:         { width: 7, height: 7, borderRadius: 4 },
  openText:        { fontSize: 12, fontWeight: '600' },
  rating:          { fontSize: 12, fontWeight: '600', color: '#555' },
  heartButton:     { padding: 8 },
});