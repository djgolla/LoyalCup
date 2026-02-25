// universal-coffee-shop/components/CoffeeShopCard.js - Enhanced with better visuals
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
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
        <View style={styles.logo} />
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
          <Text style={styles.ratingText}>4.8</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.distanceText}>0.3 mi</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.favoriteButton, isFavorited && styles.favoriteButtonActive]} 
        onPress={(e) => {
          e.stopPropagation();
          setIsFavorited(!isFavorited);
        }}>
        <Feather 
          name={isFavorited ? "heart" : "heart"} 
          size={20} 
          color={isFavorited ? '#FF3B30' : '#999'} 
          fill={isFavorited ? '#FF3B30' : 'none'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 16,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 18,
    color: '#1A1A1A',
    fontFamily: 'Anton-Regular',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  dotSeparator: {
    fontSize: 13,
    color: '#CCC',
    marginHorizontal: 4,
  },
  distanceText: {
    fontSize: 13,
    color: '#666',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginLeft: 8,
  },
  favoriteButtonActive: {
    backgroundColor: '#FFE5E5',
  },
});