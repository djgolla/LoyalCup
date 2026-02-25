/**
 * Menu API Client
 * API methods for menu and customization management
 */

const API_BASE = '/api/v1/shops';

// ============================================================================
// PUBLIC ENDPOINTS - CATEGORIES
// ============================================================================

export async function getCategories(shopId) {
  const response = await fetch(`${API_BASE}/${shopId}/categories`);
  return response.json();
}

// ============================================================================
// PUBLIC ENDPOINTS - MENU ITEMS
// ============================================================================

export async function getMenuItems(shopId, categoryId = null) {
  const params = categoryId ? `?category_id=${categoryId}` : '';
  const response = await fetch(`${API_BASE}/${shopId}/items${params}`);
  return response.json();
}

export async function getMenuItem(shopId, itemId) {
  const response = await fetch(`${API_BASE}/${shopId}/items/${itemId}`);
  return response.json();
}

// ============================================================================
// SHOP OWNER ENDPOINTS - CATEGORIES
// ============================================================================

export async function createCategory(shopId, categoryData) {
  const response = await fetch(`${API_BASE}/${shopId}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryData),
  });
  return response.json();
}

export async function updateCategory(shopId, categoryId, categoryData) {
  const response = await fetch(`${API_BASE}/${shopId}/categories/${categoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryData),
  });
  return response.json();
}

export async function deleteCategory(shopId, categoryId) {
  const response = await fetch(`${API_BASE}/${shopId}/categories/${categoryId}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function reorderCategories(shopId, categoryOrders) {
  const response = await fetch(`${API_BASE}/${shopId}/categories/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryOrders),
  });
  return response.json();
}

// ============================================================================
// SHOP OWNER ENDPOINTS - MENU ITEMS
// ============================================================================

export async function createMenuItem(shopId, itemData) {
  const response = await fetch(`${API_BASE}/${shopId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });
  return response.json();
}

export async function updateMenuItem(shopId, itemId, itemData) {
  const response = await fetch(`${API_BASE}/${shopId}/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });
  return response.json();
}

export async function deleteMenuItem(shopId, itemId) {
  const response = await fetch(`${API_BASE}/${shopId}/items/${itemId}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function toggleItemAvailability(shopId, itemId, isAvailable) {
  const response = await fetch(`${API_BASE}/${shopId}/items/${itemId}/availability`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_available: isAvailable }),
  });
  return response.json();
}

export async function uploadItemImage(shopId, itemId, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/${shopId}/items/${itemId}/image`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

// ============================================================================
// CUSTOMIZATION TEMPLATES
// ============================================================================

export async function getCustomizationTemplates(shopId) {
  const response = await fetch(`${API_BASE}/${shopId}/customizations`);
  return response.json();
}

export async function createCustomizationTemplate(shopId, templateData) {
  const response = await fetch(`${API_BASE}/${shopId}/customizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(templateData),
  });
  return response.json();
}

export async function updateCustomizationTemplate(shopId, templateId, templateData) {
  const response = await fetch(`${API_BASE}/${shopId}/customizations/${templateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(templateData),
  });
  return response.json();
}

export async function deleteCustomizationTemplate(shopId, templateId) {
  const response = await fetch(`${API_BASE}/${shopId}/customizations/${templateId}`, {
    method: 'DELETE',
  });
  return response.json();
}
