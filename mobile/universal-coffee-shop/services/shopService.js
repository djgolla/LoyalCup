/**
 * shopService — public shop/menu reads through FastAPI.
 */
import { apiClient } from './apiClient';

function isBadId(value) {
  return !value || value === 'undefined' || value === 'null';
}

function emptyShopPayload() {
  return {
    shop: null,
    categories: [],
    items: [],
    modifierGroups: [],
    offers: [],
  };
}

function normalizeMenuResponse(payload) {
  const shop = payload?.shop || null;
  const menu = payload?.menu || {};

  const categories =
    payload?.categories ||
    menu.categories ||
    [];

  const rawItems =
    payload?.items ||
    payload?.menu_items ||
    menu.items ||
    menu.menu_items ||
    [];

  const modifierGroups =
    payload?.modifierGroups ||
    payload?.modifier_groups ||
    menu.modifierGroups ||
    menu.modifier_groups ||
    [];

  const offers =
    payload?.offers ||
    payload?.shop_offers ||
    menu.offers ||
    [];

  const items = rawItems.map((item) => ({
    ...item,
    id: item.id,
    name: item.name,
    description: item.description,
    price: parseFloat(item.base_price || item.price || 0),
    base_price: item.base_price ?? item.price ?? 0,
    image_url: item.image_url,
    category: categories.find((c) => c.id === item.category_id)?.name || 'Other',
    category_id: item.category_id,
    modifier_group_ids: item.modifier_group_ids || [],
  }));

  const normalizedGroups = modifierGroups.map((group) => ({
    ...group,
    modifier_options: group.modifier_options || group.options || [],
    options: group.options || group.modifier_options || [],
  }));

  return {
    shop,
    categories,
    items,
    modifierGroups: normalizedGroups,
    offers,
  };
}

export const shopService = {
  getShops: async (params = {}) => {
    const query = new URLSearchParams();

    if (params.city) query.set('city', params.city);
    if (params.search) query.set('search', params.search);
    if (params.lat) query.set('lat', String(params.lat));
    if (params.lng) query.set('lng', String(params.lng));
    if (params.radius) query.set('radius', String(params.radius));

    const suffix = query.toString();
    const res = await apiClient.get(suffix ? `/api/v1/shops?${suffix}` : '/api/v1/shops');

    return res.shops || res.data || [];
  },

  getShop: async (shopId) => {
    if (isBadId(shopId)) {
      console.warn('[shopService] blocked invalid getShop id:', shopId);
      return null;
    }

    const res = await apiClient.get(`/api/v1/shops/${shopId}`);
    return res.shop || null;
  },

  getMenu: async (shopId) => {
    if (isBadId(shopId)) {
      console.warn('[shopService] blocked invalid getMenu id:', shopId);
      return [];
    }

    const res = await apiClient.get(`/api/v1/shops/${shopId}`);
    return normalizeMenuResponse(res).items;
  },

  getShopWithMenu: async (shopId) => {
    if (isBadId(shopId)) {
      console.warn('[shopService] blocked invalid getShopWithMenu id:', shopId);
      return emptyShopPayload();
    }

    const res = await apiClient.get(`/api/v1/shops/${shopId}`);
    return normalizeMenuResponse(res);
  },

  searchShops: async (query) => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);

    const suffix = params.toString();
    const res = await apiClient.get(suffix ? `/api/v1/shops?${suffix}` : '/api/v1/shops');

    return res.shops || res.data || [];
  },

  getNearbyShops: async (latitude, longitude, radius = 5000) => {
    const radiusKm = radius > 1000 ? radius / 1000 : radius;

    const params = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
      radius: String(radiusKm || 10),
    });

    const res = await apiClient.get(`/api/v1/shops/nearby?${params.toString()}`);
    return res.shops || res.data || [];
  },
};