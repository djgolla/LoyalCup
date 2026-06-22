// cart screen — review items & shop-specific points, then go to checkout
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Image, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { getBalanceForShop } from '../services/loyaltyService';

export default function CartScreen() {
  const router = useRouter();
  const {
    cart,
    removeItem,
    clearCart,
    updateQuantity,
    hasMultipleShops,
  } = useCart();

  const [pointsSummary, setPointsSummary] = useState(null);

  const activeShopId = cart[0]?.shopId || null;
  const activeShopName = cart[0]?.shopName || 'Unknown Shop';

  const itemsByShop = cart.reduce((acc, item) => {
    const shopId = item.shopId;
    const shopName = item.shopName || 'Unknown Shop';

    if (!acc[shopId]) acc[shopId] = { shopName, shopId, items: [] };
    acc[shopId].items.push(item);

    return acc;
  }, {});

  useEffect(() => {
    loadPoints();
  }, [activeShopId]);

  const loadPoints = async () => {
    if (!activeShopId) {
      setPointsSummary(null);
      return;
    }

    try {
      const balance = await getBalanceForShop(activeShopId);

      const available = balance?.current_balance || 0;
      const pending = balance?.pending_balance || 0;

      setPointsSummary({
        available,
        pending,
        total: available + pending,
        shopName: activeShopName,
      });
    } catch (e) {
      console.error('Failed to load shop points:', e);
      setPointsSummary(null);
    }
  };

  const subtotal = cart.reduce((sum, item) =>
    sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0
  );

  const handleUpdateQuantity = (cartKey, change) => {
    const item = cart.find(i => i.cartKey === cartKey);
    if (!item) return;

    const newQty = (item.quantity || 1) + change;

    if (newQty <= 0) {
      Alert.alert('Remove Item', 'Remove this item from cart?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(cartKey) },
      ]);
    } else {
      updateQuantity(cartKey, newQty);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add some items first!');
      return;
    }

    if (hasMultipleShops?.()) {
      Alert.alert(
        'One shop at a time',
        'Your cart has items from multiple shops. Clear your cart and order from one shop at a time.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear Cart', style: 'destructive', onPress: clearCart },
        ]
      );
      return;
    }

    router.push('/checkout');
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#101828" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.emptyContainer}>
          <Feather name="shopping-bag" size={80} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/home')}>
            <Text style={styles.shopButtonText}>Browse Shops</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const availablePoints = pointsSummary?.available || 0;
  const pendingPoints = pointsSummary?.pending || 0;
  const hasPoints = availablePoints > 0 || pendingPoints > 0;
  const multipleShopsDetected = hasMultipleShops?.();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#101828" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Cart ({cart.length})</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearCart },
          ])}
        >
          <Feather name="trash-2" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 200 }}>
        {multipleShopsDetected && (
          <View style={styles.multiShopWarning}>
            <Feather name="alert-triangle" size={18} color="#B45309" />
            <Text style={styles.multiShopWarningText}>
              Orders are one shop at a time. Clear your cart and add items from one shop.
            </Text>
          </View>
        )}

        {Object.values(itemsByShop).map(({ shopId, shopName, items }) => (
          <View key={shopId} style={styles.shopSection}>
            <Text style={styles.shopSectionLabel}>{shopName}</Text>

            {items.map((item) => (
              <View key={item.cartKey} style={styles.cartItem}>
                {item.image_url
                  ? <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                  : (
                    <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                      <Feather name="coffee" size={24} color="#CBD5E1" />
                    </View>
                  )
                }

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>

                  {item.customizations?.length > 0 && (
                    <Text style={styles.itemCustomizations}>
                      {item.customizations.map(c => c.name).join(' · ')}
                    </Text>
                  )}

                  <Text style={styles.itemPrice}>
                    ${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}
                  </Text>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleUpdateQuantity(item.cartKey, -1)}
                    >
                      <Feather name="minus" size={16} color="#101828" />
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>{item.quantity || 1}</Text>

                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleUpdateQuantity(item.cartKey, 1)}
                    >
                      <Feather name="plus" size={16} color="#101828" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}

        {hasPoints && !multipleShopsDetected && (
          <View style={styles.pointsTeaser}>
            <Feather name="award" size={18} color="#2563EB" />
            <Text style={styles.pointsTeaserText}>
              {availablePoints.toLocaleString()} points available at {activeShopName}
              {pendingPoints > 0 ? ` · ${pendingPoints.toLocaleString()} pending` : ''}
              {availablePoints > 0 ? ' — redeem at checkout!' : ' — available soon!'}
            </Text>
          </View>
        )}

        {!hasPoints && !multipleShopsDetected && (
          <View style={styles.pointsTeaserMuted}>
            <Feather name="award" size={18} color="#94A3B8" />
            <Text style={styles.pointsTeaserMutedText}>
              No points available at {activeShopName} yet.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>${subtotal.toFixed(2)}</Text>
        </View>

        <Text style={styles.taxNote}>Tax calculated live by Square at payment</Text>

        <TouchableOpacity
          style={[styles.checkoutButton, multipleShopsDetected && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={multipleShopsDetected}
        >
          <Text style={styles.checkoutButtonText}>
            {multipleShopsDetected ? 'One Shop at a Time' : 'Proceed to Checkout'}
          </Text>
          {!multipleShopsDetected && <Feather name="arrow-right" size={20} color="#FFF" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: { padding: 8, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#101828' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101828',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 15, color: '#94A3B8', marginBottom: 32 },
  shopButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#101828',
    borderRadius: 22,
  },
  shopButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  scrollView: { flex: 1 },

  multiShopWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    marginBottom: 0,
    padding: 14,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  multiShopWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 18,
  },

  shopSection: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  shopSectionLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#101828',
    marginBottom: 12,
  },

  cartItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  itemImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 2,
  },
  itemCustomizations: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101828',
    marginHorizontal: 16,
  },

  pointsTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  pointsTeaserText: {
    flex: 1,
    fontSize: 14,
    color: '#1D4ED8',
    fontWeight: '500',
    lineHeight: 19,
  },
  pointsTeaserMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
  },
  pointsTeaserMutedText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 19,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subtotalLabel: { fontSize: 16, color: '#64748B' },
  subtotalValue: { fontSize: 20, fontWeight: '900', color: '#101828' },
  taxNote: { fontSize: 12, color: '#94A3B8', marginBottom: 12 },

  checkoutButton: {
    backgroundColor: '#101828',
    borderRadius: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
