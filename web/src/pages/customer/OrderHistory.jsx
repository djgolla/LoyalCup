import { useEffect, useState } from "react";
import { toast } from "sonner";
import supabase from "../../lib/supabase";
import Loading from "../../components/Loading";
import { formatDistanceToNow } from "date-fns";

export default function OrderHistory() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to view order history");
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          shops (
            name,
            logo_url
          ),
          order_items (
            id,
            quantity,
            price
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      accepted: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
      preparing: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
      ready: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      picked_up: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      completed: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
    };
    return colors[status] || "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to cancel orders");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/orders/${orderId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to cancel order');
      }

      toast.success("Order cancelled successfully");
      loadOrders();
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast.error(error.message || "Failed to cancel order");
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Order History
      </h1>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 p-12 rounded-xl border border-gray-200 dark:border-neutral-800 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No orders yet
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Start ordering from your favorite coffee shops!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {order.shops?.logo_url && (
                    <img
                      src={order.shops.logo_url}
                      alt={order.shops.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {order.shops?.name || 'Coffee Shop'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Items</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.order_items?.length || 0} item{order.order_items?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total</p>
                  <p className="font-bold text-amber-700">
                    ${order.total?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              {order.loyalty_points_earned > 0 && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-400">
                    🎉 Earned {order.loyalty_points_earned} loyalty points!
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="px-4 py-2 text-sm border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={() => window.location.href = `/orders/${order.id}`}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
