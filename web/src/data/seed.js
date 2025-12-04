// seed.js
// mock database for the fake backend

export default {
  orders: [
    {
      id: 101,
      customer: "Professor Lei",
      time: "2025-12-02T08:32:00", // FIXED valid ISO time
      status: "pending",
      total: 12.50,
      items: [
        { name: "Iced Latte", qty: 1, price: 5.00 },        // added qty
        { name: "Blueberry Muffin", qty: 1, price: 3.50 }, // added qty
        { name: "Extra Shot", qty: 1, price: 4.00 },       // added qty
      ],
    },
    {
      id: 102,
      customer: "Daniel Golladay",
      time: "2025-12-02T09:10:00",
      status: "preparing",
      total: 7.00,
      items: [
        { name: "Cappuccino", qty: 1, price: 4.00 },
        { name: "Chocolate Chip Cookie", qty: 1, price: 3.00 },
      ],
    },
    {
      id: 103,
      customer: "Billy Bob",
      time: "2025-12-02T09:42:00",
      status: "ready",
      total: 4.50,
      items: [
        { name: "Hot Coffee", qty: 1, price: 4.50 }
      ],
    },
    {
      id: 104,
      customer: "Joe",
      time: "2025-12-02T10:15:00",
      status: "completed",
      total: 9.75,
      items: [
        { name: "Vanilla Latte", qty: 1, price: 5.75 },
        { name: "Banana Bread", qty: 1, price: 4.00 },
      ],
    },
  ],

  menu: [
    { id: 1, name: "Hot Coffee", category: "Drinks", price: 4.50 },
    { id: 2, name: "Iced Latte", category: "Drinks", price: 5.00 },
    { id: 3, name: "Cold Brew", category: "Drinks", price: 5.25 },
    { id: 4, name: "Vanilla Latte", category: "Drinks", price: 5.75 },
    { id: 5, name: "Cappuccino", category: "Drinks", price: 4.00 },
    { id: 6, name: "Mocha", category: "Drinks", price: 5.50 },

    { id: 7, name: "Blueberry Muffin", category: "Bakery", price: 3.50 },
    { id: 8, name: "Chocolate Croissant", category: "Bakery", price: 4.00 },
    { id: 9, name: "Banana Bread", category: "Bakery", price: 4.00 },
  ],

  account: [
    {
      id: 1,
      name: "Manager Account",
      email: "manager@coffeeshop.com",
    },
  ],

  stats: [
    {
      totalOrders: 47,
      revenueToday: 312.40,
      activeCustomers: 21,
      recentOrders: [
        { id: 104, time: "10:15 AM" },
        { id: 103, time: "9:42 AM" },
        { id: 102, time: "9:10 AM" },
        { id: 101, time: "8:32 AM" },
      ],
    },
  ],

  // loyalty balances
  loyaltyBalances: [
    { id: 1, user_id: 'user_1', shop_id: null, shop_name: 'Global', points: 230 },
    { id: 2, user_id: 'user_1', shop_id: 'shop_1', shop_name: 'Corner Coffee Co', points: 145 },
    { id: 3, user_id: 'user_1', shop_id: 'shop_2', shop_name: 'The Daily Grind', points: 52 },
    { id: 4, user_id: 'user_1', shop_id: 'shop_3', shop_name: 'Brewed Awakening', points: 12 },
  ],

  // loyalty rewards
  loyaltyRewards: [
    {
      id: 'reward_1',
      shop_id: 'shop_1',
      name: 'Free Size Upgrade',
      description: 'Upgrade any drink to a larger size',
      points_required: 150,
      is_active: true
    },
    {
      id: 'reward_2',
      shop_id: 'shop_1',
      name: 'Free Pastry',
      description: 'Any pastry on the menu',
      points_required: 100,
      is_active: true
    },
    {
      id: 'reward_3',
      shop_id: 'shop_1',
      name: 'Free Any Drink',
      description: 'Any drink on the menu',
      points_required: 250,
      is_active: true
    },
    {
      id: 'reward_4',
      shop_id: 'shop_2',
      name: '$2 Off',
      description: '$2 off any purchase',
      points_required: 100,
      is_active: true
    },
    {
      id: 'reward_5',
      shop_id: 'shop_2',
      name: 'Free Cookie',
      description: 'Any cookie',
      points_required: 50,
      is_active: true
    },
  ],

  // loyalty transactions
  loyaltyTransactions: [
    {
      id: 'trans_1',
      user_id: 'user_1',
      shop_id: 'shop_1',
      order_id: 101,
      points_change: 50,
      type: 'earned',
      created_at: '2025-12-01T10:00:00'
    },
    {
      id: 'trans_2',
      user_id: 'user_1',
      shop_id: null,
      order_id: 101,
      points_change: 12,
      type: 'earned',
      created_at: '2025-12-01T10:00:00'
    },
    {
      id: 'trans_3',
      user_id: 'user_1',
      shop_id: 'shop_2',
      order_id: null,
      points_change: -50,
      type: 'redeemed',
      created_at: '2025-11-28T14:30:00'
    },
    {
      id: 'trans_4',
      user_id: 'user_1',
      shop_id: 'shop_1',
      order_id: 102,
      points_change: 35,
      type: 'earned',
      created_at: '2025-11-25T09:15:00'
    },
  ],

  // shop loyalty settings
  shopLoyaltySettings: {
    shop_123: {
      shop_id: 'shop_123',
      points_per_dollar: 10,
      participates_in_global_loyalty: true
    }
  },

  // shop loyalty stats
  shopLoyaltyStats: {
    shop_123: {
      total_points_issued: 12450,
      points_redeemed: 3200,
      active_members: 89,
      rewards_count: 3
    }
  }
};
