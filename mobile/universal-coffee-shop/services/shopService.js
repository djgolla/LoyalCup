import { supabase } from '../lib/supabase'

export const shopService = {
  // get all shops
  getShops: async (params = {}) => {
    try {
      let query = supabase
        .from('shops')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (params.city) {
        query = query.eq('city', params.city)
      }

      if (params.search) {
        query = query.ilike('name', `%${params.search}%`)
      }

      const { data, error } = await query
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to fetch shops:', error)
      throw error
    }
  },

  // get shop by id
  getShop: async (shopId) => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to fetch shop:', error)
      throw error
    }
  },

  // get shop menu
  getMenu: async (shopId) => {
    try {
      const { data: categories, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('shop_id', shopId)
        .order('display_order')

      if (catError) throw catError

      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_available', true)
        .order('display_order')

      if (itemsError) throw itemsError

      // Group items by category
      const menu = items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.base_price),
        image_url: item.image_url,
        category: categories.find(c => c.id === item.category_id)?.name || 'Other',
        category_id: item.category_id,
      }))

      return menu
    } catch (error) {
      console.error('Failed to fetch menu:', error)
      throw error
    }
  },

  // search shops
  searchShops: async (query) => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('status', 'active')
        .ilike('name', `%${query}%`)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to search shops:', error)
      throw error
    }
  },

  // get nearby shops
  getNearbyShops: async (latitude, longitude, radius = 5000) => {
    try {
      // Note: This is a simple implementation
      // For production, you'd use PostGIS functions for proper geospatial queries
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('status', 'active')
        .not('lat', 'is', null)
        .not('lng', 'is', null)

      if (error) throw error
      
      // Simple distance calculation (not production-ready)
      // In production, use proper PostGIS queries
      return data || []
    } catch (error) {
      console.error('Failed to fetch nearby shops:', error)
      throw error
    }
  },
}
