import api from './api'

export const loyaltyService = {
  // get user's loyalty points
  getPoints: async () => {
    const response = await api.get('/loyalty/points')
    return response.data
  },

  // get loyalty transactions
  getTransactions: async (params = {}) => {
    const response = await api.get('/loyalty/transactions', { params })
    return response.data
  },

  // redeem points
  redeemPoints: async (points, rewardId) => {
    const response = await api.post('/loyalty/redeem', { points, rewardId })
    return response.data
  },

  // get available rewards
  getRewards: async () => {
    const response = await api.get('/loyalty/rewards')
    return response.data
  },
}
