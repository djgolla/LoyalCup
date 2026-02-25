// cart screen - STARBUCKS STYLE
// universal-coffee-shop/app/cart.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

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
        'Your order has been sent to the shop',
        [
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

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.08;
  const serviceFee = 0.99;
  const total = subtotal + tax + serviceFee;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}>
          <Feather name="x" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => {
            if (cart.length > 0) {
              Alert.alert(
                'Clear Cart',
                'Remove all items from cart?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clearCart }
                ]
              );
            }
          }}>
          <Feather name="trash-2" size={20} color={cart.length > 0 ? "#FF3B30" : "#CCC"} />
        </TouchableOpacity>
      </View>

      {cart.length === 0 ? (
        // Empty State
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="shopping-bag" size={64} color="#CCC" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items from a shop to get started</Text>
          <TouchableOpacity 
            style={styles.browseShopsButton}
            onPress={() => router.push('/(tabs)')}>
            <Text style={styles.browseShopsText}>Browse Shops</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Cart Items */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {Object.entries(itemsByShop).map(([shopName, items]) => (
              <View key={shopName} style={styles.shopSection}>
                {/* Shop Header */}
                <View style={styles.shopHeader}>
                  <View style={styles.shopIcon}>
                    <Text style={{ fontSize: 20 }}>☕</Text>
                  </View>
                  <Text style={styles.shopName}>{shopName}</Text>
                </View>

                {/* Items */}
                {items.map((item) => (
                  <View key={item.id} style={styles.cartItem}>
                    <View style={styles.itemImageContainer}>
                      {item.image_url ? (
                        <Image 
                          source={{ uri: item.image_url }} 
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.itemImagePlaceholder}>
                          <Text style={{ fontSize: 24 }}>☕</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.itemPrice}>${item.price?.toFixed(2)}</Text>

                      {/* Quantity Controls */}
                      <View style={styles.quantityContainer}>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => {
                            const currentQty = item.quantity || 1;
                            if (currentQty > 1) {
                              updateQuantity?.(item.id, currentQty - 1);
                            } else {
                              handleRemoveItem(item.id);
                            }
                          }}>
                          <Feather name="minus" size={16} color="#000" />
                        </TouchableOpacity>
                        
                        <Text style={styles.quantityText}>{item.quantity || 1}</Text>
                        
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => {
                            const currentQty = item.quantity || 1;
                            updateQuantity?.(item.id, currentQty + 1);
                          }}>
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
      )}
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
    fontWeight: 'bold',
    color: '#000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  browseShopsButton: {
    backgroundColor: '#00704A',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  browseShopsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  shopSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  shopIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemImageContainer: {
    marginRight: 12,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  itemImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  priceBreakdown: {
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontWeight: 'bold',
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