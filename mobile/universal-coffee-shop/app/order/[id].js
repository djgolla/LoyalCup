// order tracking screen — with review prompt for completed orders
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, ActivityIndicator, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { orderService } from '../../services/orderService';
import ReviewModal from '../../components/ReviewModal';

const ORDER_STATUSES = [
  { key: 'pending',   label: 'Order Placed',      icon: 'check-circle' },
  { key: 'accepted',  label: 'Accepted',           icon: 'thumbs-up' },
  { key: 'preparing', label: 'Preparing',          icon: 'coffee' },
  { key: 'ready',     label: 'Ready for Pickup',   icon: 'package' },
  { key: 'completed', label: 'Completed',          icon: 'check' },
];

// ML threshold — show est time only once model has enough training data
const ML_MIN_ORDERS = 50;

const normalizeItems = (order) => {
  if (!order) return [];
  if (order.items?.length) return order.items;
  return (order.order_items || []).map(oi => ({
    name: oi.menu_items?.name || 'Item',
    description: oi.menu_items?.description || '',
    image_url: oi.menu_items?.image_url,
    quantity: oi.quantity || 1,
    unit_price: oi.unit_price || 0,
    total_price: oi.total_price || (oi.unit_price * oi.quantity) || 0,
    customizations: oi.customizations || [],
  }));
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const shortId = (id) => id?.slice(0, 8)?.toUpperCase() || '—';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estTime, setEstTime] = useState(null);        // null = not available yet
  const [showReview, setShowReview] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [id]);

  // real-time
  useEffect(() => {
    if (!id) return;
    const unsub = orderService.subscribeToOrder(id, (updated) => {
      setOrder(prev => ({ ...prev, ...updated }));
    });
    return unsub;
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await orderService.getOrder(id);
      setOrder(data);
      // Fetch est time only if not yet completed/cancelled and shop has enough data
      if (data && !['completed', 'cancelled', 'picked_up'].includes(data.status)) {
        fetchEstTime(data);
      }
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstTime = async (orderData) => {
    try {
      const ML_URL = process.env.EXPO_PUBLIC_ML_URL;
      if (!ML_URL) return;

      // First check if the model has enough data
      const statsRes = await fetch(`${ML_URL}/api/model-stats/${orderData.shop_id}`);
      if (!statsRes.ok) return;
      const stats = await statsRes.json();

      // Only show estimate if at least 50 completed orders trained the model
      if ((stats.training_data_count || 0) < ML_MIN_ORDERS) return;

      const items = normalizeItems(orderData);
      const predRes = await fetch(`${ML_URL}/api/predict-prep-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: orderData.shop_id,
          items: items.map(i => ({ name: i.name, quantity: i.quantity })),
          current_queue_length: 0,
        }),
      });
      if (!predRes.ok) return;
      const pred = await predRes.json();
      setEstTime(pred);
    } catch {
      // silently ignore — est time is nice-to-have
    }
  };

  const getStatusIndex = (status) => ORDER_STATUSES.findIndex(s => s.key === status);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const items = normalizeItems(order);
  const currentStatusIndex = getStatusIndex(order?.status || 'pending');
  const shopName = order?.shops?.name || 'Shop';
  const shopLogo = order?.shops?.logo_url;
  const isCompleted = order?.status === 'completed' || order?.status === 'picked_up';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Order info */}
        <View style={styles.card}>
          <View style={styles.shopRow}>
            {shopLogo
              ? <Image source={{ uri: shopLogo }} style={styles.shopLogo} />
              : <View style={styles.shopLogoPlaceholder}><Feather name="coffee" size={18} color="#00704A" /></View>
            }
            <View style={{ flex: 1 }}>
              <Text style={styles.shopName}>{shopName}</Text>
              <Text style={styles.orderMeta}>#{shortId(order?.id)} · {formatDate(order?.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Est time — only shown when ML model is trained */}
        {estTime && (
          <View style={styles.card}>
            <View style={styles.estTimeRow}>
              <Feather name="clock" size={20} color="#00704A" />
              <View style={{ flex: 1 }}>
                <Text style={styles.estTimeLabel}>Estimated ready time</Text>
                <Text style={styles.estTimeValue}>{estTime.estimated_ready_time}</Text>
              </View>
              <Text style={styles.estTimeMinutes}>~{estTime.estimated_minutes} min</Text>
            </View>
          </View>
        )}

        {/* Status tracker */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          {ORDER_STATUSES.map((status, index) => {
            const isDone = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            return (
              <View key={status.key} style={styles.statusItem}>
                <View style={styles.statusLeft}>
                  <View style={[styles.statusIcon, isDone && styles.statusIconDone, isCurrent && styles.statusIconCurrent]}>
                    <Feather name={status.icon} size={18} color={isDone ? '#FFF' : '#CCC'} />
                  </View>
                  {index < ORDER_STATUSES.length - 1 && (
                    <View style={[styles.statusLine, isDone && styles.statusLineDone]} />
                  )}
                </View>
                <View style={styles.statusRight}>
                  <Text style={[styles.statusLabel, isDone && styles.statusLabelDone]}>{status.label}</Text>
                  {isCurrent && <Text style={styles.statusCurrent}>Current status</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Order items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.length === 0 ? (
            <Text style={styles.noItems}>No items found</Text>
          ) : (
            items.map((item, index) => (
              <View key={index} style={[styles.itemRow, index < items.length - 1 && styles.itemRowBorder]}>
                <View style={styles.itemLeft}>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.customizations?.length > 0 && (
                      <Text style={styles.itemCustom}>
                        {item.customizations.map(c => c.name).join(' · ')}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.itemPrice}>
                  ${parseFloat(item.total_price || item.unit_price * item.quantity || 0).toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Totals */}
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>${parseFloat(order?.subtotal || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tax</Text>
            <Text style={styles.priceValue}>${parseFloat(order?.tax || 0).toFixed(2)}</Text>
          </View>
          {order?.loyalty_discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: '#00704A' }]}>Points Discount</Text>
              <Text style={[styles.priceValue, { color: '#00704A' }]}>-${parseFloat(order.loyalty_discount).toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${parseFloat(order?.total || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Review CTA — only for completed orders */}
        {isCompleted && !reviewed && (
          <TouchableOpacity style={styles.reviewCTA} onPress={() => setShowReview(true)} activeOpacity={0.85}>
            <View style={styles.reviewCTALeft}>
              <Feather name="star" size={20} color="#F59E0B" />
              <View>
                <Text style={styles.reviewCTATitle}>How was your order?</Text>
                <Text style={styles.reviewCTASub}>Leave a review for {shopName}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {isCompleted && reviewed && (
          <View style={[styles.reviewCTA, { backgroundColor: '#F0FAF5' }]}>
            <Feather name="check-circle" size={20} color="#00704A" />
            <Text style={{ marginLeft: 10, fontWeight: '600', color: '#00704A' }}>Thanks for your review!</Text>
          </View>
        )}

      </ScrollView>

      <ReviewModal
        visible={showReview}
        orderId={order?.id}
        shopId={order?.shop_id}
        shopName={shopName}
        onClose={() => setShowReview(false)}
        onSubmitted={() => { setShowReview(false); setReviewed(true); }}
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
  content: { flex: 1 },

  card: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' },

  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shopLogo: { width: 44, height: 44, borderRadius: 22 },
  shopLogoPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  shopName: { fontSize: 17, fontWeight: '700', color: '#000', marginBottom: 2 },
  orderMeta: { fontSize: 13, color: '#999' },

  // Est time
  estTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  estTimeLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  estTimeValue: { fontSize: 16, fontWeight: '700', color: '#000' },
  estTimeMinutes: { fontSize: 22, fontWeight: '800', color: '#00704A' },

  // Status tracker
  statusItem: { flexDirection: 'row', marginBottom: 4 },
  statusLeft: { alignItems: 'center', marginRight: 16, width: 40 },
  statusIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  statusIconDone: { backgroundColor: '#00704A' },
  statusIconCurrent: { backgroundColor: '#00704A' },
  statusLine: { width: 2, flex: 1, minHeight: 20, backgroundColor: '#E0E0E0', marginVertical: 2 },
  statusLineDone: { backgroundColor: '#00704A' },
  statusRight: { flex: 1, paddingTop: 10, paddingBottom: 16 },
  statusLabel: { fontSize: 15, color: '#CCC' },
  statusLabelDone: { color: '#000', fontWeight: '600' },
  statusCurrent: { fontSize: 12, color: '#00704A', marginTop: 2, fontWeight: '600' },

  // Items
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  qtyText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  itemName: { fontSize: 15, fontWeight: '600', color: '#000' },
  itemCustom: { fontSize: 12, color: '#00704A', marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '600', color: '#000' },
  noItems: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 12 },

  // Totals
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  priceLabel: { fontSize: 15, color: '#666' },
  priceValue: { fontSize: 15, fontWeight: '600', color: '#000' },
  totalRow: { borderBottomWidth: 0, paddingTop: 12 },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#000' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#00704A' },

  // Review CTA
  reviewCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#FDE68A' },
  reviewCTALeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewCTATitle: { fontSize: 15, fontWeight: '700', color: '#000' },
  reviewCTASub: { fontSize: 13, color: '#666', marginTop: 1 },
});