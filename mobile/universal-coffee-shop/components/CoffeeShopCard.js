// CoffeeShopCard component
// universal-coffee-shop/components/CoffeeShopCard.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CoffeeShopCard({ shop }) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);

  const shopId = shop?.id || shop?.shop_id;

  const handlePress = () => {
    if (!shopId || shopId === 'undefined' || shopId === 'null') {
      console.warn('[CoffeeShopCard] Missing shop id, not navigating:', shop);
      return;
    }

    console.log('[CoffeeShopCard] opening shop:', {
      id: shopId,
      name: shop?.name,
      status: shop?.status,
    });

    router.push(`/shop/${shopId}`);
  };

  const handleFavoritePress = (event) => {
    event?.stopPropagation?.();
    setIsFavorited((prev) => !prev);
  };

  const rating = shop?.avg_rating || shop?.rating || 4.5;
  const reviewCount = shop?.review_count || shop?.reviews_count || 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.logoContainer, { backgroundColor: shop?.color || '#F8FAFC' }]}>
        {shop?.logo_url ? (
          <Image
            source={{ uri: shop.logo_url }}
            style={styles.logo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.logo}>
            <Text style={{ fontSize: 24 }}>☕</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.shopName} numberOfLines={1}>
          {shop?.name || 'Coffee Shop'}
        </Text>

        <View style={styles.infoRow}>
          <Feather name="map-pin" size={14} color="#64748B" />
          <Text style={styles.locationText} numberOfLines={1}>
            {shop?.city || shop?.address || 'Nearby'}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          <Feather name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>
            {Number(rating || 0).toFixed(1)}
          </Text>
          <Text style={styles.reviewCount}>
            ({reviewCount})
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={handleFavoritePress}
      >
        <Feather
          name="heart"
          size={20}
          color={isFavorited ? '#FF0000' : '#94A3B8'}
          fill={isFavorited ? '#FF0000' : 'none'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#101828',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#101828',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  favoriteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
