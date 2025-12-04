import { createServer } from "miragejs";
import seedData from "../data/seed";

export default function makeServer({ environment = "development" }) {
  let server = createServer({
    environment,

    seeds(server) {
      server.db.loadData(seedData);
    },

    routes() {
      this.namespace = "api";

      // get a single order details
      this.get("/orders/:id", (schema, request) => {
        let id = request.params.id;
        let order = schema.db.orders.find(id);
        return { order };
      });

      // orders -- pull single 
      this.get("/orders", (schema) => {
        return { orders: schema.db.orders };
      });

      // menu
      this.get("/menu", (schema) => schema.db.menu);

      // account
      this.get("/account", (schema) => schema.db.account[0]);

      // dashboard metrics
      this.get("/stats", (schema) => schema.db.stats[0]);

      // analytics - most ordered today
      this.get("/analytics/top-today", () => {
        return {
          items: [
            { name: "Iced Vanilla Latte", count: 42 },
            { name: "Caramel Macchiato", count: 31 },
            { name: "Cold Brew", count: 26 },
          ],
        };
      });

      // analytics - hourly orders today
      this.get("/analytics/orders-today", () => {
        return {
          hours: ["7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM"],
          values: [4, 10, 18, 26, 21, 12],
        };
      });

      // analytics - last 7 days revenue
      this.get("/analytics/revenue-week", () => {
        return {
          days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          values: [120, 240, 180, 310, 400, 280, 350],
        };
      });

      // ============================================================================
      // SHOP & MENU ENDPOINTS
      // ============================================================================

      // Shop list
      this.get("/v1/shops", (schema) => {
        return { shops: schema.db.shops || [] };
      });

      // Shop details
      this.get("/v1/shops/:id", (schema, request) => {
        const shopId = request.params.id;
        const shop = schema.db.shops?.find(shopId);
        const categories = schema.db.menuCategories?.where({ shopId }) || [];
        const items = schema.db.menuItems?.where({ shopId }) || [];
        
        return {
          shop: shop || {},
          menu: { categories, items }
        };
      });

      // Shop menu
      this.get("/v1/shops/:id/menu", (schema, request) => {
        const shopId = request.params.id;
        const categories = schema.db.menuCategories?.where({ shopId }) || [];
        const items = schema.db.menuItems?.where({ shopId }) || [];
        
        return { menu: { categories, items } };
      });

      // Shop analytics
      this.get("/v1/shops/:id/analytics", () => {
        return {
          analytics: {
            total_orders: 156,
            total_revenue: 3420.50,
            orders_today: 23,
            revenue_today: 287.50,
            avg_order_value: 12.50,
            top_items: [
              { name: "Iced Latte", count: 45 },
              { name: "Cappuccino", count: 32 },
              { name: "Cold Brew", count: 28 }
            ]
          }
        };
      });

      // Categories
      this.get("/v1/shops/:shopId/categories", (schema, request) => {
        const shopId = request.params.shopId;
        return { categories: schema.db.menuCategories?.where({ shopId }) || [] };
      });

      this.post("/v1/shops/:shopId/categories", (schema, request) => {
        const data = JSON.parse(request.requestBody);
        const category = schema.db.menuCategories.insert({
          id: Date.now().toString(),
          shopId: request.params.shopId,
          ...data
        });
        return { category };
      });

      // Menu items
      this.get("/v1/shops/:shopId/items", (schema, request) => {
        const shopId = request.params.shopId;
        return { items: schema.db.menuItems?.where({ shopId }) || [] };
      });

      this.post("/v1/shops/:shopId/items", (schema, request) => {
        const data = JSON.parse(request.requestBody);
        const item = schema.db.menuItems.insert({
          id: Date.now().toString(),
          shopId: request.params.shopId,
          ...data
        });
        return { item };
      });

      this.put("/v1/shops/:shopId/items/:itemId", (schema, request) => {
        const data = JSON.parse(request.requestBody);
        const item = schema.db.menuItems.update(request.params.itemId, data);
        return { item };
      });

      this.delete("/v1/shops/:shopId/items/:itemId", (schema, request) => {
        schema.db.menuItems.remove(request.params.itemId);
        return { success: true };
      });

      // Customizations
      this.get("/v1/shops/:shopId/customizations", (schema, request) => {
        const shopId = request.params.shopId;
        return { templates: schema.db.customizationTemplates?.where({ shopId }) || [] };
      });

      this.post("/v1/shops/:shopId/customizations", (schema, request) => {
        const data = JSON.parse(request.requestBody);
        const template = schema.db.customizationTemplates.insert({
          id: Date.now().toString(),
          shopId: request.params.shopId,
          ...data
        });
        return { template };
      });

      this.passthrough();
    },
  });

  return server;
}
