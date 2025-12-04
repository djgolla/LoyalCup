// OrderDetails.jsx
// shows details for a single order
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => setOrder(data.order));
  }, [id]);

  if (!order) return <Loading />;

  const markCompleted = () => {
    setOrder({ ...order, status: "Completed" });
    toast.success("Order marked as completed");
  };

  const markPreparing = () => {
    setOrder({ ...order, status: "Preparing" });
    toast.success("Order set to preparing");
  };

  // badge color
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

  return (
    <div className="flex flex-col gap-6 animate-fadeIn relative">
      
      {/* Back Button */}
      <button
        onClick={() => navigate("/orders")}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition w-fit"
      >
        <ArrowLeft size={18} /> Back to Orders
      </button>

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
          <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-neutral-400 text-sm">
            <Clock size={15} />
            {new Date(order.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(
            order.status
          )}`}
        >
          {order.status}
        </span>
      </div>

      {/* ITEMS CARD */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <h2 className="text-lg font-semibold mb-3">Items</h2>

        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  Qty: {item.qty}
                </p>
              </div>

              <p className="font-semibold">${(item.qty * item.price).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TOTAL CARD */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <h2 className="text-lg font-semibold mb-3">Total</h2>

        <div className="flex justify-between text-lg font-semibold">
          <span>Total Price:</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-4 mt-2">
        {/* Preparing */}
        {order.status !== "Preparing" && (
          <button
            onClick={markPreparing}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
          >
            <Clock size={18} /> Set Preparing
          </button>
        )}

        {/* Completed */}
        {order.status !== "Completed" && (
          <button
            onClick={markCompleted}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            <CheckCircle size={18} /> Mark Completed
          </button>
        )}
      </div>
    </div>
  );
}
