/**
 * Order History screen
 * - Recent orders pinned at top (sent to the shop — pick up soon)
 * - Past orders below
 * - Tap any order → confirmation screen
 * - Reorder CTA on past orders
 *
 * There is no live status tracking. Orders go straight to the shop's Square POS
 * and the customer is shown an ETA based on the shop's average prep time.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

// ── Helpers ──────────────────────────────────────────────────────────────────

// "Active" = just placed (still relevant for pickup). Past = done/cancelled.
const ACTIVE_STATUSES    = ['confirmed', 'pending'];
const COMPLETED_STATUSES = ['completed', 'cancelled'];

const shortId   = (id) => id?.slice(0, 8)?.toUpperCase() || '—';
const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now  = new Date();
  const days = Math.floor((now - date) / 86400000);
  if (days === 0) return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (days === 1) return 'Yesterday';
  if (days <  7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeItems = (order) =>
  (order.order_items || []).map(oi => ({
    name:       oi.menu_items?.name || 'Item',
    image_url:  oi.menu_items?.image_url,
    quantity:   oi.quantity || 1,
    unit_price: oi.unit_price || 0,
    id:         oi.menu_item_id,
    customizations: oi.customizations || [],
  }));

// ── Order Card ───────────────────────────────────────────────────────────────

const OrderCard = ({ order, onPress, onReorder, isActive }) => {
  const items     = normalizeItems(order);
  const shopName  = order.shops?.name || 'Shop';
  const shopLogo  = order.shops?.logo_url;
  const prep      = order.shops?.avg_prep_time_minutes || 10;
  const isCancelled = order.status === 'cancelled';

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* ETA banner for active orders */}
      {isActive && (
        <View style={styles.etaBanner}>
          <Text style={styles.etaBannerText}>☕ Ready in about {prep} min — head over and pick it up!</Text>
        </View>
      )}

      {/* Shop row */}
      <View style={styles.shopRow}>
        {shopLogo
          ? <Image source={{ uri: shopLogo }} style={styles.shopLogo} />
          : <View style={styles.shopLogoPlaceholder}><Feather name="coffee" size={13} color="#00704A" /></View>
        }
        <Text style={styles.shopName} numberOfLines={1}>{shopName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: isCancelled ? '#fef2f2' : isActive ? '#fffbeb' : '#f9fafb' }]}>
          <Text style={[styles.statusText, { color: isCancelled ? '#dc2626' : isActive ? '#d97706' : '#6b7280' }]}>
            {isCancelled ? 'Cancelled' : isActive ? 'Placed' : 'Completed'}
          </Text>
        </View>
      </View>

      {/* Date + ID */}
      <View style={styles.metaRow}>
        <Text style={styles.dateText}>{formatDate(order.created_at)}</Text>
        <Text style={styles.idText}>#{shortId(order.id)}</Text>
      </View>

      {/* Items preview */}
      {items.length > 0 && (
        <View style={styles.itemsPreview}>
          {items.slice(0, 3).map((item, i) => (
            <Text key={i} style={styles.itemLine} numberOfLines={1}>
              {item.quantity}× {item.name}
              {item.customizations?.length > 0 && (
                <Text style={styles.itemMods}> · {item.customizations.map(c => c.name || c).join(', ')}</Text>
              )}
            </Text>
          ))}
          {items.length > 3 && <Text style={styles.moreItems}>+{items.length - 3} more</Text>}
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.totalText}>${parseFloat(order.total || 0).toFixed(2)}</Text>
        <View style={styles.cardFooterRight}>
          {!isActive && order.status === 'completed' && (
            <TouchableOpacity style={styles.reorderBtn} onPress={() => onReorder(order)}>
              <Feather name="refresh-cw" size={13} color="#00704A" />
              <Text style={styles.reorderBtnText}>Reorder</Text>
            </TouchableOpacity>
          )}
          <Feather name="chevron-right" size={18} color="#CCC" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { addItem } = useCart();

  const [activeOrders, setActiveOrders] = useState([]);
  const [pastOrders,   setPastOrders]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, status, total, subtotal, created_at, shop_id, metadata,
          shops ( name, logo_url, avg_prep_time_minutes ),
          order_items (
            quantity, unit_price, menu_item_id, customizations,
            menu_items ( name, image_url, id )
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) throw error;

      const all = data || [];
      setActiveOrders(all.filter(o => ACTIVE_STATUSES.includes(o.status)));
      setPastOrders(all.filter(o => COMPLETED_STATUSES.includes(o.status)));
    } catch (e) {
      console.error('[OrderHistory] load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = async () => { setRefreshing(true); await loadOrders(); setRefreshing(false); };

  const handleReorder = (order) => {
    const items = normalizeItems(order);
    if (!items.length) return;
    items.forEach(item => {
      addItem({
        id:             `${order.shop_id}:${item.id}`,
        name:           item.name,
        price:          item.unit_price,
        quantity:       item.quantity,
        shopId:         order.shop_id,
        shopName:       order.shops?.name,
        image_url:      item.image_url,
        customizations: item.customizations,
      });
    });
    router.push('/cart');
  };

  if (loading) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={22} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.centered}><ActivityIndicator size="large" color="#00704A" /></View>
    </SafeAreaView>
  );

  const hasSomething = activeOrders.length > 0 || pastOrders.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={22} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 22 }} />
      </View>

      {!hasSomething ? (
        <View style={styles.emptyState}>
          <Feather name="shopping-bag" size={60} color="#DDD" />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Your orders will appear here after you place them</Text>
          <TouchableOpacity style={styles.shopNowBtn} onPress={() => router.push('/home')}>
            <Text style={styles.shopNowBtnText}>Browse Shops</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00704A" />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={
            <>
              {activeOrders.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>READY SOON</Text>
                    <View style={styles.activePulse}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeCount}>{activeOrders.length} to pick up</Text>
                    </View>
                  </View>
                  {activeOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      isActive
                      onPress={() => router.push(`/order/${order.id}`)}
                      onReorder={handleReorder}
                    />
                  ))}
                </View>
              )}

              {pastOrders.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>PAST ORDERS</Text>
                  {pastOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      isActive={false}
                      onPress={() => router.push(`/order/${order.id}`)}
                      onReorder={handleReorder}
                    />
                  ))}
                </View>
              )}
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#FAFAFA' },
  centered:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle:        { fontSize: 20, fontWeight: '800', color: '#000' },
  section:            { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeaderRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel:       { fontSize: 11, fontWeight: '800', color: '#9ca3af', letterSpacing: 1.2 },
  activePulse:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeDot:          { width: 7, height: 7, borderRadius: 4, backgroundColor: '#d97706' },
  activeCount:        { fontSize: 11, fontWeight: '700', color: '#d97706' },
  card:               { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardActive:         { borderColor: '#d97706', borderWidth: 1.5 },
  etaBanner:          { backgroundColor: '#d97706', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12, alignItems: 'center' },
  etaBannerText:      { color: '#FFF', fontWeight: '800', fontSize: 13 },
  shopRow:            { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  shopLogo:           { width: 26, height: 26, borderRadius: 13, marginRight: 8 },
  shopLogoPlaceholder:{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  shopName:           { flex: 1, fontSize: 14, fontWeight: '700', color: '#000' },
  statusBadge:        { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  statusText:         { fontSize: 11, fontWeight: '800' },
  metaRow:            { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dateText:           { fontSize: 12, color: '#9ca3af' },
  idText:             { fontSize: 12, color: '#d1d5db', fontWeight: '600' },
  itemsPreview:       { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, marginBottom: 10, gap: 3 },
  itemLine:           { fontSize: 13, color: '#374151' },
  itemMods:           { color: '#9ca3af', fontSize: 12 },
  moreItems:          { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  cardFooter:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  totalText:          { fontSize: 18, fontWeight: '800', color: '#000' },
  cardFooterRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reorderBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#00704A' },
  reorderBtnText:     { fontSize: 12, fontWeight: '700', color: '#00704A' },
  emptyState:         { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle:         { fontSize: 20, fontWeight: '800', color: '#000', marginTop: 16, marginBottom: 6 },
  emptySubtitle:      { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  shopNowBtn:         { paddingHorizontal: 28, paddingVertical: 14, backgroundColor: '#00704A', borderRadius: 25 },
  shopNowBtnText:     { color: '#FFF', fontSize: 15, fontWeight: '700' },
});