// ShopSettings.jsx
// Shop information and settings

import { useState } from "react";
import { toast } from "sonner";
import ImageUploader from "../../components/shop-owner/ImageUploader";

export default function ShopSettings() {
  const [shopData, setShopData] = useState({
    name: "The Loyal Cup - Downtown",
    description: "Artisan coffee in the heart of the city",
    address: "123 Main St",
    city: "Seattle",
    state: "WA",
    phone: "(555) 123-4567",
    logo_url: "",
    banner_url: "",
  });

  const handleSave = (e) => {
    e.preventDefault();
    toast.success("Shop settings saved");
  };

  const handleLogoUpload = (file, preview) => {
    setShopData({ ...shopData, logo_url: preview });
  };

  const handleBannerUpload = (file, preview) => {
    setShopData({ ...shopData, banner_url: preview });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Shop Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Branding */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <h2 className="text-lg font-semibold mb-4">Branding</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUploader
              onUpload={handleLogoUpload}
              currentImage={shopData.logo_url}
              label="Shop Logo"
            />
            <ImageUploader
              onUpload={handleBannerUpload}
              currentImage={shopData.banner_url}
              label="Shop Banner"
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Shop Name *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                value={shopData.name}
                onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                rows="3"
                value={shopData.description}
                onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  value={shopData.phone}
                  onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  value={shopData.address}
                  onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  value={shopData.city}
                  onChange={(e) => setShopData({ ...shopData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
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
            className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
