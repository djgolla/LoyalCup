import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, CheckCircle, XCircle, Package, DollarSign,
  User, Phone, Calendar, Filter, Search, Zap,
  ShoppingBag, Eye, AlertCircle
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';
import { toast } from 'sonner';

const OrderCard = ({ order, onUpdateStatus, onViewDetails, delay }) => {
  const statusConfig = {
    pending: {
      color: 'from-yellow-500 to-yellow-600',
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: Clock,
      label: 'Pending'
    },
    confirmed: {
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      icon: Package,
      label: 'Confirmed'
    },
    preparing: {
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      text: 'text-purple-700 dark:text-purple-400',
      icon: Package,
      label: 'Preparing'
    },
    ready: {
      color: 'from-green-500 to-green-600',
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-400',
      icon: CheckCircle,
      label: 'Ready'
    },
    completed: {
      color: 'from-gray-500 to-gray-600',
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-400',
      icon: CheckCircle,
      label: 'Completed'
    },
    cancelled: {
      color: 'from-red-500 to-red-600',
      bg: 'bg-red-100 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      icon: XCircle,
      label: 'Cancelled'
    }
  };

  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 hover:border-amber-500 shadow-lg hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 bg-gradient-to-br ${config.color} rounded-xl shadow-lg`}>
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Order #{order.id.slice(0, 8)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className={`px-4 py-2 ${config.bg} rounded-xl flex items-center gap-2`}>
          <StatusIcon className={`w-4 h-4 ${config.text}`} />
          <span className={`font-bold text-sm ${config.text}`}>
            {config.label}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {order.customer_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">{order.customer_name}</span>
          </div>
        )}
        {order.customer_phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">{order.customer_phone}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <span className="text-2xl font-black text-green-600">
            {parseFloat(order.total || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewDetails(order)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View
          </motion.button>
          
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <select
              value={order.status}
              onChange={(e) => onUpdateStatus(order.id, e.target.value)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition cursor-pointer"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-2xl w-full my-8"
      >
        <div className="p-6 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            Order Details
          </h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition"
          >
            <XCircle className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Order Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Order ID</p>
                <p className="font-bold text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Date</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Customer</p>
                <p className="font-bold text-gray-900 dark:text-white">{order.customer_name || 'N/A'}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                <p className="font-bold text-gray-900 dark:text-white">{order.customer_phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                    {item.size && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">Size: {item.size}</p>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Add-ons: {item.addons.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                    <p className="font-bold text-green-600">${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-neutral-800">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Total</span>
              <span className="text-3xl font-black text-green-600">
                ${parseFloat(order.total || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {order.notes && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Special Instructions
              </h3>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-gray-700 dark:text-gray-300">{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Orders() {
  const { shopId } = useShop();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (shopId) {
      loadOrders();
      
      // Subscribe to real-time order updates
      const channel = supabase
        .channel('orders')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'orders',
            filter: `shop_id=eq.${shopId}`
          }, 
          () => {
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [shopId]);

  const loadOrders = async () => {
    if (!shopId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success('Order status updated!');
      loadOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <ShoppingBag className="w-12 h-12 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
          Orders
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage incoming orders in real-time
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID or customer..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-amber-500 transition"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <AlertCircle className="w-24 h-24 text-gray-300 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No orders found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Orders will appear here when customers place them'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredOrders.map((order, i) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={handleUpdateStatus}
                onViewDetails={setSelectedOrder}
                delay={i * 0.05}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}