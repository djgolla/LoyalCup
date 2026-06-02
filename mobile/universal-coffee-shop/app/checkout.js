/**
 * Checkout — pulls dynamic redemption config + smart chips + custom stepper
 * from /api/v1/loyalty/balance/:shopId. No more hardcoded 100pts=$1.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, Modal, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import WebView from 'react-native-webview';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { apiClient } from '../services/apiClient';
import { getBalanceForShop, previewRedeem } from '../services/loyaltyService';

const SQUARE_APP_ID = process.env.EXPO_PUBLIC_SQUARE_APP_ID || '';

const getSquareHTML = (appId, locationId) => {
  const env    = process.env.EXPO_PUBLIC_SQUARE_ENV || 'sandbox';
  const sdkUrl = env === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js';

  return `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <script src="${sdkUrl}"></script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,sans-serif;background:#fff;padding:20px}
    #card-container{margin-bottom:8px;min-height:90px}
    #pay-button{width:100%;padding:16px;background:#000;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:12px}
    #pay-button:disabled{opacity:.5;cursor:not-allowed}
    #status{margin-top:10px;font-size:13px;color:#666;text-align:center;min-height:18px}
    .error{color:#e53e3e!important}
  </style>
</head><body>
  <div id="card-container"></div>
  <button id="pay-button" disabled>Loading...</button>
  <div id="status"></div>
  <script>
    let card;
    async function init() {
      if (!window.Square) {
        document.getElementById('status').textContent='Square failed to load.';
        document.getElementById('status').className='error';
        return;
      }
      try {
        const payments = window.Square.payments('${appId}', '${locationId}');
        card = await payments.card();
        await card.attach('#card-container');
        document.getElementById('pay-button').textContent='Confirm Payment';
        document.getElementById('pay-button').disabled=false;
      } catch(e) {
        document.getElementById('status').textContent='Card form error: '+e.message;
        document.getElementById('status').className='error';
      }
    }
    document.getElementById('pay-button').addEventListener('click', async () => {
      const btn=document.getElementById('pay-button');
      const status=document.getElementById('status');
      if(!card){status.textContent='Card form not ready.';return;}
      btn.disabled=true;status.textContent='Processing...';status.className='';
      try{
        const r=await card.tokenize();
        if(r.status==='OK'){window.ReactNativeWebView.postMessage(JSON.stringify({type:'nonce',nonce:r.token}));}
        else{status.textContent=(r.errors||[]).map(e=>e.message).join(', ')||'Tokenization failed';status.className='error';btn.disabled=false;}
      }catch(e){status.textContent=e.message||'Error tokenizing card';status.className='error';btn.disabled=false;}
    });
    init();
  </script>
</body></html>`;
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, clearCart } = useCart();

  const [loading,          setLoading]          = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [shopLocationId,   setShopLocationId]   = useState(null);
  const [locationLoading,  setLocationLoading]  = useState(false);

  // Loyalty state — driven entirely by backend
  const [loyaltyBalance, setLoyaltyBalance] = useState(null);   // { current_balance, config, points_type }
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [preview,        setPreview]        = useState(null);   // last server-validated dry-run
  const [showPointsPanel, setShowPointsPanel] = useState(false);

  const itemsByShop = cart.reduce((acc, item) => {
    const sid = item.shopId;
    if (!acc[sid]) acc[sid] = { shopId: sid, shopName: item.shopName || 'Shop', items: [] };
    acc[sid].items.push(item);
    return acc;
  }, {});

  const subtotal       = cart.reduce((s, i) => s + (parseFloat(i.price) || 0) * (i.quantity || 1), 0);
  const subtotalCents  = Math.round(subtotal * 100);
  const estimatedTax   = subtotal * 0.0875;
  const pointsDiscount = (preview?.applied_points && preview?.valid) ? (preview.discount_cents / 100) : 0;
  const estimatedTotal = Math.max(0, subtotal + estimatedTax - pointsDiscount);

  const activeShopId = cart.length > 0 ? Object.keys(itemsByShop)[0] : null;

  // ── Load shop's Square location
  useEffect(() => {
    if (!activeShopId) { setShopLocationId(null); return; }
    setLocationLoading(true);
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const res = await apiClient.get(`/api/v1/pos/status?provider=square&shop_id=${activeShopId}`, token);
        if (res?.location_id) setShopLocationId(res.location_id);
      } catch (e) {
        console.warn('[Checkout] location load:', e.message);
      } finally {
        setLocationLoading(false);
      }
    })();
  }, [activeShopId]);

  // ── Load loyalty balance + config for the shop
  useEffect(() => {
    if (!activeShopId) { setLoyaltyBalance(null); return; }
    (async () => {
      try {
        const b = await getBalanceForShop(activeShopId);
        setLoyaltyBalance(b);
      } catch (e) {
        console.warn('[Checkout] loyalty balance:', e.message);
        setLoyaltyBalance(null);
      }
    })();
  }, [activeShopId]);

  // ── Ask backend to validate + price the redemption every time it changes
  useEffect(() => {
    if (!activeShopId || subtotalCents <= 0) { setPreview(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const p = await previewRedeem({
          shopId:          activeShopId,
          subtotalCents,
          requestedPoints: pointsToRedeem,
        });
        if (!cancelled) setPreview(p);
      } catch (e) {
        if (!cancelled) setPreview(null);
      }
    })();
    return () => { cancelled = true; };
  }, [activeShopId, subtotalCents, pointsToRedeem]);

  const cfg            = loyaltyBalance?.config;
  const balance        = loyaltyBalance?.current_balance || 0;
  const step           = preview?.step_points || cfg?.min_redemption_points || 0;
  const maxRedeemable  = preview?.max_redeemable_points || 0;
  const chips          = preview?.suggested_chips_points || [];
  const pointValueCents = preview?.point_value_cents || (cfg ? cfg.points_to_dollar_value * 100 : 1);
  const canRedeem      = balance >= (cfg?.min_redemption_points || 0) && maxRedeemable >= step;

  const handlePay = () => {
    if (cart.length === 0) { Alert.alert('Empty Cart', 'Nothing to order!'); return; }
    if (!SQUARE_APP_ID)    { Alert.alert('Setup Required', 'Square App ID not configured.'); return; }
    if (!shopLocationId)   { Alert.alert('Shop Not Ready', "This shop hasn't finished setting up payments."); return; }
    if (pointsToRedeem > 0 && preview && !preview.valid) {
      Alert.alert('Redemption invalid', preview.reason || 'Please adjust your points.');
      return;
    }
    setShowPaymentSheet(true);
  };

  const handleWebViewMessage = async (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type !== 'nonce') return;
      setShowPaymentSheet(false);
      // PATCH: Only call processPayment if nonce is present & non-blank
      if (!msg.nonce || !msg.nonce.trim()) {
        Alert.alert(
          "Payment Error",
          "Card was not entered or tokenization failed. Please try again."
        );
        return;
      }
      await processPayment(msg.nonce);
    } catch (e) { console.error('WebView message error:', e); }
  };

  const processPayment = async (nonce) => {
    setLoading(true);
    try {
      // PATCH: Nonce check, alert user if missing/blank
      if (!nonce || !nonce.trim()) {
        setLoading(false);
        Alert.alert(
          "Card Not Processed",
          "Something went wrong, please enter your card details."
        );
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Session expired — please log in again');

      const { shopId, items } = Object.values(itemsByShop)[0];
      const orderItems = items.map(item => ({
        menu_item_id:   item.id?.includes(':') ? item.id.split(':')[1] : item.id,
        quantity:       Math.max(1, item.quantity || 1),
        unit_price:     parseFloat(item.price) || 0,
        base_price:     parseFloat(item.price) || 0,
        customizations: item.customizations || [],
      }));

      const result = await apiClient.post('/api/v1/payments/create', {
        shop_id:                  shopId,
        items:                    orderItems,
        payment_nonce:            nonce,
        loyalty_points_to_redeem: pointsToRedeem,
        customer_note:            null,
      }, token);

      clearCart();
      setPointsToRedeem(0);

      const orderId   = result.order_id;
      const charged   = result.charged ?? estimatedTotal;
      const pointsMsg = pointsToRedeem > 0
        ? `\n💰 Saved $${pointsDiscount.toFixed(2)} with points`
        : `\n⭐ Earned ${result.points_earned || 0} loyalty pts`;

      Alert.alert(
        'Order Placed! 🎉',
        `Order #${orderId?.slice(0, 8) || '—'}\nCharged: $${charged.toFixed(2)}${pointsMsg}\n\nYour barista has been notified.`,
        [
          { text: 'Track Order', onPress: () => router.push(`/order/${orderId}`) },
          { text: 'Done',        onPress: () => router.push('/home') },
        ]
      );
    } catch (e) {
      Alert.alert('Payment Failed', e.message || 'Your card was not charged. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top','bottom']}>
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
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/home')}>
            <Text style={styles.browseButtonText}>Browse Shops</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const dec = () => setPointsToRedeem(p => Math.max(0, p - step));
  const inc = () => setPointsToRedeem(p => Math.min(maxRedeemable, p + step));

  return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
        {Object.values(itemsByShop).map(({ shopId, shopName, items }) => (
          <View key={shopId}>
            <Text style={styles.sectionLabel}>ORDER FROM {shopName.toUpperCase()}</Text>
            <View style={styles.card}>
              {items.map((item, idx) => (
                <View key={item.cartKey || `${item.id}-${idx}`}
                  style={[styles.orderItem, idx < items.length - 1 && styles.orderItemBorder]}>
                  <View style={styles.itemLeft}>
                    <View style={styles.qtyBadge}><Text style={styles.qtyBadgeText}>{item.quantity || 1}</Text></View>
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

        {/* ── Loyalty panel ─────────────────────────────────────────── */}
        {loyaltyBalance && balance > 0 && (
          <>
            <Text style={styles.sectionLabel}>LOYALTY POINTS</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.pointsToggle} onPress={() => setShowPointsPanel(s => !s)} activeOpacity={0.7}>
                <View style={styles.pointsToggleLeft}>
                  <View style={styles.pointsIcon}><Feather name="award" size={18} color="#fff" /></View>
                  <View>
                    <Text style={styles.pointsToggleTitle}>
                      {pointsToRedeem > 0 ? `${pointsToRedeem} pts → −$${pointsDiscount.toFixed(2)}` : 'Redeem Points'}
                    </Text>
                    <Text style={styles.pointsToggleSub}>
                      {balance.toLocaleString()} pts available · {(itemsByShop[activeShopId]?.shopName) || 'Shop'} rewards
                    </Text>
                  </View>
                </View>
                <Feather name={showPointsPanel ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
              </TouchableOpacity>

              {showPointsPanel && (
                <View style={styles.pointsPanel}>
                  {!canRedeem ? (
                    <Text style={styles.lockedText}>
                      You need {cfg?.min_redemption_points || 0} pts to redeem. Keep ordering to unlock!
                    </Text>
                  ) : (
                    <>
                      <View style={styles.pointsChips}>
                        {chips.map((n, i) => {
                          const active = pointsToRedeem === n;
                          const isMax  = n === maxRedeemable;
                          return (
                            <TouchableOpacity key={i} style={[styles.chip, active && styles.chipActive]}
                              onPress={() => setPointsToRedeem(prev => prev === n ? 0 : n)}>
                              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                {isMax && chips.length > 1 ? `Max (${n})` : `${n} pts`}
                              </Text>
                              <Text style={[styles.chipSub, active && styles.chipSubActive]}>
                                −${(n * pointValueCents / 100).toFixed(2)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={styles.stepperLabel}>Custom · steps of {step} pts</Text>
                      <View style={styles.stepperRow}>
                        <TouchableOpacity style={[styles.stepperBtn, pointsToRedeem <= 0 && styles.stepperBtnDis]} onPress={dec} disabled={pointsToRedeem <= 0}>
                          <Feather name="minus" size={18} color="#000" />
                        </TouchableOpacity>
                        <View style={styles.stepperValue}>
                          <Text style={styles.stepperPts}>{pointsToRedeem} pts</Text>
                          <Text style={styles.stepperUsd}>−${(pointsToRedeem * pointValueCents / 100).toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity style={[styles.stepperBtn, pointsToRedeem >= maxRedeemable && styles.stepperBtnDis]} onPress={inc} disabled={pointsToRedeem >= maxRedeemable}>
                          <Feather name="plus" size={18} color="#000" />
                        </TouchableOpacity>
                      </View>

                      {pointsToRedeem > 0 && (
                        <TouchableOpacity onPress={() => setPointsToRedeem(0)}>
                          <Text style={styles.clearPoints}>Clear redemption</Text>
                        </TouchableOpacity>
                      )}
                      {preview && !preview.valid && pointsToRedeem > 0 && (
                        <Text style={styles.invalidText}>{preview.reason}</Text>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>SUMMARY</Text>
        <View style={styles.card}>
          <View style={styles.priceRow}><Text style={styles.priceLabel}>Subtotal</Text><Text style={styles.priceValue}>${subtotal.toFixed(2)}</Text></View>
          <View style={styles.priceRow}>
            <View style={styles.taxLabelRow}><Text style={styles.priceLabel}>Tax</Text><View style={styles.estBadge}><Text style={styles.estBadgeText}>est.</Text></View></View>
            <Text style={styles.priceValue}>${estimatedTax.toFixed(2)}</Text>
          </View>
          {pointsDiscount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: '#00704A' }]}>Points ({pointsToRedeem})</Text>
              <Text style={[styles.priceValue, { color: '#00704A' }]}>−${pointsDiscount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalValue}>${estimatedTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.taxNote}>
            <Feather name="info" size={12} color="#999" />
            <Text style={styles.taxNoteText}>Final total calculated by Square at payment time</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Feather name="star" size={14} color="#00704A" />
          <Text style={styles.infoText}>
            {cfg ? `Earn ${cfg.points_per_dollar} pts per $1${cfg.bonus_active ? ` (${cfg.bonus_multiplier}× bonus active!)` : ''}` : 'Earn loyalty points on this order.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, (loading || locationLoading) && styles.payButtonDisabled]}
          onPress={handlePay} disabled={loading || locationLoading} activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#FFF" /> :
            locationLoading ? (
              <View style={styles.payButtonInner}>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.payButtonText}>Loading...</Text>
              </View>
            ) : (
              <View style={styles.payButtonInner}>
                <Feather name="lock" size={18} color="#FFF" />
                <Text style={styles.payButtonText}>Pay ~${estimatedTotal.toFixed(2)}</Text>
              </View>
            )
          }
        </TouchableOpacity>
        <Text style={styles.poweredBy}>Secured by Square · Powered by LoyalCup</Text>
      </View>

      <Modal visible={showPaymentSheet} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPaymentSheet(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modalContainer} edges={['top','bottom']}>
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
              source={{ html: getSquareHTML(SQUARE_APP_ID, shopLocationId || ''), baseUrl: 'https://loyalcupapp.com' }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled domStorageEnabled
              mixedContentMode="never"
              setSupportMultipleWindows={false}
              keyboardDisplayRequiresUserAction={false}
              scrollEnabled={false}
            />
            <View style={styles.modalFooter}>
              <Feather name="lock" size={13} color="#999" />
              <Text style={styles.modalFooterText}>Tokenized by Square. We never see or store your card number.</Text>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#FAFAFA' },
  header:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerButton:        { width: 40, height: 40, justifyContent: 'center' },
  headerTitle:         { fontSize: 20, fontWeight: '700', color: '#000' },
  emptyContainer:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle:          { fontSize: 22, fontWeight: '700', color: '#000', marginTop: 16, marginBottom: 6 },
  browseButton:        { backgroundColor: '#000', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14 },
  browseButtonText:    { color: '#FFF', fontWeight: '700', fontSize: 15 },
  scrollView:          { flex: 1 },
  sectionLabel:        { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginHorizontal: 16 },
  card:                { backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
  orderItem:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  orderItemBorder:     { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  itemLeft:            { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  qtyBadge:            { width: 28, height: 28, borderRadius: 14, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  qtyBadgeText:        { color: '#FFF', fontSize: 13, fontWeight: '700' },
  itemInfo:            { flex: 1 },
  itemName:            { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 2 },
  itemCustom:          { fontSize: 12, color: '#00704A' },
  itemPrice:           { fontSize: 15, fontWeight: '600', color: '#000' },
  pointsToggle:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  pointsToggleLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pointsIcon:          { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00704A', justifyContent: 'center', alignItems: 'center' },
  pointsToggleTitle:   { fontSize: 15, fontWeight: '600', color: '#000' },
  pointsToggleSub:     { fontSize: 12, color: '#666', marginTop: 2 },
  pointsPanel:         { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  lockedText:          { fontSize: 13, color: '#999', textAlign: 'center', paddingVertical: 16 },
  pointsChips:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 14, marginBottom: 12 },
  chip:                { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', backgroundColor: '#FAFAFA', alignItems: 'center', minWidth: 78 },
  chipActive:          { backgroundColor: '#000', borderColor: '#000' },
  chipText:            { fontSize: 13, fontWeight: '600', color: '#000' },
  chipTextActive:      { color: '#FFF' },
  chipSub:             { fontSize: 11, color: '#999', marginTop: 2 },
  chipSubActive:       { color: '#AAA' },
  stepperLabel:        { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1, marginTop: 4, marginBottom: 8 },
  stepperRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  stepperBtn:          { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  stepperBtnDis:       { opacity: 0.4 },
  stepperValue:        { flex: 1, alignItems: 'center' },
  stepperPts:          { fontSize: 18, fontWeight: '800', color: '#000' },
  stepperUsd:          { fontSize: 13, color: '#00704A', fontWeight: '600', marginTop: 2 },
  invalidText:         { fontSize: 12, color: '#FF3B30', textAlign: 'center', marginTop: 4 },
  clearPoints:         { fontSize: 13, fontWeight: '600', color: '#FF3B30', textAlign: 'center', marginTop: 6 },
  priceRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  taxLabelRow:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  estBadge:            { backgroundColor: '#F0F0F0', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  estBadgeText:        { fontSize: 10, fontWeight: '600', color: '#999' },
  priceLabel:          { fontSize: 15, color: '#666' },
  priceValue:          { fontSize: 15, fontWeight: '600', color: '#000' },
  totalRow:            { borderBottomWidth: 0, paddingTop: 14, paddingBottom: 8 },
  totalLabel:          { fontSize: 17, fontWeight: '700', color: '#000' },
  totalValue:          { fontSize: 17, fontWeight: '700', color: '#000' },
  taxNote:             { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 14 },
  taxNoteText:         { fontSize: 12, color: '#999', flex: 1 },
  infoBox:             { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', padding: 12 },
  infoText:            { flex: 1, fontSize: 13, color: '#00704A', lineHeight: 18 },
  footer:              { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  payButton:           { backgroundColor: '#000', padding: 18, borderRadius: 14 },
  payButtonDisabled:   { opacity: 0.5 },
  payButtonInner:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  payButtonText:       { color: '#FFF', fontWeight: '700', fontSize: 18 },
  poweredBy:           { textAlign: 'center', fontSize: 12, color: '#999', marginTop: 10 },
  modalContainer:      { flex: 1, backgroundColor: '#FFF' },
  modalHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalAmount:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#FAFAFA' },
  modalAmountLabel:    { fontSize: 15, color: '#666' },
  modalAmountValue:    { fontSize: 24, fontWeight: '700', color: '#000' },
  webView:             { flex: 1, backgroundColor: '#FFF' },
  modalFooter:         { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  modalFooterText:     { flex: 1, fontSize: 12, color: '#999', lineHeight: 17 },
});