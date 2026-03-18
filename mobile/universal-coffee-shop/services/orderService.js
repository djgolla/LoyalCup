/**
 * orderService — all order mutations go through the FastAPI backend.
 * Reads (get order, history) hit Supabase directly for speed.
 * Real-time status subscription uses Supabase channels.
 */
import { supabase } from '../lib/supabase';
import { apiClient } from './apiClient';

export const orderService = {
  /**
   * Create a new order via backend (which pushes to Square POS + awards loyalty points).
   * items: [{ menu_item_id, quantity, base_price, customizations }]
   */
  createOrder: async (shopId, items, customerNote = null) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const orderItems = items.map(item => ({
      menu_item_id: item.id || item.menu_item_id,
      quantity: item.quantity || 1,
      base_price: parseFloat(item.price || item.base_price) || 0,
      customizations: item.customizations || [],
    }));

    const response = await apiClient.post(
      '/api/v1/orders',
      { shop_id: shopId, items: orderItems, customer_note: customerNote },
      token
    );
    return response.order;
  },

  /** Get a single order with shop + items (direct Supabase read — fast) */
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

    let query = supabase
      .from('orders')
      .select(`
        *,
        shops (name, logo_url),
        order_items (quantity, unit_price, menu_items(name))
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (params.status) query = query.eq('status', params.status);
    if (params.limit) query = query.limit(params.limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /** Cancel a pending order via backend */
  cancelOrder: async (orderId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const response = await apiClient.post(
      `/api/v1/orders/${orderId}/cancel`,
      {},
      token
    );
    return response.order;
  },

  /** Real-time subscription to order status changes */
  subscribeToOrder: (orderId, callback) => {
    const sub = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => callback(payload.new)
      )
      .subscribe();

    return () => sub.unsubscribe();
  },
};