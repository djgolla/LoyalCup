/**
 * orderService — all order mutations go through the FastAPI backend.
 * Reads hit Supabase directly for speed.
 * Real-time status uses Supabase channels.
 *
 * NOTE: createOrder requires a payment_nonce (Square token).
 * All mobile orders are Square-paid. Use checkout.js which handles
 * card entry + nonce generation before calling this.
 */
import { supabase } from '../lib/supabase';
import { apiClient } from './apiClient';

export const orderService = {
  /**
   * Create + pay for an order via backend.
   * Requires a Square payment nonce from the card tokenizer.
   *
   * items: [{ menu_item_id, quantity, unit_price, base_price, customizations }]
   */
  createOrder: async (shopId, items, paymentNonce, options = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated — please log in again');
    if (!paymentNonce) throw new Error('Payment nonce required');

    const orderItems = items.map(item => ({
      menu_item_id:   item.id || item.menu_item_id,
      quantity:       Math.max(1, item.quantity || 1),
      unit_price:     parseFloat(item.price || item.unit_price || item.base_price) || 0,
      base_price:     parseFloat(item.price || item.base_price) || 0,
      customizations: item.customizations || [],
    }));

    const response = await apiClient.post('/api/v1/orders', {
      shop_id:                  shopId,
      items:                    orderItems,
      payment_nonce:            paymentNonce,
      loyalty_points_to_redeem: options.loyaltyPointsToRedeem || 0,
      customer_note:            options.customerNote || null,
    }, token);

    return response;
  },

  /** Get a single order with shop + items (direct Supabase — fast) */
  getOrder: async (orderId) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        shops (name, logo_url, address),
        order_items (
          *,
          menu_items (name, description, image_url)
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  },

  /** Get the current user's order history */
  getOrderHistory: async (params = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('orders')
      .select(`
        *,
        shops (name, logo_url),
        order_items (quantity, unit_price, menu_items(name, image_url))
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (params.status) query = query.eq('status', params.status);
    if (params.limit)  query = query.limit(params.limit);
    else               query = query.limit(20);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /** Cancel a confirmed/pending order (only allowed before it's accepted) */
  cancelOrder: async (orderId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const response = await apiClient.post(`/api/v1/orders/${orderId}/cancel`, {}, token);
    return response.order;
  },

  /** Real-time subscription to a single order's status changes */
  subscribeToOrder: (orderId, callback) => {
    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => callback(payload.new)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};