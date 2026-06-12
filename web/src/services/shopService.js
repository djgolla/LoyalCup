/**
 * Shop Service - backend API integration for shops
 */
import {
  listShops as apiListShops,
  findNearbyShops as apiFindNearbyShops,
  getShop as apiGetShop,
  getShopMenu as apiGetShopMenu,
} from '../api/shops';

export const shopService = {
  /**
   * Fetch all shops from Supabase
   */
  async getShops(filters = {}) {
    try {
      const data = await apiListShops(filters);
      return data?.shops || [];
    } catch (error) {
      console.error('Error fetching shops:', error);
      return [];
    }
  },

  /**
   * Fetch nearby shops based on coordinates
   * NOTE: This implementation uses client-side filtering which is not ideal for production.
   * For production, implement server-side filtering using PostGIS or Supabase's geospatial functions.
   */
  async getNearbyShops(lat, lng, radius = 10) {
    try {
      const radiusKm = radius > 1000 ? radius / 1000 : radius;
      const data = await apiFindNearbyShops(lat, lng, radiusKm);
      return data?.shops || [];
    } catch (error) {
      console.error('Error fetching nearby shops:', error);
      return [];
    }
  },

  /**
   * Get a single shop by ID
   */
  async getShop(shopId) {
    try {
      const data = await apiGetShop(shopId);
      return data?.shop || null;
    } catch (error) {
      console.error('Error fetching shop:', error);
      return null;
    }
  },

  /**
   * Get menu for a shop
   */
  async getShopMenu(shopId) {
    try {
      const data = await apiGetShopMenu(shopId);
      const categories = Object.values(data?.menu || {}).map(entry => entry.category);
      const items = Object.values(data?.menu || {}).flatMap(entry => entry.items || []);

      // Group items by category
      const menu = categories.map(category => ({
        ...category,
        items: items.filter(item => item.category_id === category.id)
      }));

      return menu;
    } catch (error) {
      console.error('Error fetching shop menu:', error);
      return [];
    }
  }
};
