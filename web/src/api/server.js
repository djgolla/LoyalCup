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

      // shops endpoints
      this.get("/shops", (schema) => {
        return { shops: schema.db.shops };
      });

      this.get("/shops/:id", (schema, request) => {
        let id = request.params.id;
        let shop = schema.db.shops.find(id);
        return { shop };
      });

      this.get("/shops/:id/menu", (schema, request) => {
        let shopId = request.params.id;
        let items = schema.db.menuItems.where({ shop_id: shopId });
        return { items };
      });

      // order endpoints (v1 API)
      this.namespace = "api/v1";

      this.post("/orders", (schema, request) => {
        let attrs = JSON.parse(request.requestBody);
        
        // create order with mock data
        let order = {
          id: `order-${Date.now()}`,
          shop_id: attrs.shop_id,
          customer_id: "customer-temp",
          status: "pending",
          subtotal: 10.00,
          tax: 0.80,
          total: 10.80,
          created_at: new Date().toISOString(),
          items: attrs.items
        };
        
        schema.db.orders.insert(order);
        return { order };
      });

      this.get("/orders/:id", (schema, request) => {
        let id = request.params.id;
        let order = schema.db.orders.find(id);
        return { order };
      });

      this.get("/orders/:id/status", (schema, request) => {
        let id = request.params.id;
        let order = schema.db.orders.find(id);
        return { 
          status: order?.status || "pending",
          updated_at: new Date().toISOString()
        };
      });

      this.get("/shops/:shopId/orders/queue", (schema, request) => {
        let shopId = request.params.shopId;
        let allOrders = schema.db.orders.where({ shop_id: shopId });
        
        return {
          pending: allOrders.filter(o => o.status === "pending"),
          accepted: allOrders.filter(o => o.status === "accepted"),
          preparing: allOrders.filter(o => o.status === "preparing"),
          ready: allOrders.filter(o => o.status === "ready")
        };
      });

      this.put("/shops/:shopId/orders/:orderId/status", (schema, request) => {
        let orderId = request.params.orderId;
        let attrs = JSON.parse(request.requestBody);
        
        let order = schema.db.orders.find(orderId);
        if (order) {
          order.status = attrs.status;
          order.updated_at = new Date().toISOString();
          schema.db.orders.update(orderId, order);
        }
        
        return { message: "Status updated", status: attrs.status };
      });

      // legacy endpoints
      this.namespace = "api";

      this.get("/orders/:id", (schema, request) => {
        let id = request.params.id;
        let order = schema.db.orders.find(id);
        return { order };
      });

      this.get("/orders", (schema) => {
        return { orders: schema.db.orders };
      });

      this.get("/menu", (schema) => schema.db.menu);

      this.get("/account", (schema) => schema.db.account[0]);

      this.get("/stats", (schema) => schema.db.stats[0]);

      // analytics endpoints
      this.get("/analytics/top-today", () => {
        return {
          items: [
            { name: "Iced Vanilla Latte", count: 42 },
            { name: "Caramel Macchiato", count: 31 },
            { name: "Cold Brew", count: 26 }
          ]
        };
      });

      this.get("/analytics/orders-today", () => {
        return {
          hours: ["7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM"],
          values: [4, 10, 18, 26, 21, 12]
        };
      });

      this.get("/analytics/revenue-week", () => {
        return {
          days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          values: [120, 240, 180, 310, 400, 280, 350]
        };
      });

      this.passthrough();
    }
  });

  return server;
}
