// Shop management page
// List and manage all shops on the platform

import { useEffect, useState, useCallback } from "react";
import { Search, MoreVertical, Star } from "lucide-react";
import { listShops, updateShopStatus, toggleShopFeatured, deleteShop } from "../../api/admin";
import { toast } from "sonner";

export default function Shops() {
  const [shops, setShops] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);

  const loadShops = useCallback(async () => {
    try {
      const filters = filter !== "all" ? { status: filter } : {};
      const data = await listShops(filters);
      setShops(data.shops || []);
    } catch {
      toast.error("Failed to load shops");
    }
  }, [filter]);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const handleStatusChange = async (shopId, newStatus) => {
    try {
      await updateShopStatus(shopId, newStatus);
      toast.success(`Shop status updated to ${newStatus}`);
      loadShops();
    } catch {
      toast.error("Failed to update shop status");
    }
  };

  const handleToggleFeatured = async (shopId) => {
    try {
      await toggleShopFeatured(shopId);
      toast.success("Featured status updated");
      loadShops();
    } catch {
      toast.error("Failed to update featured status");
    }
  };

  const handleDeleteShop = async (shopId) => {
    if (!confirm("Are you sure you want to permanently delete this shop?")) return;
    
    try {
      await deleteShop(shopId);
      toast.success("Shop deleted successfully");
      loadShops();
    } catch {
      toast.error("Failed to delete shop");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      suspended: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return (
      <span className={`px-2 py-1 rounded-md text-xs border ${styles[status] || ""}`}>
        {status}
      </span>
    );
  };

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Shop Management</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search shops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-gray-300 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-2">
          {["all", "active", "pending", "suspended"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition ${
                filter === f
                  ? "bg-amber-500 text-black font-medium"
                  : "bg-neutral-900 text-gray-300 border border-neutral-800 hover:border-neutral-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-800/50 border-b border-neutral-800">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Shop</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Owner</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Revenue</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filteredShops.map((shop) => (
              <tr key={shop.id} className="hover:bg-neutral-800/30 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center text-xl">
                      ☕
                    </div>
                    <div>
                      <p className="text-white font-medium flex items-center gap-2">
                        {shop.name}
                        {shop.featured && <Star className="w-4 h-4 fill-amber-500 text-amber-500" />}
                      </p>
                      <p className="text-xs text-gray-500">{shop.created_at}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300">{shop.owner_email}</td>
                <td className="px-6 py-4">{getStatusBadge(shop.status)}</td>
                <td className="px-6 py-4 text-gray-300">${shop.revenue.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === shop.id ? null : shop.id)}
                      className="p-2 hover:bg-neutral-800 rounded-lg transition"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>

                    {activeMenu === shop.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            handleToggleFeatured(shop.id);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-gray-300 text-sm"
                        >
                          {shop.featured ? "Remove Featured" : "Make Featured"}
                        </button>
                        {shop.status === "pending" && (
                          <button
                            onClick={() => {
                              handleStatusChange(shop.id, "active");
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-gray-300 text-sm"
                          >
                            Approve Shop
                          </button>
                        )}
                        {shop.status === "active" && (
                          <button
                            onClick={() => {
                              handleStatusChange(shop.id, "suspended");
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-gray-300 text-sm"
                          >
                            Suspend Shop
                          </button>
                        )}
                        {shop.status === "suspended" && (
                          <button
                            onClick={() => {
                              handleStatusChange(shop.id, "active");
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-gray-300 text-sm"
                          >
                            Activate Shop
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleDeleteShop(shop.id);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-red-400 text-sm border-t border-neutral-700"
                        >
                          Delete Shop
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredShops.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No shops found
          </div>
        )}
      </div>
    </div>
  );
}
