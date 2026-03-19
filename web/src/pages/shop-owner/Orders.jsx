import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle, XCircle, Package, DollarSign,
  User, Search, ShoppingBag, Eye, AlertCircle, Coffee, X,
  ChevronRight, Loader2,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';
import { toast } from 'sonner';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:    { color: 'from-yellow-500 to-amber-500',   bg: 'bg-yellow-100 dark:bg-yellow-900/20',  text: 'text-yellow-700 dark:text-yellow-400',  icon: Clock,         label: 'Pending' },
  accepted:   { color: 'from-blue-500 to-blue-600',      bg: 'bg-blue-100 dark:bg-blue-900/20',      text: 'text-blue-700 dark:text-blue-400',      icon: Package,       label: 'Accepted' },
  preparing:  { color: 'from-purple-500 to-purple-600',  bg: 'bg-purple-100 dark:bg-purple-900/20',  text: 'text-purple-700 dark:text-purple-400',  icon: Coffee,        label: 'Preparing' },
  ready:      { color: 'from-green-500 to-green-600',    bg: 'bg-green-100 dark:bg-green-900/20',    text: 'text-green-700 dark:text-green-400',    icon: CheckCircle,   label: 'Ready' },
  picked_up:  { color: 'from-teal-500 to-teal-600',      bg: 'bg-teal-100 dark:bg-teal-900/20',      text: 'text-teal-700 dark:text-teal-400',      icon: CheckCircle,   label: 'Picked Up' },
  completed:  { color: 'from-gray-500 to-gray-600',      bg: 'bg-gray-100 dark:bg-gray-800',         text: 'text-gray-700 dark:text-gray-400',      icon: CheckCircle,   label: 'Completed' },
  cancelled:  { color: 'from-red-500 to-red-600',        bg: 'bg-red-100 dark:bg-red-900/20',        text: 'text-red-700 dark:text-red-400',        icon: XCircle,       label: 'Cancelled' },
};

// Valid next statuses per current status (matches backend VALID_TRANSITIONS)
const NEXT_STATUSES = {
  pending:   ['accepted', 'cancelled'],
  accepted:  ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready:     ['picked_up'],
  picked_up: ['completed'],
  completed: [],
  cancelled: [],
};

const shortId = (id) => id?.slice(0, 8).toUpperCase() || '—';

const formatOrderDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return `Today ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// Normalize order_items (joined from Supabase) → flat items
const normalizeItems = (order) => {
  if (!order) return [];
  // If already a flat array with .name directly (legacy shape), use it
  if (order.items?.length && order.items[0]?.name) return order.items;
  // Supabase join shape: order_items[].menu_items.name
  return (order.order_items || []).map(oi => ({
    name: oi.menu_items?.name || 'Item',
    image_url: oi.menu_items?.image_url || null,
    quantity: oi.quantity || 1,
    unit_price: oi.unit_price || 0,
    total_price: oi.total_price || (oi.unit_price * oi.quantity) || 0,
    customizations: oi.customizations || [],
  }));
};

// ─── Order card ───────────────────────────────────────────────────────────────
const OrderCard = ({ order, onViewDetails, delay }) => {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const items = normalizeItems(order);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -3 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border-2 border-gray-200 dark:border-neutral-800 hover:border-amber-500 shadow-sm hover:shadow-lg transition-all cursor-pointer"
      onClick={() => onViewDetails(order)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 bg-gradient-to-br ${config.color} rounded-xl shadow`}>
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              #{shortId(order.id)}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatOrderDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1.5 ${config.bg} rounded-full flex items-center gap-1.5`}>
          <StatusIcon className={`w-3.5 h-3.5 ${config.text}`} />
          <span className={`font-bold text-xs ${config.text}`}>{config.label}</span>
        </div>
      </div>

      {/* Items preview */}
      {items.length > 0 ? (
        <div className="mb-3 space-y-1">
          {items.slice(0, 2).map((item, i) => (
            <p key={i} className="text-sm text-gray-700 dark:text-gray-300 truncate">
              {item.quantity}× {item.name}
            </p>
          ))}
          {items.length > 2 && (
            <p className="text-xs text-gray-400">+{items.length - 2} more</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic mb-3">No items</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-neutral-800">
        <span className="text-xl font-black text-gray-900 dark:text-white">
          ${parseFloat(order.total || 0).toFixed(2)}
        </span>
        <div className="flex items-center gap-1 text-amber-600 text-sm font-semibold">
          <Eye className="w-4 h-4" />
          <span>Manage</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Order details modal ──────────────────────────────────────────────────────
const OrderDetailsModal = ({ order: initialOrder, onClose, onStatusUpdated }) => {
  const [order, setOrder] = useState(initialOrder);
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const items = normalizeItems(order);
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const nextStatuses = NEXT_STATUSES[order.status] || [];

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', order.id);

      if (error) throw error;

      const updated = { ...order, status: newStatus };
      setOrder(updated);
      onStatusUpdated?.(updated);
      toast.success(`Order marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const nextStatusConfig = {
    accepted:  { label: 'Accept Order',      color: 'bg-blue-500 hover:bg-blue-600' },
    preparing: { label: 'Start Preparing',   color: 'bg-purple-500 hover:bg-purple-600' },
    ready:     { label: 'Mark Ready',        color: 'bg-green-500 hover:bg-green-600' },
    picked_up: { label: 'Mark Picked Up',    color: 'bg-teal-500 hover:bg-teal-600' },
    completed: { label: 'Complete Order',    color: 'bg-gray-600 hover:bg-gray-700' },
    cancelled: { label: 'Cancel Order',      color: 'bg-red-500 hover:bg-red-600' },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Order #{shortId(order.id)}
            </h2>
            <p className="text-sm text-gray-500">{formatOrderDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 ${config.bg} rounded-full flex items-center gap-1.5`}>
              <StatusIcon className={`w-3.5 h-3.5 ${config.text}`} />
              <span className={`font-bold text-xs ${config.text}`}>{config.label}</span>
            </div>
            <motion.button
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </motion.button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">

          {/* Status actions */}
          {nextStatuses.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map(s => {
                  const c = nextStatusConfig[s];
                  const isCancelling = s === 'cancelled';
                  return (
                    <motion.button
                      key={s}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={updating}
                      onClick={() => handleStatusChange(s)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed
                        ${isCancelling ? 'bg-red-500 hover:bg-red-600' : c?.color || 'bg-gray-500 hover:bg-gray-600'}`}
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {c?.label || `Mark ${STATUS_CONFIG[s]?.label || s}`}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Order Items ({items.length})
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
              <span>Tax</span>
              <span>${parseFloat(order.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-lg text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-neutral-700">
              <span>Total</span>
              <span className="text-green-600">${parseFloat(order.total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                Special Instructions
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{order.notes}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Orders() {
  const { shopId } = useShop();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    if (!shopId) return;
    try {
      // ← KEY FIX: join order_items + menu_items so items actually load
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` }, loadOrders)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [shopId, loadOrders]);

  const handleStatusUpdated = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o));
    setSelectedOrder(prev => prev?.id === updatedOrder.id ? { ...prev, status: updatedOrder.status } : prev);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    if (!searchQuery) return matchesStatus;
    const q = searchQuery.toLowerCase();
    return matchesStatus && (
      order.id.toLowerCase().includes(q) ||
      order.customer_name?.toLowerCase().includes(q) ||
      order.customer_phone?.includes(searchQuery)
    );
  });

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const activeCount = (statusCounts.pending || 0) + (statusCounts.accepted || 0) + (statusCounts.preparing || 0);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-1">Orders</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {activeCount > 0 ? (
                <span className="text-amber-600 font-semibold">{activeCount} active order{activeCount !== 1 ? 's' : ''}</span>
              ) : 'All caught up!'}
              {' · '}{orders.length} total
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID or customer..."
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-amber-500 transition text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-amber-500 transition text-sm"
        >
          <option value="all">All Orders ({orders.length})</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) =>
            statusCounts[key] ? (
              <option key={key} value={key}>{cfg.label} ({statusCounts[key]})</option>
            ) : null
          )}
        </select>
      </div>

      {/* Grid */}
      {filteredOrders.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-gray-200 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No orders found</h3>
          <p className="text-gray-500 text-sm">
            {searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Orders will appear here when customers place them'}
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
            onStatusUpdated={handleStatusUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}