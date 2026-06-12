import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, ShoppingBag, Users,
  Award, Coffee, Star, Clock, BarChart3, RefreshCw,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';
import { getShopOrders } from '../../api/orders';
import { toast } from 'sonner';

const StatCard = ({ icon: Icon, title, value, sub, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -6 }}
    className="relative group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} rounded-xl shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  </motion.div>
);

const TopItemCard = ({ item, rank, delay }) => {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ x: 5 }}
      className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-800 hover:border-amber-500 shadow-lg transition-all"
    >
      <div className="text-3xl w-10 text-center">{medals[rank - 1] || `#${rank}`}</div>
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center shrink-0">
          <Coffee className="w-7 h-7 text-amber-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 dark:text-white truncate">{item.name}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{item.totalQty} sold</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-black text-green-600">${item.revenue.toFixed(2)}</p>
      </div>
    </motion.div>
  );
};

const RangeBtn = ({ active, onClick, children }) => (
  <motion.button
    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`px-4 py-2 rounded-xl font-semibold transition text-sm ${
      active
        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
        : 'bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300'
    }`}
  >
    {children}
  </motion.button>
);

export default function Analytics() {
  const { shopId } = useShop();
  const [loading,      setLoading]      = useState(true);
  const [timeRange,    setTimeRange]    = useState('week');
  const [stats,        setStats]        = useState({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, uniqueCustomers: 0 });
  const [topItems,     setTopItems]     = useState([]);
  const [revenueByDay, setRevenueByDay] = useState([]);
  const [peakHour,     setPeakHour]     = useState(null);
  const [avgRating,    setAvgRating]    = useState(null);
  const [repeatRate,   setRepeatRate]   = useState(null);

  useEffect(() => { if (shopId) loadAnalytics(); }, [shopId, timeRange]);

  const loadAnalytics = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const now       = new Date();
      const startDate = new Date();
      if      (timeRange === 'week')  startDate.setDate(now.getDate() - 7);
      else if (timeRange === 'month') startDate.setMonth(now.getMonth() - 1);
      else if (timeRange === 'year')  startDate.setFullYear(now.getFullYear() - 1);

      const { data: { session } } = await supabase.auth.getSession();
      const ordersResp = await getShopOrders(shopId, session?.access_token);
      const safeOrders = (ordersResp.orders || [])
        .filter(order => new Date(order.created_at) >= startDate && order.status !== 'cancelled');

      // ── Core stats ────────────────────────────────────────────────────────
      const totalRevenue   = safeOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
      const totalOrders    = safeOrders.length;
      const avgOrderValue  = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const uniqueCusts    = new Set(safeOrders.map(o => o.customer_id).filter(Boolean)).size;

      setStats({ totalRevenue, totalOrders, avgOrderValue, uniqueCustomers: uniqueCusts });

      // ── Top items — from order_items join ─────────────────────────────────
      const itemMap = {};
      safeOrders.forEach(order => {
        (order.order_items || []).forEach(oi => {
          const name      = oi.menu_items?.name || oi.name || 'Unknown';
          const imageUrl  = oi.menu_items?.image_url || oi.image_url || null;
          const qty       = oi.quantity  || 1;
          const revenue   = parseFloat(oi.total_price || 0) || (parseFloat(oi.unit_price || 0) * qty);
          if (!itemMap[name]) itemMap[name] = { name, image_url: imageUrl, totalQty: 0, revenue: 0 };
          itemMap[name].totalQty += qty;
          itemMap[name].revenue  += revenue;
        });
      });
      setTopItems(Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

      // ── Revenue by day ────────────────────────────────────────────────────
      const dayMap = {};
      safeOrders.forEach(order => {
        const d = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dayMap[d] = (dayMap[d] || 0) + parseFloat(order.total || 0);
      });
      const revenueData = Object.entries(dayMap)
        .map(([date, revenue]) => ({ date, revenue }))
        .slice(-14);
      setRevenueByDay(revenueData);

      // ── Peak hour (real) ──────────────────────────────────────────────────
      const hourMap = {};
      safeOrders.forEach(order => {
        const h = new Date(order.created_at).getHours();
        hourMap[h] = (hourMap[h] || 0) + 1;
      });
      if (Object.keys(hourMap).length > 0) {
        const peakH = parseInt(Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0][0]);
        const fmt   = (h) => {
          const suffix = h >= 12 ? 'PM' : 'AM';
          const h12    = h % 12 || 12;
          return `${h12}${suffix}`;
        };
        setPeakHour(`${fmt(peakH)} – ${fmt(peakH + 1)}`);
      } else {
        setPeakHour('Not enough data');
      }

      // ── Repeat customer rate ──────────────────────────────────────────────
      const custOrderCount = {};
      safeOrders.forEach(o => {
        if (o.customer_id) custOrderCount[o.customer_id] = (custOrderCount[o.customer_id] || 0) + 1;
      });
      const custList   = Object.values(custOrderCount);
      const repeats    = custList.filter(c => c > 1).length;
      const repeatPct  = custList.length > 0 ? Math.round((repeats / custList.length) * 100) : 0;
      setRepeatRate(repeatPct);

      // ── Avg rating ────────────────────────────────────────────────────────
      const reviewResp = await fetch(`/api/v1/shops/${shopId}/reviews?limit=100`);
      const reviewData = await reviewResp.json().catch(() => ({}));
      const reviews = (reviewData.reviews || [])
        .filter(review => new Date(review.created_at) >= startDate);
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
        setAvgRating(avg.toFixed(1));
      } else {
        setAvgRating(null);
      }

    } catch (err) {
      console.error('[Analytics] load error:', err);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <BarChart3 className="w-12 h-12 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  const maxRevenue = Math.max(...revenueByDay.map(d => d.revenue), 1);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-1">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Real data from your Square-powered orders</p>
        </div>
        <div className="flex items-center gap-2">
          <RangeBtn active={timeRange === 'week'}  onClick={() => setTimeRange('week')}>7 Days</RangeBtn>
          <RangeBtn active={timeRange === 'month'} onClick={() => setTimeRange('month')}>30 Days</RangeBtn>
          <RangeBtn active={timeRange === 'year'}  onClick={() => setTimeRange('year')}>1 Year</RangeBtn>
          <motion.button whileHover={{ scale: 1.05 }} onClick={loadAnalytics}
            className="p-2 text-gray-400 hover:text-gray-600 border-2 border-gray-200 dark:border-neutral-700 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={DollarSign} title="Total Revenue"    value={`$${stats.totalRevenue.toFixed(2)}`}  color="bg-gradient-to-br from-green-500 to-green-600"  delay={0.05} />
        <StatCard icon={ShoppingBag} title="Total Orders"   value={stats.totalOrders}                     color="bg-gradient-to-br from-blue-500 to-blue-600"    delay={0.1}  />
        <StatCard icon={DollarSign}  title="Avg Order Value" value={`$${stats.avgOrderValue.toFixed(2)}`} color="bg-gradient-to-br from-purple-500 to-purple-600" delay={0.15} />
        <StatCard icon={Users}       title="Unique Customers" value={stats.uniqueCustomers}               color="bg-gradient-to-br from-orange-500 to-orange-600" delay={0.2}  />
      </div>

      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Revenue by Day</h2>
        {revenueByDay.length > 0 ? (
          <div className="space-y-3">
            {revenueByDay.map((day, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.04 }} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-20 shrink-0">{day.date}</span>
                  <span className="font-black text-green-600">${day.revenue.toFixed(2)}</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.04 }}
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">No orders in this period yet</p>
        )}
      </motion.div>

      {/* Top Items */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Top Selling Items
        </h2>
        {topItems.length > 0 ? (
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <TopItemCard key={i} item={item} rank={i + 1} delay={0.5 + i * 0.05} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">No item data yet — orders will populate this</p>
        )}
      </motion.div>

      {/* Insights — real data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <Clock className="w-10 h-10 mb-4 opacity-80" />
          <h3 className="text-lg font-bold mb-1">Peak Hour</h3>
          <p className="text-2xl font-black mb-1">{peakHour || '—'}</p>
          <p className="text-sm opacity-80">Busiest hour this period</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <Award className="w-10 h-10 mb-4 opacity-80" />
          <h3 className="text-lg font-bold mb-1">Repeat Customers</h3>
          <p className="text-2xl font-black mb-1">{repeatRate !== null ? `${repeatRate}%` : '—'}</p>
          <p className="text-sm opacity-80">Ordered more than once</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <Star className="w-10 h-10 mb-4 opacity-80 fill-white" />
          <h3 className="text-lg font-bold mb-1">Avg Rating</h3>
          <p className="text-2xl font-black mb-1">{avgRating ? `${avgRating} ⭐` : 'No reviews yet'}</p>
          <p className="text-sm opacity-80">Based on customer reviews</p>
        </motion.div>
      </div>
    </div>
  );
}
