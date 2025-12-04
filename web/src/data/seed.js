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

  // Shop & Menu Management Data
  shops: [
    {
      id: "shop-1",
      name: "The Loyal Cup - Downtown",
      description: "Artisan coffee in the heart of the city",
      address: "123 Main St",
      city: "Seattle",
      state: "WA",
      phone: "(555) 123-4567",
      hours: {
        monday: { open: "7:00", close: "19:00" },
        tuesday: { open: "7:00", close: "19:00" },
        wednesday: { open: "7:00", close: "19:00" },
        thursday: { open: "7:00", close: "19:00" },
        friday: { open: "7:00", close: "20:00" },
        saturday: { open: "8:00", close: "20:00" },
        sunday: { open: "8:00", close: "18:00" }
      },
      loyalty_points_per_dollar: 10,
      participates_in_global_loyalty: true
    }
  ],

  menuCategories: [
    { id: "cat-1", shopId: "shop-1", name: "Hot Drinks", display_order: 1 },
    { id: "cat-2", shopId: "shop-1", name: "Cold Drinks", display_order: 2 },
    { id: "cat-3", shopId: "shop-1", name: "Bakery", display_order: 3 },
    { id: "cat-4", shopId: "shop-1", name: "Food", display_order: 4 }
  ],

  menuItems: [
    { 
      id: "item-1", 
      shopId: "shop-1", 
      category_id: "cat-1",
      name: "Hot Coffee", 
      description: "Fresh brewed dark roast",
      base_price: 4.50,
      is_available: true,
      display_order: 1
    },
    { 
      id: "item-2", 
      shopId: "shop-1", 
      category_id: "cat-1",
      name: "Cappuccino", 
      description: "Espresso with steamed milk foam",
      base_price: 4.00,
      is_available: true,
      display_order: 2
    },
    { 
      id: "item-3", 
      shopId: "shop-1", 
      category_id: "cat-1",
      name: "Vanilla Latte", 
      description: "Espresso with vanilla and steamed milk",
      base_price: 5.75,
      is_available: true,
      display_order: 3
    },
    { 
      id: "item-4", 
      shopId: "shop-1", 
      category_id: "cat-2",
      name: "Iced Latte", 
      description: "Espresso with cold milk over ice",
      base_price: 5.00,
      is_available: true,
      display_order: 1
    },
    { 
      id: "item-5", 
      shopId: "shop-1", 
      category_id: "cat-2",
      name: "Cold Brew", 
      description: "Smooth cold-steeped coffee",
      base_price: 5.25,
      is_available: true,
      display_order: 2
    },
    { 
      id: "item-6", 
      shopId: "shop-1", 
      category_id: "cat-3",
      name: "Blueberry Muffin", 
      description: "Fresh baked daily",
      base_price: 3.50,
      is_available: true,
      display_order: 1
    },
    { 
      id: "item-7", 
      shopId: "shop-1", 
      category_id: "cat-3",
      name: "Chocolate Croissant", 
      description: "Buttery flaky pastry",
      base_price: 4.00,
      is_available: true,
      display_order: 2
    }
  ],

  customizationTemplates: [
    {
      id: "custom-1",
      shopId: "shop-1",
      name: "Size",
      type: "single_select",
      is_required: true,
      applies_to: "all_items",
      options: [
        { name: "Small", price: 0 },
        { name: "Medium", price: 0.50 },
        { name: "Large", price: 1.00 }
      ]
    },
    {
      id: "custom-2",
      shopId: "shop-1",
      name: "Milk Options",
      type: "single_select",
      is_required: false,
      applies_to: "all_items",
      options: [
        { name: "Whole Milk", price: 0 },
        { name: "Oat Milk", price: 0.75 },
        { name: "Almond Milk", price: 0.75 },
        { name: "Soy Milk", price: 0.50 }
      ]
    },
    {
      id: "custom-3",
      shopId: "shop-1",
      name: "Add-ons",
      type: "multi_select",
      is_required: false,
      applies_to: "all_items",
      options: [
        { name: "Extra Shot", price: 1.00 },
        { name: "Whipped Cream", price: 0.50 },
        { name: "Caramel Drizzle", price: 0.50 }
      ]
    }
  ]
};
