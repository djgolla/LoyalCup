/**
 * Home screen — shop discovery
 * Filters: All · Nearby (device GPS) · Open Now · Favorites
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Image, TextInput, FlatList, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import WebView from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../hooks/useFavorites';
import { shopService } from '../services/shopService';

const deg2rad = (d) => d * (Math.PI / 180);

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R  = 6371;
  const dL = deg2rad(lat2 - lat1);
  const dO = deg2rad(lon2 - lon1);
  const a  = Math.sin(dL / 2) ** 2 +
             Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dO / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const kmToDisplay = (km) => {
  const miles = km * 0.621371;
  if (miles < 0.1) return `${Math.round(km * 1000 * 3.281)}ft`;
  return `${miles.toFixed(1)}mi`;
};

const getShopId = (shop) => shop?.id || shop?.shop_id || null;

const isValidShopId = (shopId) => (
  !!shopId &&
  shopId !== 'undefined' &&
  shopId !== 'null'
);

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
  } catch {
    return null;
  }
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

const CardBanner = ({ bannerUrl, logoUrl, shopName, open }) => {
  if (bannerUrl) {
    return (
      <View style={styles.cardBannerWrap}>
        <ShopImg uri={bannerUrl} style={styles.cardBannerImg} resizeMode="cover" />

        <View pointerEvents="none" style={styles.cardBannerScrim}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {logoUrl && (
          <View style={styles.logoBadge}>
            <ShopImg uri={logoUrl} style={styles.logoBadgeImg} resizeMode="cover" />
          </View>
        )}

        {open !== null && (
          <View style={[styles.openBadge, { backgroundColor: open ? '#00704A' : '#4b5563' }]}>
            <View style={[styles.openDot, { backgroundColor: open ? '#4ade80' : '#9ca3af' }]} />
            <Text style={styles.openBadgeText}>{open ? 'Open' : 'Closed'}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.cardBannerWrap}>
      <LinearGradient
        colors={['#1a0a00', '#2d1200', '#1a2e1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(255,255,255,0.06)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.noBannerContent}>
        {logoUrl ? (
          <View style={styles.noBannerGlowRing}>
            <View style={styles.noBannerLogoCircle}>
              <ShopImg uri={logoUrl} style={styles.noBannerLogoImg} resizeMode="contain" />
            </View>
          </View>
        ) : (
          <View style={styles.noBannerIconWrap}>
            <Feather name="coffee" size={32} color="rgba(255,255,255,0.55)" />
          </View>
        )}

        {shopName ? (
          <Text style={styles.noBannerName} numberOfLines={1}>{shopName}</Text>
        ) : null}
      </View>

      {open !== null && (
        <View style={[styles.openBadge, { backgroundColor: open ? '#00704A' : '#4b5563' }]}>
          <View style={[styles.openDot, { backgroundColor: open ? '#4ade80' : '#9ca3af' }]} />
          <Text style={styles.openBadgeText}>{open ? 'Open' : 'Closed'}</Text>
        </View>
      )}
    </View>
  );
};

const ShopCard = ({ item, onPress, distanceKm, isFav, onToggleFav }) => {
  const open        = isOpenNow(item);
  const rating      = item?.avg_rating ? parseFloat(item.avg_rating).toFixed(1) : null;
  const activeOffer = item?.shop_offers?.find(o => o.is_active);
  const shopId      = getShopId(item);

  return (
    <TouchableOpacity style={styles.shopCard} onPress={onPress} activeOpacity={0.75}>
      {activeOffer && (
        <View style={styles.offerRibbon}>
          <Feather name="tag" size={10} color="#fff" />
          <Text style={styles.offerRibbonText}>{activeOffer.title}</Text>
        </View>
      )}

      <View style={{ position: 'relative' }}>
        <CardBanner
          bannerUrl={item?.banner_url}
          logoUrl={item?.logo_url}
          shopName={item?.name}
          open={open}
        />

        <TouchableOpacity
          style={styles.heartButton}
          onPress={(e) => {
            e.stopPropagation?.();

            if (!isValidShopId(shopId)) {
              console.warn('[Home] Missing shop id, not toggling favorite:', item);
              return;
            }

            onToggleFav(shopId);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="heart" size={18} color={isFav ? '#ef4444' : '#fff'} />
        </TouchableOpacity>
      </View>

      <View style={styles.shopCardContent}>
        <Text style={styles.shopName} numberOfLines={1}>{item?.name}</Text>

        {item?.description ? (
          <Text style={styles.shopDescription} numberOfLines={1}>{item.description}</Text>
        ) : null}

        {item?.address && (
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
              <Text style={styles.shopBadgeText}>{kmToDisplay(distanceKm)}</Text>
            </View>
          )}

          {(item?.review_count || 0) > 0 && (
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
  const router                              = useRouter();
  const { user }                            = useAuth();
  const { getItemCount }                    = useCart();
  const { isFavorite, toggle, favoriteIds } = useFavorites();

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
    { key: 'all',       label: 'All',       icon: 'grid'    },
    { key: 'nearby',    label: 'Nearby',    icon: 'map-pin' },
    { key: 'open',      label: 'Open Now',  icon: 'clock'   },
    { key: 'favorites', label: 'Favorites', icon: 'heart'   },
  ];

  useEffect(() => {
    const fullName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email ||
      null;

    setProfile(fullName ? { full_name: fullName } : null);
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
        }
      } catch {
        // location optional
      }
    })();
  }, []);

  const loadShops = async () => {
    try {
      const result = await shopService.getShops();

      const shopList = Array.isArray(result)
        ? result
        : result?.shops || result?.data || [];

      const validShops = shopList.filter((shop) => {
        const shopId = getShopId(shop);
        const valid = isValidShopId(shopId);

        if (!valid) {
          console.warn('[Home] Dropping shop with missing id:', shop);
        }

        return valid;
      });

      setShops(validShops);
    } catch (e) {
      console.error('[Home] loadShops error:', e);
      Alert.alert('Error', e?.message || 'Failed to load shops. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    if (!userLocation || !shops.length) return;

    const d = {};

    shops.forEach(shop => {
      const shopId = getShopId(shop);

      if (isValidShopId(shopId) && shop.lat != null && shop.lng != null) {
        d[shopId] = haversineKm(userLocation.lat, userLocation.lon, shop.lat, shop.lng);
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
          Alert.alert('No Location Data', "Shops haven't set their location yet. Check back soon!", [{ text: 'OK' }]);
          setSelectedFilter('all');
          break;
        }

        result = result
          .filter(s => {
            const shopId = getShopId(s);
            return isValidShopId(shopId) && distances[shopId] !== undefined;
          })
          .sort((a, b) => {
            const aId = getShopId(a);
            const bId = getShopId(b);
            return (distances[aId] ?? 999) - (distances[bId] ?? 999);
          })
          .slice(0, 20);
        break;

      case 'open':
        result = result.filter(s => isOpenNow(s) === true);
        break;

      case 'favorites':
        if (!user) {
          Alert.alert('Sign In Required', 'Sign in to see your saved shops.', [{ text: 'OK' }]);
          setSelectedFilter('all');
          break;
        }

        result = result.filter(s => {
          const shopId = getShopId(s);
          return isValidShopId(shopId) && isFavorite(shopId);
        });
        break;

      default:
        break;
    }

    setFilteredShops(result);
  }, [searchQuery, selectedFilter, shops, distances, userLocation, favoriteIds, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadShops();
    setRefreshing(false);
  };

  const handleOpenShop = (item) => {
    const shopId = getShopId(item);

    if (!isValidShopId(shopId)) {
      console.warn('[Home] Missing shop id, not navigating:', item);
      return;
    }

    router.push(`/shop/${shopId}`);
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

  const emptyMessage = () => {
    if (searchQuery)                    return 'Try a different search';
    if (selectedFilter === 'open')      return 'No shops appear open right now';
    if (selectedFilter === 'nearby')    return 'No shops found near you';
    if (selectedFilter === 'favorites') return 'Heart a shop to save it here ♥';
    return 'Check back soon!';
  };

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
              <Feather
                name={f.icon}
                size={13}
                color={
                  selectedFilter === f.key
                    ? '#fff'
                    : f.key === 'favorites'
                    ? '#ef4444'
                    : '#666'
                }
              />
              <Text style={[styles.filterChipText, selectedFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredShops.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather
            name={selectedFilter === 'favorites' ? 'heart' : 'coffee'}
            size={60}
            color="#DDD"
          />
          <Text style={styles.emptyTitle}>
            {selectedFilter === 'favorites' ? 'No favorites yet' : 'No shops found'}
          </Text>
          <Text style={styles.emptySubtitle}>{emptyMessage()}</Text>
          {(searchQuery || selectedFilter !== 'all') && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedFilter('all');
              }}
            >
              <Text style={styles.clearButtonText}>Show All Shops</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredShops}
          keyExtractor={item => String(getShopId(item))}
          renderItem={({ item }) => {
            const shopId = getShopId(item);

            return (
              <ShopCard
                item={item}
                distanceKm={distances[shopId]}
                isFav={isValidShopId(shopId) && isFavorite(shopId)}
                onToggleFav={toggle}
                onPress={() => handleOpenShop(item)}
              />
            );
          }}
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

  shopCard:             { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  offerRibbon:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 5 },
  offerRibbonText:      { color: '#fff', fontSize: 11, fontWeight: '700' },

  cardBannerWrap:       { width: '100%', height: 150, overflow: 'hidden' },
  cardBannerImg:        { width: '100%', height: '100%' },
  cardBannerScrim:      { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 },

  logoBadge:            { position: 'absolute', bottom: 10, left: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', overflow: 'hidden', borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 4, elevation: 4 },
  logoBadgeImg:         { width: '100%', height: '100%' },

  openBadge:            { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  openDot:              { width: 6, height: 6, borderRadius: 3 },
  openBadgeText:        { color: '#FFF', fontSize: 11, fontWeight: '700' },

  noBannerContent:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  noBannerGlowRing:     { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)' },
  noBannerLogoCircle:   { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFF', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  noBannerLogoImg:      { width: '100%', height: '100%' },
  noBannerIconWrap:     { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(255,255,255,0.10)', justifyContent: 'center', alignItems: 'center' },
  noBannerName:         { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700', letterSpacing: 0.3, maxWidth: 200 },

  heartButton:          { position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },

  shopCardContent:      { padding: 14 },
  shopName:             { fontSize: 17, fontWeight: '800', color: '#000', marginBottom: 3 },
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