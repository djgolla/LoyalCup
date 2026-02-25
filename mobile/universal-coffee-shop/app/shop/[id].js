// shop detail screen - STARBUCKS STYLE
// universal-coffee-shop/app/shop/[id].js
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert, Image, Animated, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { shopService } from '../../services/shopService';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function ShopDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addItem, getItemCount } = useCart();
  const [shop, setShop] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [shopStats, setShopStats] = useState({ rating: 0, reviewCount: 0, avgPrepTime: 15 });
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadShopData();
  }, [id]);

  const loadShopData = async () => {
    try {
      const [shopData, menuData] = await Promise.all([
        shopService.getShop(id),
        shopService.getMenu(id),
        loadShopStats(id)
      ]);
      setShop(shopData);
      setMenu(menuData);
    } catch (error) {
      console.error('Failed to load shop data:', error);
      Alert.alert('Error', 'Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  const loadShopStats = async (shopId) => {
    try {
      // Get order count and calculate average rating from orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select('rating, created_at, completed_at')
        .eq('shop_id', shopId)
        .eq('status', 'completed')
        .not('rating', 'is', null);

      if (!error && orders && orders.length > 0) {
        // Calculate average rating
        const totalRating = orders.reduce((sum, order) => sum + (order.rating || 0), 0);
        const avgRating = (totalRating / orders.length).toFixed(1);
        
        // Calculate average prep time
        const timeDiffs = orders
          .filter(o => o.completed_at && o.created_at)
          .map(o => {
            const created = new Date(o.created_at);
            const completed = new Date(o.completed_at);
            return (completed - created) / 1000 / 60; // minutes
          });
        
        const avgTime = timeDiffs.length > 0 
          ? Math.round(timeDiffs.reduce((sum, t) => sum + t, 0) / timeDiffs.length)
          : 15;

        setShopStats({
          rating: parseFloat(avgRating),
          reviewCount: orders.length,
          avgPrepTime: avgTime
        });
      } else {
        // Default values if no data
        setShopStats({ rating: 0, reviewCount: 0, avgPrepTime: 15 });
      }
    } catch (error) {
      console.error('Failed to load shop stats:', error);
      setShopStats({ rating: 0, reviewCount: 0, avgPrepTime: 15 });
    }
  };

  const handleAddToCart = (item) => {
    addItem({
      id: `${id}:${item.id}`,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      shopId: id,
      shopName: shop?.name,
    });
    Alert.alert('Added! 🎉', `${item.name} is in your cart`);
  };

  const categories = ['all', ...new Set(menu.map(item => item.category))];
  const filteredMenu = selectedCategory === 'all' 
    ? menu 
    : menu.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
        </View>
      </SafeAreaView>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Floating Header */}
      <Animated.View style={[styles.header, { 
        backgroundColor: headerOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.98)']
        }),
        borderBottomColor: headerOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']
        })
      }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Animated.Text style={[styles.headerTitle, { opacity: headerOpacity }]}>
          {shop?.name}
        </Animated.Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/cart')}>
          <Feather name="shopping-bag" size={24} color="#000" />
          {getItemCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getItemCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {shop?.banner_url ? (
            <Image 
              source={{ uri: shop.banner_url }} 
              style={styles.heroBanner}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroBannerPlaceholder}>
              <Text style={{ fontSize: 60, opacity: 0.3 }}>☕</Text>
            </View>
          )}
        </View>

        {/* Shop Info */}
        <View style={styles.shopInfo}>
          <View style={styles.shopHeader}>
            <View style={styles.shopLogoContainer}>
              {shop?.logo_url ? (
                <Image 
                  source={{ uri: shop.logo_url }} 
                  style={styles.shopLogo}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.shopLogo, styles.shopLogoPlaceholder]}>
                  <Text style={{ fontSize: 32 }}>☕</Text>
                </View>
              )}
            </View>
            <View style={styles.shopHeaderInfo}>
              <Text style={styles.shopName}>{shop?.name}</Text>
              <View style={styles.statsRow}>
                {shopStats.reviewCount > 0 ? (
                  <>
                    <View style={styles.statItem}>
                      <Feather name="star" size={16} color="#00704A" />
                      <Text style={styles.statText}>{shopStats.rating}</Text>
                      <Text style={styles.statTextGray}>({shopStats.reviewCount})</Text>
                    </View>
                    <Text style={styles.statDivider}>•</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                    <Text style={styles.statDivider}>•</Text>
                  </>
                )}
                <View style={styles.statItem}>
                  <Feather name="clock" size={16} color="#666" />
                  <Text style={styles.statText}>{shopStats.avgPrepTime}-{shopStats.avgPrepTime + 5} min</Text>
                </View>
              </View>
              {shop?.address && (
                <View style={styles.addressRow}>
                  <Feather name="map-pin" size={14} color="#666" />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {shop.address}, {shop.city}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {shop?.description && (
            <Text style={styles.shopDescription}>{shop.description}</Text>
          )}
        </View>

        {/* Category Tabs */}
        <View style={styles.categorySection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.categoryTabActive
                ]}
                onPress={() => setSelectedCategory(category)}>
                <Text style={[
                  styles.categoryTabText,
                  selectedCategory === category && styles.categoryTabTextActive
                ]}>
                  {category === 'all' ? 'All Items' : category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {filteredMenu.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="coffee" size={48} color="#DDD" />
              <Text style={styles.emptyText}>No items available</Text>
            </View>
          ) : (
            filteredMenu.map(item => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.menuItem}
                onPress={() => handleAddToCart(item)}
                activeOpacity={0.9}
              >
                {item.image_url ? (
                  <Image 
                    source={{ uri: item.image_url }} 
                    style={styles.menuItemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.menuItemImagePlaceholder}>
                    <Text style={{ fontSize: 48 }}>☕</Text>
                  </View>
                )}
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemName} numberOfLines={2}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.menuItemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.menuItemFooter}>
                    <Text style={styles.menuItemPrice}>${item.price?.toFixed(2) || '0.00'}</Text>
                    <View style={styles.addButtonSmall}>
                      <Feather name="plus" size={16} color="#FFF" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 60 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    zIndex: 100,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    color: '#000',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#00704A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    height: 160,
    width: '100%',
  },
  heroBanner: {
    width: '100%',
    height: '100%',
  },
  heroBannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfo: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  shopHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  shopLogoContainer: {
    marginRight: 16,
  },
  shopLogo: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  shopLogoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  shopHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  statTextGray: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    marginHorizontal: 8,
    color: '#CCC',
  },
  newBadge: {
    backgroundColor: '#00704A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  shopDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  categorySection: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  categoryTabActive: {
    backgroundColor: '#00704A',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTabTextActive: {
    color: '#FFF',
  },
  menuGrid: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: (width - 48) / 2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F5F5F5',
  },
  menuItemImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemInfo: {
    padding: 12,
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    lineHeight: 20,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  addButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00704A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    width: '100%',
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});