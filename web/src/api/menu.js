/**
 * Menu API Client
 * API methods for menu and customization management
 */

import supabase from '../lib/supabase';
import { API_V1, parseJsonResponse } from './client';

const API_BASE = `${API_V1}/shops`;

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

const authHeaders = async (json = true) => {
  const token = await getToken();
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function parseResponse(response) {
  return parseJsonResponse(response);
}

// ============================================================================
// PUBLIC ENDPOINTS - CATEGORIES
// ============================================================================

export async function getCategories(shopId) {
  const response = await fetch(`${API_BASE}/${shopId}/categories`);
  return parseResponse(response);
}

// ============================================================================
// PUBLIC ENDPOINTS - MENU ITEMS
// ============================================================================

export async function getMenuItems(shopId, categoryId = null) {
  const params = categoryId ? `?category_id=${categoryId}` : '';
  const response = await fetch(`${API_BASE}/${shopId}/items${params}`);
  return parseResponse(response);
}

export async function getMenuItem(shopId, itemId) {
  const response = await fetch(`${API_BASE}/${shopId}/items/${itemId}`);
  return parseResponse(response);
}

// ============================================================================
// SHOP OWNER ENDPOINTS - CATEGORIES
// ============================================================================

export async function createCategory(shopId, categoryData) {
  const response = await fetch(`${API_BASE}/${shopId}/categories`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(categoryData),
  });
  return parseResponse(response);
}

export async function updateCategory(shopId, categoryId, categoryData) {
  const response = await fetch(`${API_BASE}/${shopId}/categories/${categoryId}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(categoryData),
  });
  return parseResponse(response);
}

export async function deleteCategory(shopId, categoryId) {
  const response = await fetch(`${API_BASE}/${shopId}/categories/${categoryId}`, {
    method: 'DELETE',
    headers: await authHeaders(false),
  });
  return parseResponse(response);
}

export async function reorderCategories(shopId, categoryOrders) {
  const response = await fetch(`${API_BASE}/${shopId}/categories/reorder`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(categoryOrders),
  });
  return parseResponse(response);
}

// ============================================================================
// SHOP OWNER ENDPOINTS - MENU ITEMS
// ============================================================================

export async function createMenuItem(shopId, itemData) {
  const response = await fetch(`${API_BASE}/${shopId}/items`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(itemData),
  });
  return parseResponse(response);
}

export async function updateMenuItem(shopId, itemId, itemData) {
  const response = await fetch(`${API_BASE}/${shopId}/items/${itemId}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(itemData),
  });
  return parseResponse(response);
}

export async function deleteMenuItem(shopId, itemId) {
  const response = await fetch(`${API_BASE}/${shopId}/items/${itemId}`, {
    method: 'DELETE',
    headers: await authHeaders(false),
  });
  return parseResponse(response);
}

export async function toggleItemAvailability(shopId, itemId, isAvailable) {
  const response = await fetch(`${API_BASE}/${shopId}/items/${itemId}/availability`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify({ is_available: isAvailable }),
  });
  return parseResponse(response);
}

export async function uploadItemImage(shopId, itemId, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/${shopId}/items/${itemId}/image`, {
    method: 'POST',
    headers: await authHeaders(false),
    body: formData,
  });
  return parseResponse(response);
}

// ============================================================================
// CUSTOMIZATION TEMPLATES
// ============================================================================

export async function getCustomizationTemplates(shopId) {
  const response = await fetch(`${API_BASE}/${shopId}/customizations`);
  return parseResponse(response);
}

export async function createCustomizationTemplate(shopId, templateData) {
  const response = await fetch(`${API_BASE}/${shopId}/customizations`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(templateData),
  });
  return parseResponse(response);
}

export async function updateCustomizationTemplate(shopId, templateId, templateData) {
  const response = await fetch(`${API_BASE}/${shopId}/customizations/${templateId}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(templateData),
  });
  return parseResponse(response);
}

export async function deleteCustomizationTemplate(shopId, templateId) {
  const response = await fetch(`${API_BASE}/${shopId}/customizations/${templateId}`, {
    method: 'DELETE',
    headers: await authHeaders(false),
  });
  return parseResponse(response);
}

export async function getModifierGroups(shopId) {
  const response = await fetch(`${API_BASE}/${shopId}/modifier-groups`);
  return parseResponse(response);
}

export async function createModifierGroup(shopId, groupData) {
  const response = await fetch(`${API_BASE}/${shopId}/modifier-groups`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(groupData),
  });
  return parseResponse(response);
}

export async function updateModifierGroup(shopId, groupId, groupData) {
  const response = await fetch(`${API_BASE}/${shopId}/modifier-groups/${groupId}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(groupData),
  });
  return parseResponse(response);
}

export async function deleteModifierGroup(shopId, groupId) {
  const response = await fetch(`${API_BASE}/${shopId}/modifier-groups/${groupId}`, {
    method: 'DELETE',
    headers: await authHeaders(false),
  });
  return parseResponse(response);
}
