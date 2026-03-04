import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, ScrollView, 
  Image, Dimensions, RefreshControl, ActivityIndicator, Linking, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function ShopDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addItem, getItemCount } = useCart();
  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadShopData();
  }, [id]);

  const loadShopData = async () => {
    try {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('id', id)
        .single();

      if (shopError) throw shopError;
      setShop(shopData);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', id)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      console.log('Categories loaded:', categoriesData);
      setCategories(categoriesData || []);

      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('shop_id', id)
        .eq('is_available', true)
        .order('display_order', { ascending: true });

      if (itemsError) throw itemsError;
      console.log('Menu items loaded:', itemsData);
      setMenuItems(itemsData || []);
    } catch (error) {
      console.error('Failed to load shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadShopData();
    setRefreshing(false);
  };

  const handleAddToCart = (item) => {
    const cartItem = {
      id: `${id}:${item.id}`,
      name: item.name,
      price: parseFloat(item.base_price),
      quantity: 1,
      shopId: id,
      shopName: shop?.name,
      image_url: item.image_url,
    };
    
    addItem(cartItem);
  };

  const handleCall = () => {
    if (!shop?.phone) {
      Alert.alert('No phone number', 'This shop hasn\'t added a phone number yet.');
      return;
    }
    
    const phoneNumber = shop.phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleDirections = () => {
    if (!shop?.address) {
      Alert.alert('No address', 'This shop hasn\'t added an address yet.');
      return;
    }
    
    const encodedAddress = encodeURIComponent(shop.address);
    const url = `https://maps.apple.com/?q=${encodedAddress}`;
    Linking.openURL(url);
  };

  const getFilteredItems = () => {
    if (selectedCategory === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.category_id === selectedCategory);
  };

  const getItemsByCategory = () => {
    const grouped = {};
    
    menuItems.forEach(item => {
      const categoryId = item.category_id || 'uncategorized';
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(item);
    });

    return grouped;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Loading shop...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>Shop not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filteredItems = getFilteredItems();
  const itemsByCategory = getItemsByCategory();
  const cartCount = getItemCount();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{shop.name}</Text>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => router.push('/cart')}>
          <Feather name="shopping-cart" size={24} color="#000" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        
        <View style={styles.shopInfo}>
          <View style={styles.shopLogoContainer}>
            {shop.logo_url ? (
              <Image source={{ uri: shop.logo_url }} style={styles.shopLogo} />
            ) : (
              <View style={styles.shopLogoPlaceholder}>
                <Feather name="coffee" size={40} color="#00704A" />
              </View>
            )}
          </View>
          
          {shop.description && (
            <Text style={styles.shopDescription}>{shop.description}</Text>
          )}
          
          <View style={styles.shopDetails}>
            {shop.address && (
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={16} color="#00704A" />
                <Text style={styles.detailText}>{shop.address}</Text>
              </View>
            )}
            {shop.phone && (
              <View style={styles.detailRow}>
                <Feather name="phone" size={16} color="#00704A" />
                <Text style={styles.detailText}>{shop.phone}</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            {shop.phone && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <Feather name="phone" size={20} color="#00704A" />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
            )}
            {shop.address && (
              <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
                <Feather name="navigation" size={20} color="#00704A" />
                <Text style={styles.actionButtonText}>Directions</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {categories.length > 0 && (
          <View style={styles.categoryTabsWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabsContent}>
              <TouchableOpacity
                style={[
                  styles.categoryTab,
                  selectedCategory === 'all' && styles.categoryTabActive
                ]}
                onPress={() => setSelectedCategory('all')}>
                <Text style={[
                  styles.categoryTabText,
                  selectedCategory === 'all' && styles.categoryTabTextActive
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryTab,
                    selectedCategory === category.id && styles.categoryTabActive
                  ]}
                  onPress={() => setSelectedCategory(category.id)}>
                  <Text style={[
                    styles.categoryTabText,
                    selectedCategory === category.id && styles.categoryTabTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {selectedCategory === 'all' ? (
          <View style={styles.menuContainer}>
            {categories.length > 0 ? (
              categories.map((category) => {
                const categoryItems = itemsByCategory[category.id] || [];
                if (categoryItems.length === 0) return null;

                return (
                  <View key={category.id} style={styles.categorySection}>
                    <Text style={styles.categorySectionTitle}>{category.name}</Text>
                    {category.description && (
                      <Text style={styles.categorySectionDescription}>
                        {category.description}
                      </Text>
                    )}
                    <View style={styles.menuGrid}>
                      {categoryItems.map((item) => (
                        <View key={item.id} style={styles.menuItem}>
                          {item.image_url && (
                            <Image 
                              source={{ uri: item.image_url }} 
                              style={styles.menuItemImage}
                            />
                          )}
                          <View style={styles.menuItemContent}>
                            <Text style={styles.menuItemName} numberOfLines={2}>
                              {item.name}
                            </Text>
                            {item.description && (
                              <Text style={styles.menuItemDescription} numberOfLines={2}>
                                {item.description}
                              </Text>
                            )}
                            <View style={styles.menuItemFooter}>
                              <Text style={styles.menuItemPrice}>
                                ${parseFloat(item.base_price).toFixed(2)}
                              </Text>
                              <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => handleAddToCart(item)}>
                                <Feather name="plus" size={20} color="#FFF" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })
            ) : null}

            {itemsByCategory.uncategorized && itemsByCategory.uncategorized.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categorySectionTitle}>Menu Items</Text>
                <View style={styles.menuGrid}>
                  {itemsByCategory.uncategorized.map((item) => (
                    <View key={item.id} style={styles.menuItem}>
                      {item.image_url && (
                        <Image 
                          source={{ uri: item.image_url }} 
                          style={styles.menuItemImage}
                        />
                      )}
                      <View style={styles.menuItemContent}>
                        <Text style={styles.menuItemName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        {item.description && (
                          <Text style={styles.menuItemDescription} numberOfLines={2}>
                            {item.description}
                          </Text>
                        )}
                        <View style={styles.menuItemFooter}>
                          <Text style={styles.menuItemPrice}>
                            ${parseFloat(item.base_price).toFixed(2)}
                          </Text>
                          <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => handleAddToCart(item)}>
                            <Feather name="plus" size={20} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.menuContainer}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="coffee" size={64} color="#CCC" />
                <Text style={styles.emptyText}>No items in this category</Text>
              </View>
            ) : (
              <View style={styles.menuGrid}>
                {filteredItems.map((item) => (
                  <View key={item.id} style={styles.menuItem}>
                    {item.image_url && (
                      <Image 
                        source={{ uri: item.image_url }} 
                        style={styles.menuItemImage}
                      />
                    )}
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {item.description && (
                        <Text style={styles.menuItemDescription} numberOfLines={2}>
                          {item.description}
                        </Text>
                      )}
                      <View style={styles.menuItemFooter}>
                        <Text style={styles.menuItemPrice}>
                          ${parseFloat(item.base_price).toFixed(2)}
                        </Text>
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={() => handleAddToCart(item)}>
                          <Feather name="plus" size={20} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {cartCount > 0 && (
        <TouchableOpacity 
          style={styles.floatingCartButton}
          onPress={() => router.push('/cart')}>
          <View style={styles.floatingCartContent}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.floatingCartText}>View Cart</Text>
            <Feather name="arrow-right" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#00704A',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  shopInfo: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  shopLogoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#00704A',
  },
  shopLogo: {
    width: '100%',
    height: '100%',
  },
  shopLogoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  shopDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  shopDetails: {
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#00704A',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00704A',
  },
  categoryTabsWrapper: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#00704A',
  },
  categoryTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  categoryTabTextActive: {
    color: '#FFF',
  },
  menuContainer: {
    paddingTop: 16,
  },
  categorySection: {
    marginBottom: 32,
  },
  categorySectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  categorySectionDescription: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  menuGrid: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: (width - 32) / 2,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItemImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F5F5F5',
  },
  menuItemContent: {
    padding: 12,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00704A',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00704A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#00704A',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  floatingCartBadge: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  floatingCartBadgeText: {
    color: '#00704A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  floatingCartText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
});