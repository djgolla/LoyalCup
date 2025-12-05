// loyalty.js
// API calls for loyalty system

const API_BASE = '/api';

export const loyaltyApi = {
  // customer endpoints
  
  // get all user's loyalty balances
  getBalances: async () => {
    const response = await fetch(`${API_BASE}/loyalty/balances`);
    return response.json();
  },

  // get balance at specific shop
  getBalance: async (shopId) => {
    const response = await fetch(`${API_BASE}/loyalty/balances/${shopId}`);
    return response.json();
  },

  // get transaction history
  getTransactions: async (limit = 50) => {
    const response = await fetch(`${API_BASE}/loyalty/transactions?limit=${limit}`);
    return response.json();
  },

  // get available rewards
  getRewards: async () => {
    const response = await fetch(`${API_BASE}/loyalty/rewards`);
    return response.json();
  },

  // redeem reward
  redeemReward: async (rewardId) => {
    const response = await fetch(`${API_BASE}/loyalty/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reward_id: rewardId })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to redeem reward');
    }
    return response.json();
  },

  // shop owner endpoints
  
  // get shop loyalty settings
  getShopSettings: async (shopId) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/settings`);
    return response.json();
  },

  // update shop loyalty settings
  updateShopSettings: async (shopId, settings) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return response.json();
  },

  // get shop's rewards
  getShopRewards: async (shopId) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/rewards`);
    return response.json();
  },

  // create reward
  createReward: async (shopId, reward) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/rewards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reward)
    });
    return response.json();
  },

  // update reward
  updateReward: async (shopId, rewardId, updates) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/rewards/${rewardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  },

  // delete reward
  deleteReward: async (shopId, rewardId) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/rewards/${rewardId}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // get shop loyalty stats
  getShopStats: async (shopId) => {
    const response = await fetch(`${API_BASE}/shops/${shopId}/loyalty/stats`);
    return response.json();
  },

  // admin endpoints
  
  // get global loyalty stats
  getGlobalStats: async () => {
    const response = await fetch(`${API_BASE}/admin/loyalty/global-stats`);
    return response.json();
  }
};
