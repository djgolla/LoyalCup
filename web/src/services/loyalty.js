import { supabase } from '../lib/supabase';

/**
 * Get customer's global points balance
 */
export async function getGlobalPoints(customerId) {
  const { data, error } = await supabase
    .from('customer_global_points')
    .select('*')
    .eq('customer_id', customerId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching global points:', error);
    return null;
  }

  // If no record exists, return zero balance
  if (!data) {
    return {
      customer_id: customerId,
      total_earned: 0,
      total_spent: 0,
      current_balance: 0
    };
  }

  return data;
}

/**
 * Get customer's points for a specific shop
 */
export async function getShopPoints(customerId, shopId) {
  const { data, error } = await supabase
    .from('customer_shop_points')
    .select('*')
    .eq('customer_id', customerId)
    .eq('shop_id', shopId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching shop points:', error);
    return null;
  }

  if (!data) {
    return {
      customer_id: customerId,
      shop_id: shopId,
      total_earned: 0,
      total_spent: 0,
      current_balance: 0
    };
  }

  return data;
}

/**
 * Get all shop points for a customer
 */
export async function getAllShopPoints(customerId) {
  const { data, error } = await supabase
    .from('customer_shop_points')
    .select(`
      *,
      shop:shops(id, name, logo_url)
    `)
    .eq('customer_id', customerId)
    .gt('current_balance', 0)
    .order('current_balance', { ascending: false });

  if (error) {
    console.error('Error fetching all shop points:', error);
    return [];
  }

  return data || [];
}

/**
 * Award points after order completion
 */
export async function awardPointsForOrder(orderId, customerId, shopId, orderTotal) {
  try {
    // Get shop's loyalty settings
    const { data: shopSettings, error: settingsError } = await supabase
      .from('shop_loyalty_settings')
      .select('*')
      .eq('shop_id', shopId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching shop settings:', settingsError);
      return { success: false, error: settingsError };
    }

    // Default to global system if no settings exist
    const useGlobal = !shopSettings || shopSettings.use_global_system;
    const pointsPerDollar = useGlobal ? 10 : (shopSettings?.points_per_dollar || 5);
    const bonusMultiplier = shopSettings?.bonus_active ? (shopSettings.bonus_multiplier || 1.0) : 1.0;

    // Calculate points
    const basePoints = Math.floor(orderTotal * pointsPerDollar);
    const pointsToAward = Math.floor(basePoints * bonusMultiplier);

    console.log(`💰 Awarding ${pointsToAward} points (${basePoints} base × ${bonusMultiplier} multiplier)`);

    if (useGlobal) {
      // Award global points
      await awardGlobalPoints(customerId, shopId, orderId, pointsToAward);
    } else {
      // Award shop-specific points
      await awardShopSpecificPoints(customerId, shopId, orderId, pointsToAward);
    }

    return { success: true, points: pointsToAward, type: useGlobal ? 'global' : 'shop' };
  } catch (error) {
    console.error('Error awarding points:', error);
    return { success: false, error };
  }
}

/**
 * Award global points (internal helper)
 */
async function awardGlobalPoints(customerId, shopId, orderId, points) {
  // Get or create customer global points record
  let { data: pointsRecord, error: fetchError } = await supabase
    .from('customer_global_points')
    .select('*')
    .eq('customer_id', customerId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (!pointsRecord) {
    // Create new record
    const { data: newRecord, error: createError } = await supabase
      .from('customer_global_points')
      .insert({
        customer_id: customerId,
        total_earned: points,
        total_spent: 0,
        current_balance: points
      })
      .select()
      .single();

    if (createError) throw createError;
    pointsRecord = newRecord;
  } else {
    // Update existing record
    const { error: updateError } = await supabase
      .from('customer_global_points')
      .update({
        total_earned: pointsRecord.total_earned + points,
        current_balance: pointsRecord.current_balance + points,
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customerId);

    if (updateError) throw updateError;
    pointsRecord.current_balance += points;
  }

  // Record transaction
  await supabase
    .from('points_transactions')
    .insert({
      customer_id: customerId,
      shop_id: shopId,
      order_id: orderId,
      type: 'earned',
      points_type: 'global',
      amount: points,
      balance_after: pointsRecord.current_balance,
      description: `Earned from order`
    });
}

/**
 * Award shop-specific points (internal helper)
 */
async function awardShopSpecificPoints(customerId, shopId, orderId, points) {
  // Get or create customer shop points record
  let { data: pointsRecord, error: fetchError } = await supabase
    .from('customer_shop_points')
    .select('*')
    .eq('customer_id', customerId)
    .eq('shop_id', shopId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (!pointsRecord) {
    // Create new record
    const { data: newRecord, error: createError } = await supabase
      .from('customer_shop_points')
      .insert({
        customer_id: customerId,
        shop_id: shopId,
        total_earned: points,
        total_spent: 0,
        current_balance: points
      })
      .select()
      .single();

    if (createError) throw createError;
    pointsRecord = newRecord;
  } else {
    // Update existing record
    const { error: updateError } = await supabase
      .from('customer_shop_points')
      .update({
        total_earned: pointsRecord.total_earned + points,
        current_balance: pointsRecord.current_balance + points,
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customerId)
      .eq('shop_id', shopId);

    if (updateError) throw updateError;
    pointsRecord.current_balance += points;
  }

  // Record transaction
  await supabase
    .from('points_transactions')
    .insert({
      customer_id: customerId,
      shop_id: shopId,
      order_id: orderId,
      type: 'earned',
      points_type: 'shop',
      amount: points,
      balance_after: pointsRecord.current_balance,
      description: `Earned from order`
    });
}

/**
 * Get points transaction history
 */
export async function getPointsHistory(customerId, limit = 50) {
  const { data, error } = await supabase
    .from('points_transactions')
    .select(`
      *,
      shop:shops(name, logo_url)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching points history:', error);
    return [];
  }

  return data || [];
}

/**
 * Redeem points for discount
 */
export async function redeemPoints(customerId, shopId, pointsToRedeem, pointsType = 'global') {
  try {
    // Validate points balance
    const balance = pointsType === 'global' 
      ? await getGlobalPoints(customerId)
      : await getShopPoints(customerId, shopId);

    if (!balance || balance.current_balance < pointsToRedeem) {
      return { success: false, error: 'Insufficient points' };
    }

    // Get conversion rate (100 points = $1 by default)
    const dollarValue = pointsToRedeem * 0.01;

    // Deduct points
    if (pointsType === 'global') {
      const { error } = await supabase
        .from('customer_global_points')
        .update({
          total_spent: balance.total_spent + pointsToRedeem,
          current_balance: balance.current_balance - pointsToRedeem,
          updated_at: new Date().toISOString()
        })
        .eq('customer_id', customerId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('customer_shop_points')
        .update({
          total_spent: balance.total_spent + pointsToRedeem,
          current_balance: balance.current_balance - pointsToRedeem,
          updated_at: new Date().toISOString()
        })
        .eq('customer_id', customerId)
        .eq('shop_id', shopId);

      if (error) throw error;
    }

    // Record transaction
    await supabase
      .from('points_transactions')
      .insert({
        customer_id: customerId,
        shop_id: shopId,
        type: 'redeemed',
        points_type: pointsType,
        amount: -pointsToRedeem,
        balance_after: balance.current_balance - pointsToRedeem,
        description: `Redeemed for $${dollarValue.toFixed(2)} discount`
      });

    return { 
      success: true, 
      pointsRedeemed: pointsToRedeem, 
      discountAmount: dollarValue 
    };
  } catch (error) {
    console.error('Error redeeming points:', error);
    return { success: false, error };
  }
}