/**
 * shopService — public shop/menu reads through FastAPI, not direct Supabase.
 *
 * This keeps the app compatible with tightened SQL where public clients cannot
 * select private shop columns like owner_id, business_license, Square IDs,
 * or Stripe subscription fields.
 */
import { apiClient } from './apiClient';

function normalizeMenuResponse(payload) {
  const shop = payload?.shop || null;
  const categories = payload?.menu?.categories || [];
  const rawItems = payload?.menu?.items || [];
  const modifierGroups = payload?.menu?.modifier_groups || [];
  const offers = payload?.menu?.offers || [];

  const items = rawItems.map(item => ({
    ...item,
    id: item.id,
    name: item.name,
    description: item.description,
    price: parseFloat(item.base_price || item.price || 0),
    base_price: item.base_price,
    image_url: item.image_url,
    category: categories.find(c => c.id === item.category_id)?.name || 'Other',
    category_id: item.category_id,
  }));

  return { shop, categories, items, modifierGroups, offers };
}

export const shopService = {
  getShops: async (params = {}) => {
    const query = new URLSearchParams();

    if (params.city) query.set('city', params.city);
    if (params.search) query.set('search', params.search);

    const path = query.toString()
      ? `/api/v1/shops?${query.toString()}`
      : '/api/v1/shops';

    const res = await apiClient.get(path);
    return res.shops || [];
  },

  getShop: async (shopId) => {
    const res = await apiClient.get(`/api/v1/shops/${shopId}`);
    return res.shop || null;
  },

  getMenu: async (shopId) => {
    const res = await apiClient.get(`/api/v1/shops/${shopId}`);
    return normalizeMenuResponse(res).items;
  },

  getShopWithMenu: async (shopId) => {
    const res = await apiClient.get(`/api/v1/shops/${shopId}`);
    return normalizeMenuResponse(res);
  },

  searchShops: async (query) => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);

    const res = await apiClient.get(`/api/v1/shops?${params.toString()}`);
    return res.shops || [];
  },

  getNearbyShops: async (latitude, longitude, radius = 5000) => {
    const radiusKm = radius > 1000 ? radius / 1000 : radius;
    const params = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
      radius: String(radiusKm || 10),
    });

    const res = await apiClient.get(`/api/v1/shops/nearby?${params.toString()}`);
    return res.shops || [];
  },
};
