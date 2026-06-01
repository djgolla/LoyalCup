/**
 * Home screen — shop discovery
 * Filters: All · Nearby (device GPS) · Open Now
 *
 * Card image logic:
 *   - Uses banner_url as the card header image if available (wide, landscape-friendly)
 *   - Falls back to a green gradient with the logo centred if no banner
 *   - Logo-only shops get a clean placeholder — no stretched square logo
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
import WebView from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { useFavorites } from '../hooks/useFavorites';

const deg2rad = (d) => d * (Math.PI / 180);
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R  = 6371;
  const dL = deg2rad(lat2 - lat1);
  const dO = deg2rad(lon2 - lon1);
  const a  = Math.sin(dL / 2) ** 2 +
             Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dO / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const DAYS_FULL  = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const DAYS_SHORT = ['sun','mon','tue','wed','thu','fri','sat'];

const isOpenNow = (shop) => {
  const hours = shop?.hours;
  if (!hours) return null;
  try {
    const now    = new Date();
    const idx    = now.getDay();
    const todayH = hours[DAYS_FULL[idx]] || hours[DAYS_SHORT[idx]];
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

const isSvgUrl = (url) => typeof url === 'string' && url.split('?')[0].toLowerCase().endsWith('.svg');

const SvgImage = ({ uri, style, resizeMode = 'cover' }) => {
  const objectFit = resizeMode === 'contain' ? 'contain' : 'cover';
  const html = `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      html,body{margin:0;padding:0;background:transparent;height:100%;width:100%;overflow:hidden}
      img{width:100%;height:100%;object-fit:${objectFit};display:block}
    </style></head>
    <body><img src="${uri}" /></body></html>`;
  return (
    <WebView
      style={[style, { backgroundColor: 'transparent' }]}
      originWhitelist={['*']}
      source={{ html, baseUrl: 'https://loyalcupapp.com' }}
      scrollEnabled={false}
      androidLayerType="software"
      pointerEvents="none"
    />
  );
};

const ShopImg = ({ uri, style, resizeMode = 'cover' }) => {
  if (!uri) return null;
  if (isSvgUrl(uri)) return <SvgImage uri={uri} style={style} resizeMode={resizeMode} />;
  return <Image source={{ uri }} style={style} resizeMode={resizeMode} />;
};

/**
 * Card header image:
 *  - banner_url  → fills the header (proper wide image, looks great)
 *  - logo only   → green gradient with logo pill centred
 *  - nothing     → green gradient + coffee icon
 */
const CardBanner = ({ bannerUrl, logoUrl, open }) => {
  if (bannerUrl) {
    return (
      <View style={styles.cardBannerWrap}>
        <ShopImg uri={bannerUrl} style={styles.cardBannerImg} resizeMode="cover" />
        <View style={styles.cardBannerOverlay} />
        {/* tiny logo badge over banner */}
        {logoUrl && (
          <View style={styles.logoBadge}>
            <ShopImg uri={logoUrl} style={styles.logoBadgeImg} resizeMode="contain" />
          </View>
        )}
        {open !== null && (
          <View style={[styles.openBadge, { backgroundColor: open ? '#00704A' : '#6b7280' }]}>
            <Text style={styles.openBadgeText}>{open ? 'Open' : 'Closed'}</Text>
          </View>
        )}
      </View>
    );
  }

  // No banner — show gradient placeholder with logo or icon centred
  return (
    <View style={styles.cardBannerWrap}>
      <View style={styles.cardBannerGradient}>
        {logoUrl ? (
          <View style={styles.logoCentred}>
            <ShopImg uri={logoUrl} style={styles.logoCentredImg} resizeMode="contain" />
          </View>
        ) : (
          <Feather name="coffee" size={36} color="rgba(255,255,255,0.6)" />
        )}
      </View>
      {open !== null && (
        <View style={[styles.openBadge, { backgroundColor: open ? '#00704A' : '#6b7280' }]}>
          <Text style={styles.openBadgeText}>{open ? 'Open' : 'Closed'}</Text>
        </View>
      )}
    </View>
  );
};

const ShopCard = ({ item, onPress, distanceKm, isFav, onToggleFav }) => {
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

      <View style={{ position: 'relative' }}>
        <CardBanner bannerUrl={item.banner_url} logoUrl={item.logo_url} open={open} />
        {/* Heart */}
        <TouchableOpacity
          style={styles.heartButton}
          onPress={(e) => { e.stopPropagation?.(); onToggleFav(item.id); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="heart" size={18} color={isFav ? '#ef4444' : '#fff'} />
        </TouchableOpacity>
      </View>

      <View style={styles.shopCardContent}>
        <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
        {/* Description — 1 line max, ellipsis */}
        {item.description ? (
          <Text style={styles.shopDescription} numberOfLines={1}>{item.description}</Text>
        ) : null}
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
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router              = useRouter();
  const { user }            = useAuth();
  const { getItemCount }    = useCart();
  const { isFavorite, toggle } = useFavorites();

  const [shops,          setShops]          = useState([]);
  const [filteredShops,  setFilteredShops]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [userLocation,   setUserLocation]   = useState(null);
  const [profile,        setProfile]        = useState(null);
  const [distances,      setDistances]      = useState({});

  const filters = [
    { key: 'all',    label: 'All',      icon: 'grid'    },
    { key: 'nearby', label: 'Nearby',   icon: 'map-pin' },
    { key: 'open',   label: 'Open Now', icon: 'clock'   },
  ];

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('full_name').eq('id', user.id).single()
      .then(({ data }) => setProfile(data)).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
        }
      } catch { /* location optional */ }
    })();
  }, []);

  const loadShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          id, name, description, address, city, state,
          logo_url, banner_url,
          hours, lat, lng, avg_rating, review_count, status,
          shop_offers ( id, title, description, is_active )
        `)
        .eq('status', 'active')
        .order('name', { ascending: true });

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
      if (shop.lat != null && shop.lng != null) {
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
        if (Object.keys(distances).length === 0) {
          Alert.alert('No Location Data', 'Shops haven\'t set their location yet. Check back soon!', [{ text: 'OK' }]);
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
              isFav={isFavorite(item.id)}
              onToggleFav={toggle}
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

  // ── Card ──
  shopCard:             { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  offerRibbon:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 5 },
  offerRibbonText:      { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Card banner
  cardBannerWrap:       { width: '100%', height: 140, position: 'relative' },
  cardBannerImg:        { width: '100%', height: '100%' },
  cardBannerOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  cardBannerGradient:   { width: '100%', height: '100%', backgroundColor: '#00704A', justifyContent: 'center', alignItems: 'center' },
  // Logo badge overlaid on banner (bottom-left)
  logoBadge:            { position: 'absolute', bottom: 10, left: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', overflow: 'hidden', borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  logoBadgeImg:         { width: '100%', height: '100%' },
  // Logo centred in gradient (no banner case)
  logoCentred:          { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  logoCentredImg:       { width: '100%', height: '100%' },

  openBadge:            { position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  openBadgeText:        { color: '#FFF', fontSize: 11, fontWeight: '700' },
  heartButton:          { position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },

  shopCardContent:      { padding: 14 },
  shopName:             { fontSize: 17, fontWeight: '800', color: '#000', marginBottom: 3 },
  // 1 line with ellipsis
  shopDescription:      { fontSize: 13, color: '#888', lineHeight: 18, marginBottom: 6 },
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