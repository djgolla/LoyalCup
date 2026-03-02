import { useEffect, useState } from "react";
import { useShop } from "../../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, DollarSign, TrendingUp, Coffee, Users, 
  Clock, CheckCircle, XCircle, Zap, ArrowUpRight,
  ShoppingBag, Award, Star, Eye
} from "lucide-react";
import supabase from "../../lib/supabase";
import { toast } from "sonner";

const StatCard = ({ icon: Icon, title, value, subtitle, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className="relative group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} rounded-xl shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-5 h-5 text-amber-500 opacity-50" />
        </motion.div>
      </div>
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  </motion.div>
);

const QuickActionCard = ({ icon: Icon, title, description, color, onClick, delay }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ scale: 1.05, y: -5 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="text-left bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 hover:border-amber-500 shadow-lg hover:shadow-xl transition-all group"
  >
    <div className={`p-4 ${color} rounded-xl mb-4 inline-block group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    <div className="flex items-center gap-2 mt-4 text-amber-600 font-semibold">
      <span>Get started</span>
      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
    </div>
  </motion.button>
);

const RecentOrderCard = ({ order, delay }) => {
  const statusColors = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
    preparing: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    ready: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    completed: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
  };

  const statusIcons = {
    pending: Clock,
    preparing: Package,
    ready: CheckCircle,
    completed: CheckCircle,
  };

  const StatusIcon = statusIcons[order.status] || Clock;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ x: 5 }}
      className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 hover:border-amber-500 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
            <ShoppingBag className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              Order #{order.id.slice(0, 8)}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusColors[order.status]}`}>
          <StatusIcon className="w-3 h-3" />
          {order.status}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {order.items?.length || 0} items
        </span>
        <span className="text-lg font-black text-amber-700">
          ${parseFloat(order.total || 0).toFixed(2)}
        </span>
      </div>
    </motion.div>
  );
};

export default function ShopOwnerDashboard() {
  const { shop, shopId, loading: shopLoading, error } = useShop();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    ordersToday: 0,
    revenueToday: 0,
    totalMenuItems: 0,
    activeMenuItems: 0,
    avgRating: 4.8,
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data: ordersToday, error: ordersError } = await supabase
        .from("orders")
        .select("total, id, created_at, status")
        .eq("shop_id", shopId)
        .gte("created_at", todayISO);

      if (ordersError) throw ordersError;

      const revenueToday = ordersToday?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;

      const { count: totalMenuItems } = await supabase
        .from("menu_items")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shopId);

      const { count: activeMenuItems } = await supabase
        .from("menu_items")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .eq("is_available", true);

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
        avgRating: 4.8,
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
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Coffee className="w-12 h-12 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <XCircle className="w-24 h-24 text-red-500 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          {error === "No shop assigned to your account" ? "No Shop Assigned" : "Shop Not Found"}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error || "You don't have a shop assigned to your account yet."}
        </p>
      </div>
    );
  }

  if (shop.status === "suspended") {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <XCircle className="w-24 h-24 text-red-500 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Shop Suspended
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your shop has been suspended. Please contact support for more information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            Welcome back! ☕
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Managing <span className="font-bold text-amber-700">{shop.name}</span>
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="hidden md:flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full font-bold shadow-lg"
        >
          <Star className="w-5 h-5 fill-white" />
          {stats.avgRating} Rating
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={ShoppingBag}
          title="Orders Today"
          value={stats.ordersToday}
          subtitle="Live tracking"
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.1}
        />
        <StatCard
          icon={DollarSign}
          title="Revenue Today"
          value={`$${stats.revenueToday.toFixed(2)}`}
          subtitle="Last 24 hours"
          color="bg-gradient-to-br from-green-500 to-green-600"
          delay={0.2}
        />
        <StatCard
          icon={Coffee}
          title="Active Items"
          value={stats.activeMenuItems}
          subtitle={`${stats.totalMenuItems} total`}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
          delay={0.3}
        />
        <StatCard
          icon={Users}
          title="Customers"
          value="156"
          subtitle="This month"
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          delay={0.4}
        />
      </div>

      <div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
        >
          Quick Actions
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickActionCard
            icon={Coffee}
            title="Manage Menu"
            description="Add, edit, or remove menu items"
            color="bg-gradient-to-br from-amber-500 to-orange-500"
            onClick={() => navigate('/shop-owner/menu')}
            delay={0.6}
          />
          <QuickActionCard
            icon={Package}
            title="View Orders"
            description="Check and manage incoming orders"
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            onClick={() => navigate('/shop-owner/orders')}
            delay={0.7}
          />
          <QuickActionCard
            icon={TrendingUp}
            title="Analytics"
            description="View shop performance metrics"
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            onClick={() => navigate('/shop-owner/analytics')}
            delay={0.8}
          />
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              Recent Orders
            </motion.h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/shop-owner/orders')}
              className="text-sm text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
            >
              View all
              <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentOrders.map((order, i) => (
              <RecentOrderCard key={order.id} order={order} delay={1 + i * 0.1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}