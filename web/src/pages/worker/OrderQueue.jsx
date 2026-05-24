import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle, Package, AlertCircle,
  Coffee, Zap, ArrowRight, RefreshCw,
} from 'lucide-react';
import supabase from '../../lib/supabase';
import { toast } from 'sonner';

// Status transitions a barista can make
const NEXT_STATUS = {
  confirmed: { status: 'accepted',  label: 'Accept Order',   color: 'from-blue-500 to-blue-600' },
  accepted:  { status: 'preparing', label: 'Start Preparing', color: 'from-purple-500 to-purple-600' },
  preparing: { status: 'ready',     label: 'Mark Ready ✓',   color: 'from-green-500 to-green-600' },
  ready:     { status: 'completed', label: 'Picked Up',       color: 'from-gray-500 to-gray-600' },
};

const STATUS_LABELS = {
  confirmed: { label: 'Confirmed', bg: 'bg-blue-100', text: 'text-blue-700' },
  accepted:  { label: 'Accepted',  bg: 'bg-indigo-100', text: 'text-indigo-700' },
  preparing: { label: 'Preparing', bg: 'bg-purple-100', text: 'text-purple-700' },
  ready:     { label: 'Ready!',    bg: 'bg-green-100', text: 'text-green-700' },
};

const getTimeSince = (date) => {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
};

const normalizeItems = (order) => {
  if (order.order_items?.length) {
    return order.order_items.map(oi => ({
      name:           oi.menu_items?.name || 'Item',
      quantity:       oi.quantity || 1,
      customizations: oi.customizations || [],
    }));
  }
  // fallback flat shape
  return (order.items || []);
};

const OrderCard = ({ order, shopId, onStatusChanged, delay }) => {
  const [processing, setProcessing] = useState(false);
  const items      = normalizeItems(order);
  const nextInfo   = NEXT_STATUS[order.status];
  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, bg: 'bg-gray-100', text: 'text-gray-600' };
  const note       = order.metadata?.customer_note || order.notes;
  const isOld      = (Date.now() - new Date(order.created_at)) / 1000 > 600; // >10 min

  const handleStatusChange = async () => {
    if (!nextInfo) return;
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      // ✅ Go through the backend — triggers push notifications + emails
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/shops/${shopId}/orders/${order.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextInfo.status }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Status update failed');
      }

      const msgs = {
        accepted:  '✅ Order accepted!',
        preparing: '👨‍🍳 Preparing...',
        ready:     '✨ Ready for pickup!',
        completed: '🎉 Order complete!',
      };
      toast.success(msgs[nextInfo.status] || 'Updated!');
      onStatusChanged();
    } catch (e) {
      toast.error(e.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  // play a subtle beep on new confirmed orders
  useEffect(() => {
    if (order.status === 'confirmed') {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
      } catch {}
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25, delay }}
      className={`bg-white dark:bg-neutral-900 rounded-2xl p-5 border-2 shadow-xl transition-all
        ${isOld ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-neutral-800'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">#{order.id.slice(0, 8).toUpperCase()}</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {getTimeSince(order.created_at)}
              {isOld && <span className="ml-1 text-red-500 font-bold">⚠ Waiting long</span>}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`px-2.5 py-1 rounded-full text-xs font-bold mb-1 ${statusInfo.bg} ${statusInfo.text}`}>
            {statusInfo.label}
          </div>
          <p className="text-2xl font-black text-green-600">${parseFloat(order.total || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4 space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items</p>
        {items.length > 0 ? items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
            <span className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {item.quantity}
            </span>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</p>
              {(item.customizations || []).length > 0 && (
                <p className="text-xs text-amber-600 mt-0.5">
                  {item.customizations.map(c => c.name || c).filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
        )) : (
          <p className="text-sm text-gray-400 italic">No item details</p>
        )}
      </div>

      {/* Note */}
      {note && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">{note}</p>
          </div>
        </div>
      )}

      {/* Action */}
      {nextInfo && (
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          disabled={processing}
          onClick={handleStatusChange}
          className={`w-full py-4 bg-gradient-to-r ${nextInfo.color} text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {processing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Zap className="w-5 h-5" />
            </motion.div>
          ) : (
            <>{nextInfo.label} <ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>
      )}
    </motion.div>
  );
};

export default function OrderQueue() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopId,  setShopId]  = useState(null);
  const [filter,  setFilter]  = useState('active');

  // Load the worker's assigned shop_id
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Not logged in'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('shop_id')
        .eq('id', user.id)
        .single();

      if (!profile?.shop_id) {
        toast.error('No shop assigned to your worker account');
        return;
      }
      setShopId(profile.shop_id);
    })();
  }, []);

  const loadOrders = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      let q = supabase
        .from('orders')
        .select(`
          id, status, total, subtotal, tax, created_at, notes, metadata,
          order_items (
            quantity, unit_price, total_price, customizations,
            menu_items (name, image_url)
          )
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: true });

      if (filter === 'active') {
        q = q.in('status', ['confirmed', 'accepted', 'preparing', 'ready']);
      } else {
        // all orders today
        const today = new Date(); today.setHours(0, 0, 0, 0);
        q = q.gte('created_at', today.toISOString());
      }

      const { data, error } = await q;
      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      toast.error('Failed to load orders: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [shopId, filter]);

  useEffect(() => { if (shopId) loadOrders(); }, [shopId, filter, loadOrders]);

  // Real-time subscription
  useEffect(() => {
    if (!shopId) return;
    const channel = supabase
      .channel(`worker-queue-${shopId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
        filter: `shop_id=eq.${shopId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          toast.success('🔔 New order received!', { duration: 6000 });
        }
        loadOrders();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [shopId, loadOrders]);

  const counts = {
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    accepted:  orders.filter(o => o.status === 'accepted').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready:     orders.filter(o => o.status === 'ready').length,
  };
  const activeCount = counts.confirmed + counts.accepted + counts.preparing + counts.ready;

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Package className="w-12 h-12 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-amber-600" /> Order Queue
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {activeCount > 0
              ? <span className="text-amber-600 font-bold">{activeCount} active</span>
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} onClick={loadOrders}
            className="p-2 text-gray-400 hover:text-gray-600 border-2 border-gray-200 dark:border-neutral-700 rounded-xl">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'New',       count: counts.confirmed, color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Accepted',  count: counts.accepted,  color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Preparing', count: counts.preparing, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Ready',     count: counts.ready,     color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className={`${s.bg} rounded-xl p-3 text-center border-2 border-transparent`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[['active', 'Active'], ['all', "Today's All"]].map(([key, label]) => (
          <motion.button key={key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition
              ${filter === key
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300'}`}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {/* Orders */}
      {orders.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">All caught up! 🎉</h3>
          <p className="text-gray-500">No {filter === 'active' ? 'active ' : ''}orders right now</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {orders.map((order, i) => (
              <OrderCard
                key={order.id}
                order={order}
                shopId={shopId}
                onStatusChanged={loadOrders}
                delay={i * 0.04}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}