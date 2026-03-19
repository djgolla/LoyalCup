import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, ScrollView, 
  Image, Dimensions, RefreshControl, ActivityIndicator, Linking, Alert, Modal
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
  const [modifierGroups, setModifierGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // modifier modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [quantity, setQuantity] = useState(1);

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

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', id)
        .order('display_order', { ascending: true });
      setCategories(categoriesData || []);

      const { data: itemsData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('shop_id', id)
        .eq('is_available', true)
        .order('display_order', { ascending: true });
      setMenuItems(itemsData || []);

      const { data: modGroups } = await supabase
        .from('modifier_groups')
        .select('*, modifier_options(*)')
        .eq('shop_id', id);
      setModifierGroups(modGroups || []);
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

  const openModifierModal = (item) => {
    setSelectedItem(item);
    setSelectedModifiers({});
    setQuantity(1);
    setModalVisible(true);
  };

  const toggleModifier = (groupId, option, isRadio) => {
    setSelectedModifiers(prev => {
      if (isRadio) {
        // single select — radio style
        return { ...prev, [groupId]: [option] };
      } else {
        // multi select — checkbox style
        const current = prev[groupId] || [];
        const exists = current.find(o => o.id === option.id);
        if (exists) {
          return { ...prev, [groupId]: current.filter(o => o.id !== option.id) };
        } else {
          return { ...prev, [groupId]: [...current, option] };
        }
      }
    });
  };

  const getItemModifierGroups = (item) => {
    if (!item?.modifier_group_ids?.length) return [];
    return modifierGroups.filter(g => item.modifier_group_ids.includes(g.id));
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;

    const customizations = Object.values(selectedModifiers).flat();
    const extraPrice = customizations.reduce((sum, c) => sum + (parseFloat(c.price_delta) || 0), 0);
    const totalPrice = (parseFloat(selectedItem.base_price) + extraPrice) * quantity;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: `${id}:${selectedItem.id}`,
        name: selectedItem.name,
        price: parseFloat(selectedItem.base_price) + extraPrice,
        quantity: 1,
        shopId: id,
        shopName: shop?.name,
        image_url: selectedItem.image_url,
        customizations,
      });
    }

    setModalVisible(false);
  };

  const handleCall = () => {
    if (!shop?.phone) { Alert.alert('No phone number', 'This shop hasn\'t added a phone number yet.'); return; }
    Linking.openURL(`tel:${shop.phone.replace(/[^0-9]/g, '')}`);
  };

  const handleDirections = () => {
    if (!shop?.address) { Alert.alert('No address', 'This shop hasn\'t added an address yet.'); return; }
    Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent(shop.address)}`);
  };

  const getFilteredItems = () => {
    if (selectedCategory === 'all') return menuItems;
    return menuItems.filter(item => item.category_id === selectedCategory);
  };

  const getItemsByCategory = () => {
    const grouped = {};
    menuItems.forEach(item => {
      const categoryId = item.category_id || 'uncategorized';
      if (!grouped[categoryId]) grouped[categoryId] = [];
      grouped[categoryId].push(item);
    });
    return grouped;
  };

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => openModifierModal(item)}
      activeOpacity={0.85}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.menuItemImage} />
      )}
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemName} numberOfLines={2}>{item.name}</Text>
        {item.description && (
          <Text style={styles.menuItemDescription} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.menuItemFooter}>
          <Text style={styles.menuItemPrice}>${parseFloat(item.base_price).toFixed(2)}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => openModifierModal(item)}>
            <Feather name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

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
  const itemModGroups = selectedItem ? getItemModifierGroups(selectedItem) : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{shop.name}</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/cart')}>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>

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
          {shop.description && <Text style={styles.shopDescription}>{shop.description}</Text>}
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabsContent}>
              <TouchableOpacity
                style={[styles.categoryTab, selectedCategory === 'all' && styles.categoryTabActive]}
                onPress={() => setSelectedCategory('all')}>
                <Text style={[styles.categoryTabText, selectedCategory === 'all' && styles.categoryTabTextActive]}>All</Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryTab, selectedCategory === category.id && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(category.id)}>
                  <Text style={[styles.categoryTabText, selectedCategory === category.id && styles.categoryTabTextActive]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {selectedCategory === 'all' ? (
          <View style={styles.menuContainer}>
            {categories.length > 0 ? categories.map((category) => {
              const categoryItems = itemsByCategory[category.id] || [];
              if (categoryItems.length === 0) return null;
              return (
                <View key={category.id} style={styles.categorySection}>
                  <Text style={styles.categorySectionTitle}>{category.name}</Text>
                  {category.description && <Text style={styles.categorySectionDescription}>{category.description}</Text>}
                  <View style={styles.menuGrid}>{categoryItems.map(renderMenuItem)}</View>
                </View>
              );
            }) : null}
            {itemsByCategory.uncategorized?.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categorySectionTitle}>Menu Items</Text>
                <View style={styles.menuGrid}>{itemsByCategory.uncategorized.map(renderMenuItem)}</View>
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
              <View style={styles.menuGrid}>{filteredItems.map(renderMenuItem)}</View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {cartCount > 0 && (
        <TouchableOpacity style={styles.floatingCartButton} onPress={() => router.push('/cart')}>
          <View style={styles.floatingCartContent}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.floatingCartText}>View Cart</Text>
            <Feather name="arrow-right" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* ── Modifier Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
                <Text style={styles.modalPrice}>${parseFloat(selectedItem?.base_price || 0).toFixed(2)}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>

              {/* Modifier groups */}
              {itemModGroups.length === 0 ? (
                <Text style={styles.noModifiersText}>No customizations available for this item.</Text>
              ) : (
                itemModGroups.map((group) => {
                  const isRadio = group.selection_type === 'single' || group.max_selections === 1;
                  const selected = selectedModifiers[group.id] || [];
                  return (
                    <View key={group.id} style={styles.modGroup}>
                      <View style={styles.modGroupHeader}>
                        <Text style={styles.modGroupName}>{group.name}</Text>
                        <Text style={styles.modGroupTag}>{isRadio ? 'Pick one' : 'Pick any'}</Text>
                      </View>
                      {(group.modifier_options || []).map((option) => {
                        const isSelected = selected.some(o => o.id === option.id);
                        return (
                          <TouchableOpacity
                            key={option.id}
                            style={[styles.modOption, isSelected && styles.modOptionSelected]}
                            onPress={() => toggleModifier(group.id, option, isRadio)}>
                            <Text style={[styles.modOptionName, isSelected && styles.modOptionNameSelected]}>
                              {option.name}
                            </Text>
                            <View style={styles.modOptionRight}>
                              {option.price_delta > 0 && (
                                <Text style={[styles.modOptionPrice, isSelected && styles.modOptionPriceSelected]}>
                                  +${parseFloat(option.price_delta).toFixed(2)}
                                </Text>
                              )}
                              <View style={[styles.modCheckbox, isSelected && styles.modCheckboxSelected]}>
                                {isSelected && <Feather name="check" size={12} color="#FFF" />}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })
              )}

              {/* Quantity */}
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                    <Feather name="minus" size={18} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => q + 1)}>
                    <Feather name="plus" size={18} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>

            </ScrollView>

            {/* Add to Cart button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
                <Text style={styles.addToCartText}>
                  Add to Cart — ${(
                    (parseFloat(selectedItem?.base_price || 0) +
                      Object.values(selectedModifiers).flat().reduce((s, c) => s + (parseFloat(c.price_delta) || 0), 0)
                    ) * quantity
                  ).toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  errorText: { fontSize: 20, fontWeight: '600', color: '#000', marginTop: 16, marginBottom: 24 },
  backButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#00704A', borderRadius: 8 },
  backButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerButton: { padding: 8, position: 'relative' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000', flex: 1, textAlign: 'center', paddingHorizontal: 16 },
  cartBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  cartBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  shopInfo: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  shopLogoContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, overflow: 'hidden', borderWidth: 3, borderColor: '#00704A' },
  shopLogo: { width: '100%', height: '100%' },
  shopLogoPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F5E9' },
  shopDescription: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  shopDetails: { width: '100%', marginTop: 8, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 8 },
  detailText: { fontSize: 14, color: '#666' },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#E8F5E9', borderRadius: 25, borderWidth: 1, borderColor: '#00704A' },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: '#00704A' },
  categoryTabsWrapper: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  categoryTabsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  categoryTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F5F5F5', marginRight: 8 },
  categoryTabActive: { backgroundColor: '#00704A' },
  categoryTabText: { fontSize: 15, fontWeight: '600', color: '#666' },
  categoryTabTextActive: { color: '#FFF' },
  menuContainer: { paddingTop: 16 },
  categorySection: { marginBottom: 32 },
  categorySectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', paddingHorizontal: 20, marginBottom: 8 },
  categorySectionDescription: { fontSize: 14, color: '#666', paddingHorizontal: 20, marginBottom: 16 },
  menuGrid: { paddingHorizontal: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { width: (width - 32) / 2, backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, marginHorizontal: 4, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  menuItemImage: { width: '100%', height: 140, backgroundColor: '#F5F5F5' },
  menuItemContent: { padding: 12 },
  menuItemName: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  menuItemDescription: { fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 18 },
  menuItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuItemPrice: { fontSize: 18, fontWeight: 'bold', color: '#00704A' },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00704A', justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16 },
  floatingCartButton: { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: '#00704A', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  floatingCartContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 24, gap: 12 },
  floatingCartBadge: { backgroundColor: '#FFF', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  floatingCartBadgeText: { color: '#00704A', fontSize: 14, fontWeight: 'bold' },
  floatingCartText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 4 },
  modalPrice: { fontSize: 16, color: '#00704A', fontWeight: '600' },
  modalClose: { padding: 4 },
  modalScroll: { paddingHorizontal: 20, paddingTop: 8 },
  noModifiersText: { color: '#999', fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  modGroup: { marginBottom: 24 },
  modGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modGroupName: { fontSize: 16, fontWeight: '700', color: '#000' },
  modGroupTag: { fontSize: 11, color: '#999', backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  modOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', marginBottom: 8, backgroundColor: '#FFF' },
  modOptionSelected: { borderColor: '#00704A', backgroundColor: '#F0FAF5' },
  modOptionName: { fontSize: 15, color: '#000', flex: 1 },
  modOptionNameSelected: { color: '#00704A', fontWeight: '600' },
  modOptionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modOptionPrice: { fontSize: 13, color: '#999' },
  modOptionPriceSelected: { color: '#00704A' },
  modCheckbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center' },
  modCheckboxSelected: { backgroundColor: '#00704A', borderColor: '#00704A' },
  quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 8, marginBottom: 8 },
  quantityLabel: { fontSize: 16, fontWeight: '600', color: '#000' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 18, fontWeight: '700', color: '#000', minWidth: 24, textAlign: 'center' },
  modalFooter: { padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  addToCartBtn: { backgroundColor: '#00704A', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  addToCartText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});