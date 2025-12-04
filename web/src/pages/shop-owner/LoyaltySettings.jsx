// LoyaltySettings.jsx
// Configure loyalty program

import { useState } from "react";
import { toast } from "sonner";

export default function LoyaltySettings() {
  const [settings, setSettings] = useState({
    points_per_dollar: 10,
    participates_in_global: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    toast.success("Loyalty settings saved");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Loyalty Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <h2 className="text-lg font-semibold mb-4">Points Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Points per Dollar Spent
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                value={settings.points_per_dollar}
                onChange={(e) => setSettings({ ...settings, points_per_dollar: parseInt(e.target.value) })}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Customers earn this many points for every dollar spent
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="global-loyalty"
                className="w-4 h-4 accent-amber-700"
                checked={settings.participates_in_global}
                onChange={(e) => setSettings({ ...settings, participates_in_global: e.target.checked })}
              />
              <label htmlFor="global-loyalty" className="text-sm font-medium">
                Participate in global loyalty program
              </label>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Allow customers to use points earned at other shops
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <h2 className="text-lg font-semibold mb-4">Rewards</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Configure rewards customers can redeem with points
          </p>
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 dark:bg-neutral-800 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
          >
            Manage Rewards
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
