import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, CheckCircle, Package, AlertCircle,
  User, Phone, Coffee, Zap, ArrowRight, Bell
} from 'lucide-react';
import supabase from '../../lib/supabase';
import { toast } from 'sonner';

const OrderCard = ({ order, onStatusChange, delay }) => {
  const [processing, setProcessing] = useState(false);

  const nextStatus = {
    pending: { status: 'confirmed', label: 'Confirm Order', color: 'from-blue-500 to-blue-600' },
    confirmed: { status: 'preparing', label: 'Start Preparing', color: 'from-purple-500 to-purple-600' },
    preparing: { status: 'ready', label: 'Mark Ready', color: 'from-green-500 to-green-600' },
    ready: { status: 'completed', label: 'Complete', color: 'from-gray-500 to-gray-600' },
  };

  const statusInfo = nextStatus[order.status];

  const handleStatusChange = async () => {
    if (!statusInfo) return;
    
    setProcessing(true);
    await onStatusChange(order.id, statusInfo.status);
    setProcessing(false);
  };

  const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              #{order.id.slice(0, 8)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getTimeSince(order.created_at)}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
          <p className="text-3xl font-black text-green-600">
            ${parseFloat(order.total || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Customer Info */}
      {(order.customer_name || order.customer_phone) && (
        <div className="mb-4 space-y-2">
          {order.customer_name && (
            <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {order.customer_name}
              </span>
            </div>
          )}
          {order.customer_phone && (
            <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{order.customer_phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Order Items */}
      <div className="mb-4 space-y-2">
        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Items:</h4>
        {order.items && order.items.length > 0 ? (
          order.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 + i * 0.05 }}
              className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white">
                  {item.quantity}x {item.name}
                </p>
                {item.size && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">Size: {item.size}</p>
                )}
                {item.addons && item.addons.length > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    + {item.addons.join(', ')}
                  </p>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">No items</p>
        )}
      </div>

      {/* Special Instructions */}
      {order.notes && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-yellow-900 dark:text-yellow-400 text-sm mb-1">
                Special Instructions:
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">{order.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {statusInfo && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={processing}
          onClick={handleStatusChange}
          className={`w-full py-4 bg-gradient-to-r ${statusInfo.color} text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {processing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-5 h-5" />
              </motion.div>
              Processing...
            </>
          ) : (
            <>
              {statusInfo.label}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      )}
    </motion.div>
  );
};

export default function OrderQueue() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [user, setUser] = useState(null);
  const [shopId, setShopId] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (shopId) {
      loadOrders();
      subscribeToOrders();
    }
  }, [shopId, filter]);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please login');
        return;
      }

      setUser(user);

      // Get worker's shop_id from profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('shop_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!profile?.shop_id) {
        toast.error('No shop assigned to your account');
        return;
      }

      setShopId(profile.shop_id);
    } catch (error) {
      console.error('Failed to load user:', error);
      toast.error('Failed to load user data');
    }
  };

  const loadOrders = async () => {
    if (!shopId) return;

    try {
      setLoading(true);

      let query = supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: true });

      if (filter === 'active') {
        query = query.in('status', ['pending', 'confirmed', 'preparing', 'ready']);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('Loaded orders:', data);
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrders = () => {
    if (!shopId) return;

    const channel = supabase
      .channel('worker-orders')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `shop_id=eq.${shopId}`
        }, 
        (payload) => {
          console.log('Order update:', payload);
          loadOrders();
          
          if (payload.eventType === 'INSERT') {
            playNotificationSound();
            toast.success('New order received! 🔔', {
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      const statusMessages = {
        confirmed: '✅ Order confirmed!',
        preparing: '👨‍🍳 Started preparing!',
        ready: '✨ Order ready for pickup!',
        completed: '🎉 Order completed!',
      };

      toast.success(statusMessages[newStatus] || 'Status updated!');
      loadOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Package className="w-12 h-12 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <Package className="w-10 h-10 text-amber-600" />
              Order Queue
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                filter === 'active'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Active Only
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              All Orders
            </motion.button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending', count: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-600' },
            { label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length, color: 'text-blue-600' },
            { label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length, color: 'text-purple-600' },
            { label: 'Ready', count: orders.filter(o => o.status === 'ready').length, color: 'text-green-600' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-white dark:bg-neutral-900 rounded-xl p-4 border-2 border-gray-200 dark:border-neutral-800 shadow-lg"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.count}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            All caught up! 🎉
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No orders in the queue right now
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {orders.map((order, i) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                delay={i * 0.05}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}