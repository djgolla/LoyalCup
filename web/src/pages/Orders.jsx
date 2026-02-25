// Orders.jsx
// list of all orders — fetches /api/orders
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle, Clock, XCircle, Trash2 } from "lucide-react";

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        // sort by time (newest first)
        const sorted = data.orders.sort(
          (a, b) => new Date(b.time) - new Date(a.time)
        );
        setOrders(sorted);
      });
  }, []);

  if (!orders) return <Loading />;

  // status badge styling
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300";
      case "Preparing":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300";
      default:
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300";
    }
  };

  // mark completed
  const markCompleted = (id) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: "Completed" } : o
      )
    );
    toast.success("Order marked completed");
  };

  // delete order
  const deleteOrder = (id) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    toast.error("Order removed");
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <h1 className="text-2xl font-semibold">Orders</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md hover:shadow-lg transition relative cursor-pointer"
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            {/* top row */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Order #{order.id}
              </h2>

              <span
                className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>

            {/* items */}
            <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
              {order.items.map((i) => `${i.name} x${i.qty}`).join(" • ")}
            </p>

            {/* price */}
            <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
              ${order.total.toFixed(2)}
            </p>

            {/* time */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-500 mt-3">
              <Clock size={14} />
              {new Date(order.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            {/* action icons */}
            <div
              className="absolute bottom-3 right-3 flex gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* mark completed */}
              {order.status !== "Completed" && (
                <button
                  onClick={() => markCompleted(order.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <CheckCircle size={20} className="text-green-600" />
                </button>
              )}

              {/* delete */}
              <button
                onClick={() => deleteOrder(order.id)}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
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
