/**
 * Home screen — shop discovery
 * Filters: All · Nearby (device GPS) · Open Now (hours JSON) · Popular (review_count)
 * Shows active shop offers inline on cards
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Image, TextInput, FlatList, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

const deg2rad = (d) => d * (Math.PI / 180);

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R  = 6371;
  const dL = deg2rad(lat2 - lat1);
  const dO = deg2rad(lon2 - lon1);
  const a  = Math.sin(dL / 2) ** 2 +
             Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dO / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const isOpenNow = (shop) => {
  const hours = shop.hours;
  if (!hours) return null;
  try {
    const now    = new Date();
    const day    = ['sun','mon','tue','wed','thu','fri','sat'][now.getDay()];
    const todayH = hours[day];
    if (!todayH || todayH.closed) return false;
    const [oH, oM] = (todayH.open  || '00:00').split(':').map(Number);
    const [cH, cM] = (todayH.close || '23:59').split(':').map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= oH * 60 + oM && cur <= cH * 60 + cM;
  } catch { return null; }
};

const getGreeting = (name) => {
  const h    = new Date().getHours();
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${time}, ${name.split(' ')[0]}! ☕` : `${time}! ☕`;
};

const ShopCard = ({ item, onPress, distanceKm }) => {
  const open        = isOpenNow(item);
  const rating      = item.avg_rating ? parseFloat(item.avg_rating).toFixed(1) : null;
  const activeOffer = item.shop_offers?.find(o => o.is_active);

  return (
    <TouchableOpacity style={styles.shopCard} onPress={onPress} activeOpacity={0.75}>
      {activeOffer && (
        <View style={styles.offerRibbon}>
          <Feather name="tag" size={10} color="#fff" />
          <Text style={styles.offerRibbonText}>{activeOffer.title}</Text>
        </View>
      )}

      <View style={styles.shopImageContainer}>
        {item.logo_url
          ? <Image source={{ uri: item.logo_url }} style={styles.shopImage} />
          : <View style={styles.shopImagePlaceholder}><Feather name="coffee" size={36} color="#00704A" /></View>
        }
        {open !== null && (
          <View style={[styles.openBadge, { backgroundColor: open ? '#00704A' : '#9ca3af' }]}>
            <Text style={styles.openBadgeText}>{open ? 'Open' : 'Closed'}</Text>
          </View>
        )}
      </View>

      <View style={styles.shopCardContent}>
        <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
        {item.description && (
          <Text style={styles.shopDescription} numberOfLines={2}>{item.description}</Text>
        )}
        {item.address && (
          <View style={styles.shopDetailRow}>
            <Feather name="map-pin" size={11} color="#999" />
            <Text style={styles.shopDetailText} numberOfLines={1}>{item.address}</Text>
          </View>
        )}
        <View style={styles.shopFooter}>
          {rating && (
            <View style={styles.shopBadge}>
              <Feather name="star" size={11} color="#f59e0b" />
              <Text style={styles.shopBadgeText}>{rating}</Text>
            </View>
          )}
          {distanceKm !== null && distanceKm !== undefined && (
            <View style={styles.shopBadge}>
              <Feather name="navigation" size={11} color="#00704A" />
              <Text style={styles.shopBadgeText}>
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
              </Text>
            </View>
          )}
          {(item.review_count || 0) > 0 && (
            <View style={styles.shopBadge}>
              <Feather name="message-circle" size={11} color="#6b7280" />
              <Text style={styles.shopBadgeText}>{item.review_count} reviews</Text>
            </View>
          )}
          {item.featured && (
            <View style={[styles.shopBadge, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="zap" size={11} color="#d97706" />
              <Text style={[styles.shopBadgeText, { color: '#d97706' }]}>Featured</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router           = useRouter();
  const { user }         = useAuth();
  const { getItemCount } = useCart();

  const [shops,          setShops]          = useState([]);
  const [filteredShops,  setFilteredShops]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [userLocation,   setUserLocation]   = useState(null);
  const [profile,        setProfile]        = useState(null);
  const [distances,      setDistances]      = useState({});
  const locationGranted  = useRef(false);

  const filters = [
    { key: 'all',      label: 'All',      icon: 'grid' },
    { key: 'nearby',   label: 'Nearby',   icon: 'map-pin' },
    { key: 'open',     label: 'Open Now', icon: 'clock' },
    { key: 'popular',  label: 'Popular',  icon: 'trending-up' },
    { key: 'featured', label: 'Featured', icon: 'zap' },
  ];

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('full_name').eq('id', user.id).single()
      .then(({ data }) => setProfile(data))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          locationGranted.current = true;
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
        }
      } catch {
        // location optional — silent fail
      }
    })();
  }, []);

  const loadShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          id, name, description, address, city, state, logo_url, banner_url,
          hours, lat, lng, avg_rating, review_count, featured, status,
          shop_offers ( id, title, description, is_active )
        `)
        .eq('status', 'active')
        .order('featured', { ascending: false });

      if (error) throw error;
      setShops(data || []);
    } catch (e) {
      console.error('[Home] loadShops error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShops(); }, []);

  useEffect(() => {
    if (!userLocation || !shops.length) return;
    const d = {};
    shops.forEach(shop => {
      if (shop.lat && shop.lng) {
        d[shop.id] = haversineKm(userLocation.lat, userLocation.lon, shop.lat, shop.lng);
      }
    });
    setDistances(d);
  }, [userLocation, shops]);

  useEffect(() => {
    let result = [...shops];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q)
      );
    }

    switch (selectedFilter) {
      case 'nearby':
        if (!userLocation) {
          Alert.alert('Location Required', 'Enable location to find nearby shops.', [{ text: 'OK' }]);
          setSelectedFilter('all');
          break;
        }
        result = result
          .filter(s => distances[s.id] !== undefined)
          .sort((a, b) => (distances[a.id] ?? 999) - (distances[b.id] ?? 999))
          .slice(0, 20);
        break;

      case 'open':
        result = result.filter(s => isOpenNow(s) === true);
        break;

      case 'popular':
        result = [...result].sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        break;

      case 'featured':
        result = result.filter(s => s.featured === true);
        break;

      default:
        break;
    }

    setFilteredShops(result);
  }, [searchQuery, selectedFilter, shops, distances, userLocation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadShops();
    setRefreshing(false);
  };

  const cartCount = getItemCount();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Finding shops...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting(profile?.full_name)}</Text>
            <Text style={styles.subGreeting}>Find your next coffee</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/cart')}>
              <Feather name="shopping-bag" size={22} color="#000" />
              {cartCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/profile')}>
              <Feather name="user" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search shops, drinks..."
              placeholderTextColor="#bbb"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, selectedFilter === f.key && styles.filterChipActive]}
              onPress={() => setSelectedFilter(f.key)}
            >
              <Feather name={f.icon} size={13} color={selectedFilter === f.key ? '#fff' : '#666'} />
              <Text style={[styles.filterChipText, selectedFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredShops.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="coffee" size={60} color="#DDD" />
          <Text style={styles.emptyTitle}>No shops found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try a different search'
              : selectedFilter === 'open'
              ? 'No shops appear open right now'
              : selectedFilter === 'nearby'
              ? 'No shops found near you'
              : selectedFilter === 'featured'
              ? 'No featured shops right now'
              : 'Check back soon!'}
          </Text>
          {(searchQuery || selectedFilter !== 'all') && (
            <TouchableOpacity style={styles.clearButton} onPress={() => { setSearchQuery(''); setSelectedFilter('all'); }}>
              <Text style={styles.clearButtonText}>Show All Shops</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredShops}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ShopCard
              item={item}
              distanceKm={distances[item.id]}
              onPress={() => router.push(`/shop/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.shopsList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00704A" />}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {filteredShops.length} {filteredShops.length === 1 ? 'shop' : 'shops'}
              {selectedFilter !== 'all' ? ` · ${filters.find(f => f.key === selectedFilter)?.label}` : ''}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#FAFAFA' },
  centered:             { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:          { marginTop: 12, fontSize: 15, color: '#999' },
  header:               { backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTop:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  greeting:             { fontSize: 22, fontWeight: '800', color: '#000' },
  subGreeting:          { fontSize: 13, color: '#999', marginTop: 2 },
  headerButtons:        { flexDirection: 'row', gap: 10 },
  headerButton:         { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  headerBadge:          { position: 'absolute', top: -3, right: -3, backgroundColor: '#FF3B30', borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  headerBadgeText:      { color: '#FFF', fontSize: 11, fontWeight: '800' },
  searchContainer:      { marginBottom: 12 },
  searchBar:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  searchInput:          { flex: 1, fontSize: 15, color: '#000' },
  filtersRow:           { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F5F5F5', borderRadius: 20 },
  filterChipActive:     { backgroundColor: '#00704A' },
  filterChipText:       { fontSize: 13, fontWeight: '600', color: '#666' },
  filterChipTextActive: { color: '#FFF' },
  resultsCount:         { paddingTop: 4, paddingBottom: 8, fontSize: 12, fontWeight: '600', color: '#999' },
  shopsList:            { paddingHorizontal: 16, paddingBottom: 24 },
  shopCard:             { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  offerRibbon:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 5 },
  offerRibbonText:      { color: '#fff', fontSize: 11, fontWeight: '700' },
  shopImageContainer:   { width: '100%', height: 130, position: 'relative' },
  shopImage:            { width: '100%', height: '100%' },
  shopImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  openBadge:            { position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  openBadgeText:        { color: '#FFF', fontSize: 11, fontWeight: '700' },
  shopCardContent:      { padding: 14 },
  shopName:             { fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 3 },
  shopDescription:      { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },
  shopDetailRow:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  shopDetailText:       { fontSize: 12, color: '#999', flex: 1 },
  shopFooter:           { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  shopBadge:            { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F5F5F5', borderRadius: 8 },
  shopBadgeText:        { fontSize: 11, fontWeight: '600', color: '#555' },
  emptyState:           { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle:           { fontSize: 20, fontWeight: '700', color: '#000', marginTop: 16, marginBottom: 6 },
  emptySubtitle:        { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  clearButton:          { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#00704A', borderRadius: 25 },
  clearButtonText:      { color: '#FFF', fontSize: 14, fontWeight: '700' },
});