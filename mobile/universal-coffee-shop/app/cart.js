// cart screen
// universal-coffee-shop/app/cart.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { awardPointsForOrder } from '../services/loyaltyService'; 

export default function CartScreen() {
  const router = useRouter();
  const { cart, removeItem, clearCart, updateQuantity, getTotalPrice } = useCart();

  // Group items by shop
  const itemsByShop = cart.reduce((acc, item) => {
    const shopName = item.shopName || 'Unknown Shop';
    if (!acc[shopName]) {
      acc[shopName] = [];
    }
    acc[shopName].push(item);
    return acc;
  }, {});

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

      // Group items by shop and create orders
      const shopOrders = Object.entries(itemsByShop);
      
      for (const [shopName, items] of shopOrders) {
        const shopId = items[0].shopId;
        
        // Calculate totals
        const subtotal = items.reduce((sum, item) => {
          const price = parseFloat(item.price) || 0;
          const quantity = item.quantity || 1;
          return sum + (price * quantity);
        }, 0);
        
        const tax = subtotal * 0.08;
        const serviceFee = 0.99;
        const total = subtotal + tax + serviceFee;

        // Create order with correct column names
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: user.id,
            shop_id: shopId,
            status: 'pending',
            subtotal: subtotal,
            tax: tax,
            total: total,
            loyalty_points_earned: Math.floor(total), // 1 point per dollar
            metadata: {
              service_fee: serviceFee,
              item_count: items.reduce((sum, item) => sum + (item.quantity || 1), 0)
            }
          })
          .select()
          .single();

        if (orderError) {
          console.error('Order creation error:', orderError);
          throw orderError;
        }

        console.log('Order created:', order);

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

        // Now create order items in order_items table
        const orderItems = items.map(item => {
          const unitPrice = parseFloat(item.price) || 0;
          const quantity = item.quantity || 1;
          const totalPrice = unitPrice * quantity;
          
          return {
            order_id: order.id,
            menu_item_id: item.id.split(':')[1], // Remove shop prefix from id
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

      Alert.alert(
        'Order Placed! 🎉',
        `Your order has been sent to the shop. You earned loyalty points!`,
        [
          {
            text: 'View Rewards',
            onPress: () => {
              clearCart();
              router.push('/rewards');
            }
          },
          {
            text: 'Continue Shopping',
            onPress: () => {
              clearCart();
              router.back();
            }
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

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);

  const tax = subtotal * 0.08;
  const serviceFee = 0.99;
  const total = subtotal + tax + serviceFee;

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
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
    <SafeAreaView style={styles.container}>
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

      {/* Cart Items */}
      <>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {Object.entries(itemsByShop).map(([shopName, items]) => (
            <View key={shopName} style={styles.shopSection}>
              <Text style={styles.shopName}>{shopName}</Text>
              
              {items.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  {/* Item Image */}
                  {item.image_url && (
                    <Image 
                      source={{ uri: item.image_url }} 
                      style={styles.itemImage}
                    />
                  )}

                  {/* Item Details */}
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>
                      ${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}
                    </Text>

                    {/* Quantity Controls */}
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

          <View style={{ height: 200 }} />
        </ScrollView>

        {/* Bottom Checkout Card */}
        <View style={styles.checkoutCard}>
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
      </>
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
    paddingTop: 50,
    paddingBottom: 16,
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
    paddingTop: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
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