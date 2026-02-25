/**
 * Orders API Client
 * API methods for order management
 */

const API_BASE = '/api/v1';

// ============================================================================
// CUSTOMER ENDPOINTS
// ============================================================================

export async function createOrder(orderData) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  return response.json();
}

export async function getCustomerOrders(customerId) {
  const response = await fetch(`${API_BASE}/customers/${customerId}/orders`);
  return response.json();
}

export async function getOrder(orderId) {
  const response = await fetch(`${API_BASE}/orders/${orderId}`);
  return response.json();
}

export async function cancelOrder(orderId) {
  const response = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method: 'PUT',
  });
  return response.json();
}

// ============================================================================
// SHOP ENDPOINTS - Orders Management
// ============================================================================

export async function getShopOrders(shopId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.from_date) params.append('from_date', filters.from_date);
  if (filters.to_date) params.append('to_date', filters.to_date);
  
  const response = await fetch(`${API_BASE}/shops/${shopId}/orders?${params}`);
  return response.json();
}

export async function updateOrderStatus(shopId, orderId, status) {
  const response = await fetch(`${API_BASE}/shops/${shopId}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return response.json();
}

export async function getShopOrderStats(shopId, period = 'today') {
  const response = await fetch(`${API_BASE}/shops/${shopId}/orders/stats?period=${period}`);
  return response.json();
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

// Use with Supabase real-time subscriptions
export function subscribeToShopOrders(shopId, callback) {
  // This will be implemented with Supabase realtime
  // For now, return a dummy unsubscribe function
  console.log('Subscribing to orders for shop:', shopId);
  return () => console.log('Unsubscribed from orders');
}
