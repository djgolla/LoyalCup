/**
 * Checkout screen
 * - Square Web Payments SDK via WebView
 * - Loyalty points redemption
 * - Posts order to backend → Square creates order → charges card → awards points
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Modal,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import WebView from 'react-native-webview';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { getGlobalPoints, redeemPoints } from '../services/loyaltyService';
import { apiClient } from '../services/apiClient';

const SQUARE_APP_ID = process.env.EXPO_PUBLIC_SQUARE_APP_ID || '';
const SQUARE_LOCATION_ID = process.env.EXPO_PUBLIC_SQUARE_LOCATION_ID || '';

const getSquareHTML = (appId, locationId) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #fff; padding: 20px; }
    #card-container { margin-bottom: 8px; }
    #pay-button {
      width: 100%; padding: 16px; background: #000; color: #fff;
      border: none; border-radius: 12px; font-size: 16px; font-weight: 700;
      cursor: pointer; margin-top: 12px;
    }
    #pay-button:disabled { opacity: 0.5; }
    #status { margin-top: 10px; font-size: 13px; color: #666; text-align: center; }
    .error { color: #e53e3e !important; }
  </style>
</head>
<body>
  <div id="card-container"></div>
  <button id="pay-button">Confirm Payment</button>
  <div id="status"></div>
  <script>
    let card;
    async function init() {
      if (!window.Square) { document.getElementById('status').textContent = 'Square failed to load'; return; }
      try {
        const payments = window.Square.payments('${appId}', '${locationId}');
        card = await payments.card();
        await card.attach('#card-container');
        document.getElementById('status').textContent = '';
      } catch(e) {
        document.getElementById('status').textContent = 'Card form error: ' + e.message;
        document.getElementById('status').className = 'error';
      }
    }
    document.getElementById('pay-button').addEventListener('click', async () => {
      const btn = document.getElementById('pay-button');
      const status = document.getElementById('status');
      btn.disabled = true;
      status.textContent = 'Processing...';
      status.className = '';
      try {
        const result = await card.tokenize();
        if (result.status === 'OK') {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'nonce', nonce: result.token }));
        } else {
          const errs = result.errors?.map(e => e.message).join(', ') || 'Tokenization failed';
          status.textContent = errs;
          status.className = 'error';
          btn.disabled = false;
        }
      } catch(e) {
        status.textContent = e.message || 'Error';
        status.className = 'error';
        btn.disabled = false;
      }
    });
    init();
  </script>
</body>
</html>
`;

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [globalPoints, setGlobalPoints] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [showPointsPanel, setShowPointsPanel] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        setUser(u);
        const pts = await getGlobalPoints(u.id);
        setGlobalPoints(pts);
      }
    } catch (e) { console.error('loadUser:', e); }
  };

  // ── derived ──────────────────────────────────────────────────────────────────
  const itemsByShop = cart.reduce((acc, item) => {
    const sid = item.shopId;
    if (!acc[sid]) acc[sid] = { shopId: sid, shopName: item.shopName || 'Shop', items: [] };
    acc[sid].items.push(item);
    return acc;
  }, {});

  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0);
  const estimatedTax = subtotal * 0.08;
  const availablePoints = globalPoints?.current_balance || 0;
  const maxRedeemable = Math.min(availablePoints, Math.floor(subtotal * 100));
  const pointsDiscount = pointsToRedeem * 0.01;
  const estimatedTotal = Math.max(0, subtotal + estimatedTax - pointsDiscount);

  // Smart points chips — based on actual balance, not hardcoded amounts
  const getPointsChips = () => {
    if (maxRedeemable <= 0) return [];
    const chips = [];
    const increments = [
      Math.floor(maxRedeemable * 0.25),
      Math.floor(maxRedeemable * 0.5),
      Math.floor(maxRedeemable * 0.75),
    ].filter(v => v > 0);

    // deduplicate and add max
    const seen = new Set();
    for (const v of increments) {
      if (!seen.has(v) && v < maxRedeemable) {
        seen.add(v);
        chips.push(v);
      }
    }
    chips.push(maxRedeemable); // always show max
    return chips;
  };

  const handleSelectPoints = (pts) => {
    setPointsToRedeem(prev => prev === pts ? 0 : Math.min(pts, maxRedeemable));
  };

  const handlePay = () => {
    if (cart.length === 0) { Alert.alert('Empty Cart', 'Nothing to order!'); return; }
    if (!SQUARE_APP_ID || !SQUARE_LOCATION_ID) {
      Alert.alert('Setup Required', 'Square credentials not configured.');
      return;
    }
    setShowPaymentSheet(true);
  };

  const handleWebViewMessage = async (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type !== 'nonce') return;
      setShowPaymentSheet(false);
      await processPayment(msg.nonce);
    } catch (e) { console.error('WebView message error:', e); }
  };

  const processPayment = async (nonce) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Session expired — please log in again');

      if (pointsToRedeem > 0 && user) {
        const redeemResult = await redeemPoints(user.id, Object.keys(itemsByShop)[0], pointsToRedeem, 'global');
        if (!redeemResult.success) throw new Error('Failed to redeem points — please try again');
      }

      const { shopId, items } = Object.values(itemsByShop)[0];
      const orderItems = items.map(item => ({
        menu_item_id: item.id.includes(':') ? item.id.split(':')[1] : item.id,
        quantity: item.quantity || 1,
        base_price: parseFloat(item.price) || 0,
        customizations: item.customizations || [],
      }));

      const result = await apiClient.post('/api/v1/payments/create', {
        shop_id: shopId,
        items: orderItems,
        payment_nonce: nonce,
        loyalty_points_redeemed: pointsToRedeem,
      }, token);

      clearCart();
      setPointsToRedeem(0);

      const pointsMsg = pointsToRedeem > 0
        ? `\n💰 Saved $${pointsDiscount.toFixed(2)} with points`
        : '\n⭐ Loyalty points earned!';

      Alert.alert(
        'Order Placed! 🎉',
        `Order #${result.order_id?.slice(0, 8) || '—'}\nTotal charged: $${result.charged?.toFixed(2) || estimatedTotal.toFixed(2)}${pointsMsg}`,
        [
          { text: 'Track Order', onPress: () => router.push(`/order/${result.order_id}`) },
          { text: 'Done', onPress: () => router.push('/home') },
        ]
      );
    } catch (e) {
      console.error('Payment error:', e);
      Alert.alert('Payment Failed', e.message || 'Your card was not charged. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── empty cart ───────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="shopping-bag" size={72} color="#CCC" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
            <Text style={styles.browseButtonText}>Browse Shops</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const pointsChips = getPointsChips();

  // ── main screen ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 200 }} showsVerticalScrollIndicator={false}>

        {/* Order items per shop */}
        {Object.values(itemsByShop).map(({ shopId, shopName, items }) => (
          <View key={shopId}>
            <Text style={styles.sectionLabel}>ORDER FROM {shopName.toUpperCase()}</Text>
            <View style={styles.card}>
              {items.map((item, idx) => (
                <View key={item.cartKey || `${item.id}-${idx}`} style={[styles.orderItem, idx < items.length - 1 && styles.orderItemBorder]}>
                  <View style={styles.itemLeft}>
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyBadgeText}>{item.quantity || 1}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.customizations?.length > 0 && (
                        <Text style={styles.itemCustom}>{item.customizations.map(c => c.name).join(' · ')}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Points redemption */}
        {availablePoints > 0 && (
          <>
            <Text style={styles.sectionLabel}>LOYALTY POINTS</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.pointsToggle} onPress={() => setShowPointsPanel(!showPointsPanel)} activeOpacity={0.7}>
                <View style={styles.pointsToggleLeft}>
                  <View style={styles.pointsIcon}>
                    <Feather name="award" size={18} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.pointsToggleTitle}>
                      {pointsToRedeem > 0 ? `${pointsToRedeem} pts → -$${pointsDiscount.toFixed(2)}` : 'Redeem Points'}
                    </Text>
                    <Text style={styles.pointsToggleSub}>{availablePoints} pts available</Text>
                  </View>
                </View>
                <Feather name={showPointsPanel ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
              </TouchableOpacity>

              {showPointsPanel && (
                <View style={styles.pointsPanel}>
                  <View style={styles.pointsChips}>
                    {pointsChips.map((n, i) => {
                      const isMax = n === maxRedeemable;
                      const active = pointsToRedeem === n;
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => handleSelectPoints(n)}>
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {isMax && pointsChips.length > 1 ? `Max (${n})` : `${n} pts`}
                          </Text>
                          <Text style={[styles.chipSub, active && styles.chipSubActive]}>
                            -${(n * 0.01).toFixed(2)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {pointsToRedeem > 0 && (
                    <TouchableOpacity onPress={() => setPointsToRedeem(0)}>
                      <Text style={styles.clearPoints}>Clear redemption</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </>
        )}

        {/* Price summary */}
        <Text style={styles.sectionLabel}>SUMMARY</Text>
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <View style={styles.taxLabelRow}>
              <Text style={styles.priceLabel}>Tax</Text>
              <View style={styles.estBadge}>
                <Text style={styles.estBadgeText}>est.</Text>
              </View>
            </View>
            <Text style={styles.priceValue}>${estimatedTax.toFixed(2)}</Text>
          </View>
          {pointsToRedeem > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: '#00704A' }]}>Points ({pointsToRedeem} pts)</Text>
              <Text style={[styles.priceValue, { color: '#00704A' }]}>-${pointsDiscount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalValue}>${estimatedTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.taxNote}>
            <Feather name="info" size={12} color="#999" />
            <Text style={styles.taxNoteText}>Final tax calculated live when you proceed to payment</Text>
          </View>
        </View>

        {/* Points earn note */}
        <View style={styles.infoBox}>
          <Feather name="star" size={14} color="#00704A" />
          <Text style={styles.infoText}>You'll earn loyalty points automatically after your payment goes through.</Text>
        </View>

        {/* Refund policy */}
        <View style={[styles.infoBox, { marginTop: 8 }]}>
          <Feather name="info" size={14} color="#999" />
          <Text style={[styles.infoText, { color: '#999' }]}>All sales are final. For refund exceptions contact the shop directly.</Text>
        </View>

      </ScrollView>

      {/* Pay button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={loading}
          activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#FFF" />
            : (
              <View style={styles.payButtonInner}>
                <Feather name="lock" size={18} color="#FFF" />
                <Text style={styles.payButtonText}>Pay ~${estimatedTotal.toFixed(2)}</Text>
              </View>
            )
          }
        </TouchableOpacity>
        <Text style={styles.poweredBy}>Secured by Square</Text>
      </View>

      {/* Square card entry modal */}
      <Modal visible={showPaymentSheet} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPaymentSheet(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.headerButton} onPress={() => setShowPaymentSheet(false)}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Enter Card</Text>
              <View style={styles.headerButton} />
            </View>
            <View style={styles.modalAmount}>
              <Text style={styles.modalAmountLabel}>Amount due</Text>
              <Text style={styles.modalAmountValue}>${estimatedTotal.toFixed(2)}</Text>
            </View>
            <WebView
              style={styles.webView}
              originWhitelist={['*']}
              source={{ html: getSquareHTML(SQUARE_APP_ID, SQUARE_LOCATION_ID) }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              domStorageEnabled
              keyboardDisplayRequiresUserAction={false}
              scrollEnabled={false}
            />
            <View style={styles.modalFooter}>
              <Feather name="lock" size={13} color="#999" />
              <Text style={styles.modalFooterText}>Card details are tokenized by Square and never stored on our servers.</Text>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#000', marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 15, color: '#666', marginBottom: 28 },
  browseButton: { backgroundColor: '#000', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14 },
  browseButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // Scroll
  scrollView: { flex: 1 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginHorizontal: 16 },
  card: { backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },

  // Order items
  orderItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  orderItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  qtyBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  qtyBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 2 },
  itemCustom: { fontSize: 12, color: '#00704A' },
  itemPrice: { fontSize: 15, fontWeight: '600', color: '#000' },

  // Points
  pointsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  pointsToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointsIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00704A', justifyContent: 'center', alignItems: 'center' },
  pointsToggleTitle: { fontSize: 15, fontWeight: '600', color: '#000' },
  pointsToggleSub: { fontSize: 12, color: '#666', marginTop: 2 },
  pointsPanel: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  pointsChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 14, marginBottom: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', backgroundColor: '#FAFAFA', alignItems: 'center' },
  chipActive: { backgroundColor: '#000', borderColor: '#000' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#000' },
  chipTextActive: { color: '#FFF' },
  chipSub: { fontSize: 11, color: '#999', marginTop: 2 },
  chipSubActive: { color: '#AAA' },
  clearPoints: { fontSize: 13, fontWeight: '600', color: '#FF3B30' },

  // Pricing
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  taxLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  estBadge: { backgroundColor: '#F0F0F0', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  estBadgeText: { fontSize: 10, fontWeight: '600', color: '#999' },
  priceLabel: { fontSize: 15, color: '#666' },
  priceValue: { fontSize: 15, fontWeight: '600', color: '#000' },
  totalRow: { borderBottomWidth: 0, paddingTop: 14, paddingBottom: 8 },
  totalLabel: { fontSize: 17, fontWeight: '700', color: '#000' },
  totalValue: { fontSize: 17, fontWeight: '700', color: '#000' },
  taxNote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 14 },
  taxNoteText: { fontSize: 12, color: '#999', flex: 1 },

  // Info boxes
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', padding: 14 },
  infoText: { flex: 1, fontSize: 13, color: '#00704A', lineHeight: 18 },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  payButton: { backgroundColor: '#000', padding: 18, borderRadius: 14 },
  payButtonDisabled: { opacity: 0.5 },
  payButtonInner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  payButtonText: { color: '#FFF', fontWeight: '700', fontSize: 18 },
  poweredBy: { textAlign: 'center', fontSize: 12, color: '#999', marginTop: 10 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalAmount: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalAmountLabel: { fontSize: 15, color: '#666' },
  modalAmountValue: { fontSize: 24, fontWeight: '700', color: '#000' },
  webView: { flex: 1, backgroundColor: '#FFF' },
  modalFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  modalFooterText: { flex: 1, fontSize: 12, color: '#999', lineHeight: 17 },
});