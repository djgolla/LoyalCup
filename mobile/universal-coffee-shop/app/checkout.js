// checkout screen
// universal-coffee-shop/app/checkout.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCart();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    console.log('🔥 PAY NOW CLICKED');
    setLoading(true);
    
    try {
      const subtotal = getTotal();
      const tax = subtotal * 0.08;
      const total = subtotal + tax;

      console.log('💰 Total:', total);
      console.log('📦 Items:', items);

      // 1. Create payment intent on backend
      console.log('🌐 Calling API:', `${process.env.EXPO_PUBLIC_API_URL}/api/v1/payments/create-payment-intent`);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: items[0]?.shopId || 'default-shop',
          items: items.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
          })),
          total: total
        })
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📄 Response data:', data);

      const { client_secret } = data;

      if (!client_secret) {
        throw new Error('No client_secret returned from server');
      }

      console.log('🔑 Got client_secret');

      // 2. Initialize payment sheet
      console.log('🎨 Initializing payment sheet...');
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'LoyalCup',
        paymentIntentClientSecret: client_secret,
        defaultBillingDetails: {
          name: 'Customer Name',
        }
      });

      if (initError) {
        console.error('❌ Init error:', initError);
        Alert.alert('Error', initError.message);
        setLoading(false);
        return;
      }

      console.log('✅ Payment sheet initialized');

      // 3. Present payment sheet
      console.log('📱 Presenting payment sheet...');
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        console.log('❌ Payment cancelled:', presentError.message);
        Alert.alert('Payment cancelled', presentError.message);
        setLoading(false);
        return;
      }

      console.log('✅ Payment successful!');

      // 4. Payment successful - create order
      const orderData = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          shopId: item.shopId,
        })),
        total: total,
        status: 'pending',
      };

      const order = await orderService.createOrder(orderData);
      
      clearCart();
      
      Alert.alert(
        'Order Placed!',
        'Your payment was successful and order has been placed.',
        [{ text: 'OK', onPress: () => router.replace(`/order/${order.id}`) }]
      );
    } catch (error) {
      console.error('💥 Error:', error);
      Alert.alert('Error', `Failed to complete payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getTotal();
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CHECKOUT</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
          {items.map(item => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.itemName}>
                {item.quantity}x {item.name}
              </Text>
              <Text style={styles.itemPrice}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (8%)</Text>
            <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DELIVERY INFO</Text>
          <Text style={styles.infoText}>Pick up in store</Text>
          <Text style={styles.infoSubtext}>Ready in 10-15 minutes</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.placeOrderButton, loading && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.placeOrderButtonText}>PAY NOW</Text>
              <Text style={styles.placeOrderTotal}>${total.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 24,
    fontFamily: 'Anton-Regular',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Anton-Regular',
    marginBottom: 15,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 16,
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: 'Anton-Regular',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalValue: {
    fontSize: 16,
  },
  grandTotal: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  grandTotalLabel: {
    fontSize: 20,
    fontFamily: 'Anton-Regular',
  },
  grandTotalValue: {
    fontSize: 20,
    fontFamily: 'Anton-Regular',
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'Anton-Regular',
    marginBottom: 5,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  placeOrderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#000',
    borderRadius: 25,
    paddingHorizontal: 25,
  },
  placeOrderButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Anton-Regular',
  },
  placeOrderTotal: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Anton-Regular',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});