/**
 * Shop API Client
 * API methods for shop management
 */

const API_BASE = '/api/v1';

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

export async function listShops(filters = {}) {
  const params = new URLSearchParams();
  if (filters.city) params.append('city', filters.city);
  if (filters.search) params.append('search', filters.search);
  
  const response = await fetch(`${API_BASE}/shops?${params}`);
  return response.json();
}

export async function findNearbyShops(lat, lng, radius = 10) {
  const params = new URLSearchParams({ lat, lng, radius });
  const response = await fetch(`${API_BASE}/shops/nearby?${params}`);
  return response.json();
}

export async function getShop(shopId) {
  const response = await fetch(`${API_BASE}/shops/${shopId}`);
  return response.json();
}

export async function getShopMenu(shopId) {
  const response = await fetch(`${API_BASE}/shops/${shopId}/menu`);
  return response.json();
}

// ============================================================================
// SHOP OWNER ENDPOINTS
// ============================================================================

export async function createShop(shopData) {
  const response = await fetch(`${API_BASE}/shops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shopData),
  });
  return response.json();
}

export async function updateShop(shopId, shopData) {
  const response = await fetch(`${API_BASE}/shops/${shopId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shopData),
  });
  return response.json();
}

export async function deleteShop(shopId) {
  const response = await fetch(`${API_BASE}/shops/${shopId}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function uploadShopLogo(shopId, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/shops/${shopId}/logo`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function uploadShopBanner(shopId, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/shops/${shopId}/banner`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function getShopAnalytics(shopId) {
  const response = await fetch(`${API_BASE}/shops/${shopId}/analytics`);
  return response.json();
}

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

export async function listAllShops() {
  const response = await fetch(`${API_BASE}/admin/shops`);
  return response.json();
}

export async function approveShop(shopId) {
  const response = await fetch(`${API_BASE}/admin/shops/${shopId}/approve`, {
    method: 'PUT',
  });
  return response.json();
}

export async function featureShop(shopId) {
  const response = await fetch(`${API_BASE}/admin/shops/${shopId}/feature`, {
    method: 'PUT',
  });
  return response.json();
}
