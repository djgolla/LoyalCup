// Favorites/saved shops screen
// universal-coffee-shop/app/favorites.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem('favoriteShops');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const removeFavorite = async (shopId) => {
    try {
      const updated = favorites.filter(shop => shop.id !== shopId);
      setFavorites(updated);
      await AsyncStorage.setItem('favoriteShops', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.backButton} />
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="heart" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>
            Start adding your favorite coffee shops to see them here
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.back()}>
            <Text style={styles.exploreButtonText}>Explore Shops</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          {favorites.map((shop) => (
            <TouchableOpacity 
              key={shop.id}
              style={styles.shopCard}
              onPress={() => router.push(`/shop/${shop.id}`)}
              activeOpacity={0.7}>
              <View style={styles.shopImageContainer}>
                {shop.logo_url ? (
                  <Image 
                    source={{ uri: shop.logo_url }} 
                    style={styles.shopImage}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Feather name="coffee" size={32} color="#00704A" />
                  </View>
                )}
              </View>
              
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{shop.name}</Text>
                {shop.address && (
                  <View style={styles.shopDetails}>
                    <Feather name="map-pin" size={14} color="#666" />
                    <Text style={styles.shopAddress}>{shop.address}</Text>
                  </View>
                )}
                {shop.distance && (
                  <Text style={styles.shopDistance}>{shop.distance}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  removeFavorite(shop.id);
                }}>
                <Feather name="heart" size={24} color="#FF3B30" fill="#FF3B30" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#00704A',
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shopCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shopImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfo: {
    flex: 1,
    marginLeft: 12,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  shopDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  shopAddress: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  shopDistance: {
    fontSize: 12,
    color: '#00704A',
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 8,
  },
});