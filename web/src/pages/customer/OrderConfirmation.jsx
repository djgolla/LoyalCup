import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OrderStatusTimeline from "../../components/customer/OrderStatusTimeline";
import Loading from "../../components/Loading";
import Button from "../../components/Button";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // fetch order details
    fetch(`/api/v1/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => setOrder(data.order));
  }, [orderId]);

  if (!order) return <Loading />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* success message */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
            <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Order Placed Successfully!
        </h1>
        
        <p className="text-gray-600 dark:text-neutral-400">
          Your order has been received and is being prepared
        </p>
      </div>

      {/* order info */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Order Number
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              #{order.id?.slice(0, 8)}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Total
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              ${order.total?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* estimated time */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Estimated preparation time
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            10-15 min
          </p>
        </div>
      </div>

      {/* order status */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          Order Status
        </h2>
        <OrderStatusTimeline status={order.status || "pending"} />
      </div>

      {/* actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => navigate(`/order-tracking/${orderId}`)}
          className="flex-1"
        >
          Track Order
        </Button>
        
        <Button
          onClick={() => navigate("/")}
          className="flex-1 bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-neutral-700"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
