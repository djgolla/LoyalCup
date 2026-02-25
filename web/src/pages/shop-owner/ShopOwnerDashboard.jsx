import { useEffect, useState } from "react";
import { useShop } from "../../context/ShopContext";
import { Link } from "react-router-dom";
import { Package, DollarSign, TrendingUp, Coffee } from "lucide-react";
import Loading from "../../components/Loading";
import supabase from "../../lib/supabase";
import { toast } from "sonner";

export default function ShopOwnerDashboard() {
  const { shop, shopId, loading: shopLoading, error } = useShop();
  const [stats, setStats] = useState({
    ordersToday: 0,
    revenueToday: 0,
    totalMenuItems: 0,
    activeMenuItems: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) {
      loadDashboardData();
    }
  }, [shopId]);

  const loadDashboardData = async () => {
    if (!shopId) return;

    try {
      setLoading(true);

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Fetch orders today
      const { data: ordersToday, error: ordersError } = await supabase
        .from("orders")
        .select("total")
        .eq("shop_id", shopId)
        .gte("created_at", todayISO);

      if (ordersError) throw ordersError;

      const revenueToday = ordersToday?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;

      // Fetch menu items count
      const { count: totalMenuItems } = await supabase
        .from("menu_items")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shopId);

      const { count: activeMenuItems } = await supabase
        .from("menu_items")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .eq("is_available", true);

      // Fetch recent orders
      const { data: recentOrdersData, error: recentError } = await supabase
        .from("orders")
        .select("id, created_at, total, status")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      setStats({
        ordersToday: ordersToday?.length || 0,
        revenueToday,
        totalMenuItems: totalMenuItems || 0,
        activeMenuItems: activeMenuItems || 0,
      });

      setRecentOrders(recentOrdersData || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (shopLoading || loading) {
    return <Loading />;
  }

  if (error || !shop) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏪</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          {error === "No shop assigned to your account" ? "No Shop Assigned" : "Shop Not Found"}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error || "You don't have a shop assigned to your account yet."}
        </p>
        {shop?.status === "pending" && (
          <p className="text-amber-600 dark:text-amber-400">
            Your shop application is pending approval.
          </p>
        )}
      </div>
    );
  }

  if (shop.status === "suspended") {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          Shop Suspended
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your shop has been suspended. Please contact support for more information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Managing <span className="font-semibold text-amber-700">{shop.name}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Orders Today</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.ordersToday}</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Revenue Today</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">${stats.revenueToday.toFixed(2)}</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Active Menu Items</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeMenuItems}</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Total Menu Items</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalMenuItems}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/shop-owner/menu"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-neutral-700 rounded-lg hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition"
          >
            <Coffee className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Manage Menu</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add or edit items</p>
            </div>
          </Link>
          <Link
            to="/shop-owner/orders"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-neutral-700 rounded-lg hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition"
          >
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">View Orders</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage incoming orders</p>
            </div>
          </Link>
          <Link
            to="/shop-owner/settings"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-neutral-700 rounded-lg hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition"
          >
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Shop Settings</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update shop details</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link to="/shop-owner/orders" className="text-sm text-amber-600 hover:text-amber-700">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-neutral-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Order #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${parseFloat(order.total || 0).toFixed(2)}
                  </p>
                  <span className="text-sm px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
