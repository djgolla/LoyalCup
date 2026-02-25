import api from './api'

export const userService = {
  // get user profile
  getProfile: async () => {
    const response = await api.get('/users/profile')
    return response.data
  },

  // update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData)
    return response.data
  },

  // get user preferences
  getPreferences: async () => {
    const response = await api.get('/users/preferences')
    return response.data
  },

  // update user preferences
  updatePreferences: async (preferences) => {
    const response = await api.put('/users/preferences', preferences)
    return response.data
  },

  // get favorite shops
  getFavorites: async () => {
    const response = await api.get('/users/favorites')
    return response.data
  },

  // add shop to favorites
  addFavorite: async (shopId) => {
    const response = await api.post('/users/favorites', { shopId })
    return response.data
  },

  // remove shop from favorites
  removeFavorite: async (shopId) => {
    const response = await api.delete(`/users/favorites/${shopId}`)
    return response.data
  },
}
