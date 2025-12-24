// Worker Daily Summary page
// View daily order and revenue summary

import { useEffect, useState } from "react";
import { DollarSign, Package, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import Loading from "../../components/Loading";
import { getShopOrderStats } from "../../api/orders";
import { useShop } from "../../context/ShopContext";

export default function DailySummary() {
  const { shopId, loading: shopLoading } = useShop();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");

  useEffect(() => {
    if (shopId) {
      loadStats();
    }
  }, [shopId, period]);

  const loadStats = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      const response = await getShopOrderStats(shopId, period);
      setStats(response);
    } catch (error) {
      console.error("Failed to load stats:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  if (shopLoading || loading) {
    return <Loading />;
  }

  if (!shopId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 dark:text-neutral-400">
          You need to be associated with a shop to view daily summary
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Daily Summary
          </h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">
            Your shift performance and statistics
          </p>
        </div>

        {/* Period Selector */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${stats?.revenue?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <TrendingUp size={16} />
            <span>+12% from yesterday</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Package size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Orders Completed</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.orders_completed || 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
            <TrendingUp size={16} />
            <span>+5 from yesterday</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <Clock size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Avg. Prep Time</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.avg_prep_time || '0'} min
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-neutral-400">
            <span>Target: 8 min</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Package size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Items Made</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.items_made || 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400">
            <TrendingUp size={16} />
            <span>+15 from yesterday</span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Breakdown
        </h2>
        
        <div className="space-y-4">
          {/* Orders by Status */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-neutral-400">Orders Completed</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats?.orders_completed || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: '75%' }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-neutral-400">Orders in Progress</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats?.orders_in_progress || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: '20%' }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-neutral-400">Orders Pending</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats?.orders_pending || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: '5%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Popular Items */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Most Popular Items
        </h2>
        
        <div className="space-y-3">
          {(stats?.popular_items || []).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  {item.count} orders
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  ${item.revenue?.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          
          {(!stats?.popular_items || stats.popular_items.length === 0) && (
            <p className="text-center text-gray-500 dark:text-neutral-400 py-4">
              No orders yet for this period
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
