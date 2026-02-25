// Favorites/saved shops screen
// universal-coffee-shop/app/favorites.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

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
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAVORITES</Text>
          <View style={styles.backButton} />
        </View>

        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="heart" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyText}>
              Start adding your favorite coffee shops to see them here
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => router.push('/home')}>
              <Text style={styles.exploreButtonText}>EXPLORE SHOPS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {favorites.map((shop) => (
              <TouchableOpacity 
                key={shop.id}
                style={styles.shopCard}
                onPress={() => router.push(`/shop/${shop.id}`)}>
                <View style={styles.shopImageContainer}>
                  {shop.logo_url ? (
                    <Image 
                      source={{ uri: shop.logo_url }} 
                      style={styles.shopImage}
                    />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Feather name="coffee" size={32} color="#666" />
                    </View>
                  )}
                </View>
                
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{shop.name}</Text>
                  <View style={styles.shopDetails}>
                    <Feather name="map-pin" size={14} color="#666" />
                    <Text style={styles.shopAddress}>{shop.address || 'No address'}</Text>
                  </View>
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
                  <Feather name="heart" size={24} color="#FF0000" fill="#FF0000" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Anton-Regular',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Anton-Regular',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  exploreButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: '#000',
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#FFF',
    fontFamily: 'Anton-Regular',
    fontSize: 16,
  },
  content: {
    padding: 20,
  },
  shopCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
  },
  shopImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000',
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfo: {
    flex: 1,
    marginLeft: 15,
  },
  shopName: {
    fontSize: 18,
    fontFamily: 'Anton-Regular',
    marginBottom: 5,
  },
  shopDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  shopAddress: {
    fontSize: 14,
    color: '#666',
  },
  shopDistance: {
    fontSize: 12,
    color: '#8B4513',
    fontFamily: 'Anton-Regular',
  },
  favoriteButton: {
    padding: 10,
  },
});
