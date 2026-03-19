// order tracking screen — real-time, review prompt, Square POS aware
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, ActivityIndicator, Image, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../services/apiClient';

const ORDER_STATUSES = [
  { key: 'pending',   label: 'Order Placed',     icon: 'clock',       color: '#6b7280' },
  { key: 'accepted',  label: 'Accepted',          icon: 'thumbs-up',   color: '#2563eb' },
  { key: 'preparing', label: 'Preparing',         icon: 'coffee',      color: '#d97706' },
  { key: 'ready',     label: 'Ready for Pickup',  icon: 'package',     color: '#059669' },
  { key: 'completed', label: 'Completed',         icon: 'check-circle',color: '#7c3aed' },
];

const STATUS_MSGS = {
  pending:   'Your order is in the queue...',
  accepted:  'The barista has your order!',
  preparing: 'Brewing in progress ☕',
  ready:     '🎉 Head to the counter — it\'s ready!',
  completed: 'Enjoy! Come back soon 🙌',
  cancelled: 'This order was cancelled.',
};

const shortId = (id) => id?.slice(0, 8)?.toUpperCase() || '—';

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const normalizeItems = (order) => {
  if (!order) return [];
  if (Array.isArray(order.items) && order.items.length) return order.items;
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

// ── Review Modal ��────────────────────────────────────────────────────────────
function ReviewModal({ orderId, shopId, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { TextInput } = require('react-native');

  const submit = async () => {
    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Sign in required'); return; }
      const { error } = await supabase.from('reviews').upsert({
        shop_id: shopId,
        customer_id: user.id,
        order_id: orderId,
        rating,
        comment: comment.trim() || null,
      }, { onConflict: 'order_id,customer_id' });
      if (error) throw error;
      onSubmitted();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>Leave a Review ⭐</Text>
        <Text style={styles.modalSub}>How was your experience?</Text>
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map(s => (
            <TouchableOpacity key={s} onPress={() => setRating(s)}>
              <Feather name="star" size={32} color={s <= rating ? '#f59e0b' : '#d1d5db'}
                style={{ marginHorizontal: 4 }} />
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.commentInput}
          placeholder="Tell us more (optional)"
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={300}
          value={comment}
          onChangeText={setComment}
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.modalSkip} onPress={onClose}>
            <Text style={styles.modalSkipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalSubmit} onPress={submit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.modalSubmitText}>Submit</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for "ready" status
  useEffect(() => {
    if (order?.status === 'ready') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [order?.status]);

  // Load order
  const loadOrder = async () => {
    try {
      const token = (await supabase.auth.getSession())?.data?.session?.access_token;
      if (!token) return;
      const data = await apiClient.get(`/orders/${id}`);
      setOrder(data.order || data);
    } catch (err) {
      console.error('loadOrder:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 10 seconds as fallback
  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [id]);

  // Real-time Supabase subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${id}`,
      }, (payload) => {
        setOrder(prev => prev ? { ...prev, ...payload.new } : payload.new);
        // Show review prompt when completed
        if (payload.new?.status === 'completed' && !reviewed) {
          setTimeout(() => setShowReview(true), 1000);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id, reviewed]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#d97706" />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={48} color="#d1d5db" />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/home')}>
            <Text style={styles.backButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const items = normalizeItems(order);
  const shopName = order.shops?.name || 'Shop';
  const shopLogo = order.shops?.logo_url;
  const currentStatus = order.status || 'pending';
  const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.key === currentStatus);
  const isCancelled = currentStatus === 'cancelled';
  const isCompleted = currentStatus === 'completed' || currentStatus === 'picked_up';
  const isReady = currentStatus === 'ready';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/order-history')}>
          <Feather name="list" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Ready banner */}
        {isReady && (
          <Animated.View style={[styles.readyBanner, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.readyBannerText}>🎉 Your order is ready! Head to the counter.</Text>
          </Animated.View>
        )}

        {/* Shop + order info */}
        <View style={styles.card}>
          <View style={styles.shopRow}>
            {shopLogo
              ? <Image source={{ uri: shopLogo }} style={styles.shopLogo} />
              : <View style={styles.shopLogoPlaceholder}><Feather name="coffee" size={20} color="#d97706" /></View>
            }
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.shopName}>{shopName}</Text>
              <Text style={styles.orderMeta}>#{shortId(order.id)} · {formatDate(order.created_at)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isCancelled ? '#fee2e2' : isCompleted ? '#ede9fe' : '#fef3c7' }]}>
              <Text style={[styles.statusBadgeText, { color: isCancelled ? '#dc2626' : isCompleted ? '#7c3aed' : '#d97706' }]}>
                {currentStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.statusMsg}>{STATUS_MSGS[currentStatus] || currentStatus}</Text>
        </View>

        {/* Progress tracker */}
        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Progress</Text>
            {ORDER_STATUSES.map((s, i) => {
              const isDone = i < currentStatusIndex || isCompleted;
              const isCurrent = i === currentStatusIndex && !isCompleted;
              return (
                <View key={s.key} style={styles.stepRow}>
                  <View style={[
                    styles.stepCircle,
                    isDone && { backgroundColor: '#059669', borderColor: '#059669' },
                    isCurrent && { backgroundColor: s.color, borderColor: s.color },
                  ]}>
                    <Feather
                      name={isDone ? 'check' : s.icon}
                      size={14}
                      color={isDone || isCurrent ? '#fff' : '#d1d5db'}
                    />
                  </View>
                  {i < ORDER_STATUSES.length - 1 && (
                    <View style={[styles.stepLine, isDone && { backgroundColor: '#059669' }]} />
                  )}
                  <Text style={[
                    styles.stepLabel,
                    isDone && { color: '#059669', fontWeight: '700' },
                    isCurrent && { color: s.color, fontWeight: '800' },
                  ]}>{s.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Cancelled state */}
        {isCancelled && (
          <View style={[styles.card, { alignItems: 'center' }]}>
            <Feather name="x-circle" size={48} color="#dc2626" />
            <Text style={styles.cancelTitle}>Order Cancelled</Text>
            <Text style={styles.cancelSub}>This order was cancelled. Contact the shop if you have questions.</Text>
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              {item.image_url
                ? <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                : <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Feather name="coffee" size={16} color="#d97706" />
                  </View>
              }
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.itemName}>{item.name} × {item.quantity}</Text>
                {(item.customizations || []).length > 0 && (
                  <Text style={styles.itemMods}>
                    {item.customizations.map(c => c.name).filter(Boolean).join(', ')}
                  </Text>
                )}
              </View>
              <Text style={styles.itemPrice}>${parseFloat(item.total_price || 0).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Total</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${parseFloat(order.subtotal || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>${parseFloat(order.tax || 0).toFixed(2)}</Text>
          </View>
          {order.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#059669' }]}>Points Discount</Text>
              <Text style={[styles.totalValue, { color: '#059669' }]}>-${parseFloat(order.discount_amount).toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' }]}>
            <Text style={[styles.totalLabel, { fontWeight: '800', fontSize: 16, color: '#111827' }]}>Total</Text>
            <Text style={[styles.totalValue, { fontWeight: '800', fontSize: 16, color: '#059669' }]}>
              ${parseFloat(order.total || 0).toFixed(2)}
            </Text>
          </View>
          {order.loyalty_points_earned > 0 && (
            <View style={styles.pointsBadge}>
              <Feather name="award" size={14} color="#d97706" />
              <Text style={styles.pointsBadgeText}>+{order.loyalty_points_earned} points earned</Text>
            </View>
          )}
        </View>

        {/* Review button for completed orders */}
        {isCompleted && !reviewed && (
          <TouchableOpacity style={styles.reviewButton} onPress={() => setShowReview(true)}>
            <Feather name="star" size={18} color="#fff" />
            <Text style={styles.reviewButtonText}>Leave a Review</Text>
          </TouchableOpacity>
        )}

        {reviewed && (
          <View style={styles.reviewedBadge}>
            <Feather name="check-circle" size={16} color="#059669" />
            <Text style={styles.reviewedText}>Review submitted — thanks!</Text>
          </View>
        )}

        <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/home')}>
          <Feather name="home" size={18} color="#d97706" />
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>

      </ScrollView>

      {showReview && (
        <ReviewModal
          orderId={order.id}
          shopId={order.shop_id}
          onClose={() => setShowReview(false)}
          onSubmitted={() => { setShowReview(false); setReviewed(true); Alert.alert('Thanks!', 'Your review has been submitted.'); }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
  errorText: { fontSize: 16, color: '#9ca3af', marginTop: 8 },
  readyBanner: { margin: 16, marginBottom: 0, backgroundColor: '#059669', borderRadius: 14, padding: 16, alignItems: 'center' },
  readyBannerText: { color: '#fff', fontWeight: '800', fontSize: 15, textAlign: 'center' },
  card: { margin: 16, marginBottom: 0, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  shopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  shopLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6' },
  shopLogoPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  orderMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  statusMsg: { fontSize: 14, color: '#6b7280', fontStyle: 'italic' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  stepLine: { position: 'absolute', left: 13, top: 28, width: 2, height: 8, backgroundColor: '#d1d5db' },
  stepLabel: { marginLeft: 12, fontSize: 14, color: '#9ca3af' },
  cancelTitle: { fontSize: 20, fontWeight: '800', color: '#dc2626', marginTop: 12 },
  cancelSub: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemImage: { width: 44, height: 44, borderRadius: 10 },
  itemImagePlaceholder: { backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemMods: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#059669' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 14, color: '#6b7280' },
  totalValue: { fontSize: 14, color: '#374151', fontWeight: '600' },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#fffbeb', padding: 10, borderRadius: 10 },
  pointsBadgeText: { fontSize: 13, fontWeight: '700', color: '#d97706' },
  reviewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginBottom: 0, backgroundColor: '#d97706', borderRadius: 14, padding: 16 },
  reviewButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  reviewedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginBottom: 0, backgroundColor: '#ecfdf5', borderRadius: 14, padding: 14 },
  reviewedText: { fontSize: 14, color: '#059669', fontWeight: '700' },
  homeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginBottom: 0, borderWidth: 2, borderColor: '#d97706', borderRadius: 14, padding: 14 },
  homeButtonText: { color: '#d97706', fontWeight: '700', fontSize: 15 },
  backButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#d97706', borderRadius: 12 },
  backButtonText: { color: '#fff', fontWeight: '700' },
  // Review modal
  modalOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  modalSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  commentInput: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, color: '#111827', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalSkip: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  modalSkipText: { fontWeight: '700', color: '#6b7280' },
  modalSubmit: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: '#d97706', alignItems: 'center' },
  modalSubmitText: { fontWeight: '800', color: '#fff', fontSize: 15 },
});