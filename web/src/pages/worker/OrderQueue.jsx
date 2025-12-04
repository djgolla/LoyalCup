import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import OrderCard from "../../components/worker/OrderCard";
import Loading from "../../components/Loading";
import { toast } from "sonner";

export default function OrderQueue() {
  const { shopId } = useParams();
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchOrders();

    // poll for new orders every 5 seconds
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [shopId]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/v1/shops/${shopId}/orders/queue`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/v1/shops/${shopId}/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Order updated to ${newStatus}`);
        fetchOrders();
      } else {
        toast.error("Failed to update order");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  if (!orders) return <Loading />;

  const allOrders = [
    ...(orders.pending || []),
    ...(orders.accepted || []),
    ...(orders.preparing || []),
    ...(orders.ready || [])
  ];

  const filteredOrders = filter === "all" 
    ? allOrders
    : orders[filter] || [];

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Order Queue
        </h1>
        
        {/* filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
        </select>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {orders.pending?.length || 0}
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">Accepted</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {orders.accepted?.length || 0}
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
          <p className="text-sm text-purple-600 dark:text-purple-400">Preparing</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {orders.preparing?.length || 0}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <p className="text-sm text-green-600 dark:text-green-400">Ready</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {orders.ready?.length || 0}
          </p>
        </div>
      </div>

      {/* kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* pending column */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-yellow-500">🟡</span>
            Pending ({orders.pending?.length || 0})
          </h2>
          {orders.pending?.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={updateOrderStatus}
            />
          ))}
        </div>

        {/* accepted column */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-blue-500">🔵</span>
            Accepted ({orders.accepted?.length || 0})
          </h2>
          {orders.accepted?.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={updateOrderStatus}
            />
          ))}
        </div>

        {/* preparing column */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-purple-500">🟣</span>
            Preparing ({orders.preparing?.length || 0})
          </h2>
          {orders.preparing?.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={updateOrderStatus}
            />
          ))}
        </div>

        {/* ready column */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-green-500">🟢</span>
            Ready ({orders.ready?.length || 0})
          </h2>
          {orders.ready?.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={updateOrderStatus}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
