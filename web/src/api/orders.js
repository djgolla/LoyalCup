/**
 * Orders API Client
 * All requests require a token — the backend identifies the customer from the JWT.
 *
 * NOTE: There is no order-status workflow anymore. Orders go straight to the
 * shop's Square POS and customers get an ETA. No status updates / no polling.
 */

import { API_V1, parseJsonResponse } from './client';

const API_BASE = API_V1;

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// ============================================================================
// CUSTOMER ENDPOINTS
// ============================================================================

/** Get the current user's orders (customer identified from JWT). */
export async function getCustomerOrders(token, status) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  const response = await fetch(`${API_BASE}/orders?${params}`, {
    headers: authHeaders(token),
  });
  return parseJsonResponse(response);
}

export async function getOrder(orderId, token) {
  const response = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: authHeaders(token),
  });
  return parseJsonResponse(response);
}

export async function getOrderHistory(token) {
  const response = await fetch(`${API_BASE}/orders/history`, {
    headers: authHeaders(token),
  });
  return parseJsonResponse(response);
}

export async function cancelOrder(orderId, token) {
  const response = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method:  'POST',
    headers: authHeaders(token),
  });
  return parseJsonResponse(response);
}

// ============================================================================
// SHOP ENDPOINTS  (owner order history — read only, no status actions)
// ============================================================================

export async function getShopOrders(shopId, token, filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  const response = await fetch(`${API_BASE}/shops/${shopId}/orders?${params}`, {
    headers: authHeaders(token),
  });
  return parseJsonResponse(response);
}
