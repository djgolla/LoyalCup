// seed.js
// mock database for the fake backend

export default {
  shops: [
    {
      id: "shop-1",
      name: "Corner Coffee Co",
      description: "Your neighborhood coffee shop with artisan brews",
      logo_url: null,
      banner_url: null,
      address: "123 Main St, Seattle, WA",
      city: "Seattle",
      state: "WA",
      phone: "(206) 555-0100",
      loyalty_points_per_dollar: 10
    },
    {
      id: "shop-2",
      name: "Brew & Bites",
      description: "Coffee and pastries made with love",
      logo_url: null,
      banner_url: null,
      address: "456 Pike St, Seattle, WA",
      city: "Seattle",
      state: "WA",
      phone: "(206) 555-0200",
      loyalty_points_per_dollar: 5
    },
    {
      id: "shop-3",
      name: "Daily Grind",
      description: "Premium coffee, daily specials",
      logo_url: null,
      banner_url: null,
      address: "789 Broadway, Seattle, WA",
      city: "Seattle",
      state: "WA",
      phone: "(206) 555-0300",
      loyalty_points_per_dollar: 8
    }
  ],

  menuItems: [
    // shop-1 menu
    { id: "item-1", shop_id: "shop-1", name: "Hot Coffee", category: "Drinks", base_price: 4.50, description: "Fresh brewed daily" },
    { id: "item-2", shop_id: "shop-1", name: "Iced Latte", category: "Drinks", base_price: 5.00, description: "Smooth and refreshing" },
    { id: "item-3", shop_id: "shop-1", name: "Cappuccino", category: "Drinks", base_price: 4.00, description: "Classic Italian style" },
    { id: "item-4", shop_id: "shop-1", name: "Mocha", category: "Drinks", base_price: 5.50, description: "Chocolate and espresso" },
    { id: "item-5", shop_id: "shop-1", name: "Blueberry Muffin", category: "Bakery", base_price: 3.50, description: "Made fresh daily" },
    { id: "item-6", shop_id: "shop-1", name: "Chocolate Croissant", category: "Bakery", base_price: 4.00, description: "Buttery and flaky" },
    
    // shop-2 menu
    { id: "item-7", shop_id: "shop-2", name: "Cold Brew", category: "Drinks", base_price: 5.25, description: "Smooth cold brew" },
    { id: "item-8", shop_id: "shop-2", name: "Vanilla Latte", category: "Drinks", base_price: 5.75, description: "Sweet vanilla flavor" },
    { id: "item-9", shop_id: "shop-2", name: "Banana Bread", category: "Bakery", base_price: 4.00, description: "Moist and delicious" },
    
    // shop-3 menu
    { id: "item-10", shop_id: "shop-3", name: "Americano", category: "Drinks", base_price: 3.75, description: "Bold espresso" },
    { id: "item-11", shop_id: "shop-3", name: "Caramel Macchiato", category: "Drinks", base_price: 6.00, description: "Layered perfection" }
  ],

  orders: [
    {
      id: "order-101",
      shop_id: "shop-1",
      customer_id: "customer-1",
      customer_name: "Professor Lei",
      created_at: "2025-12-02T08:32:00",
      status: "pending",
      subtotal: 11.57,
      tax: 0.93,
      total: 12.50,
      items: [
        { 
          id: "item-2",
          name: "Iced Latte", 
          quantity: 1, 
          unit_price: 5.00,
          total_price: 5.00,
          customizations: [] 
        },
        { 
          id: "item-5",
          name: "Blueberry Muffin", 
          quantity: 1, 
          unit_price: 3.50,
          total_price: 3.50,
          customizations: [] 
        },
        { 
          id: "item-2",
          name: "Extra Shot", 
          quantity: 1, 
          unit_price: 3.00,
          total_price: 3.07,
          customizations: [{ name: "Extra Shot", price: 1.00 }] 
        }
      ]
    },
    {
      id: "order-102",
      shop_id: "shop-1",
      customer_id: "customer-2",
      customer_name: "Daniel Golladay",
      created_at: "2025-12-02T09:10:00",
      status: "preparing",
      subtotal: 6.48,
      tax: 0.52,
      total: 7.00,
      items: [
        { 
          id: "item-3",
          name: "Cappuccino", 
          quantity: 1, 
          unit_price: 4.00,
          total_price: 4.00,
          customizations: [] 
        },
        { 
          name: "Chocolate Chip Cookie", 
          quantity: 1, 
          unit_price: 3.00,
          total_price: 3.00,
          customizations: [] 
        }
      ]
    },
    {
      id: "order-103",
      shop_id: "shop-1",
      customer_id: "customer-3",
      customer_name: "Billy Bob",
      created_at: "2025-12-02T09:42:00",
      status: "ready",
      subtotal: 4.17,
      tax: 0.33,
      total: 4.50,
      items: [
        { 
          id: "item-1",
          name: "Hot Coffee", 
          quantity: 1, 
          unit_price: 4.50,
          total_price: 4.50,
          customizations: [] 
        }
      ]
    }
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
    { id: 9, name: "Banana Bread", category: "Bakery", price: 4.00 }
  ],

  account: [
    {
      id: 1,
      name: "Manager Account",
      email: "manager@coffeeshop.com"
    }
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
        { id: 101, time: "8:32 AM" }
      ]
    }
  ]
};
