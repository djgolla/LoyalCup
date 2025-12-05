// Shop Owner Dashboard
// Overview with stats, quick actions, and recent activity

import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, TrendingUp, Users } from "lucide-react";
import StatsCard from "../../components/shop-owner/StatsCard";
import { getShopAnalytics } from "../../api/shops";
import Loading from "../../components/Loading";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await getShopAnalytics("shop-1");
      setAnalytics(response.analytics);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Today: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Orders Today"
          value={analytics?.orders_today || 0}
          icon={ShoppingBag}
          trend={12}
        />
        <StatsCard
          title="Revenue Today"
          value={`$${(analytics?.revenue_today || 0).toFixed(2)}`}
          icon={DollarSign}
          trend={8}
        />
        <StatsCard
          title="Total Orders"
          value={analytics?.total_orders || 0}
          icon={TrendingUp}
        />
        <StatsCard
          title="Avg Order Value"
          value={`$${(analytics?.avg_order_value || 0).toFixed(2)}`}
          icon={Users}
        />
      </div>

      {/* Top Items */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <h2 className="text-xl font-semibold mb-4">☕ Top Selling Items</h2>
        <div className="space-y-3">
          {analytics?.top_items?.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-neutral-800"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-500">
                  #{idx + 1}
                </span>
                <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
              </div>
              <span className="font-semibold text-amber-700 dark:text-amber-500">
                {item.count} orders
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="px-4 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition">
            Add New Item
          </button>
          <button className="px-4 py-3 bg-gray-200 dark:bg-neutral-800 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition">
            Manage Categories
          </button>
          <button className="px-4 py-3 bg-gray-200 dark:bg-neutral-800 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition">
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
