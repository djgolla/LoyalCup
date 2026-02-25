import { useEffect, useState } from "react";
import { toast } from "sonner";
import supabase from "../../lib/supabase";
import Loading from "../../components/Loading";
import { formatDistanceToNow } from "date-fns";

export default function OrderQueue() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [shopId, setShopId] = useState(null);
  const [filter, setFilter] = useState('active'); // 'active', 'all'

  useEffect(() => {
    loadWorkerShop();
  }, []);

  useEffect(() => {
    if (shopId) {
      loadOrders();
      // Poll for new orders every 10 seconds
      const interval = setInterval(loadOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [shopId, filter]);

  const loadWorkerShop = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in");
        return;
      }

      // Get the shop this worker belongs to from their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('shop_id')
        .eq('id', user.id)
        .single();

      if (!profile?.shop_id) {
        toast.error("You are not assigned to a shop");
        return;
      }

      setShopId(profile.shop_id);
    } catch (error) {
      console.error("Failed to load worker shop:", error);
      toast.error("Failed to load shop information");
    }
  };

  const loadOrders = async () => {
    if (!shopId) return;

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            menu_items (
              name
            )
          )
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: true });

      // Filter based on status
      if (filter === 'active') {
        query = query.in('status', ['pending', 'accepted', 'preparing', 'ready']);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/orders/${orderId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      toast.success(`Order marked as ${newStatus}`);
      loadOrders();
    } catch (error) {
      console.error("Failed to update order:", error);
      toast.error("Failed to update order status");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      accepted: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
      preparing: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
      ready: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getNextAction = (status) => {
    const actions = {
      pending: { label: "Accept Order", nextStatus: "accepted" },
      accepted: { label: "Start Preparing", nextStatus: "preparing" },
      preparing: { label: "Mark Ready", nextStatus: "ready" },
      ready: { label: "Mark Picked Up", nextStatus: "picked_up" }
    };
    return actions[status];
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Order Queue
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'active'
                ? 'bg-amber-700 text-white'
                : 'bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Active Orders
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-amber-700 text-white'
                : 'bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            All Orders
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 p-12 rounded-xl border border-gray-200 dark:border-neutral-800 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No orders in queue
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            New orders will appear here automatically
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => {
            const nextAction = getNextAction(order.status);
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.order_items?.map((item) => (
                    <p key={item.id} className="text-sm text-gray-600 dark:text-gray-400">
                      • {item.menu_items?.name || 'Item'} x{item.quantity}
                    </p>
                  ))}
                </div>

                <div className="mb-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-bold text-amber-700">
                      ${order.total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                {nextAction && (
                  <button
                    onClick={() => updateOrderStatus(order.id, nextAction.nextStatus)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    {nextAction.label}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
