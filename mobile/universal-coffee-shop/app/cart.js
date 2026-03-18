// cart screen — review items & points, then go to checkout
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Image, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { getGlobalPoints } from '../services/loyaltyService';

export default function CartScreen() {
  const router = useRouter();
  const { cart, removeItem, clearCart, updateQuantity } = useCart();
  const [globalPoints, setGlobalPoints] = useState(null);

  // Group items by shop
  const itemsByShop = cart.reduce((acc, item) => {
    const shopId = item.shopId;
    const shopName = item.shopName || 'Unknown Shop';
    if (!acc[shopId]) acc[shopId] = { shopName, shopId, items: [] };
    acc[shopId].items.push(item);
    return acc;
  }, {});

  useEffect(() => {
    loadPoints();
  }, []);

  const loadPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const pts = await getGlobalPoints(user.id);
        setGlobalPoints(pts);
      }
    } catch (e) {
      console.error('Failed to load points:', e);
    }
  };

  const subtotal = cart.reduce((sum, item) => {
    return sum + (parseFloat(item.price) || 0) * (item.quantity || 1);
  }, 0);

  const handleUpdateQuantity = (itemId, change) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    const newQty = (item.quantity || 1) + change;
    if (newQty <= 0) {
      Alert.alert('Remove Item', 'Remove this item from cart?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(itemId) },
      ]);
    } else {
      updateQuantity(itemId, newQty);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add some items first!');
      return;
    }
    router.push('/checkout');
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="shopping-bag" size={80} color="#CCC" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/browse')}>
            <Text style={styles.shopButtonText}>Browse Shops</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart ({cart.length})</Text>
        <TouchableOpacity style={styles.headerButton} onPress={clearCart}>
          <Feather name="trash-2" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 200 }}>
        {Object.values(itemsByShop).map(({ shopId, shopName, items }) => (
          <View key={shopId} style={styles.shopSection}>
            <Text style={styles.shopName}>{shopName}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                {item.image_url
                  ? <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                  : <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                      <Feather name="coffee" size={24} color="#CCC" />
                    </View>
                }
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>
                    ${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}
                  </Text>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleUpdateQuantity(item.id, -1)}>
                      <Feather name="minus" size={16} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity || 1}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleUpdateQuantity(item.id, 1)}>
                      <Feather name="plus" size={16} color="#000" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Points teaser */}
        {globalPoints && globalPoints.current_balance > 0 && (
          <View style={styles.pointsTeaser}>
            <Feather name="award" size={18} color="#00704A" />
            <Text style={styles.pointsTeaserText}>
              You have {globalPoints.current_balance} points — redeem them at checkout!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <Text style={styles.taxNote}>Tax & total calculated at checkout</Text>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Feather name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerButton: { padding: 8, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#000', marginTop: 20, marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  shopButton: { backgroundColor: '#00704A', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 25 },
  shopButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  scrollView: { flex: 1 },
  shopSection: {
    backgroundColor: '#FFF', marginBottom: 8,
    paddingVertical: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  shopName: { fontSize: 15, fontWeight: '700', color: '#00704A', marginBottom: 12 },
  cartItem: {
    flexDirection: 'row', marginBottom: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  itemImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#F0F0F0' },
  itemImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  itemDetails: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#00704A', marginBottom: 8 },
  quantityContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 8,
    paddingHorizontal: 4, paddingVertical: 4, alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
  },
  quantityText: { fontSize: 16, fontWeight: '600', color: '#000', marginHorizontal: 16 },
  pointsTeaser: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, padding: 14,
    backgroundColor: '#E8F5E9', borderRadius: 12,
  },
  pointsTeaserText: { flex: 1, fontSize: 14, color: '#00704A', fontWeight: '500' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
  },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  subtotalLabel: { fontSize: 16, color: '#666' },
  subtotalValue: { fontSize: 16, fontWeight: '700', color: '#000' },
  taxNote: { fontSize: 12, color: '#999', marginBottom: 14 },
  checkoutButton: {
    backgroundColor: '#00704A', flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 18, borderRadius: 12, gap: 8,
  },
  checkoutButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});