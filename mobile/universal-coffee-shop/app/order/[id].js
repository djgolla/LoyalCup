// order tracking screen
// universal-coffee-shop/app/order/[id].js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { orderService } from '../../services/orderService';

const ORDER_STATUSES = [
  { key: 'pending', label: 'Order Placed', icon: 'check-circle' },
  { key: 'preparing', label: 'Preparing', icon: 'coffee' },
  { key: 'ready', label: 'Ready', icon: 'package' },
  { key: 'completed', label: 'Completed', icon: 'check' },
];

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    
    // poll for updates every 10 seconds
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const loadOrder = async () => {
    try {
      const orderData = await orderService.getOrder(id);
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status) => {
    return ORDER_STATUSES.findIndex(s => s.key === status);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  const currentStatusIndex = getStatusIndex(order?.status || 'pending');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.replace('/home')}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ORDER TRACKING</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Order #{order?.id || 'N/A'}</Text>
          <Text style={styles.orderDate}>
            {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          {ORDER_STATUSES.map((status, index) => (
            <View key={status.key} style={styles.statusItem}>
              <View style={styles.statusIconContainer}>
                <View style={[
                  styles.statusIcon,
                  index <= currentStatusIndex && styles.statusIconActive
                ]}>
                  <Feather 
                    name={status.icon} 
                    size={24} 
                    color={index <= currentStatusIndex ? '#FFF' : '#CCC'} 
                  />
                </View>
                {index < ORDER_STATUSES.length - 1 && (
                  <View style={[
                    styles.statusLine,
                    index < currentStatusIndex && styles.statusLineActive
                  ]} />
                )}
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={[
                  styles.statusLabel,
                  index <= currentStatusIndex && styles.statusLabelActive
                ]}>
                  {status.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER ITEMS</Text>
          {order?.items?.map((item, index) => (
            <View key={index} style={styles.orderItem}>
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
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order?.total?.toFixed(2) || '0.00'}</Text>
          </View>
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
    fontSize: 24,
    fontFamily: 'Anton-Regular',
  },
  content: {
    flex: 1,
  },
  orderInfo: {
    alignItems: 'center',
    padding: 20,
  },
  orderNumber: {
    fontSize: 24,
    fontFamily: 'Anton-Regular',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    padding: 20,
  },
  statusItem: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  statusIconContainer: {
    alignItems: 'center',
    marginRight: 20,
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconActive: {
    backgroundColor: '#000',
  },
  statusLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 5,
  },
  statusLineActive: {
    backgroundColor: '#000',
  },
  statusTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 16,
    color: '#999',
  },
  statusLabelActive: {
    fontSize: 18,
    fontFamily: 'Anton-Regular',
    color: '#000',
  },
  section: {
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
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
  },
  totalLabel: {
    fontSize: 20,
    fontFamily: 'Anton-Regular',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Anton-Regular',
  },
});
