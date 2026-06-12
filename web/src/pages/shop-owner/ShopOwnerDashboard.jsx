import { useEffect, useState } from "react";
import { useShop } from "../../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package, DollarSign, TrendingUp, Coffee,
  Clock, XCircle, ArrowUpRight,
  ShoppingBag, Terminal, AlertTriangle,
  RefreshCw,
} from "lucide-react";
import supabase from "../../lib/supabase";
import { getPosStatus } from "../../services/posService";
import { getMenuItems } from "../../api/menu";
import { getShopOrders } from "../../api/orders";
import { toast } from "sonner";

// ── Sub-components ─────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, title, value, subtitle, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="relative group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} rounded-xl shadow`}><Icon className="w-6 h-6 text-white" /></div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
    </div>
  </motion.div>
);

const QuickAction = ({ icon: Icon, title, description, color, onClick, delay, badge }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, delay }}
    whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="relative text-left bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 hover:border-amber-500 shadow-lg hover:shadow-xl transition-all group"
  >
    {badge && (
      <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
    <div className={`p-3 ${color} rounded-xl mb-4 inline-block group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</p>
    <div className="flex items-center gap-1 text-amber-600 text-sm font-semibold">
      Open <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
    </div>
  </motion.button>
);

// ── Slim "needs attention" banner — only shown when something is actually broken
function SquareIssueBanner({ kind, onClick }) {
  const map = {
    reauth: {
      title: "Square connection expired",
      body:  "Reconnect Square to keep accepting mobile orders.",
      cta:   "Reconnect Square",
      tone:  "from-orange-500 to-red-500",
    },
    no_location: {
      title: "Pick a Square location",
      body:  "Choose which Square terminal receives mobile orders so checkout can go live.",
      cta:   "Pick location",
      tone:  "from-amber-500 to-orange-500",
    },
  };
  const m = map[kind];
  if (!m) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-orange-200 dark:border-orange-800 shadow-sm overflow-hidden"
    >
      <div className={`bg-gradient-to-r ${m.tone} px-5 py-3 text-white flex items-center gap-2`}>
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <span className="font-bold">{m.title}</span>
      </div>
      <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-gray-600 dark:text-gray-300 flex-1 min-w-[200px]">{m.body}</p>
        <button
          onClick={onClick}
          className="shrink-0 bg-black dark:bg-white text-white dark:text-black font-semibold text-sm px-4 py-2 rounded-xl hover:opacity-90 transition"
        >
          {m.cta} →
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

export default function ShopOwnerDashboard() {
  const { shop, shopId, loading: shopLoading } = useShop();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    ordersToday: 0, revenueToday: 0,
    totalMenuItems: 0, activeMenuItems: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [posStatus, setPosStatus]       = useState(null);

  const squareConnected = !!shop?.square_merchant_id;

  useEffect(() => {
    if (shopId) {
      loadDashboardData();
      loadPosStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const loadPosStatus = async () => {
    if (!shopId) return;
    try {
      const data = await getPosStatus(shopId, "square");
      setPosStatus(data);
    } catch {
      // status fetch failing shouldn't break the dashboard
      setPosStatus(null);
    }
  };

  const loadDashboardData = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data: { session } } = await supabase.auth.getSession();
      const [ordersResp, menuResp] = await Promise.all([
        getShopOrders(shopId, session?.access_token),
        getMenuItems(shopId),
      ]);

      const orders = ordersResp.orders || [];
      const menuItems = menuResp.items || [];
      const todayOrders = orders.filter(order => new Date(order.created_at) >= today);
      const activeItems = menuItems.filter(item => item.is_available);
      const pendingOrders = orders.filter(order => ["confirmed", "preparing", "pending"].includes(order.status));
      const recentOrders = [...orders]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6);

      const revenueToday = todayOrders.reduce(
        (sum, o) => sum + parseFloat(o.total || 0), 0
      );

      setStats({
        ordersToday:     todayOrders.length,
        revenueToday,
        totalMenuItems:  menuItems.length,
        activeMenuItems: activeItems.length,
        pendingOrders:   pendingOrders.length,
      });
      setRecentOrders(recentOrders);
    } catch (err) {
      console.error("Dashboard load error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (shopLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Coffee className="w-10 h-10 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-16">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Shop Not Found</h3>
        <p className="text-gray-500">You don't have a shop assigned to your account.</p>
      </div>
    );
  }

  const statusColors = {
    confirmed: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    preparing: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    ready:     'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    completed: 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400',
    cancelled: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  };

  // Decide if we need to show a small "needs attention" banner.
  // Only when Square is connected at DB level (shop.square_merchant_id is set)
  // — the layout already hard-blocks brand-new unconnected shops, so we never
  // need to re-prompt for the initial connect here.
  const needsReauth = posStatus?.needs_reauth || posStatus?.status === "reauth_required";
  const needsLocation = squareConnected && posStatus && !posStatus.location_id;
  const issueKind =
    needsReauth     ? "reauth"
    : needsLocation ? "no_location"
    : null;

  return (
    <div className="space-y-8 pb-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">
            {shop.name} ☕
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${
              issueKind ? 'bg-amber-500' : squareConnected ? 'bg-green-500' : 'bg-amber-500'
            }`} />
            {issueKind === "reauth"
              ? "Square needs reconnection"
              : issueKind === "no_location"
              ? "Pick your Square location to go live"
              : squareConnected
              ? "Live — accepting mobile orders"
              : "Setup required before accepting orders"}
          </p>
        </div>
        <button onClick={() => { loadDashboardData(); loadPosStatus(); }} disabled={loading}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* ── Slim issue banner — only when something is actually broken ── */}
      {issueKind && (
        <SquareIssueBanner
          kind={issueKind}
          onClick={() => navigate('/shop-owner/connect-square')}
        />
      )}

      {/* ── Stats ── */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ShoppingBag} title="Orders Today"
            value={stats.ordersToday} subtitle="Since midnight"
            color="bg-gradient-to-br from-blue-500 to-blue-600" delay={0.05}
          />
          <StatCard
            icon={DollarSign} title="Revenue Today"
            value={`$${stats.revenueToday.toFixed(2)}`} subtitle="Square payments"
            color="bg-gradient-to-br from-green-500 to-green-600" delay={0.1}
          />
          <StatCard
            icon={Coffee} title="Active Items"
            value={stats.activeMenuItems} subtitle={`${stats.totalMenuItems} total`}
            color="bg-gradient-to-br from-amber-500 to-orange-500" delay={0.15}
          />
          <StatCard
            icon={Clock} title="In Queue"
            value={stats.pendingOrders} subtitle="Confirmed + preparing"
            color="bg-gradient-to-br from-purple-500 to-purple-600" delay={0.2}
          />
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            icon={Package} title="Orders"
            description="View and manage incoming orders"
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            onClick={() => navigate('/shop-owner/orders')}
            badge={stats.pendingOrders > 0 ? stats.pendingOrders : null}
            delay={0.25}
          />
          <QuickAction
            icon={Coffee} title="Menu"
            description="Build and update your menu"
            color="bg-gradient-to-br from-amber-500 to-orange-500"
            onClick={() => navigate('/shop-owner/menu')}
            delay={0.3}
          />
          <QuickAction
            icon={TrendingUp} title="Analytics"
            description="Revenue, top items, trends"
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            onClick={() => navigate('/shop-owner/analytics')}
            delay={0.35}
          />
          <QuickAction
            icon={Terminal} title="Square POS"
            description={squareConnected ? "Manage POS connection & sync" : "Connect to start accepting orders"}
            color={squareConnected ? "bg-gradient-to-br from-gray-700 to-gray-900" : "bg-gradient-to-br from-amber-500 to-orange-600"}
            onClick={() => navigate('/shop-owner/connect-square')}
            delay={0.4}
          />
        </div>
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
            <button onClick={() => navigate('/shop-owner/orders')}
              className="text-sm text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100 dark:divide-neutral-800">
              {recentOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.05 }}
                  onClick={() => navigate('/shop-owner/orders')}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                      <ShoppingBag className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || statusColors.confirmed}`}>
                      {order.status}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      ${parseFloat(order.total || 0).toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No orders yet + Square is ready */}
      {recentOrders.length === 0 && !loading && squareConnected && !issueKind && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-700">
          <Coffee className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 dark:text-gray-300">No orders yet today</p>
          <p className="text-sm text-gray-400 mt-1">Orders from the mobile app will appear here and print on your terminal.</p>
        </motion.div>
      )}
    </div>
  );
}
