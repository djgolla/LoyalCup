// ShopSettings.jsx
// Shop information and settings

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useShop } from "../../context/ShopContext";
import ImageUploader from "../../components/shop-owner/ImageUploader";
import Loading from "../../components/Loading";
import supabase from "../../lib/supabase";

export default function ShopSettings() {
  const { shop, shopId, loading: shopLoading, refreshShop } = useShop();
  const [shopData, setShopData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    logo_url: "",
    banner_url: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shop) {
      setShopData({
        name: shop.name || "",
        description: shop.description || "",
        address: shop.address || "",
        city: shop.city || "",
        state: shop.state || "",
        phone: shop.phone || "",
        logo_url: shop.logo_url || "",
        banner_url: shop.banner_url || "",
      });
    }
  }, [shop]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!shopId) {
      toast.error("Shop not found");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({
          name: shopData.name,
          description: shopData.description,
          address: shopData.address,
          city: shopData.city,
          state: shopData.state,
          phone: shopData.phone,
          logo_url: shopData.logo_url,
          banner_url: shopData.banner_url,
        })
        .eq("id", shopId);

      if (error) throw error;

      toast.success("Shop settings saved successfully!");
      refreshShop();
    } catch (error) {
      console.error("Failed to save shop settings:", error);
      toast.error("Failed to save shop settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (file, preview) => {
    setShopData({ ...shopData, logo_url: preview });
  };

  const handleBannerUpload = (file, preview) => {
    setShopData({ ...shopData, banner_url: preview });
  };

  if (shopLoading) {
    return <Loading />;
  }

  if (!shop || !shopId) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏪</div>
        <h3 className="text-xl font-semibold mb-2">No Shop Found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have a shop assigned to your account yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Shop Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your shop information and branding
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Branding */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Branding</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUploader
              onUpload={handleLogoUpload}
              currentImage={shopData.logo_url}
              label="Shop Logo"
              shopId={shopId}
            />
            <ImageUploader
              onUpload={handleBannerUpload}
              currentImage={shopData.banner_url}
              label="Shop Banner"
              shopId={shopId}
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Shop Name *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                value={shopData.name}
                onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                rows="3"
                value={shopData.description}
                onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  value={shopData.phone}
                  onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Address</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  value={shopData.address}
                  onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">City</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  value={shopData.city}
                  onChange={(e) => setShopData({ ...shopData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">State</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  value={shopData.state}
                  onChange={(e) => setShopData({ ...shopData, state: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
