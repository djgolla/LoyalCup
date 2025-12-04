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

      this.passthrough();
    },
  });

  return server;
}
