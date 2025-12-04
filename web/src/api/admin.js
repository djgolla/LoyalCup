// Admin API client
// All endpoints require admin authentication

const API_BASE = "/api/v1/admin";

// Dashboard
export const getDashboardStats = async () => {
  const response = await fetch(`${API_BASE}/dashboard`);
  return response.json();
};

// Shop management
export const listShops = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE}/shops?${params}`);
  return response.json();
};

export const getShopDetails = async (shopId) => {
  const response = await fetch(`${API_BASE}/shops/${shopId}`);
  return response.json();
};

export const updateShopStatus = async (shopId, status) => {
  const response = await fetch(`${API_BASE}/shops/${shopId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return response.json();
};

export const toggleShopFeatured = async (shopId) => {
  const response = await fetch(`${API_BASE}/shops/${shopId}/featured`, {
    method: "PUT",
  });
  return response.json();
};

export const deleteShop = async (shopId) => {
  const response = await fetch(`${API_BASE}/shops/${shopId}`, {
    method: "DELETE",
  });
  return response.json();
};

// User management
export const listUsers = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE}/users?${params}`);
  return response.json();
};

export const getUserDetails = async (userId) => {
  const response = await fetch(`${API_BASE}/users/${userId}`);
  return response.json();
};

export const updateUserRole = async (userId, role) => {
  const response = await fetch(`${API_BASE}/users/${userId}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  return response.json();
};

export const updateUserStatus = async (userId, status) => {
  const response = await fetch(`${API_BASE}/users/${userId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return response.json();
};

export const deleteUser = async (userId) => {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
  });
  return response.json();
};

// Analytics
export const getAnalyticsOverview = async (days = 30) => {
  const response = await fetch(`${API_BASE}/analytics/overview?days=${days}`);
  return response.json();
};

export const getOrderAnalytics = async (period = "month") => {
  const response = await fetch(`${API_BASE}/analytics/orders?period=${period}`);
  return response.json();
};

export const getRevenueAnalytics = async (period = "month") => {
  const response = await fetch(`${API_BASE}/analytics/revenue?period=${period}`);
  return response.json();
};

export const getGrowthAnalytics = async () => {
  const response = await fetch(`${API_BASE}/analytics/growth`);
  return response.json();
};

// Platform settings
export const getPlatformSettings = async () => {
  const response = await fetch(`${API_BASE}/settings`);
  return response.json();
};

export const updatePlatformSettings = async (settings) => {
  const response = await fetch(`${API_BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  });
  return response.json();
};

// Audit log
export const getAuditLog = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE}/audit-log?${params}`);
  return response.json();
};
