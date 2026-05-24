/**
 * Orders API Client
 * All requests require a token — the backend identifies the customer from the JWT.
 */
import supabase from '../lib/supabase';

const API_BASE = '/api/v1';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// ============================================================================
// CUSTOMER ENDPOINTS
// ============================================================================

/**
 * Get the current user's orders.
 * Backend: GET /api/v1/orders  (customer identified from JWT — no customerId in URL)
 */
export async function getCustomerOrders(token, status) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  const response = await fetch(`${API_BASE}/orders?${params}`, {
    headers: authHeaders(token),
  });
  return response.json();
}

export async function getOrder(orderId, token) {
  const response = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: authHeaders(token),
  });
  return response.json();
}

export async function getOrderHistory(token) {
  const response = await fetch(`${API_BASE}/orders/history`, {
    headers: authHeaders(token),
  });
  return response.json();
}

// ============================================================================
// SHOP ENDPOINTS  (shop workers/owners — require token)
// ============================================================================

export async function getShopOrders(shopId, token, filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  const response = await fetch(`${API_BASE}/shops/${shopId}/orders?${params}`, {
    headers: authHeaders(token),
  });
  return response.json();
}

export async function updateOrderStatus(shopId, orderId, status, token) {
  const response = await fetch(`${API_BASE}/shops/${shopId}/orders/${orderId}/status`, {
    method:  'PUT',
    headers: authHeaders(token),
    body:    JSON.stringify({ status }),
  });
  return response.json();
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS  (Supabase realtime — no backend call needed)
// ============================================================================

/**
 * Subscribe to live order updates for a shop.
 * Returns an unsubscribe function — call it on component unmount.
 *
 * Usage:
 *   const unsub = subscribeToShopOrders(shopId, (payload) => { ... });
 *   return () => unsub();
 */
export function subscribeToShopOrders(shopId, callback) {
  const channel = supabase
    .channel(`shop_orders_${shopId}`)
    .on(
      'postgres_changes',
      {
        event:  '*',
        schema: 'public',
        table:  'orders',
        filter: `shop_id=eq.${shopId}`,
      },
      callback,
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}