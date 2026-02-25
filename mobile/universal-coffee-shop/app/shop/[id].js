// shop detail screen
// universal-coffee-shop/app/shop/[id].js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { shopService } from '../../services/shopService';
import MenuItemCard from '../../components/MenuItemCard';
import { useCart } from '../../context/CartContext';

export default function ShopDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addItem, getItemCount } = useCart();
  const [shop, setShop] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadShopData();
  }, [id]);

  const loadShopData = async () => {
    try {
      const [shopData, menuData] = await Promise.all([
        shopService.getShop(id),
        shopService.getMenu(id),
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

  const handleAddToCart = (item) => {
    addItem({
      id: `${id}:${item.id}`,
      name: item.name,
      price: item.price,
      shopId: id,
      shopName: shop?.name,
    });
    Alert.alert('Added to Cart', `${item.name} has been added to your cart`);
  };

  const categories = ['all', ...new Set(menu.map(item => item.category))];
  const filteredMenu = selectedCategory === 'all' 
    ? menu 
    : menu.filter(item => item.category === selectedCategory);

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
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{shop?.name || 'Shop'}</Text>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => router.push('/cart')}>
          <Feather name="shopping-cart" size={24} color="black" />
          {getItemCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getItemCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.shopInfo}>
          <View style={[styles.shopLogo, { backgroundColor: shop?.color || '#F0F0F0' }]} />
          <Text style={styles.shopName}>{shop?.name}</Text>
          <Text style={styles.shopAddress}>{shop?.address || 'Location not available'}</Text>
        </View>

        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.menuContainer}>
          {filteredMenu.map(item => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              onAddToCart={handleAddToCart}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 20,
    fontFamily: 'Anton-Regular',
    flex: 1,
    textAlign: 'center',
  },
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
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
  content: {
    flex: 1,
  },
  shopInfo: {
    alignItems: 'center',
    padding: 20,
  },
  shopLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: 15,
  },
  shopName: {
    fontSize: 24,
    fontFamily: 'Anton-Regular',
    marginBottom: 5,
  },
  shopAddress: {
    fontSize: 14,
    color: '#666',
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#FFF',
  },
  categoryButtonActive: {
    backgroundColor: '#000',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Anton-Regular',
    color: '#000',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  menuContainer: {
    padding: 20,
  },
});
