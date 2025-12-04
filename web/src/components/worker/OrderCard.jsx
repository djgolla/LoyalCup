import { useState } from "react";
import OrderStatusBadge from "../customer/OrderStatusBadge";
import { Clock, User } from "lucide-react";

export default function OrderCard({ order, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);

  const getNextStatus = (currentStatus) => {
    const transitions = {
      'pending': 'accepted',
      'accepted': 'preparing',
      'preparing': 'ready',
      'ready': 'picked_up'
    };
    return transitions[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      'pending': 'Accept',
      'accepted': 'Start Preparing',
      'preparing': 'Mark Ready',
      'ready': 'Complete'
    };
    return labels[currentStatus];
  };

  // calculate time since order was placed
  const getTimeSince = (createdAt) => {
    if (!createdAt) return "Just now";
    const minutes = Math.floor((Date.now() - new Date(createdAt)) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min ago";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      {/* card header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-neutral-500">
              Order #{order.id?.slice(0, 8)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <User size={14} className="text-gray-400" />
              <p className="font-semibold text-gray-900 dark:text-white">
                {order.customer_name || "Customer"}
              </p>
            </div>
          </div>
          
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="text-sm text-gray-600 dark:text-neutral-400">
          {order.item_count || order.items?.length || 0} items • ${order.total?.toFixed(2)}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-neutral-500 mt-2">
          <Clock size={12} />
          {getTimeSince(order.created_at)}
        </div>
      </div>

      {/* expanded details */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-neutral-800 p-4 space-y-3">
          {/* order items */}
          <div className="space-y-2">
            {order.items?.map((item, idx) => (
              <div key={idx} className="text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-900 dark:text-white">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-gray-600 dark:text-neutral-400">
                    ${item.total_price?.toFixed(2)}
                  </span>
                </div>
                {item.customizations && item.customizations.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-neutral-500 ml-4">
                    {item.customizations.map(c => c.name).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* totals */}
          <div className="border-t border-gray-200 dark:border-neutral-800 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-neutral-400">
              <span>Subtotal</span>
              <span>${order.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-neutral-400">
              <span>Tax</span>
              <span>${order.tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-white">
              <span>Total</span>
              <span>${order.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* actions */}
          <div className="flex gap-2 pt-2">
            {order.status === 'pending' && (
              <button
                onClick={() => onUpdateStatus(order.id, 'cancelled')}
                className="flex-1 px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Cancel
              </button>
            )}
            
            {getNextStatus(order.status) && (
              <button
                onClick={() => onUpdateStatus(order.id, getNextStatus(order.status))}
                className="flex-1 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600"
              >
                {getNextStatusLabel(order.status)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
