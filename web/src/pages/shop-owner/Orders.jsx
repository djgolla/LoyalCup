// Orders.jsx
import { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle, Clock, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      console.log('🔥 Loading orders...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Auth error:', authError);
        toast.error("Please log in");
        setOrders([]);
        setLoading(false);
        return;
      }

      console.log('✅ User:', user.id);

      // Get user's shops
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id);

      if (shopsError) {
        console.error('❌ Shops error:', shopsError);
        toast.error('Failed to load shops');
        setOrders([]);
        setLoading(false);
        return;
      }

      const shopIds = shops?.map(s => s.id) || [];
      console.log('✅ Shop IDs:', shopIds);

      if (shopIds.length === 0) {
        console.log('⚠️ No shops');
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          shop:shops(name, logo_url),
          customer:profiles(full_name, email),
          order_items(
            id,
            quantity,
            unit_price,
            total_price,
            menu_item:menu_items(name, image_url)
          )
        `)
        .in('shop_id', shopIds)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Orders error:', ordersError);
        toast.error('Failed to load orders');
        setOrders([]);
      } else {
        console.log('✅ Orders loaded:', ordersData?.length || 0);
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    switch (s) {
      case "completed":
        return "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300";
      case "preparing":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "pending":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-300";
    }
  };

  const markCompleted = async (orderId, e) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'completed' } : o
        )
      );
      toast.success("Order marked completed");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to update order");
    }
  };

  const deleteOrder = async (orderId, e) => {
    e.stopPropagation();
    
    if (!confirm('Delete this order?')) return;

    try {
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("Order deleted");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to delete order");
    }
  };

  if (loading) return <Loading />;

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fadeIn">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="bg-white dark:bg-neutral-900 p-12 rounded-xl border border-gray-200 dark:border-neutral-800 text-center">
          <p className="text-gray-500 dark:text-neutral-400">No orders yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <h1 className="text-2xl font-semibold">Orders ({orders.length})</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md hover:shadow-lg transition relative cursor-pointer"
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Order #{order.id.slice(0, 8)}
              </h2>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(order.status)}`}
              >
                {order.status || 'pending'}
              </span>
            </div>

            {order.customer && (
              <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
                {order.customer.full_name || order.customer.email}
              </p>
            )}

            <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
              {order.order_items && order.order_items.length > 0
                ? order.order_items.map((item) => 
                    `${item.menu_item?.name || 'Item'} x${item.quantity}`
                  ).join(" • ")
                : "No items"}
            </p>

            <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
              ${order.total?.toFixed(2) || '0.00'}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-500 mt-3">
              <Clock size={14} />
              {new Date(order.created_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            <div className="absolute bottom-3 right-3 flex gap-3">
              {order.status !== "completed" && (
                <button
                  onClick={(e) => markCompleted(order.id, e)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                >
                  <CheckCircle size={20} className="text-green-600" />
                </button>
              )}

              <button
                onClick={(e) => deleteOrder(order.id, e)}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
              >
                <Trash2 size={20} className="text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}