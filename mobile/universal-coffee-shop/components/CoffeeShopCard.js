// CoffeeShopCard component
// universal-coffee-shop/components/CoffeeShopCard.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CoffeeShopCard({ shop }) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/shop/${shop.id}`)}
      activeOpacity={0.7}>
      
      <View style={[styles.logoContainer, { backgroundColor: shop.color || '#F5F5F5' }]}>
        {shop.logo_url ? (
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
        <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={14} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {shop.city || shop.address || 'Nearby'}
          </Text>
        </View>
        <View style={styles.ratingRow}>
          <Feather name="star" size={14} color="#FFB800" />
          <Text style={styles.ratingText}>4.5</Text>
          <Text style={styles.reviewCount}>(120)</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.favoriteButton}
        onPress={() => setIsFavorited(!isFavorited)}>
        <Feather 
          name={isFavorited ? "heart" : "heart"} 
          size={20} 
          color={isFavorited ? "#FF0000" : "#999"}
          fill={isFavorited ? "#FF0000" : "none"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
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
    fontFamily: 'Anton-Regular',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  favoriteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});