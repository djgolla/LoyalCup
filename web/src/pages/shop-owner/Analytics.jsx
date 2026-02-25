// Analytics.jsx
// Shop analytics and reports

import { useState, useEffect } from "react";
import { useShop } from "../../context/ShopContext";
import supabase from "../../lib/supabase";
import { toast } from "sonner";
import Loading from "../../components/Loading";
import { DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

export default function Analytics() {
  const { shopId, loading: shopLoading } = useShop();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    total_orders: 0,
    total_revenue: 0,
    orders_today: 0,
    revenue_today: 0,
    avg_order_value: 0,
  });

  useEffect(() => {
    if (shopId) {
      loadAnalytics();
    }
  }, [shopId]);

  const loadAnalytics = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      // Get all completed orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('shop_id', shopId)
        .eq('status', 'completed');

      if (ordersError) throw ordersError;

      const ordersData = orders || [];
      const total_orders = ordersData.length;
      const total_revenue = ordersData.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      const avg_order_value = total_orders > 0 ? total_revenue / total_orders : 0;

      // Get today's orders
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = ordersData.filter(o => o.created_at && o.created_at.startsWith(today));
      const orders_today = todayOrders.length;
      const revenue_today = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

      setAnalytics({
        total_orders,
        total_revenue,
        orders_today,
        revenue_today,
        avg_order_value,
      });
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  // Mock data for charts (can be enhanced later with real time-series data)
  const revenueData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Revenue ($)",
        data: [320, 450, 380, 520, 680, 590, 450],
        backgroundColor: "#B45309",
      },
    ],
  };

  const ordersData = {
    labels: ["7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM"],
    datasets: [
      {
        label: "Orders",
        data: [5, 12, 18, 24, 28, 22, 20, 15, 10],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59,130,246,0.1)",
        tension: 0.4,
      },
    ],
  };

  if (shopLoading || loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-700" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          </div>
          <p className="text-3xl font-bold">${analytics.total_revenue.toFixed(2)}</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-700" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
          </div>
          <p className="text-3xl font-bold">{analytics.total_orders}</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-700" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Today's Revenue</p>
          </div>
          <p className="text-3xl font-bold">${analytics.revenue_today.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">{analytics.orders_today} orders</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-700" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</p>
          </div>
          <p className="text-3xl font-bold">${analytics.avg_order_value.toFixed(2)}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <h2 className="text-xl font-semibold mb-4">💵 Revenue (Last 7 Days)</h2>
        <p className="text-sm text-gray-500 mb-4">Sample data - Real time-series data coming soon</p>
        <Bar data={revenueData} height={80} />
      </div>

      {/* Orders Chart */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <h2 className="text-xl font-semibold mb-4">📈 Orders per Hour (Today)</h2>
        <p className="text-sm text-gray-500 mb-4">Sample data - Real hourly data coming soon</p>
        <Line data={ordersData} height={80} />
      </div>
    </div>
  );
}
