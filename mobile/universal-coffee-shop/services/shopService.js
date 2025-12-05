import api from './api'

export const shopService = {
  // get all shops
  getShops: async (params = {}) => {
    const response = await api.get('/shops', { params })
    return response.data
  },

  // get shop by id
  getShop: async (shopId) => {
    const response = await api.get(`/shops/${shopId}`)
    return response.data
  },

  // get shop menu
  getMenu: async (shopId) => {
    const response = await api.get(`/shops/${shopId}/menu`)
    return response.data
  },

  // search shops
  searchShops: async (query) => {
    const response = await api.get('/shops/search', {
      params: { q: query }
    })
    return response.data
  },

  // get nearby shops
  getNearbyShops: async (latitude, longitude, radius = 5000) => {
    const response = await api.get('/shops/nearby', {
      params: { lat: latitude, lng: longitude, radius }
    })
    return response.data
  },
}
