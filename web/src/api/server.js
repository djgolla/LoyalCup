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

      // admin endpoints
      this.namespace = "api/v1/admin";

      // admin dashboard
      this.get("/dashboard", () => {
        return {
          revenue: { total: 12450.50, change: 12.5, trend: "up" },
          orders: { total: 847, change: 8.2, trend: "up" },
          users: { total: 2341, change: 23.1, trend: "up" },
          shops: { total: 45, new: 2, trend: "up" },
          pending_actions: {
            shops_awaiting_approval: 3,
            reported_reviews: 2,
            support_tickets: 1,
          },
        };
      });

      // admin shops
      this.get("/shops", () => {
        return {
          shops: [
            { id: "1", name: "Corner Coffee Co", owner_email: "john@example.com", status: "active", featured: true, revenue: 2340.00, created_at: "2024-01-15" },
            { id: "2", name: "The Daily Grind", owner_email: "jane@example.com", status: "active", featured: false, revenue: 1890.00, created_at: "2024-02-20" },
            { id: "3", name: "New Bean Cafe", owner_email: "bob@example.com", status: "pending", featured: false, revenue: 0.00, created_at: "2024-12-01" },
            { id: "4", name: "Bad Coffee LLC", owner_email: "bad@example.com", status: "suspended", featured: false, revenue: 45.00, created_at: "2024-03-10" },
          ],
          total: 4,
        };
      });

      this.put("/shops/:id/status", () => ({ status: "success" }));
      this.put("/shops/:id/featured", () => ({ status: "success" }));
      this.delete("/shops/:id", () => ({ status: "success" }));

      // admin users
      this.get("/users", () => {
        return {
          users: [
            { id: "u1", email: "customer@example.com", full_name: "Alice Johnson", role: "customer", status: "active", created_at: "2024-03-10" },
            { id: "u2", email: "owner@example.com", full_name: "Bob Smith", role: "shop_owner", status: "active", created_at: "2024-01-15" },
            { id: "u3", email: "worker@example.com", full_name: "Charlie Brown", role: "shop_worker", status: "active", created_at: "2024-04-05" },
            { id: "u4", email: "suspended@example.com", full_name: "Dan Wilson", role: "customer", status: "suspended", created_at: "2024-02-01" },
          ],
          total: 4,
        };
      });

      this.put("/users/:id/role", () => ({ status: "success" }));
      this.put("/users/:id/status", () => ({ status: "success" }));
      this.delete("/users/:id", () => ({ status: "success" }));

      // admin analytics
      this.get("/analytics/overview", () => ({ revenue_trend: [], order_trend: [], top_shops: [] }));
      this.get("/analytics/orders", () => ({ total: 847, by_status: {}, trend: [] }));
      this.get("/analytics/revenue", () => ({ total: 12450.50, by_shop: [], trend: [] }));
      this.get("/analytics/growth", () => ({ users: { total: 2341 }, shops: { total: 45 } }));

      // admin settings
      this.get("/settings", () => {
        return {
          platform_name: "LoyalCup",
          global_loyalty_enabled: true,
          default_points_per_dollar: 10,
          max_shops_per_owner: 5,
          shop_approval_required: true,
          maintenance_mode: false,
        };
      });
      this.put("/settings", () => ({ status: "success" }));

      // admin audit log
      this.get("/audit-log", () => {
        return {
          logs: [
            {
              id: "log1",
              admin_email: "admin@loyalcup.com",
              action: "shop_status_changed_active",
              entity_type: "shop",
              entity_id: "shop1",
              details: { new_status: "active" },
              ip_address: "192.168.1.1",
              created_at: "2024-12-04T10:30:00Z",
            },
            {
              id: "log2",
              admin_email: "admin@loyalcup.com",
              action: "user_role_changed",
              entity_type: "user",
              entity_id: "user1",
              details: { new_role: "shop_owner" },
              ip_address: "192.168.1.1",
              created_at: "2024-12-04T09:15:00Z",
            },
          ],
          total: 2,
        };
      });

      this.passthrough();
    },
  });

  return server;
}
