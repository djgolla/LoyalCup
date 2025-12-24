import { useEffect, useState } from "react";
import { Store, Search, Plus, Edit, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import supabase from "../../lib/supabase";

export default function ShopManagement() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shops")
        .select(`
          *,
          profiles: owner_id (
            email,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error("Failed to load shops:", error);
      toast.error("Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (shopId) => {
    try {
      const { error } = await supabase
        .from("shops")
        .update({ status: "active" })
        .eq("id", shopId);

      if (error) throw error;
      toast.success("Shop approved!");
      loadShops();
    } catch (error) {
      console.error("Failed to approve shop:", error);
      toast.error("Failed to approve shop");
    }
  };

  const handleSuspend = async (shopId) => {
    try {
      const { error } = await supabase
        .from("shops")
        .update({ status: "suspended" })
        .eq("id", shopId);

      if (error) throw error;
      toast.success("Shop suspended");
      loadShops();
    } catch (error) {
      console.error("Failed to suspend shop:", error);
      toast.error("Failed to suspend shop");
    }
  };

  const handleDelete = async (shopId) => {
    if (! confirm("Are you sure you want to delete this shop?  This cannot be undone.")) return;

    try {
      const { error } = await supabase. from("shops").delete().eq("id", shopId);

      if (error) throw error;
      toast.success("Shop deleted");
      loadShops();
    } catch (error) {
      console.error("Failed to delete shop:", error);
      toast.error("Failed to delete shop");
    }
  };

  const handleFeatureToggle = async (shopId, currentValue) => {
    try {
      const { error } = await supabase
        .from("shops")
        .update({ featured: !currentValue })
        .eq("id", shopId);

      if (error) throw error;
      toast.success(currentValue ? "Shop unfeatured" : "Shop featured!");
      loadShops();
    } catch (error) {
      console.error("Failed to update shop:", error);
      toast.error("Failed to update shop");
    }
  };

  const filteredShops = shops.filter((shop) =>
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingShops = shops.filter((shop) => shop.status === "pending");

  const handleReject = async (shopId) => {
    if (!confirm("Are you sure you want to reject this application?")) return;

    try {
      const { error } = await supabase
        .from("shops")
        .update({ status: "rejected" })
        .eq("id", shopId);

      if (error) throw error;
      toast.success("Application rejected");
      loadShops();
    } catch (error) {
      console.error("Failed to reject shop:", error);
      toast.error("Failed to reject shop");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "suspended":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default: 
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Applications Section */}
      {pendingShops.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-600 text-white rounded-full p-2">
                <Store size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Pending Applications
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pendingShops.length} shop{pendingShops.length !== 1 ? 's' : ''} awaiting approval
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {pendingShops.slice(0, 5).map((shop) => (
              <div
                key={shop.id}
                className="bg-white dark:bg-neutral-900 rounded-lg p-4 border border-amber-200 dark:border-amber-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {shop.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Owner: {shop.profiles?.email || 'No email'} •{' '}
                      {shop.city ? `${shop.city}, ${shop.state}` : 'Location not provided'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Applied: {new Date(shop.created_at).toLocaleDateString()}
                    </p>
                    {shop.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                        {shop.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(shop.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <Check size={18} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(shop.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <X size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Shop Management
          </h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">
            Manage all coffee shops on the platform
          </p>
        </div>
        <button
          onClick={() => {
            setEditingShop(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
        >
          <Plus size={20} />
          Add Shop
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search shops by name or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e. target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-800">
          <p className="text-sm text-gray-500 dark:text-neutral-400">Total Shops</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{shops.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-800">
          <p className="text-sm text-gray-500 dark:text-neutral-400">Active</p>
          <p className="text-2xl font-semibold text-green-600">
            {shops.filter((s) => s.status === "active").length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-800">
          <p className="text-sm text-gray-500 dark:text-neutral-400">Pending</p>
          <p className="text-2xl font-semibold text-yellow-600">
            {shops.filter((s) => s.status === "pending").length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-800">
          <p className="text-sm text-gray-500 dark:text-neutral-400">Featured</p>
          <p className="text-2xl font-semibold text-purple-600">
            {shops.filter((s) => s.featured).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-neutral-400 mt-4">Loading shops...</p>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="p-12 text-center">
            <Store size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No shops found
            </h3>
            <p className="text-gray-500 dark:text-neutral-400">
              {searchQuery ? "Try adjusting your search" : "Add your first shop to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-neutral-400">
                    Shop
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-neutral-400">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-neutral-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-neutral-400">
                    Featured
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-600 dark:text-neutral-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {filteredShops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{shop.name}</p>
                        <p className="text-sm text-gray-500 dark:text-neutral-400">{shop.city}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-900 dark:text-white">
                          {shop.profiles?.full_name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-neutral-400">
                          {shop.profiles?.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          shop.status
                        )}`}
                      >
                        {shop.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleFeatureToggle(shop.id, shop.featured)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          shop.featured
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                            : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}
                      >
                        {shop.featured ? "★ Featured" : "☆ Feature"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {shop.status === "pending" && (
                          <button
                            onClick={() => handleApprove(shop.id)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        {shop.status === "active" && (
                          <button
                            onClick={() => handleSuspend(shop.id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg"
                            title="Suspend"
                          >
                            <X size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingShop(shop);
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(shop.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Shop Modal */}
      {showModal && (
        <ShopModal
          shop={editingShop}
          onClose={() => {
            setShowModal(false);
            setEditingShop(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingShop(null);
            loadShops();
          }}
        />
      )}
    </div>
  );
}

// Shop Modal Component
function ShopModal({ shop, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: shop?. name || "",
    description: shop?.description || "",
    address: shop?.address || "",
    city: shop?.city || "",
    state: shop?.state || "",
    phone: shop?.phone || "",
    color: shop?.color || "#8B4513",
    loyalty_points_per_dollar: shop?.loyalty_points_per_dollar || 10,
    status: shop?.status || "active",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (shop) {
        // Update existing shop
        const { error } = await supabase
          .from("shops")
          .update(formData)
          .eq("id", shop.id);

        if (error) throw error;
        toast.success("Shop updated successfully!");
      } else {
        // Create new shop - need owner_id
        const { error } = await supabase
          .from("shops")
          .insert({
            ...formData,
            owner_id: null, // Admin creates without owner - can be assigned later
          });

        if (error) throw error;
        toast.success("Shop created successfully!");
      }
      onSave();
    } catch (error) {
      console.error("Failed to save shop:", error);
      console.error("Error details:", error.message, error.details, error.hint);
      toast.error(error.message || "Failed to save shop");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {shop ? "Edit Shop" : "Add New Shop"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Shop Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus: ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Brand Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Loyalty Points per $
              </label>
              <input
                type="number"
                min="0"
                value={formData.loyalty_points_per_dollar}
                onChange={(e) =>
                  setFormData({ ...formData, loyalty_points_per_dollar: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : shop ? "Update Shop" : "Create Shop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}