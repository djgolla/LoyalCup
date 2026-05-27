/**
 * Loyalty service — thin client over /api/v1/loyalty/*
 *
 * IMPORTANT: never writes balances from the client anymore (the prior version
 * did, which RLS allowed — that was a duping risk). All mutations go through
 * the backend payment flow.
 */
import { supabase } from '../lib/supabase';
import { apiClient } from './apiClient';

async function _token() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// ── public reads (no auth needed)
export async function getGlobalConfig() {
  return apiClient.get('/api/v1/loyalty/global-config');
}
export async function getShopConfig(shopId) {
  return apiClient.get(`/api/v1/loyalty/shop-config/${shopId}`);
}

// ── customer reads (auth)
export async function getMyLoyalty() {
  const token = await _token();
  return apiClient.get('/api/v1/loyalty/me', token);
}
export async function getBalanceForShop(shopId) {
  const token = await _token();
  return apiClient.get(`/api/v1/loyalty/balance/${shopId}`, token);
}
export async function getTransactions(limit = 50) {
  const token = await _token();
  return apiClient.get(`/api/v1/loyalty/transactions?limit=${limit}`, token);
}
export async function previewRedeem({ shopId, subtotalCents, requestedPoints }) {
  const token = await _token();
  return apiClient.post('/api/v1/loyalty/preview-redeem', {
    shop_id:          shopId,
    subtotal_cents:   subtotalCents,
    requested_points: requestedPoints,
  }, token);
}

// ── legacy helper kept for any old screens that just want a number
export async function getGlobalPoints(customerId) {
  try {
    const me = await getMyLoyalty();
    return {
      customer_id:     customerId,
      total_earned:    me.global.total_earned    || 0,
      total_spent:     me.global.total_spent     || 0,
      current_balance: me.global.current_balance || 0,
    };
  } catch {
    return { customer_id: customerId, total_earned: 0, total_spent: 0, current_balance: 0 };
  }
}