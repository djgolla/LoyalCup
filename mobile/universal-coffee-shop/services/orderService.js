/**
 * orderService — all order mutations AND reads go through FastAPI.
 *
 * Direct Supabase order reads can break when SQL is tightened and can expose
 * more join data than the app needs. Backend enforces ownership and shop access.
 */
import { supabase } from '../lib/supabase';
import { apiClient } from './apiClient';

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export const orderService = {
  createOrder: async (shopId, items, paymentNonce, options = {}) => {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated — please log in again');
    if (!paymentNonce) throw new Error('Payment nonce required');

    const orderItems = items.map(item => ({
      menu_item_id: item.id?.includes(':') ? item.id.split(':')[1] : (item.id || item.menu_item_id),
      quantity: Math.max(1, item.quantity || 1),
      // Backend ignores client price for security. Kept for legacy request shape.
      unit_price: parseFloat(item.price || item.unit_price || item.base_price) || 0,
      base_price: parseFloat(item.price || item.base_price) || 0,
      customizations: item.customizations || [],
    }));

    return apiClient.post('/api/v1/payments/create', {
      shop_id: shopId,
      items: orderItems,
      payment_nonce: paymentNonce,
      checkout_attempt_id: options.checkoutAttemptId || null,
      loyalty_points_to_redeem: options.loyaltyPointsToRedeem || 0,
      customer_note: options.customerNote || null,
    }, token);
  },

  createCashOrder: async () => {
    throw new Error('Cash/manual orders are disabled. Use card checkout.');
  },

  getOrder: async (orderId) => {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated');

    const res = await apiClient.get(`/api/v1/orders/${orderId}`, token);
    return res.order || null;
  },

  getOrderHistory: async (params = {}) => {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated');

    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);

    const path = query.toString()
      ? `/api/v1/orders/history?${query.toString()}`
      : '/api/v1/orders/history';

    const res = await apiClient.get(path, token);
    return res.orders || [];
  },

  cancelOrder: async (orderId) => {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await apiClient.post(`/api/v1/orders/${orderId}/cancel`, {}, token);
    return response.order;
  },
};
