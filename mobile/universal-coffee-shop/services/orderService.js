import api from './api'

export const orderService = {
  // create new order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData)
    return response.data
  },

  // get order by id
  getOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`)
    return response.data
  },

  // get user's order history
  getOrderHistory: async (params = {}) => {
    const response = await api.get('/orders', { params })
    return response.data
  },

  // update order status
  updateOrderStatus: async (orderId, status) => {
    const response = await api.patch(`/orders/${orderId}/status`, { status })
    return response.data
  },

  // cancel order
  cancelOrder: async (orderId) => {
    const response = await api.delete(`/orders/${orderId}`)
    return response.data
  },
}
