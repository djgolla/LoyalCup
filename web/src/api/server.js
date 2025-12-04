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

      // loyalty endpoints
      
      // get all balances
      this.get("/loyalty/balances", (schema) => {
        return { balances: schema.db.loyaltyBalances };
      });

      // get balance for specific shop
      this.get("/loyalty/balances/:shopId", (schema, request) => {
        const shopId = request.params.shopId;
        const balance = schema.db.loyaltyBalances.find(
          b => b.shop_id === shopId
        );
        return {
          shop_id: shopId,
          points: balance ? balance.points : 0
        };
      });

      // get transactions
      this.get("/loyalty/transactions", (schema) => {
        return { transactions: schema.db.loyaltyTransactions };
      });

      // get available rewards
      this.get("/loyalty/rewards", (schema) => {
        const balances = schema.db.loyaltyBalances;
        const allRewards = schema.db.loyaltyRewards;
        
        // filter rewards user can afford
        const availableRewards = allRewards.map(reward => {
          const balance = balances.find(b => b.shop_id === reward.shop_id);
          const userPoints = balance ? balance.points : 0;
          return {
            ...reward,
            user_points: userPoints,
            can_redeem: userPoints >= reward.points_required
          };
        });
        
        return { rewards: availableRewards };
      });

      // redeem reward
      this.post("/loyalty/redeem", (schema, request) => {
        const { reward_id } = JSON.parse(request.requestBody);
        const reward = schema.db.loyaltyRewards.find(r => r.id === reward_id);
        
        if (!reward) {
          return new Response(404, {}, { detail: "Reward not found" });
        }
        
        const balance = schema.db.loyaltyBalances.find(
          b => b.shop_id === reward.shop_id
        );
        
        if (!balance || balance.points < reward.points_required) {
          return new Response(400, {}, { detail: "Insufficient points" });
        }
        
        // deduct points
        balance.points -= reward.points_required;
        
        return {
          reward,
          points_deducted: reward.points_required,
          new_balance: balance.points
        };
      });

      // shop loyalty settings
      this.get("/shops/:shopId/loyalty/settings", (schema, request) => {
        const shopId = request.params.shopId;
        const settings = schema.db.shopLoyaltySettings[shopId];
        return settings || {
          shop_id: shopId,
          points_per_dollar: 10,
          participates_in_global_loyalty: true
        };
      });

      this.put("/shops/:shopId/loyalty/settings", (schema, request) => {
        const shopId = request.params.shopId;
        const settings = JSON.parse(request.requestBody);
        schema.db.shopLoyaltySettings[shopId] = { shop_id: shopId, ...settings };
        return schema.db.shopLoyaltySettings[shopId];
      });

      // shop rewards
      this.get("/shops/:shopId/loyalty/rewards", (schema, request) => {
        const shopId = request.params.shopId;
        const rewards = schema.db.loyaltyRewards.filter(
          r => r.shop_id === shopId
        );
        return { rewards };
      });

      this.post("/shops/:shopId/loyalty/rewards", (schema, request) => {
        const reward = JSON.parse(request.requestBody);
        const shopId = request.params.shopId;
        const newReward = {
          id: `reward_${Date.now()}`,
          shop_id: shopId,
          ...reward,
          is_active: true
        };
        schema.db.loyaltyRewards.push(newReward);
        return newReward;
      });

      this.put("/shops/:shopId/loyalty/rewards/:rewardId", (schema, request) => {
        const rewardId = request.params.rewardId;
        const updates = JSON.parse(request.requestBody);
        const reward = schema.db.loyaltyRewards.find(r => r.id === rewardId);
        
        if (reward) {
          Object.assign(reward, updates);
          return reward;
        }
        return new Response(404, {}, { detail: "Reward not found" });
      });

      this.delete("/shops/:shopId/loyalty/rewards/:rewardId", (schema, request) => {
        const rewardId = request.params.rewardId;
        const index = schema.db.loyaltyRewards.findIndex(r => r.id === rewardId);
        
        if (index !== -1) {
          schema.db.loyaltyRewards.splice(index, 1);
          return { message: "Reward deleted" };
        }
        return new Response(404, {}, { detail: "Reward not found" });
      });

      // shop loyalty stats
      this.get("/shops/:shopId/loyalty/stats", (schema, request) => {
        const shopId = request.params.shopId;
        const stats = schema.db.shopLoyaltyStats[shopId];
        return stats || {
          total_points_issued: 0,
          points_redeemed: 0,
          active_members: 0,
          rewards_count: 0
        };
      });

      this.passthrough();
    },
  });

  return server;
}
