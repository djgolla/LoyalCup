import { supabase } from '../lib/supabase'

export const loyaltyService = {
  // get user's loyalty points
  getPoints: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('loyalty_balances')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      
      // Sum all points
      const totalPoints = (data || []).reduce((sum, balance) => sum + (balance.points || 0), 0)
      return { points: totalPoints, balances: data || [] }
    } catch (error) {
      console.error('Failed to fetch loyalty points:', error)
      throw error
    }
  },

  // get loyalty transactions
  getTransactions: async (params = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      let query = supabase
        .from('loyalty_transactions')
        .select(`
          *,
          shops (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      throw error
    }
  },

  // redeem points
  redeemPoints: async (points, rewardId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('id', rewardId)
        .single()

      if (rewardError) throw rewardError

      // Create transaction
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: user.id,
          shop_id: reward.shop_id,
          points_change: -points,
          type: 'redeemed',
        })
        .select()
        .single()

      if (error) throw error

      // Update balance
      const { data: balance } = await supabase
        .from('loyalty_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('shop_id', reward.shop_id)
        .single()

      if (balance) {
        await supabase
          .from('loyalty_balances')
          .update({ 
            points: balance.points - points,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('shop_id', reward.shop_id)
      }

      return data
    } catch (error) {
      console.error('Failed to redeem points:', error)
      throw error
    }
  },

  // get available rewards
  getRewards: async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select(`
          *,
          shops (name, logo_url)
        `)
        .eq('is_active', true)
        .order('points_required')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to fetch rewards:', error)
      throw error
    }
  },
}
