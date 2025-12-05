/**
 * Shop Service - Supabase integration for shops
 */
import supabase from '../lib/supabase';

export const shopService = {
  /**
   * Fetch all shops from Supabase
   */
  async getShops(filters = {}) {
    try {
      let query = supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
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
      // Note: For true geospatial queries, you'd need PostGIS
      // This is a simplified version
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) throw error;

      // Filter by radius client-side (not ideal for production)
      const filtered = data?.filter(shop => {
        const distance = calculateDistance(lat, lng, shop.lat, shop.lng);
        return distance <= radius;
      }) || [];

      return filtered;
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
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      return data;
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
      const { data: categories, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('shop_id', shopId)
        .order('display_order', { ascending: true });

      if (catError) throw catError;

      const { data: items, error: itemError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('shop_id', shopId)
        .order('display_order', { ascending: true });

      if (itemError) throw itemError;

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

/**
 * Calculate distance between two coordinates in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
