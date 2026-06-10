/**
 * Shop API Client
 * All mutating requests require an auth token.
 * Pass `token` from: const { data: { session } } = await supabase.auth.getSession()
 *                    token = session.access_token
 */

const API_BASE = '/api/v1';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.detail || data?.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

export async function listShops(filters = {}) {
  const params = new URLSearchParams();

  if (filters.city) params.append('city', filters.city);
  if (filters.search) params.append('search', filters.search);

  const response = await fetch(`${API_BASE}/shops?${params}`);
  return parseResponse(response);
}

export async function findNearbyShops(lat, lng, radius = 10) {
  const params = new URLSearchParams({ lat, lng, radius });
  const response = await fetch(`${API_BASE}/shops/nearby?${params}`);
  return parseResponse(response);
}

export async function getShop(shopId) {
  const response = await fetch(`${API_BASE}/shops/${shopId}`);
  return parseResponse(response);
}

export async function getShopMenu(shopId) {
  const response = await fetch(`${API_BASE}/shops/${shopId}/menu`);
  return parseResponse(response);
}

// ============================================================================
// BILLING / PRIVATE OWNER STATUS
// ============================================================================

export async function getBillingStatus(token) {
  const response = await fetch(`${API_BASE}/billing/status`, {
    headers: authHeaders(token),
  });

  return parseResponse(response);
}

// ============================================================================
// SHOP OWNER ENDPOINTS  (all require token)
// ============================================================================

export async function createShop(shopData, token) {
  const response = await fetch(`${API_BASE}/shops`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(shopData),
  });

  return parseResponse(response);
}

export async function updateShop(shopId, shopData, token) {
  const response = await fetch(`${API_BASE}/shops/${shopId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(shopData),
  });

  return parseResponse(response);
}

export async function deleteShop(shopId, token) {
  const response = await fetch(`${API_BASE}/shops/${shopId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  return parseResponse(response);
}

export async function uploadShopLogo(shopId, file, token) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/shops/${shopId}/logo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  return parseResponse(response);
}

export async function uploadShopBanner(shopId, file, token) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/shops/${shopId}/banner`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  return parseResponse(response);
}

export async function getShopAnalytics(shopId, token) {
  const response = await fetch(`${API_BASE}/shops/${shopId}/analytics`, {
    headers: authHeaders(token),
  });

  return parseResponse(response);
}

// ============================================================================
// ADMIN ENDPOINTS  (require token)
// ============================================================================

export async function listAllShops(token) {
  const response = await fetch(`${API_BASE}/shops/admin/shops`, {
    headers: authHeaders(token),
  });

  return parseResponse(response);
}

export async function approveShop(shopId, token) {
  const response = await fetch(`${API_BASE}/shops/admin/shops/${shopId}/approve`, {
    method: 'PUT',
    headers: authHeaders(token),
  });

  return parseResponse(response);
}

export async function featureShop(shopId, token) {
  const response = await fetch(`${API_BASE}/shops/admin/shops/${shopId}/feature`, {
    method: 'PUT',
    headers: authHeaders(token),
  });

  return parseResponse(response);
}