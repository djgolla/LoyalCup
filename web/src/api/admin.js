// Admin API client
// All endpoints require admin authentication

import { API_V1, parseJsonResponse } from "./client";

const API_BASE = `${API_V1}/admin`;

// Dashboard
export const getDashboardStats = async () => {
  const response = await fetch(`${API_BASE}/dashboard`);
  return parseJsonResponse(response);
};

// Shop management
export const listShops = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE}/shops?${params}`);
  return parseJsonResponse(response);
};

export const getShopDetails = async (shopId) => {
  const response = await fetch(`${API_BASE}/shops/${shopId}`);
  return parseJsonResponse(response);
};

export const updateShopStatus = async (shopId, status) => {
  const response = await fetch(`${API_BASE}/shops/${shopId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return parseJsonResponse(response);
};

export const toggleShopFeatured = async (shopId) => {
  const response = await fetch(`${API_BASE}/shops/${shopId}/featured`, {
    method: "PUT",
  });
  return parseJsonResponse(response);
};

export const deleteShop = async (shopId) => {
  const response = await fetch(`${API_BASE}/shops/${shopId}`, {
    method: "DELETE",
  });
  return parseJsonResponse(response);
};

// User management
export const listUsers = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE}/users?${params}`);
  return parseJsonResponse(response);
};

export const getUserDetails = async (userId) => {
  const response = await fetch(`${API_BASE}/users/${userId}`);
  return parseJsonResponse(response);
};

export const updateUserRole = async (userId, role) => {
  const response = await fetch(`${API_BASE}/users/${userId}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  return parseJsonResponse(response);
};

export const updateUserStatus = async (userId, status) => {
  const response = await fetch(`${API_BASE}/users/${userId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return parseJsonResponse(response);
};

export const deleteUser = async (userId) => {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
  });
  return parseJsonResponse(response);
};

// Analytics
export const getAnalyticsOverview = async (days = 30) => {
  const response = await fetch(`${API_BASE}/analytics/overview?days=${days}`);
  return parseJsonResponse(response);
};

export const getOrderAnalytics = async (period = "month") => {
  const response = await fetch(`${API_BASE}/analytics/orders?period=${period}`);
  return parseJsonResponse(response);
};

export const getRevenueAnalytics = async (period = "month") => {
  const response = await fetch(`${API_BASE}/analytics/revenue?period=${period}`);
  return parseJsonResponse(response);
};

export const getGrowthAnalytics = async () => {
  const response = await fetch(`${API_BASE}/analytics/growth`);
  return parseJsonResponse(response);
};

// Platform settings
export const getPlatformSettings = async () => {
  const response = await fetch(`${API_BASE}/settings`);
  return parseJsonResponse(response);
};

export const updatePlatformSettings = async (settings) => {
  const response = await fetch(`${API_BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  });
  return parseJsonResponse(response);
};

// Audit log
export const getAuditLog = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE}/audit-log?${params}`);
  return parseJsonResponse(response);
};
