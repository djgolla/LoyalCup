// loyalty.js
// API calls for loyalty system

import { API_V1, parseJsonResponse } from './client';

const API_BASE = API_V1;

export const loyaltyApi = {
  // customer endpoints
  
  // get all user's loyalty balances
  getBalances: async () => {
    const response = await fetch(`${API_BASE}/loyalty/balances`);
    return parseJsonResponse(response);
  },

  // get balance at specific shop
  getBalance: async (shopId) => {
    const response = await fetch(`${API_BASE}/loyalty/balances/${shopId}`);
    return parseJsonResponse(response);
  },

  // get transaction history
  getTransactions: async (limit = 50) => {
    const response = await fetch(`${API_BASE}/loyalty/transactions?limit=${limit}`);
    return parseJsonResponse(response);
  },

  // get available rewards
  getRewards: async () => {
    const response = await fetch(`${API_BASE}/loyalty/rewards`);
    return parseJsonResponse(response);
  },

  // redeem reward
  redeemReward: async (rewardId) => {
    const response = await fetch(`${API_BASE}/loyalty/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reward_id: rewardId })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to redeem reward');
    }
    return parseJsonResponse(response);
  },

  // shop owner endpoints
  
  // get shop loyalty settings
  getShopSettings: async (shopId) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/settings`);
    return parseJsonResponse(response);
  },

  // update shop loyalty settings
  updateShopSettings: async (shopId, settings) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return parseJsonResponse(response);
  },

  // get shop's rewards
  getShopRewards: async (shopId) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/rewards`);
    return parseJsonResponse(response);
  },

  // create reward
  createReward: async (shopId, reward) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/rewards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reward)
    });
    return parseJsonResponse(response);
  },

  // update reward
  updateReward: async (shopId, rewardId, updates) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/rewards/${rewardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return parseJsonResponse(response);
  },

  // delete reward
  deleteReward: async (shopId, rewardId) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/rewards/${rewardId}`, {
      method: 'DELETE'
    });
    return parseJsonResponse(response);
  },

  // get shop loyalty stats
  getShopStats: async (shopId) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/stats`);
    return parseJsonResponse(response);
  },

  // admin endpoints
  
  // get global loyalty stats
  getGlobalStats: async () => {
    const response = await fetch(`${API_BASE}/admin/loyalty/global-stats`);
    return parseJsonResponse(response);
  }
};
