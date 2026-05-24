import { useEffect, useState, useCallback } from "react";
import { useShop } from "../../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package, DollarSign, TrendingUp, Coffee, Users,
  Clock, CheckCircle, XCircle, Zap, ArrowUpRight,
  ShoppingBag, Star, Terminal, MapPin, AlertTriangle,
  RefreshCw,
} from "lucide-react";
import supabase from "../../lib/supabase";
import { getSquareReadiness, setSquareLocation } from "../../services/posService";
import { toast } from "sonner";

// ── Sub-components ────────────────────────────────────────────────────────────

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

// ── Square setup card — shown when Square not fully configured ────────────────

function SquareSetupCard({ shop, shopId, onComplete }) {
  const navigate = useNavigate();
  const [readiness,    setReadiness]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [settingLoc,   setSettingLoc]   = useState(false);

  const checkReadiness = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const r = await getSquareReadiness(shopId);
      setReadiness(r);
      if (r.ready) onComplete?.();
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [shopId, onComplete]);

  useEffect(() => { checkReadiness(); }, [checkReadiness]);

  const handleSetLocation = async (locationId) => {
    setSettingLoc(true);
    try {
      await setSquareLocation(shopId, locationId);
      toast.success("Square location set! Your shop is now live.");
      await checkReadiness();
    } catch (e) {
      toast.error(e.message || "Failed to set location");
    } finally {
      setSettingLoc(false);
    }
  };

  const step1Done = !!shop.address && !!shop.phone;
  const step2Done = readiness?.connected;
  const step3Done = readiness?.hasLocation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-amber-200 dark:border-amber-800 shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="w-6 h-6" />
          <h2 className="text-xl font-bold">Complete Your Square Setup</h2>
        </div>
        <p className="text-amber-100 text-sm">
          Square POS is required to accept mobile orders. Orders from customers print directly on your terminal.
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Step 1 */}
        <div className={`flex items-start gap-4 p-4 rounded-xl ${step1Done ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step1Done ? 'bg-green-500' : 'bg-gray-300 dark:bg-neutral-600'}`}>
            {step1Done ? <CheckCircle className="w-5 h-5 text-white" /> : <span className="text-white text-sm font-bold">1</span>}
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${step1Done ? 'text-green-800 dark:text-green-300' : 'text-gray-800 dark:text-gray-200'}`}>
              Shop Settings
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {step1Done ? 'Address and phone number saved ✓' : 'Add your address and phone number'}
            </p>
          </div>
          {!step1Done && (
            <button
              onClick={() => navigate('/shop-owner/settings')}
              className="shrink-0 text-sm font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg transition"
            >
              Set Up →
            </button>
          )}
        </div>

        {/* Step 2 */}
        <div className={`flex items-start gap-4 p-4 rounded-xl ${step2Done ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step2Done ? 'bg-green-500' : 'bg-gray-300 dark:bg-neutral-600'}`}>
            {step2Done ? <CheckCircle className="w-5 h-5 text-white" /> : <span className="text-white text-sm font-bold">2</span>}
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${step2Done ? 'text-green-800 dark:text-green-300' : 'text-gray-800 dark:text-gray-200'}`}>
              Connect Square
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {loading ? 'Checking...' : step2Done
                ? `Connected (Merchant: ${readiness?.merchantId?.slice(0, 12) || '—'})`
                : 'Link your Square account so orders appear on your terminal'
              }
            </p>
          </div>
          {!step2Done && !loading && (
            <button
              onClick={() => navigate('/shop-owner/connect-square')}
              className="shrink-0 text-sm font-semibold text-white bg-black dark:bg-white dark:text-black px-3 py-1.5 rounded-lg transition hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              Connect →
            </button>
          )}
        </div>

        {/* Step 3 — location picker */}
        <div className={`flex items-start gap-4 p-4 rounded-xl ${step3Done ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' : step2Done ? 'bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-300 dark:border-amber-700' : 'bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 opacity-50'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step3Done ? 'bg-green-500' : step2Done ? 'bg-amber-500' : 'bg-gray-300 dark:bg-neutral-600'}`}>
            {step3Done ? <CheckCircle className="w-5 h-5 text-white" /> : <span className="text-white text-sm font-bold">3</span>}
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${step3Done ? 'text-green-800 dark:text-green-300' : step2Done ? 'text-amber-800 dark:text-amber-300' : 'text-gray-800 dark:text-gray-200'}`}>
              Select Square Location
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {step3Done
                ? `Location set ✓ — orders will print here`
                : step2Done
                ? 'Choose which Square terminal receives orders'
                : 'Connect Square first'
              }
            </p>

            {/* Location picker — only shown when connected but no location set */}
            {step2Done && !step3Done && !loading && readiness?.locations?.length > 0 && (
              <div className="mt-3 space-y-2">
                {readiness.locations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => handleSetLocation(loc.id)}
                    disabled={settingLoc}
                    className="w-full text-left px-4 py-3 bg-white dark:bg-neutral-800 rounded-lg border border-amber-200 dark:border-amber-700 hover:border-amber-500 transition font-medium text-gray-800 dark:text-gray-200 flex items-center justify-between text-sm disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                      {loc.name}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{loc.id}</span>
                  </button>
                ))}
              </div>
            )}

            {step2Done && !step3Done && !loading && readiness?.locations?.length === 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                No active locations found on your Square account. Make sure you have an active location in Square Dashboard.
              </p>
            )}
          </div>

          {step2Done && !step3Done && (
            <button
              onClick={checkReadiness}
              disabled={loading}
              className="shrink-0 p-2 text-gray-400 hover:text-gray-600 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* All done! */}
        {step1Done && step2Done && step3Done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
          >
            <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-bold text-green-800 dark:text-green-300">You're live! 🎉</p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Mobile orders are now active. They'll print on your Square terminal automatically.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function ShopOwnerDashboard() {
  const { shop, shopId, loading: shopLoading } = useShop();
  const navigate = useNavigate();

  const [stats, setStats]         = useState({
    ordersToday: 0, revenueToday: 0,
    totalMenuItems: 0, activeMenuItems: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [squareReady, setSquareReady]   = useState(false);

  const squareConnected = !!shop?.square_merchant_id;

  useEffect(() => {
    if (shopId) loadDashboardData();
  }, [shopId]);

  const loadDashboardData = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [ordersResp, menuResp, activeResp, recentResp, pendingResp] = await Promise.all([
        supabase.from("orders").select("total").eq("shop_id", shopId).gte("created_at", todayISO),
        supabase.from("menu_items").select("*", { count: "exact", head: true }).eq("shop_id", shopId),
        supabase.from("menu_items").select("*", { count: "exact", head: true }).eq("shop_id", shopId).eq("is_available", true),
        supabase.from("orders").select("id, created_at, total, status, order_items(count)").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(6),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("shop_id", shopId).in("status", ["confirmed", "preparing"]),
      ]);

      const revenueToday = (ordersResp.data || []).reduce(
        (sum, o) => sum + parseFloat(o.total || 0), 0
      );

      setStats({
        ordersToday:     ordersResp.data?.length || 0,
        revenueToday,
        totalMenuItems:  menuResp.count || 0,
        activeMenuItems: activeResp.count || 0,
        pendingOrders:   pendingResp.count || 0,
      });
      setRecentOrders(recentResp.data || []);
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
            <span className={`inline-block w-2 h-2 rounded-full ${squareConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
            {squareConnected ? 'Live — accepting mobile orders' : 'Setup required before accepting orders'}
          </p>
        </div>
        <button onClick={loadDashboardData} disabled={loading}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* ── Square setup card — shown until fully configured ── */}
      {!squareReady && (
        <SquareSetupCard
          shop={shop}
          shopId={shopId}
          onComplete={() => setSquareReady(true)}
        />
      )}

      {/* ── Stats — only show meaningful ones when loading is done ── */}
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
      {recentOrders.length === 0 && !loading && squareConnected && (
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