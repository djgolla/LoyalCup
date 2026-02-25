import api from './api'
import { userService } from './userService'

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

  // delegate profile methods to userService
  getProfile: userService.getProfile,
  updateProfile: userService.updateProfile,
}
