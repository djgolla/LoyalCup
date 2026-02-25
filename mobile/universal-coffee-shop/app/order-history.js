// order history screen
// universal-coffee-shop/app/order-history.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { orderService } from '../services/orderService';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getOrderHistory();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'ready':
        return '#2196F3';
      case 'preparing':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const renderOrderCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => router.push(`/order/${item.id}`)}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Order #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.orderDate}>
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}
      </Text>

      <View style={styles.orderItems}>
        {item.items?.slice(0, 2).map((orderItem, index) => (
          <Text key={index} style={styles.orderItemText}>
            {orderItem.quantity}x {orderItem.name}
          </Text>
        ))}
        {item.items?.length > 2 && (
          <Text style={styles.moreItemsText}>
            +{item.items.length - 2} more items
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>${item.total?.toFixed(2) || '0.00'}</Text>
        <Feather name="chevron-right" size={24} color="black" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Feather name="shopping-bag" size={64} color="#CCC" />
      <Text style={styles.emptyText}>No orders yet</Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => router.back()}>
        <Text style={styles.shopButtonText}>START SHOPPING</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ORDER HISTORY</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderCard}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={orders.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
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
  listContent: {
    padding: 20,
  },
  emptyListContent: {
    flex: 1,
  },
  orderCard: {
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 15,
    backgroundColor: '#FFF',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontFamily: 'Anton-Regular',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Anton-Regular',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItemText: {
    fontSize: 14,
    marginBottom: 4,
  },
  moreItemsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  orderTotal: {
    fontSize: 20,
    fontFamily: 'Anton-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Anton-Regular',
    marginTop: 20,
    marginBottom: 30,
  },
  shopButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: '#000',
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Anton-Regular',
  },
});
