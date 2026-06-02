/**
 * Loyalty service — thin client over /api/v1/loyalty/*
 *
 * SHOP-SPECIFIC ONLY. There is no global/cross-shop program. Points are earned
 * and redeemed per shop. This client never writes balances — all mutations go
 * through the backend payment flow.
 */
import { supabase } from '../lib/supabase';
import { apiClient } from './apiClient';

async function _token() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// ── public reads (no auth needed)
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

/**
 * Total points a customer holds across all their shops (for profile summary).
 * Returns a single number — the sum of every shop balance.
 */
export async function getTotalPoints() {
  try {
    const me = await getMyLoyalty();
    return (me.shops || []).reduce((sum, s) => sum + (s.current_balance || 0), 0);
  } catch {
    return 0;
  }
}