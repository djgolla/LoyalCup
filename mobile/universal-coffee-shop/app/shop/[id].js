/**
 * Shop detail + menu screen
 * - Fixed: addItem now passes quantity directly instead of looping N times
 * - Added: active offers banner
 * - Modifier groups loaded with modifier_options join
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Image, Dimensions, RefreshControl, ActivityIndicator, Linking, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

const isOpenNow = (hours) => {
  if (!hours) return null;
  try {
    const now  = new Date();
    const day  = ['sun','mon','tue','wed','thu','fri','sat'][now.getDay()];
    const h    = hours[day];
    if (!h || h.closed) return false;
    const [oH, oM] = (h.open  || '00:00').split(':').map(Number);
    const [cH, cM] = (h.close || '23:59').split(':').map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= oH * 60 + oM && cur <= cH * 60 + cM;
  } catch { return null; }
};

export default function ShopDetailScreen() {
  const router            = useRouter();
  const { id }            = useLocalSearchParams();
  const { addItem, getItemCount } = useCart();

  const [shop,            setShop]            = useState(null);
  const [categories,      setCategories]      = useState([]);
  const [menuItems,       setMenuItems]       = useState([]);
  const [modifierGroups,  setModifierGroups]  = useState([]);
  const [offers,          setOffers]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [selectedCategory,setSelectedCategory]= useState('all');

  // Modifier modal
  const [modalVisible,    setModalVisible]    = useState(false);
  const [selectedItem,    setSelectedItem]    = useState(null);
  const [selectedMods,    setSelectedMods]    = useState({});
  const [quantity,        setQuantity]        = useState(1);

  useEffect(() => { loadShopData(); }, [id]);

  const loadShopData = async () => {
    try {
      const [shopResp, catResp, itemResp, modResp, offersResp] = await Promise.all([
        supabase.from('shops').select('*').eq('id', id).single(),
        supabase.from('categories').select('*').eq('shop_id', id).order('display_order', { ascending: true }),
        supabase.from('menu_items').select('*').eq('shop_id', id).eq('is_available', true).order('display_order', { ascending: true }),
        supabase.from('modifier_groups').select('*, modifier_options(*)').eq('shop_id', id),
        supabase.from('shop_offers').select('*').eq('shop_id', id).eq('is_active', true).gte('expires_at', new Date().toISOString()),
      ]);

      if (shopResp.error) throw shopResp.error;
      setShop(shopResp.data);
      setCategories(catResp.data || []);
      setMenuItems(itemResp.data || []);
      setModifierGroups(modResp.data || []);
      setOffers(offersResp.data || []);
    } catch (e) {
      console.error('[ShopDetail] loadShopData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => { setRefreshing(true); await loadShopData(); setRefreshing(false); };

  const openModifierModal = (item) => {
    setSelectedItem(item);
    setSelectedMods({});
    setQuantity(1);
    setModalVisible(true);
  };

  const toggleMod = (groupId, option, isRadio) => {
    setSelectedMods(prev => {
      if (isRadio) return { ...prev, [groupId]: [option] };
      const cur    = prev[groupId] || [];
      const exists = cur.find(o => o.id === option.id);
      return { ...prev, [groupId]: exists ? cur.filter(o => o.id !== option.id) : [...cur, option] };
    });
  };

  const getItemModGroups = (item) => {
    if (!item?.modifier_group_ids?.length) return [];
    return modifierGroups.filter(g => item.modifier_group_ids.includes(g.id));
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    const customizations = Object.values(selectedMods).flat();
    const extraPrice     = customizations.reduce((s, c) => s + (parseFloat(c.price_delta) || 0), 0);
    const unitPrice      = parseFloat(selectedItem.base_price) + extraPrice;

    // ✅ Fixed: single addItem call with quantity, not a loop
    addItem({
      id:             `${id}:${selectedItem.id}`,
      name:           selectedItem.name,
      price:          unitPrice,
      quantity,
      shopId:         id,
      shopName:       shop?.name,
      image_url:      selectedItem.image_url,
      customizations,
    });

    setModalVisible(false);
  };

  const handleCall       = () => { if (!shop?.phone)   { Alert.alert('No phone', 'Not added yet.'); return; } Linking.openURL(`tel:${shop.phone.replace(/[^0-9]/g,'')}`); };
  const handleDirections = () => { if (!shop?.address) { Alert.alert('No address', 'Not added yet.'); return; } Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent(shop.address)}`); };

  const filteredItems    = selectedCategory === 'all' ? menuItems : menuItems.filter(i => i.category_id === selectedCategory);
  const itemsByCategory  = menuItems.reduce((acc, item) => {
    const k = item.category_id || 'uncategorized';
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});

  const modItemGroups    = selectedItem ? getItemModGroups(selectedItem) : [];
  const modsExtraPrice   = Object.values(selectedMods).flat().reduce((s, c) => s + (parseFloat(c.price_delta) || 0), 0);
  const cartCount        = getItemCount();
  const openStatus       = isOpenNow(shop?.hours);

  const renderMenuItem = (item) => (
    <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => openModifierModal(item)} activeOpacity={0.85}>
      {item.image_url && <Image source={{ uri: item.image_url }} style={styles.menuItemImage} />}
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemName} numberOfLines={2}>{item.name}</Text>
        {item.description && <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>}
        <View style={styles.menuItemFooter}>
          <Text style={styles.menuItemPrice}>${parseFloat(item.base_price).toFixed(2)}</Text>
          <View style={styles.addButton}><Feather name="plus" size={18} color="#FFF" /></View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      <View style={styles.centered}><ActivityIndicator size="large" color="#00704A" /></View>
    </SafeAreaView>
  );

  if (!shop) return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      <View style={styles.centered}>
        <Feather name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Shop not found</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}><Text style={styles.btnText}>Go Back</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{shop.name}</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/cart')}>
          <Feather name="shopping-bag" size={22} color="#000" />
          {cartCount > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>

        {/* Shop info */}
        <View style={styles.shopInfo}>
          <View style={styles.shopLogoWrap}>
            {shop.logo_url
              ? <Image source={{ uri: shop.logo_url }} style={styles.shopLogo} />
              : <View style={[styles.shopLogo, styles.shopLogoPlaceholder]}><Feather name="coffee" size={36} color="#00704A" /></View>}
          </View>
          {openStatus !== null && (
            <View style={[styles.openChip, { backgroundColor: openStatus ? '#dcfce7' : '#f3f4f6' }]}>
              <View style={[styles.openDot, { backgroundColor: openStatus ? '#16a34a' : '#9ca3af' }]} />
              <Text style={[styles.openChipText, { color: openStatus ? '#16a34a' : '#6b7280' }]}>{openStatus ? 'Open now' : 'Closed'}</Text>
            </View>
          )}
          {shop.description && <Text style={styles.shopDesc}>{shop.description}</Text>}
          <View style={styles.shopActions}>
            {shop.phone   && <TouchableOpacity style={styles.actionBtn} onPress={handleCall}><Feather name="phone" size={16} color="#00704A" /><Text style={styles.actionBtnText}>Call</Text></TouchableOpacity>}
            {shop.address && <TouchableOpacity style={styles.actionBtn} onPress={handleDirections}><Feather name="navigation" size={16} color="#00704A" /><Text style={styles.actionBtnText}>Directions</Text></TouchableOpacity>}
          </View>
        </View>

        {/* Active offers */}
        {offers.length > 0 && (
          <View style={styles.offersSection}>
            <Text style={styles.offersSectionLabel}>🏷️ CURRENT OFFERS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
              {offers.map(offer => (
                <View key={offer.id} style={styles.offerCard}>
                  <Text style={styles.offerCardTitle}>{offer.title}</Text>
                  {offer.description && <Text style={styles.offerCardDesc}>{offer.description}</Text>}
                  {offer.discount_value && (
                    <View style={styles.offerDiscountBadge}>
                      <Text style={styles.offerDiscountText}>
                        {offer.discount_type === 'percent' ? `${offer.discount_value}% off` : `$${offer.discount_value} off`}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Category tabs */}
        {categories.length > 0 && (
          <View style={styles.catTabsWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catTabsContent}>
              <TouchableOpacity style={[styles.catTab, selectedCategory === 'all' && styles.catTabActive]} onPress={() => setSelectedCategory('all')}>
                <Text style={[styles.catTabText, selectedCategory === 'all' && styles.catTabTextActive]}>All</Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity key={cat.id} style={[styles.catTab, selectedCategory === cat.id && styles.catTabActive]} onPress={() => setSelectedCategory(cat.id)}>
                  <Text style={[styles.catTabText, selectedCategory === cat.id && styles.catTabTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Menu */}
        <View style={styles.menuContainer}>
          {selectedCategory === 'all'
            ? categories.map(cat => {
                const items = itemsByCategory[cat.id] || [];
                if (!items.length) return null;
                return (
                  <View key={cat.id} style={styles.catSection}>
                    <Text style={styles.catSectionTitle}>{cat.name}</Text>
                    {cat.description && <Text style={styles.catSectionDesc}>{cat.description}</Text>}
                    <View style={styles.menuGrid}>{items.map(renderMenuItem)}</View>
                  </View>
                );
              })
            : filteredItems.length === 0
            ? <View style={styles.emptyMenu}><Feather name="coffee" size={48} color="#DDD" /><Text style={styles.emptyMenuText}>No items here</Text></View>
            : <View style={styles.menuGrid}>{filteredItems.map(renderMenuItem)}</View>
          }
          {itemsByCategory.uncategorized?.length > 0 && selectedCategory === 'all' && (
            <View style={styles.catSection}>
              <Text style={styles.catSectionTitle}>Menu Items</Text>
              <View style={styles.menuGrid}>{itemsByCategory.uncategorized.map(renderMenuItem)}</View>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={() => router.push('/cart')}>
          <View style={styles.floatingCartInner}>
            <View style={styles.floatingCartBadge}><Text style={styles.floatingCartBadgeText}>{cartCount}</Text></View>
            <Text style={styles.floatingCartText}>View Cart</Text>
            <Feather name="arrow-right" size={18} color="#FFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* Modifier modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
                <Text style={styles.modalBasePrice}>${parseFloat(selectedItem?.base_price || 0).toFixed(2)}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Feather name="x" size={22} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {modItemGroups.length === 0
                ? <Text style={styles.noModsText}>No customizations available.</Text>
                : modItemGroups.map(group => {
                    const isRadio = group.selection_type === 'single' || group.max_selections === 1;
                    const selected = selectedMods[group.id] || [];
                    return (
                      <View key={group.id} style={styles.modGroup}>
                        <View style={styles.modGroupHeader}>
                          <Text style={styles.modGroupName}>{group.name}</Text>
                          <View style={styles.modGroupTag}>
                            <Text style={styles.modGroupTagText}>{isRadio ? 'Pick one' : 'Pick any'}</Text>
                          </View>
                        </View>
                        {(group.modifier_options || []).map(opt => {
                          const sel = selected.some(o => o.id === opt.id);
                          return (
                            <TouchableOpacity key={opt.id} style={[styles.modOption, sel && styles.modOptionSel]} onPress={() => toggleMod(group.id, opt, isRadio)}>
                              <Text style={[styles.modOptName, sel && styles.modOptNameSel]}>{opt.name}</Text>
                              <View style={styles.modOptRight}>
                                {opt.price_delta > 0 && <Text style={[styles.modOptPrice, sel && styles.modOptPriceSel]}>+${parseFloat(opt.price_delta).toFixed(2)}</Text>}
                                <View style={[styles.modCheck, sel && styles.modCheckSel]}>{sel && <Feather name="check" size={11} color="#FFF" />}</View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })
              }

              <View style={styles.qtyRow}>
                <Text style={styles.qtyLabel}>Quantity</Text>
                <View style={styles.qtyControls}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                    <Feather name="minus" size={16} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => q + 1)}>
                    <Feather name="plus" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
                <Text style={styles.addToCartText}>
                  Add to Cart — ${((parseFloat(selectedItem?.base_price || 0) + modsExtraPrice) * quantity).toFixed(2)}
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
  container:          { flex: 1, backgroundColor: '#FAFAFA' },
  centered:           { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText:          { fontSize: 18, fontWeight: '600', color: '#000', marginTop: 12 },
  btn:                { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#00704A', borderRadius: 10 },
  btnText:            { color: '#FFF', fontWeight: '700' },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerBtn:          { padding: 8, position: 'relative' },
  headerTitle:        { fontSize: 18, fontWeight: '700', color: '#000', flex: 1, textAlign: 'center', paddingHorizontal: 12 },
  cartBadge:          { position: 'absolute', top: 3, right: 3, backgroundColor: '#FF3B30', borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  cartBadgeText:      { color: '#FFF', fontSize: 11, fontWeight: '800' },
  shopInfo:           { backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  shopLogoWrap:       { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  shopLogo:           { width: '100%', height: '100%' },
  shopLogoPlaceholder:{ backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  openChip:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 10 },
  openDot:            { width: 7, height: 7, borderRadius: 4 },
  openChipText:       { fontSize: 12, fontWeight: '700' },
  shopDesc:           { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 14, paddingHorizontal: 8 },
  shopActions:        { flexDirection: 'row', gap: 10 },
  actionBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#E8F5E9', borderRadius: 20, borderWidth: 1, borderColor: '#00704A' },
  actionBtnText:      { fontSize: 14, fontWeight: '600', color: '#00704A' },
  offersSection:      { paddingTop: 16, paddingBottom: 4 },
  offersSectionLabel: { fontSize: 11, fontWeight: '700', color: '#f59e0b', letterSpacing: 1.2, paddingHorizontal: 16, marginBottom: 10 },
  offerCard:          { backgroundColor: '#fffbeb', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#fde68a', minWidth: 200, maxWidth: 260 },
  offerCardTitle:     { fontSize: 15, fontWeight: '800', color: '#92400e', marginBottom: 4 },
  offerCardDesc:      { fontSize: 12, color: '#b45309', lineHeight: 17, marginBottom: 8 },
  offerDiscountBadge: { alignSelf: 'flex-start', backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  offerDiscountText:  { color: '#fff', fontSize: 12, fontWeight: '800' },
  catTabsWrap:        { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  catTabsContent:     { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catTab:             { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', marginRight: 6 },
  catTabActive:       { backgroundColor: '#00704A' },
  catTabText:         { fontSize: 14, fontWeight: '600', color: '#666' },
  catTabTextActive:   { color: '#FFF' },
  menuContainer:      { paddingTop: 12 },
  catSection:         { marginBottom: 28 },
  catSectionTitle:    { fontSize: 20, fontWeight: '800', color: '#000', paddingHorizontal: 16, marginBottom: 4 },
  catSectionDesc:     { fontSize: 13, color: '#999', paddingHorizontal: 16, marginBottom: 12 },
  menuGrid:           { paddingHorizontal: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem:           { width: (width - 28) / 2, backgroundColor: '#FFF', borderRadius: 14, marginBottom: 12, marginHorizontal: 3, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  menuItemImage:      { width: '100%', height: 120, backgroundColor: '#F5F5F5' },
  menuItemContent:    { padding: 10 },
  menuItemName:       { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 3 },
  menuItemDesc:       { fontSize: 12, color: '#999', marginBottom: 10, lineHeight: 16 },
  menuItemFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuItemPrice:      { fontSize: 16, fontWeight: '800', color: '#00704A' },
  addButton:          { width: 32, height: 32, borderRadius: 16, backgroundColor: '#00704A', justifyContent: 'center', alignItems: 'center' },
  emptyMenu:          { alignItems: 'center', paddingVertical: 48 },
  emptyMenuText:      { fontSize: 15, color: '#CCC', marginTop: 12 },
  floatingCart:       { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#00704A', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  floatingCartInner:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, gap: 10 },
  floatingCartBadge:  { backgroundColor: '#FFF', borderRadius: 11, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  floatingCartBadgeText:{ color: '#00704A', fontSize: 13, fontWeight: '800' },
  floatingCartText:   { color: '#FFF', fontSize: 17, fontWeight: '800', flex: 1 },
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:         { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  modalHandle:        { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 2 },
  modalHeader:        { flexDirection: 'row', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalTitle:         { fontSize: 20, fontWeight: '800', color: '#000', marginBottom: 2 },
  modalBasePrice:     { fontSize: 15, color: '#00704A', fontWeight: '600' },
  modalClose:         { padding: 4 },
  modalScroll:        { paddingHorizontal: 20, paddingTop: 4 },
  noModsText:         { color: '#999', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  modGroup:           { marginBottom: 22 },
  modGroupHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modGroupName:       { fontSize: 15, fontWeight: '700', color: '#000' },
  modGroupTag:        { backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  modGroupTagText:    { fontSize: 11, color: '#999', fontWeight: '600' },
  modOption:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', marginBottom: 8 },
  modOptionSel:       { borderColor: '#00704A', backgroundColor: '#F0FAF5' },
  modOptName:         { fontSize: 14, color: '#000', flex: 1 },
  modOptNameSel:      { color: '#00704A', fontWeight: '600' },
  modOptRight:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modOptPrice:        { fontSize: 13, color: '#999' },
  modOptPriceSel:     { color: '#00704A' },
  modCheck:           { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center' },
  modCheckSel:        { backgroundColor: '#00704A', borderColor: '#00704A' },
  qtyRow:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 8, marginBottom: 8 },
  qtyLabel:           { fontSize: 15, fontWeight: '700', color: '#000' },
  qtyControls:        { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn:             { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  qtyText:            { fontSize: 18, fontWeight: '700', color: '#000', minWidth: 24, textAlign: 'center' },
  modalFooter:        { padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  addToCartBtn:       { backgroundColor: '#00704A', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  addToCartText:      { color: '#FFF', fontSize: 16, fontWeight: '800' },
});