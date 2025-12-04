import api from './api'

export const authService = {
  // login with email/password
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  // register new user
  register: async (email, password, userData) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      ...userData,
    })
    return response.data
  },

  // get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile')
    return response.data
  },

  // update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData)
    return response.data
  },
}
