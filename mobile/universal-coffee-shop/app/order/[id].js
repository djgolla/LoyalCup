// Order confirmation screen — ETA based, no live status tracking.
// Orders go straight to the shop's Square POS; the customer is told roughly
// when it'll be ready. No progress tracker / realtime / polling.
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, ActivityIndicator, Image, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../services/apiClient';

const GREEN = '#F97316';
const GREEN_DARK = '#005A3A';
const GREEN_LIGHT = '#F8FAFC';
const ORANGE = '#F59E0B';

const shortId = (id) => id?.slice(0, 8)?.toUpperCase() || '—';

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatReadyTime = (order) => {
  const readyAt = order?.ready_at || order?.metadata?.ready_at;
  if (!readyAt) return null;

  return new Date(readyAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const normalizeItems = (order) => {
  if (!order) return [];

  const rawItems = Array.isArray(order.items) && order.items.length
    ? order.items
    : (order.order_items || []);

  return rawItems.map((oi) => {
    const menuItem = oi.menu_items || oi.menu_item || {};

    const quantity = oi.quantity || 1;
    const unitPrice = parseFloat(oi.unit_price ?? oi.base_price ?? menuItem.base_price ?? 0) || 0;
    const totalPrice = parseFloat(oi.total_price ?? (unitPrice * quantity)) || 0;

    return {
      id: oi.id,
      name: oi.name || menuItem.name || 'Item',
      description: oi.description || menuItem.description || '',
      image_url: oi.image_url || menuItem.image_url,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      customizations: oi.customizations || [],
    };
  });
};

// ── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({ orderId, shopId, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    try {
      setSubmitting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        Alert.alert('Sign in required');
        return;
      }

      await apiClient.post('/api/v1/reviews', {
        shop_id: shopId,
        order_id: orderId,
        rating,
        body: body.trim() || null,
      }, session.access_token);

      onSubmitted();
    } catch (e) {
      const msg = e.message || 'Could not submit review';

      if (msg.includes('409') || msg.toLowerCase().includes('already')) {
        Alert.alert('Already Reviewed', 'You already left a review for this order.');
        onClose();
      } else {
        Alert.alert('Error', msg);
      }
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
          {[1, 2, 3, 4, 5].map(s => (
            <TouchableOpacity key={s} onPress={() => setRating(s)}>
              <Feather
                name="star"
                size={32}
                color={s <= rating ? ORANGE : '#D1D5DB'}
                style={{ marginHorizontal: 4 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.commentInput}
          placeholder="Tell us more (optional)"
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={300}
          value={body}
          onChangeText={setBody}
        />

        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.modalSkip} onPress={onClose}>
            <Text style={styles.modalSkipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalSubmit} onPress={submit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={styles.modalSubmitText}>Submit</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const loadOrder = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const data = await apiClient.get(`/api/v1/orders/${id}`, session.access_token);
      setOrder(data.order || data);
    } catch (err) {
      console.error('[OrderConfirmation] loadOrder error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#101828" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order</Text>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GREEN} />
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
            <Feather name="arrow-left" size={22} color="#101828" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order</Text>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.centered}>
          <Feather name="alert-circle" size={48} color="#D1D5DB" />
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
  const status = order.status || 'pending';

  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';
  const isActive = status === 'pending' || status === 'confirmed';

  const prepMinutes = order.metadata?.prep_minutes || order.shops?.avg_prep_time_minutes || 10;
  const readyTime = formatReadyTime(order);

  const discountAmount = parseFloat(order.metadata?.discount_amount || order.discount_amount || 0);
  const pointsEarned = order.metadata?.loyalty_points_earned || order.loyalty_points_earned || 0;
  const pointsRedeemed = order.metadata?.loyalty_points_redeemed || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#101828" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Order #{shortId(order.id)}</Text>

        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/order-history')}>
          <Feather name="list" size={22} color="#101828" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {isActive && (
          <View style={styles.etaBanner}>
            <Text style={styles.etaBannerTitle}>Order sent to {shopName}! ☕</Text>
            <Text style={styles.etaBannerText}>
              It'll be ready in about {prepMinutes} minutes{readyTime ? ` around ${readyTime}` : ''}. Head over and pick it up.
            </Text>
          </View>
        )}

        {isCompleted && (
          <View style={styles.readyBanner}>
            <Text style={styles.etaBannerTitle}>Ready for pickup! 🎉</Text>
            <Text style={styles.etaBannerText}>
              Your order should be ready now. Head over and pick it up.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.shopRow}>
            {shopLogo
              ? <Image source={{ uri: shopLogo }} style={styles.shopLogo} />
              : (
                <View style={styles.shopLogoPlaceholder}>
                  <Feather name="coffee" size={20} color={GREEN} />
                </View>
              )
            }

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.shopName}>{shopName}</Text>
              <Text style={styles.orderMeta}>{formatDate(order.created_at)}</Text>
            </View>
          </View>

          {isCancelled
            ? <Text style={styles.statusMsg}>This order was cancelled.</Text>
            : isCompleted
              ? <Text style={styles.statusMsg}>Your order is ready. Thanks for ordering!</Text>
              : <Text style={styles.statusMsg}>Thanks for your order!</Text>
          }
        </View>

        {isCancelled && (
          <View style={[styles.card, { alignItems: 'center' }]}>
            <Feather name="x-circle" size={48} color="#DC2626" />
            <Text style={styles.cancelTitle}>Order Cancelled</Text>
            <Text style={styles.cancelSub}>This order was cancelled. Contact the shop if you have questions.</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>

          {items.length === 0 ? (
            <View style={styles.emptyItems}>
              <Feather name="coffee" size={28} color="#D1D5DB" />
              <Text style={styles.emptyItemsText}>No item details found for this order.</Text>
            </View>
          ) : items.map((item, i) => (
            <View
              key={item.id || i}
              style={[
                styles.itemRow,
                i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
              ]}
            >
              {item.image_url
                ? <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Feather name="coffee" size={16} color={GREEN} />
                  </View>
                )
              }

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>Qty {item.quantity}</Text>

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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${parseFloat(order.subtotal || 0).toFixed(2)}</Text>
          </View>

          {parseFloat(order.tax || 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>${parseFloat(order.tax).toFixed(2)}</Text>
            </View>
          )}

          {discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: GREEN }]}>
                Points Discount ({pointsRedeemed > 0 ? `${pointsRedeemed} pts` : ''})
              </Text>
              <Text style={[styles.totalValue, { color: GREEN }]}>-${discountAmount.toFixed(2)}</Text>
            </View>
          )}

          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalLabelBold}>Total Charged</Text>
            <Text style={styles.totalValueBold}>${parseFloat(order.total || 0).toFixed(2)}</Text>
          </View>

          <View style={styles.squareBadge}>
            <Feather name="lock" size={12} color="#6B7280" />
            <Text style={styles.squareBadgeText}>Paid securely via Square</Text>
          </View>

          {pointsEarned > 0 && (
            <View style={styles.pointsBadge}>
              <Feather name="award" size={14} color={GREEN} />
              <Text style={styles.pointsBadgeText}>+{pointsEarned} points earned</Text>
            </View>
          )}
        </View>

        {isCompleted && !reviewed && (
          <TouchableOpacity style={styles.reviewButton} onPress={() => setShowReview(true)}>
            <Feather name="star" size={18} color="#FFF" />
            <Text style={styles.reviewButtonText}>Leave a Review</Text>
          </TouchableOpacity>
        )}

        {isActive && !reviewed && (
          <View style={styles.reviewLocked}>
            <Feather name="clock" size={16} color="#6B7280" />
            <Text style={styles.reviewLockedText}>You can review after pickup time.</Text>
          </View>
        )}

        {reviewed && (
          <View style={styles.reviewedBadge}>
            <Feather name="check-circle" size={16} color={GREEN} />
            <Text style={styles.reviewedText}>Review submitted — thanks!</Text>
          </View>
        )}

        <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/home')}>
          <Feather name="home" size={18} color={GREEN} />
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>

      {showReview && (
        <ReviewModal
          orderId={order.id}
          shopId={order.shop_id}
          onClose={() => setShowReview(false)}
          onSubmitted={() => {
            setShowReview(false);
            setReviewed(true);
            Alert.alert('Thanks! ⭐', 'Your review has been submitted.');
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#101828' },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 14 },
  errorText: { fontSize: 16, color: '#94A3B8', marginTop: 8 },

  etaBanner: { margin: 16, marginBottom: 0, backgroundColor: GREEN, borderRadius: 18, padding: 18, alignItems: 'center' },
  readyBanner: { margin: 16, marginBottom: 0, backgroundColor: GREEN_DARK, borderRadius: 18, padding: 18, alignItems: 'center' },
  etaBannerTitle: { color: '#FFF', fontWeight: '900', fontSize: 17, textAlign: 'center', marginBottom: 5 },
  etaBannerText: { color: 'rgba(255,255,255,0.92)', fontWeight: '600', fontSize: 13, textAlign: 'center', lineHeight: 19 },

  card: { margin: 16, marginBottom: 0, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  shopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  shopLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6' },
  shopLogoPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: GREEN_LIGHT, alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 16, fontWeight: '800', color: '#101828' },
  orderMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  statusMsg: { fontSize: 14, color: '#64748B', fontStyle: 'italic' },

  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  cancelTitle: { fontSize: 20, fontWeight: '800', color: '#DC2626', marginTop: 12 },
  cancelSub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 6 },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  itemImage: { width: 46, height: 46, borderRadius: 12 },
  itemImagePlaceholder: { backgroundColor: GREEN_LIGHT, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '800', color: '#101828' },
  itemQty: { fontSize: 12, color: '#64748B', marginTop: 2 },
  itemMods: { fontSize: 12, color: GREEN, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: GREEN },

  emptyItems: { alignItems: 'center', paddingVertical: 18 },
  emptyItemsText: { fontSize: 13, color: '#94A3B8', marginTop: 8 },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalRowFinal: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  totalLabel: { fontSize: 14, color: '#64748B' },
  totalValue: { fontSize: 14, color: '#374151', fontWeight: '600' },
  totalLabelBold: { fontSize: 16, fontWeight: '900', color: '#101828' },
  totalValueBold: { fontSize: 16, fontWeight: '900', color: GREEN },

  squareBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  squareBadgeText: { fontSize: 12, color: '#94A3B8' },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: GREEN_LIGHT, padding: 10, borderRadius: 10 },
  pointsBadgeText: { fontSize: 13, fontWeight: '800', color: GREEN },

  reviewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginBottom: 0, backgroundColor: ORANGE, borderRadius: 14, padding: 16 },
  reviewButtonText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  reviewLocked: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginBottom: 0, backgroundColor: '#F3F4F6', borderRadius: 14, padding: 14 },
  reviewLockedText: { color: '#6B7280', fontSize: 13, fontWeight: '700' },
  reviewedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginBottom: 0, backgroundColor: GREEN_LIGHT, borderRadius: 14, padding: 14 },
  reviewedText: { fontSize: 14, color: GREEN, fontWeight: '800' },

  homeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginBottom: 0, borderWidth: 2, borderColor: GREEN, borderRadius: 14, padding: 14 },
  homeButtonText: { color: GREEN, fontWeight: '800', fontSize: 15 },
  backButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: GREEN, borderRadius: 12 },
  backButtonText: { color: '#FFF', fontWeight: '800' },

  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#101828', textAlign: 'center' },
  modalSub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  commentInput: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 14, color: '#101828', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalSkip: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  modalSkipText: { fontWeight: '800', color: '#64748B' },
  modalSubmit: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: ORANGE, alignItems: 'center' },
  modalSubmitText: { fontWeight: '900', color: '#FFF', fontSize: 15 },
});