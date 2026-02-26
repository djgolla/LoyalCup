// cart screen - STARBUCKS STYLE + LOYALTY REDEMPTION
// universal-coffee-shop/app/cart.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { awardPointsForOrder, getGlobalPoints, getShopPoints, redeemPoints } from '../services/loyaltyService';

export default function CartScreen() {
  const router = useRouter();
  const { cart, removeItem, clearCart, updateQuantity } = useCart();
  const [user, setUser] = useState(null);
  const [globalPoints, setGlobalPoints] = useState(null);
  const [shopPoints, setShopPoints] = useState({});
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [showPointsSelector, setShowPointsSelector] = useState(false);

  // Group items by shop
  const itemsByShop = cart.reduce((acc, item) => {
    const shopName = item.shopName || 'Unknown Shop';
    const shopId = item.shopId;
    if (!acc[shopId]) {
      acc[shopId] = { shopName, shopId, items: [] };
    }
    acc[shopId].items.push(item);
    return acc;
  }, {});

  useEffect(() => {
    loadUserAndPoints();
  }, []);

  const loadUserAndPoints = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Load global points
        const global = await getGlobalPoints(currentUser.id);
        setGlobalPoints(global);

        // Load shop-specific points for shops in cart
        const shopIds = Object.keys(itemsByShop);
        const shopPointsData = {};
        for (const shopId of shopIds) {
          const points = await getShopPoints(currentUser.id, shopId);
          shopPointsData[shopId] = points;
        }
        setShopPoints(shopPointsData);
      }
    } catch (error) {
      console.error('Failed to load points:', error);
    }
  };

  // CALCULATE TOTALS (used by getMaxRedeemablePoints)
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);

    const tax = subtotal * 0.08;
    const serviceFee = 0.99;
    const discount = pointsToRedeem * 0.01;
    const total = Math.max(0, subtotal + tax + serviceFee - discount);

    return { subtotal, tax, serviceFee, discount, total };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add some items to your cart first!');
      return;
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Error', 'You must be logged in to place an order');
        return;
      }

      // Process each shop's order
      const shopOrders = Object.values(itemsByShop);
      
      for (const { shopId, shopName, items } of shopOrders) {
        // Calculate totals
        const subtotal = items.reduce((sum, item) => {
          const price = parseFloat(item.price) || 0;
          const quantity = item.quantity || 1;
          return sum + (price * quantity);
        }, 0);
        
        const tax = subtotal * 0.08;
        const serviceFee = 0.99;
        let total = subtotal + tax + serviceFee;
        let discount = 0;

        // Apply points redemption if selected
        if (pointsToRedeem > 0) {
          const redeemResult = await redeemPoints(
            user.id,
            shopId,
            pointsToRedeem,
            'global' // or 'shop' based on selection
          );

          if (redeemResult.success) {
            discount = redeemResult.discountAmount;
            total = Math.max(0, total - discount);
            console.log(`💰 Redeemed ${pointsToRedeem} points for $${discount.toFixed(2)} off`);
          }
        }

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: user.id,
            shop_id: shopId,
            status: 'pending',
            subtotal: subtotal,
            tax: tax,
            total: total,
            loyalty_points_earned: Math.floor(total), // Will be recalculated by awardPointsForOrder
            metadata: {
              service_fee: serviceFee,
              item_count: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
              points_redeemed: pointsToRedeem,
              discount_amount: discount,
            }
          })
          .select()
          .single();

        if (orderError) {
          console.error('Order creation error:', orderError);
          throw orderError;
        }

        console.log('Order created:', order);

        // Award loyalty points
        const pointsResult = await awardPointsForOrder(
          order.id,
          user.id,
          shopId,
          total
        );

        if (pointsResult.success) {
          console.log(`🎉 Awarded ${pointsResult.points} ${pointsResult.type} points!`);
        } else {
          console.error('Failed to award points:', pointsResult.error);
        }

        // Create order items
        const orderItems = items.map(item => {
          const unitPrice = parseFloat(item.price) || 0;
          const quantity = item.quantity || 1;
          const totalPrice = unitPrice * quantity;
          
          return {
            order_id: order.id,
            menu_item_id: item.id.split(':')[1],
            quantity: quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
          };
        });

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Order items creation error:', itemsError);
          throw itemsError;
        }
      }

      // Clear cart and show success
      clearCart();
      setPointsToRedeem(0); // Reset points
      
      const message = pointsToRedeem > 0 
        ? `Order placed! You saved $${(pointsToRedeem * 0.01).toFixed(2)} with points!`
        : 'Order placed! You earned loyalty points!';

      Alert.alert(
        'Order Placed! 🎉',
        message,
        [
          {
            text: 'View Rewards',
            onPress: () => router.push('/rewards')
          },
          {
            text: 'Continue Shopping',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  const handleRemoveItem = (itemId) => {
    Alert.alert(
      'Remove Item',
      'Remove this item from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(itemId) }
      ]
    );
  };

  const handleUpdateQuantity = (itemId, change) => {
    const item = cart.find(i => i.id === itemId);
    if (item) {
      const newQuantity = (item.quantity || 1) + change;
      if (newQuantity > 0) {
        updateQuantity(itemId, newQuantity);
      } else {
        handleRemoveItem(itemId);
      }
    }
  };

  const getAvailablePoints = () => {
    return globalPoints?.current_balance || 0;
  };

  const getMaxRedeemablePoints = () => {
    const available = getAvailablePoints();
    const { total } = calculateTotals(); // 
    const maxPointsForOrder = Math.floor(total * 100); // Can't redeem more than order value
    return Math.min(available, maxPointsForOrder);
  };

  const handleSelectPoints = (points) => {
    const max = getMaxRedeemablePoints();
    const selected = Math.min(Math.max(0, points), max);
    setPointsToRedeem(selected);
  };

  // Get current totals for display
  const { subtotal, tax, serviceFee, discount, total } = calculateTotals();

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.emptyContainer}>
          <Feather name="shopping-bag" size={80} color="#CCC" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.push('/browse')}>
            <Text style={styles.shopButtonText}>Browse Shops</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart ({cart.length})</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={clearCart}>
          <Feather name="trash-2" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {Object.values(itemsByShop).map(({ shopId, shopName, items }) => (
          <View key={shopId} style={styles.shopSection}>
            <Text style={styles.shopName}>{shopName}</Text>
            
            {items.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                {item.image_url && (
                  <Image 
                    source={{ uri: item.image_url }} 
                    style={styles.itemImage}
                  />
                )}

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

                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item.id)}>
                  <Feather name="trash-2" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: 300 }} />
      </ScrollView>

      {/* Bottom Checkout Card */}
      <View style={styles.checkoutCard}>
        {/* Points Redemption */}
        {getAvailablePoints() > 0 && (
          <TouchableOpacity 
            style={styles.pointsRedemption}
            onPress={() => setShowPointsSelector(!showPointsSelector)}>
            <View style={styles.pointsRedemptionLeft}>
              <Feather name="award" size={20} color="#00704A" />
              <View>
                <Text style={styles.pointsRedemptionTitle}>Use Points</Text>
                <Text style={styles.pointsRedemptionSubtitle}>
                  {pointsToRedeem > 0 ? `${pointsToRedeem} points (-$${discount.toFixed(2)})` : `${getAvailablePoints()} available`}
                </Text>
              </View>
            </View>
            <Feather name={showPointsSelector ? "chevron-up" : "chevron-down"} size={20} color="#666" />
          </TouchableOpacity>
        )}

        {/* Points Selector */}
        {showPointsSelector && (
          <View style={styles.pointsSelector}>
            <View style={styles.pointsSelectorHeader}>
              <Text style={styles.pointsSelectorTitle}>Redeem Points</Text>
              <TouchableOpacity onPress={() => handleSelectPoints(0)}>
                <Text style={styles.pointsClearButton}>Clear</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pointsSliderContainer}>
              <TouchableOpacity 
                style={styles.pointsQuickButton}
                onPress={() => handleSelectPoints(Math.min(100, getMaxRedeemablePoints()))}>
                <Text style={styles.pointsQuickButtonText}>100</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.pointsQuickButton}
                onPress={() => handleSelectPoints(Math.min(250, getMaxRedeemablePoints()))}>
                <Text style={styles.pointsQuickButtonText}>250</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.pointsQuickButton}
                onPress={() => handleSelectPoints(Math.min(500, getMaxRedeemablePoints()))}>
                <Text style={styles.pointsQuickButtonText}>500</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.pointsQuickButton}
                onPress={() => handleSelectPoints(getMaxRedeemablePoints())}>
                <Text style={styles.pointsQuickButtonText}>Max</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.pointsDiscountPreview}>
              {pointsToRedeem} points = ${discount.toFixed(2)} off
            </Text>
          </View>
        )}

        {/* Price Breakdown */}
        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tax (8%)</Text>
            <Text style={styles.priceValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Fee</Text>
            <Text style={styles.priceValue}>${serviceFee.toFixed(2)}</Text>
          </View>
          
          {pointsToRedeem > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, styles.discountLabel]}>Points Discount</Text>
              <Text style={[styles.priceValue, styles.discountValue]}>-${discount.toFixed(2)}</Text>
            </View>
          )}
          
          <View style={styles.divider} />
          
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={handleCheckout}
          activeOpacity={0.8}>
          <Text style={styles.checkoutButtonText}>Place Order</Text>
          <Feather name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#00704A',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  shopSection: {
    marginBottom: 16,
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00704A',
    marginBottom: 12,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00704A',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginHorizontal: 16,
  },
  removeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  pointsRedemption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    marginBottom: 12,
  },
  pointsRedemptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsRedemptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00704A',
  },
  pointsRedemptionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  pointsSelector: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 12,
  },
  pointsSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  pointsClearButton: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  pointsSliderContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pointsQuickButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00704A',
    alignItems: 'center',
  },
  pointsQuickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00704A',
  },
  pointsDiscountPreview: {
    fontSize: 14,
    color: '#00704A',
    fontWeight: '600',
    textAlign: 'center',
  },
  priceBreakdown: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 15,
    color: '#666',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  discountLabel: {
    color: '#00704A',
    fontWeight: '600',
  },
  discountValue: {
    color: '#00704A',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00704A',
  },
  checkoutButton: {
    backgroundColor: '#00704A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});