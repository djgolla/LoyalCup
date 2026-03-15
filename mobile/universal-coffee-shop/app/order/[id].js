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
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatusIndex = getStatusIndex(order?.status || 'pending');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
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
                    size={22} 
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
          <Text style={styles.sectionTitle}>Order Items</Text>
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

        <View style={styles.totalSection}>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  orderInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statusIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconActive: {
    backgroundColor: '#00704A',
  },
  statusLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  statusLineActive: {
    backgroundColor: '#00704A',
  },
  statusTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 15,
    color: '#999',
  },
  statusLabelActive: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 15,
    color: '#000',
    flex: 1,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00704A',
  },
  totalSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#00704A',
  },
});