import { supabase } from '../lib/supabase'

export const orderService = {
  // create new order
  createOrder: async (orderData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          shop_id: orderData.shop_id,
          customer_id: user.id,
          status: 'pending',
          subtotal: orderData.subtotal,
          tax: orderData.tax,
          total: orderData.total,
          metadata: orderData.metadata || {},
        })
        .select()
        .single()

      if (error) throw error

      // Insert order items
      if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map(item => ({
          order_id: data.id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          customizations: item.customizations || [],
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) throw itemsError
      }

      return data
    } catch (error) {
      console.error('Failed to create order:', error)
      throw error
    }
  },

  // get order by id
  getOrder: async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          shops (name, logo_url, address),
          order_items (
            *,
            menu_items (name, description)
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to fetch order:', error)
      throw error
    }
  },

  // get user's order history
  getOrderHistory: async (params = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      let query = supabase
        .from('orders')
        .select(`
          *,
          shops (name, logo_url),
          order_items (*)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (params.status) {
        query = query.eq('status', params.status)
      }

      const { data, error } = await query
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to fetch order history:', error)
      throw error
    }
  },

  // update order status
  updateOrderStatus: async (orderId, status) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update order status:', error)
      throw error
    }
  },

  // cancel order
  cancelOrder: async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to cancel order:', error)
      throw error
    }
  },

  // subscribe to order updates (real-time)
  subscribeToOrder: (orderId, callback) => {
    const subscription = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  },
}
