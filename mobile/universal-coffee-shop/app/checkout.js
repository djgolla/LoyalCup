/**
 * Checkout screen
 * - Square Web Payments SDK via WebView (no native SDK needed)
 * - Loyalty points redemption
 * - Posts order to backend → Square creates order → charges card → awards points
 */
import React, { useState, useEffect, useRef } from 'react';
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

// ─── Square Web Payments HTML ────────────────────────────────────────────────
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
  <button id="pay-button">Tokenize Card</button>
  <div id="status"></div>
  <script>
    let card;
    async function init() {
      if (!window.Square) {
        document.getElementById('status').textContent = 'Square failed to load';
        return;
      }
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

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [globalPoints, setGlobalPoints] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [showPointsPanel, setShowPointsPanel] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        setUser(u);
        const pts = await getGlobalPoints(u.id);
        setGlobalPoints(pts);
      }
    } catch (e) {
      console.error('loadUser:', e);
    }
  };

  // ── derived ────────────────────────────────────────────────────────────────
  const itemsByShop = cart.reduce((acc, item) => {
    const sid = item.shopId;
    if (!acc[sid]) acc[sid] = { shopId: sid, shopName: item.shopName || 'Shop', items: [] };
    acc[sid].items.push(item);
    return acc;
  }, {});

  const subtotal = cart.reduce(
    (sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0
  );
  const tax = subtotal * 0.08;
  const availablePoints = globalPoints?.current_balance || 0;
  const maxRedeemable = Math.min(availablePoints, Math.floor(subtotal * 100));
  const pointsDiscount = pointsToRedeem * 0.01;
  const total = Math.max(0, subtotal + tax - pointsDiscount);

  // ── points ─────────────────────────────────────────────────────────────────
  const handleSelectPoints = (pts) => {
    setPointsToRedeem(Math.min(Math.max(0, pts), maxRedeemable));
  };

  // ── payment flow ───────────────────────────────────────────────────────────
  const handlePay = () => {
    if (cart.length === 0) { Alert.alert('Empty Cart', 'Nothing to order!'); return; }
    if (!SQUARE_APP_ID || !SQUARE_LOCATION_ID) {
      Alert.alert(
        'Setup Required',
        'Set EXPO_PUBLIC_SQUARE_APP_ID and EXPO_PUBLIC_SQUARE_LOCATION_ID in your .env file.'
      );
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
    } catch (e) {
      console.error('WebView message error:', e);
    }
  };

  const processPayment = async (nonce) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Session expired — please log in again');

      // Redeem points first if selected
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

      const result = await apiClient.post(
        '/api/v1/payments/create',
        {
          shop_id: shopId,
          items: orderItems,
          payment_nonce: nonce,
          loyalty_points_redeemed: pointsToRedeem,
        },
        token
      );

      clearCart();
      setPointsToRedeem(0);

      const pointsMsg = pointsToRedeem > 0
        ? `\n💰 Saved $${pointsDiscount.toFixed(2)} with points`
        : '\n⭐ Loyalty points earned!';

      Alert.alert(
        'Order Placed! 🎉',
        `Order #${result.order_id?.slice(0, 8) || '—'}\nTotal charged: $${result.charged?.toFixed(2) || total.toFixed(2)}${pointsMsg}`,
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

  // ─��� empty cart ─────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CHECKOUT</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="shopping-bag" size={72} color="#CCC" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
            <Text style={styles.browseButtonText}>BROWSE SHOPS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── main screen ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CHECKOUT</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}>

        {/* Order items per shop */}
        {Object.values(itemsByShop).map(({ shopId, shopName, items }) => (
          <View key={shopId}>
            <Text style={styles.sectionLabel}>ORDER FROM {shopName.toUpperCase()}</Text>
            <View style={styles.card}>
              {items.map((item, idx) => (
                <View
                  key={`${item.id}-${idx}`}
                  style={[styles.orderItem, idx < items.length - 1 && styles.orderItemBorder]}>
                  <View style={styles.itemLeft}>
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyBadgeText}>{item.quantity || 1}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.customizations?.length > 0 && (
                        <Text style={styles.itemCustom}>
                          {item.customizations.map(c => c.name).join(' · ')}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>
                    ${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}
                  </Text>
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
              <TouchableOpacity
                style={styles.pointsToggle}
                onPress={() => setShowPointsPanel(!showPointsPanel)}
                activeOpacity={0.7}>
                <View style={styles.pointsToggleLeft}>
                  <View style={styles.pointsIcon}>
                    <Feather name="award" size={18} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.pointsToggleTitle}>
                      {pointsToRedeem > 0
                        ? `${pointsToRedeem} pts → -$${pointsDiscount.toFixed(2)}`
                        : 'Redeem Points'}
                    </Text>
                    <Text style={styles.pointsToggleSub}>
                      {availablePoints} pts available
                    </Text>
                  </View>
                </View>
                <Feather name={showPointsPanel ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
              </TouchableOpacity>

              {showPointsPanel && (
                <View style={styles.pointsPanel}>
                  <View style={styles.pointsChips}>
                    {[100, 250, 500, 1000].map(n => {
                      const capped = Math.min(n, maxRedeemable);
                      if (capped <= 0) return null;
                      const active = pointsToRedeem === capped;
                      return (
                        <TouchableOpacity
                          key={n}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => handleSelectPoints(active ? 0 : capped)}>
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {capped} pts
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {maxRedeemable > 0 && (
                      <TouchableOpacity
                        style={[styles.chip, pointsToRedeem === maxRedeemable && styles.chipActive]}
                        onPress={() => handleSelectPoints(pointsToRedeem === maxRedeemable ? 0 : maxRedeemable)}>
                        <Text style={[styles.chipText, pointsToRedeem === maxRedeemable && styles.chipTextActive]}>
                          Max
                        </Text>
                      </TouchableOpacity>
                    )}
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
            <Text style={styles.priceLabel}>Tax (8%)</Text>
            <Text style={styles.priceValue}>${tax.toFixed(2)}</Text>
          </View>
          {pointsToRedeem > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: '#00704A' }]}>
                Points ({pointsToRedeem} pts)
              </Text>
              <Text style={[styles.priceValue, { color: '#00704A' }]}>
                -${pointsDiscount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Loyalty earn note */}
        <View style={styles.infoBox}>
          <Feather name="star" size={15} color="#00704A" />
          <Text style={styles.infoText}>
            You'll earn loyalty points automatically after your payment goes through.
          </Text>
        </View>

        {/* Refund policy */}
        <View style={styles.infoBox}>
          <Feather name="info" size={14} color="#999" />
          <Text style={[styles.infoText, { color: '#999' }]}>
            All sales are final. For refund exceptions contact the shop directly — refunds are processed through their Square account.
          </Text>
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
                <Text style={styles.payButtonText}>PAY ${total.toFixed(2)}</Text>
              </View>
            )
          }
        </TouchableOpacity>
        <Text style={styles.poweredBy}>Secured by Square</Text>
      </View>

      {/* Square card entry modal */}
      <Modal
        visible={showPaymentSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentSheet(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowPaymentSheet(false)}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>ENTER CARD</Text>
              <View style={styles.headerButton} />
            </View>

            {/* Amount row */}
            <View style={styles.modalAmount}>
              <Text style={styles.modalAmountLabel}>Amount due</Text>
              <Text style={styles.modalAmountValue}>${total.toFixed(2)}</Text>
            </View>

            {/* WebView card form */}
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
              <Text style={styles.modalFooterText}>
                Card details are tokenized by Square and never stored on our servers.
              </Text>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  headerButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Anton-Regular' },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 22, fontFamily: 'Anton-Regular', marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 15, color: '#666', marginBottom: 28 },
  browseButton: {
    backgroundColor: '#000', paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 14, borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
  },
  browseButtonText: { color: '#FFF', fontFamily: 'Anton-Regular', fontSize: 15 },

  // Scroll
  scrollView: { flex: 1 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Anton-Regular', color: '#999',
    letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    overflow: 'hidden',
  },

  // Order items
  orderItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  orderItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  qtyBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  qtyBadgeText: { color: '#FFF', fontSize: 13, fontFamily: 'Anton-Regular' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontFamily: 'Anton-Regular', marginBottom: 2 },
  itemCustom: { fontSize: 12, color: '#00704A' },
  itemPrice: { fontSize: 15, fontFamily: 'Anton-Regular' },

  // Points
  pointsToggle: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  pointsToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointsIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#00704A', justifyContent: 'center', alignItems: 'center',
  },
  pointsToggleTitle: { fontSize: 15, fontFamily: 'Anton-Regular' },
  pointsToggleSub: { fontSize: 12, color: '#666', marginTop: 2 },
  pointsPanel: {
    paddingHorizontal: 16, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  pointsChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 14, marginBottom: 12 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 2, borderColor: '#000', backgroundColor: '#F5F5F5',
  },
  chipActive: { backgroundColor: '#000' },
  chipText: { fontSize: 13, fontFamily: 'Anton-Regular', color: '#333' },
  chipTextActive: { color: '#FFF' },
  clearPoints: { fontSize: 13, color: '#FF3B30', fontFamily: 'Anton-Regular' },

  // Pricing
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  priceLabel: { fontSize: 15, color: '#666' },
  priceValue: { fontSize: 15, fontWeight: '600' },
  totalRow: { borderBottomWidth: 0, paddingTop: 16, paddingBottom: 16 },
  totalLabel: { fontSize: 20, fontFamily: 'Anton-Regular' },
  totalValue: { fontSize: 20, fontFamily: 'Anton-Regular' },

  // Info boxes
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#FFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#E8E8E8',
    padding: 14,
  },
  infoText: { flex: 1, fontSize: 13, color: '#00704A', lineHeight: 18 },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', padding: 20, paddingBottom: 30,
    borderTopWidth: 2, borderTopColor: '#000',
  },
  payButton: {
    backgroundColor: '#000', padding: 18, borderRadius: 14,
    borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
  },
  payButtonDisabled: { opacity: 0.5 },
  payButtonInner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  payButtonText: { color: '#FFF', fontFamily: 'Anton-Regular', fontSize: 18 },
  poweredBy: { textAlign: 'center', fontSize: 12, color: '#999', marginTop: 10 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: '#000',
  },
  modalAmount: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  modalAmountLabel: { fontSize: 15, color: '#666' },
  modalAmountValue: { fontSize: 24, fontFamily: 'Anton-Regular' },
  webView: { flex: 1, backgroundColor: '#FFF' },
  modalFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  modalFooterText: { flex: 1, fontSize: 12, color: '#999', lineHeight: 17 },
});