import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Users, Store, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import supabase from "../../lib/supabase";
import { toast } from "sonner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalShops: 0,
    activeShops: 0,
    pendingShops: 0,
    totalUsers: 0,
    totalOrders: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch shops count
      const { count: totalShops } = await supabase
        .from("shops")
        .select("*", { count: "exact", head: true });

      const { count: activeShops } = await supabase
        .from("shops")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: pendingShops } = await supabase
        .from("shops")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch users count
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch orders count
      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      // Fetch today's revenue
      const today = new Date().toISOString().split('T')[0];
      const { data: todayOrders } = await supabase
        .from("orders")
        .select("total")
        .gte("created_at", today);

      const todayRevenue = todayOrders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;

      // Recent activities (recent shops)
      const { data: recentShops } = await supabase
        .from("shops")
        .select("name, created_at, status")
        .order("created_at", { ascending: false })
        .limit(5);

      const activities = recentShops?.map(shop => ({
        message: `New shop ${shop.status === 'pending' ? 'application' : 'registered'}: ${shop.name}`,
        time: new Date(shop.created_at).toLocaleString(),
      })) || [];

      setStats({
        totalShops: totalShops || 0,
        activeShops: activeShops || 0,
        pendingShops: pendingShops || 0,
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        todayRevenue,
      });

      setActivities(activities);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const revenueChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Revenue",
        data: [1200, 1900, 3000, 2500, 2800, 3500, 4000],
        borderColor: "rgb(217, 119, 6)",
        backgroundColor: "rgba(217, 119, 6, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "#9ca3af",
        },
        grid: {
          color: "#374151",
        },
      },
      x: {
        ticks: {
          color: "#9ca3af",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Platform Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your coffee shop platform at a glance
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">All Systems Operational</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              Total
            </span>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalUsers.toLocaleString()}</p>
          <p className="text-blue-100">Total Users</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Store className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              {stats.activeShops} Active
            </span>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalShops}</p>
          <p className="text-amber-100">Coffee Shops</p>
          {stats.pendingShops > 0 && (
            <div className="mt-2 text-sm bg-white/20 rounded-lg px-2 py-1 inline-block">
              {stats.pendingShops} pending approval
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <ShoppingBag className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalOrders.toLocaleString()}</p>
          <p className="text-green-100">Total Orders</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              Today
            </span>
          </div>
          <p className="text-3xl font-bold mb-1">${stats.todayRevenue.toFixed(2)}</p>
          <p className="text-purple-100">Revenue</p>
        </div>
      </div>

      {/* Chart and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue This Week
          </h3>
          <div className="h-64">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
            ) : (
              activities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/20 p-2 rounded-lg">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.pendingShops > 0 && (
            <a
              href="/admin/shops"
              className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-amber-200 dark:border-amber-800 hover:shadow-md transition"
            >
              <div className="bg-amber-100 dark:bg-amber-900/20 p-2 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Review Applications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.pendingShops} pending
                </p>
              </div>
            </a>
          )}
          <a
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 hover:shadow-md transition"
          >
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Manage Users</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View all users
              </p>
            </div>
          </a>
          <a
            href="/admin/analytics"
            className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 hover:shadow-md transition"
          >
            <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">View Analytics</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Detailed insights
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
