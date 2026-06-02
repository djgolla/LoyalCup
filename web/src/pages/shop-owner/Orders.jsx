import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle, XCircle, Search, ShoppingBag,
  Eye, AlertCircle, Coffee, X, ChevronRight, Loader2, Terminal, Printer,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';
import { toast } from 'sonner';

// ─── Status config (display only — no workflow) ─────────────────────────────
// Orders are simply Placed, Completed, or Cancelled. Everything routes to the
// shop's Square POS and prints marked "MOBILE"; baristas make it from the ticket.
const STATUS_CONFIG = {
  confirmed: { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', icon: Terminal,   label: 'Placed'    },
  pending:   { bg: 'bg-amber-100 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-400',     icon: Clock,      label: 'Placed'    },
  completed: { bg: 'bg-gray-100 dark:bg-gray-800',          text: 'text-gray-600 dark:text-gray-400',       icon: CheckCircle,label: 'Completed' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/20',         text: 'text-red-700 dark:text-red-400',         icon: XCircle,    label: 'Cancelled' },
};

// Real visible orders — exclude payment lifecycle ghost statuses
const VISIBLE_STATUSES = ['confirmed', 'pending', 'completed', 'cancelled'];

const shortId    = (id) => id?.slice(0, 8).toUpperCase() || '—';
const formatDate = (d) => {
  if (!d) return '';
  const date    = new Date(d);
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const normalizeItems = (order) => {
  if (!order) return [];
  if (order.items?.length && order.items[0]?.name) return order.items;
  return (order.order_items || []).map(oi => ({
    name:           oi.menu_items?.name || 'Item',
    image_url:      oi.menu_items?.image_url || null,
    quantity:       oi.quantity || 1,
    unit_price:     oi.unit_price || 0,
    total_price:    oi.total_price || (oi.unit_price * oi.quantity) || 0,
    customizations: oi.customizations || [],
  }));
};

// ─── Order card ─────────────────────────────────────────────────────────────
const OrderCard = ({ order, onViewDetails, delay }) => {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;
  const StatusIcon = config.icon;
  const items  = normalizeItems(order);
  const isNew  = order.status === 'confirmed' || order.status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -3 }}
      className={`bg-white dark:bg-neutral-900 rounded-2xl p-5 border-2 shadow-sm hover:shadow-lg transition-all cursor-pointer
        ${isNew
          ? 'border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-200 dark:ring-emerald-900'
          : 'border-gray-200 dark:border-neutral-800 hover:border-amber-500'
        }`}
      onClick={() => onViewDetails(order)}
    >
      {isNew && (
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
            <Printer className="w-3 h-3" /> Printed at counter · MOBILE
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">#{shortId(order.id)}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 ${config.bg} rounded-full flex items-center gap-1.5`}>
          <StatusIcon className={`w-3.5 h-3.5 ${config.text}`} />
          <span className={`font-bold text-xs ${config.text}`}>{config.label}</span>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mb-3 space-y-1">
          {items.slice(0, 2).map((item, i) => (
            <p key={i} className="text-sm text-gray-700 dark:text-gray-300 truncate">
              {item.quantity}× {item.name}
            </p>
          ))}
          {items.length > 2 && <p className="text-xs text-gray-400">+{items.length - 2} more</p>}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic mb-3">Loading items...</p>
      )}

      {order.metadata?.customer_note && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1 mb-3 truncate">
          📝 {order.metadata.customer_note}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-neutral-800">
        <span className="text-xl font-black text-gray-900 dark:text-white">
          ${parseFloat(order.total || 0).toFixed(2)}
        </span>
        <div className="flex items-center gap-1 text-amber-600 text-sm font-semibold">
          <Eye className="w-4 h-4" />
          <span>View</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Order details modal (read-only) ────────────────────────────────────────
const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  const items  = normalizeItems(order);
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;
  const StatusIcon = config.icon;
  const discountAmount = parseFloat(order.metadata?.discount_amount || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Order #{shortId(order.id)}</h2>
            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 ${config.bg} rounded-full flex items-center gap-1.5`}>
              <StatusIcon className={`w-3.5 h-3.5 ${config.text}`} />
              <span className={`font-bold text-xs ${config.text}`}>{config.label}</span>
            </div>
            <motion.button
              whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </motion.button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">

          {/* Print reminder */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-800 rounded-xl px-3 py-2">
            <Printer className="w-3.5 h-3.5" />
            <span>This order printed at your Square station marked “MOBILE”.</span>
          </div>

          {/* Payment badge */}
          {order.metadata?.square_payment_id && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-800 rounded-xl px-3 py-2">
              <Terminal className="w-3.5 h-3.5" />
              <span>Paid via Square · {order.metadata.square_payment_id.slice(0, 16)}...</span>
            </div>
          )}

          {/* Customer note */}
          {(order.metadata?.customer_note || order.notes) && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                Special Instructions
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {order.metadata?.customer_note || order.notes}
              </p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Items ({items.length})
            </p>
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center shrink-0">
                        <Coffee className="w-6 h-6 text-amber-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {item.quantity}× {item.name}
                      </p>
                      {item.customizations?.length > 0 && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          {item.customizations.map(c => c.name || c).join(' · ')}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm shrink-0">
                      ${parseFloat(item.total_price || item.unit_price * item.quantity || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Coffee className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No item details available</p>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>${parseFloat(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Tax (Square)</span>
              <span>${parseFloat(order.tax || 0).toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>
                  Loyalty discount
                  {order.metadata?.loyalty_points_redeemed > 0
                    ? ` (${order.metadata.loyalty_points_redeemed} pts)`
                    : ''}
                </span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-lg text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-neutral-700">
              <span>Charged</span>
              <span className="text-green-600">${parseFloat(order.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main page ──────────────────────────────────────────────────────────────
export default function Orders() {
  const { shopId }                        = useShop();
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    if (!shopId) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id, quantity, unit_price, total_price, customizations,
            menu_items (name, image_url)
          )
        `)
        .eq('shop_id', shopId)
        .in('status', VISIBLE_STATUSES)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (!shopId) return;
    loadOrders();

    const channel = supabase
      .channel(`shop-orders-${shopId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` },
        (payload) => {
          if (VISIBLE_STATUSES.includes(payload.new?.status)) {
            loadOrders();
            if (payload.eventType === 'INSERT') {
              toast.success('🔔 New mobile order — check your printer!', { duration: 6000 });
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [shopId, loadOrders]);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    if (!searchQuery) return matchesStatus;
    return matchesStatus && order.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const statusCounts = orders.reduce((acc, o) => {
    const key = (o.status === 'confirmed' || o.status === 'pending') ? 'placed' : o.status;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const todayCount = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-1">Orders</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {todayCount} today · {orders.length} total — every order prints at your counter marked “MOBILE”.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID..."
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-amber-500 transition text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-amber-500 transition text-sm text-gray-900 dark:text-white"
        >
          <option value="all">All Orders ({orders.length})</option>
          <option value="completed">Completed ({statusCounts.completed || 0})</option>
          <option value="cancelled">Cancelled ({statusCounts.cancelled || 0})</option>
        </select>
      </div>

      {/* Grid */}
      {filteredOrders.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-gray-200 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No orders found</h3>
          <p className="text-gray-500 text-sm">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Orders will appear here when customers place them through the app'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredOrders.map((order, i) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={setSelectedOrder}
                delay={Math.min(i * 0.04, 0.3)}
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