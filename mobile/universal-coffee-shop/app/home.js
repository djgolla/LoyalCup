// universal-coffee-shop/app/home.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CoffeeShopCard from '../components/CoffeeShopCard';
import { shopService } from '../services/shopService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { DUMMY_SHOPS } from '../constants/dummyData';

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { getItemCount } = useCart();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const data = await shopService.getShops();
      setShops(data);
    } catch (error) {
      console.error('Failed to load shops:', error);
      // fallback to dummy data if API fails
      setShops(DUMMY_SHOPS);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadShops();
    setRefreshing(false);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadShops();
      return;
    }

    try {
      const data = await shopService.searchShops(query);
      setShops(data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/launch');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search coffee shops..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => router.push('/cart')}>
          <Feather name="shopping-cart" size={24} color="black" />
          {getItemCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getItemCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => router.push('/profile')}>
          <Feather name="user" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>NEARBY</Text>
    </>
  );

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
      <FlatList
        data={shops}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CoffeeShopCard shop={item} />}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    height: 45,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 25,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  iconButton: {
    marginLeft: 10,
    padding: 5,
  },
  sectionTitle: {
    fontSize: 22,
    marginBottom: 15,
    fontFamily: 'Anton-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#000',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Anton-Regular',
  },
});