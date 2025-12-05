// Platform settings page
// Configure platform-wide settings

import { useEffect, useState, useCallback } from "react";
import { getPlatformSettings, updatePlatformSettings } from "../../api/admin";
import { toast } from "sonner";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getPlatformSettings();
      setSettings(data);
    } catch {
      toast.error("Failed to load settings");
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updatePlatformSettings(settings);
      toast.success("Settings updated successfully");
      setHasChanges(false);
    } catch {
      toast.error("Failed to update settings");
    }
  };

  if (!settings) {
    return <div className="text-white">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Platform Settings</h1>
        {hasChanges && (
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-600 transition"
          >
            Save Changes
          </button>
        )}
      </div>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 divide-y divide-neutral-800">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Platform Name</label>
              <input
                type="text"
                value={settings.platform_name}
                onChange={(e) => handleChange("platform_name", e.target.value)}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Maintenance Mode</p>
                <p className="text-sm text-gray-400">Temporarily disable the platform for maintenance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => handleChange("maintenance_mode", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Loyalty Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Global Loyalty Program</p>
                <p className="text-sm text-gray-400">Enable platform-wide loyalty points</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.global_loyalty_enabled}
                  onChange={(e) => handleChange("global_loyalty_enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Default Points Per Dollar</label>
              <input
                type="number"
                value={settings.default_points_per_dollar}
                onChange={(e) => handleChange("default_points_per_dollar", parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Shop Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Shop Approval Required</p>
                <p className="text-sm text-gray-400">New shops must be approved by admin</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.shop_approval_required}
                  onChange={(e) => handleChange("shop_approval_required", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Max Shops Per Owner</label>
              <input
                type="number"
                value={settings.max_shops_per_owner}
                onChange={(e) => handleChange("max_shops_per_owner", parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
