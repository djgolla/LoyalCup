import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OrderStatusTimeline from "../../components/customer/OrderStatusTimeline";
import OrderStatusBadge from "../../components/customer/OrderStatusBadge";
import Loading from "../../components/Loading";
import Button from "../../components/Button";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrderStatus = async () => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/status`);
      const data = await res.json();
      setOrder(prev => ({ ...prev, status: data.status }));
    } catch (error) {
      console.error("Failed to fetch order status:", error);
    }
  };

  useEffect(() => {
    // fetch initial order details
    fetch(`/api/v1/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => setOrder(data.order));

    // poll for status updates every 10 seconds
    const interval = setInterval(fetchOrderStatus, 10000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchOrderStatus();
    setLoading(false);
  };

  if (!order) return <Loading />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Track Order
          </h1>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* order header */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Order #{order.id?.slice(0, 8)}
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              Total: ${order.total?.toFixed(2)}
            </p>
          </div>
          
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* status timeline */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          Order Progress
        </h2>
        <OrderStatusTimeline status={order.status} />
      </div>

      {/* status message */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center">
        {order.status === "pending" && (
          <p className="text-blue-600 dark:text-blue-400">
            Waiting for shop to accept your order...
          </p>
        )}
        {order.status === "accepted" && (
          <p className="text-blue-600 dark:text-blue-400">
            Your order has been accepted and will be prepared soon!
          </p>
        )}
        {order.status === "preparing" && (
          <p className="text-blue-600 dark:text-blue-400">
            Your order is being prepared. Hang tight!
          </p>
        )}
        {order.status === "ready" && (
          <p className="text-green-600 dark:text-green-400 font-semibold">
            Your order is ready for pickup! 🎉
          </p>
        )}
        {order.status === "completed" && (
          <p className="text-gray-600 dark:text-neutral-400">
            Order completed. Thank you!
          </p>
        )}
      </div>

      {/* actions */}
      {order.status === "pending" && (
        <Button
          onClick={() => {
            // TODO: implement cancel order
            navigate("/");
          }}
          className="w-full bg-red-500 hover:bg-red-600"
        >
          Cancel Order
        </Button>
      )}
    </div>
  );
}
