// Shop Owner Orders page
// Manage and view all shop orders

import { useEffect, useState } from "react";
import { Package, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import OrderCard from "../../components/worker/OrderCard";
import Loading from "../../components/Loading";
import { getShopOrders, updateOrderStatus } from "../../api/orders";

const SHOP_ID = "shop-1"; // TODO: Get from auth context

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const filters = filterStatus !== "all" ? { status: filterStatus } : {};
      const response = await getShopOrders(SHOP_ID, filters);
      setOrders(response.orders || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(SHOP_ID, orderId, newStatus);
      toast.success("Order status updated");
      loadOrders();
    } catch (error) {
      console.error("Failed to update order:", error);
      toast.error("Failed to update order");
    }
  };

  const filteredOrders = searchQuery
    ? orders.filter(order =>
        order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : orders;

  const statuses = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "preparing", label: "Preparing" },
    { value: "ready", label: "Ready" },
    { value: "picked_up", label: "Picked Up" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Orders Management
          </h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">
            View and manage all shop orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search orders by ID or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Package size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Pending</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Package size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Preparing</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {orders.filter(o => o.status === 'preparing').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Package size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Ready</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {orders.filter(o => o.status === 'ready').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
              <Package size={20} className="text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Completed</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-12 text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No orders found
            </h3>
            <p className="text-gray-500 dark:text-neutral-400">
              {searchQuery
                ? "No orders match your search criteria"
                : filterStatus !== "all"
                ? `No ${filterStatus} orders at the moment`
                : "Orders will appear here once customers start placing them"}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={(newStatus) => handleUpdateStatus(order.id, newStatus)}
            />
          ))
        )}
      </div>
    </div>
  );
}
