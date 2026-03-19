// order history screen
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { orderService } from '../services/orderService';

// Normalize Supabase order_items → flat items array with .name, .quantity, .unit_price
const normalizeItems = (order) => {
  if (order.items) return order.items; // already normalized
  return (order.order_items || []).map(oi => ({
    name: oi.menu_items?.name || 'Item',
    quantity: oi.quantity || 1,
    unit_price: oi.unit_price || 0,
  }));
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Unknown date';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

const shortId = (id) => id?.slice(0, 8)?.toUpperCase() || '—';

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return '#00704A';
    case 'ready': return '#4CAF50';
    case 'preparing': return '#FF9800';
    case 'accepted': return '#2196F3';
    case 'cancelled': return '#F44336';
    default: return '#999';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'accepted': return 'Accepted';
    case 'preparing': return 'Preparing';
    case 'ready': return 'Ready';
    case 'picked_up': return 'Picked Up';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadOrders(); }, []);

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

  const renderOrderCard = ({ item }) => {
    const items = normalizeItems(item);
    const shopName = item.shops?.name || 'Shop';
    const shopLogo = item.shops?.logo_url;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/order/${item.id}`)}
        activeOpacity={0.7}>

        {/* Shop row */}
        <View style={styles.shopRow}>
          {shopLogo
            ? <Image source={{ uri: shopLogo }} style={styles.shopLogo} />
            : <View style={styles.shopLogoPlaceholder}><Feather name="coffee" size={14} color="#00704A" /></View>
          }
          <Text style={styles.shopName}>{shopName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        {/* Date + order number */}
        <View style={styles.metaRow}>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          <Text style={styles.orderId}>#{shortId(item.id)}</Text>
        </View>

        {/* Items */}
        {items.length > 0 && (
          <View style={styles.itemsList}>
            {items.slice(0, 3).map((oi, idx) => (
              <Text key={idx} style={styles.itemText} numberOfLines={1}>
                {oi.quantity}× {oi.name}
              </Text>
            ))}
            {items.length > 3 && (
              <Text style={styles.moreItemsText}>+{items.length - 3} more</Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.orderFooter}>
          <Text style={styles.itemCount}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
          <View style={styles.totalRow}>
            <Text style={styles.orderTotal}>${parseFloat(item.total || 0).toFixed(2)}</Text>
            <Feather name="chevron-right" size={18} color="#999" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="shopping-bag" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
      <TouchableOpacity style={styles.shopButton} onPress={() => router.back()}>
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order History</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Loading orders...</Text>
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
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={styles.headerButton} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderCard}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={orders.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00704A" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  listContent: { padding: 16, paddingBottom: 32 },
  emptyListContent: { flex: 1 },

  orderCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },

  shopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  shopLogo: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  shopLogoPlaceholder: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  shopName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#000' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderDate: { fontSize: 13, color: '#666' },
  orderId: { fontSize: 12, color: '#CCC', fontWeight: '600' },

  itemsList: { borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 10, marginBottom: 10 },
  itemText: { fontSize: 14, color: '#333', marginBottom: 3 },
  moreItemsText: { fontSize: 12, color: '#999', marginTop: 2 },

  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  itemCount: { fontSize: 13, color: '#999' },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderTotal: { fontSize: 18, fontWeight: '700', color: '#000' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999', marginBottom: 28, textAlign: 'center' },
  shopButton: { paddingHorizontal: 32, paddingVertical: 14, backgroundColor: '#00704A', borderRadius: 25 },
  shopButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});