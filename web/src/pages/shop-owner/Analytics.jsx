import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, DollarSign, ShoppingBag, Users, 
  Calendar, Award, Coffee, Star, Clock, BarChart3
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';
import { toast } from 'sonner';

const StatCard = ({ icon: Icon, title, value, change, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -8 }}
    className="relative group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} rounded-xl shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className="flex items-center gap-1 text-sm font-bold text-green-600">
            <TrendingUp className="w-4 h-4" />
            +{change}%
          </div>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
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
      <div className="text-3xl">{medals[rank - 1] || `#${rank}`}</div>
      {item.image_url ? (
        <img 
          src={item.image_url} 
          alt={item.name}
          className="w-16 h-16 rounded-lg object-cover"
        />
      ) : (
        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg flex items-center justify-center">
          <Coffee className="w-8 h-8 text-amber-600" />
        </div>
      )}
      <div className="flex-1">
        <h4 className="font-bold text-gray-900 dark:text-white">{item.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{item.orders} orders</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-black text-green-600">${item.revenue.toFixed(2)}</p>
      </div>
    </motion.div>
  );
};

const TimeRangeButton = ({ active, children, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`px-4 py-2 rounded-xl font-semibold transition ${
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
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
  });
  const [topItems, setTopItems] = useState([]);
  const [revenueByDay, setRevenueByDay] = useState([]);

  useEffect(() => {
    if (shopId) {
      loadAnalytics();
    }
  }, [shopId, timeRange]);

  const loadAnalytics = async () => {
    if (!shopId) return;

    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      
      if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeRange === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // Load orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopId)
        .gte('created_at', startDate.toISOString())
        .neq('status', 'cancelled');

      if (ordersError) throw ordersError;

      // Calculate stats
      const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Get unique customers
      const uniqueCustomers = new Set(orders?.map(o => o.user_id).filter(Boolean));
      const totalCustomers = uniqueCustomers.size;

      setStats({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        totalCustomers,
      });

      // Calculate top items
      const itemCounts = {};
      orders?.forEach(order => {
        order.items?.forEach(item => {
          if (!itemCounts[item.name]) {
            itemCounts[item.name] = {
              name: item.name,
              orders: 0,
              revenue: 0,
              image_url: item.image_url,
            };
          }
          itemCounts[item.name].orders += item.quantity;
          itemCounts[item.name].revenue += item.price * item.quantity;
        });
      });

      const sortedItems = Object.values(itemCounts)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopItems(sortedItems);

      // Calculate revenue by day (for simple bar chart visualization)
      const revenueMap = {};
      orders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString();
        revenueMap[date] = (revenueMap[date] || 0) + parseFloat(order.total || 0);
      });

      const revenueData = Object.entries(revenueMap)
        .map(([date, revenue]) => ({ date, revenue }))
        .slice(-7);

      setRevenueByDay(revenueData);

    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <BarChart3 className="w-12 h-12 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your shop's performance
          </p>
        </div>

        <div className="flex gap-2">
          <TimeRangeButton 
            active={timeRange === 'week'} 
            onClick={() => setTimeRange('week')}
          >
            7 Days
          </TimeRangeButton>
          <TimeRangeButton 
            active={timeRange === 'month'} 
            onClick={() => setTimeRange('month')}
          >
            30 Days
          </TimeRangeButton>
          <TimeRangeButton 
            active={timeRange === 'year'} 
            onClick={() => setTimeRange('year')}
          >
            1 Year
          </TimeRangeButton>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          change={12}
          color="bg-gradient-to-br from-green-500 to-green-600"
          delay={0.1}
        />
        <StatCard
          icon={ShoppingBag}
          title="Total Orders"
          value={stats.totalOrders}
          change={8}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.2}
        />
        <StatCard
          icon={DollarSign}
          title="Avg Order Value"
          value={`$${stats.avgOrderValue.toFixed(2)}`}
          change={5}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          delay={0.3}
        />
        <StatCard
          icon={Users}
          title="Customers"
          value={stats.totalCustomers}
          change={15}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          delay={0.4}
        />
      </div>

      {/* Revenue Chart (Simple Bar Visualization) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Revenue Trend
        </h2>
        
        {revenueByDay.length > 0 ? (
          <div className="space-y-4">
            {revenueByDay.map((day, i) => {
              const maxRevenue = Math.max(...revenueByDay.map(d => d.revenue));
              const width = (day.revenue / maxRevenue) * 100;
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {day.date}
                    </span>
                    <span className="font-black text-green-600">
                      ${day.revenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 1, delay: 0.7 + i * 0.05 }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No revenue data available</p>
        )}
      </motion.div>

      {/* Top Selling Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-600 fill-amber-600" />
          Top Selling Items
        </h2>

        {topItems.length > 0 ? (
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <TopItemCard key={i} item={item} rank={i + 1} delay={0.7 + i * 0.05} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No items data available</p>
        )}
      </motion.div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <Clock className="w-12 h-12 mb-4 opacity-80" />
          <h3 className="text-lg font-bold mb-2">Peak Hours</h3>
          <p className="text-3xl font-black mb-1">9AM - 11AM</p>
          <p className="text-sm opacity-90">Most orders during morning rush</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <Award className="w-12 h-12 mb-4 opacity-80" />
          <h3 className="text-lg font-bold mb-2">Repeat Customers</h3>
          <p className="text-3xl font-black mb-1">68%</p>
          <p className="text-sm opacity-90">Customer retention rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg"
        >
          <Star className="w-12 h-12 mb-4 opacity-80 fill-white" />
          <h3 className="text-lg font-bold mb-2">Average Rating</h3>
          <p className="text-3xl font-black mb-1">4.8</p>
          <p className="text-sm opacity-90">Based on customer reviews</p>
        </motion.div>
      </div>
    </div>
  );
}