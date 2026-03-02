import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, Users, DollarSign, TrendingUp, 
  ShoppingBag, Award, AlertCircle, CheckCircle,
  Clock, ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import supabase from '../../lib/supabase';
import { toast } from 'sonner';

const StatCard = ({ icon: Icon, title, value, change, isPositive, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="relative group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
    <div className={`relative bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 shadow-lg hover:shadow-xl transition-all`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${color} rounded-xl`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {change}%
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </motion.div>
);

const ActivityItem = ({ icon: Icon, title, description, time, color }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    whileHover={{ x: 5 }}
    className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
  >
    <div className={`p-2 ${color} rounded-lg flex-shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{description}</p>
    </div>
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <Clock className="w-3 h-3" />
      {time}
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalShops: 0,
    activeShops: 0,
    pendingShops: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const { data: shops } = await supabase
        .from('shops')
        .select('status');

      const { data: users } = await supabase
        .from('profiles')
        .select('id');

      const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at');

      const totalShops = shops?.length || 0;
      const activeShops = shops?.filter(s => s.status === 'active').length || 0;
      const pendingShops = shops?.filter(s => s.status === 'pending').length || 0;
      const totalUsers = users?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({
        totalShops,
        activeShops,
        pendingShops,
        totalUsers,
        totalRevenue,
        totalOrders,
        avgOrderValue,
      });

      setRecentActivity([
        {
          icon: Store,
          title: 'New shop application',
          description: 'Coffee Corner submitted application',
          time: '5m ago',
          color: 'bg-blue-500'
        },
        {
          icon: Users,
          title: 'New user registered',
          description: 'john@example.com joined the platform',
          time: '12m ago',
          color: 'bg-green-500'
        },
        {
          icon: ShoppingBag,
          title: 'Large order placed',
          description: '$156.00 order at Java House',
          time: '23m ago',
          color: 'bg-purple-500'
        },
        {
          icon: CheckCircle,
          title: 'Shop approved',
          description: 'Bean There approved and activated',
          time: '1h ago',
          color: 'bg-green-500'
        },
      ]);

    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
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
          <Zap className="w-12 h-12 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Platform overview and management
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Store}
          title="Total Shops"
          value={stats.totalShops}
          change={12}
          isPositive={true}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.1}
        />
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers}
          change={8}
          isPositive={true}
          color="bg-gradient-to-br from-green-500 to-green-600"
          delay={0.2}
        />
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change={15}
          isPositive={true}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          delay={0.3}
        />
        <StatCard
          icon={ShoppingBag}
          title="Total Orders"
          value={stats.totalOrders}
          change={5}
          isPositive={true}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quick Stats
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm text-amber-600 hover:text-amber-700 font-semibold"
            >
              View All →
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-900 dark:text-green-400">
                  Active Shops
                </span>
              </div>
              <p className="text-3xl font-black text-green-600">{stats.activeShops}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-400">
                  Pending Approval
                </span>
              </div>
              <p className="text-3xl font-black text-yellow-600">{stats.pendingShops}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-900 dark:text-purple-400">
                  Avg Order Value
                </span>
              </div>
              <p className="text-3xl font-black text-purple-600">
                ${stats.avgOrderValue.toFixed(2)}
              </p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Recent Activity
          </h2>
          <div className="space-y-2">
            {recentActivity.map((activity, i) => (
              <ActivityItem key={i} {...activity} />
            ))}
          </div>
        </motion.div>
      </div>

      {stats.pendingShops > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 text-white shadow-2xl cursor-pointer"
          onClick={() => window.location.href = '/admin/shops'}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-8 h-8" />
                <h3 className="text-2xl font-bold">Action Required</h3>
              </div>
              <p className="text-lg opacity-90">
                You have {stats.pendingShops} shop application{stats.pendingShops > 1 ? 's' : ''} waiting for approval
              </p>
            </div>
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowUpRight className="w-8 h-8" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}