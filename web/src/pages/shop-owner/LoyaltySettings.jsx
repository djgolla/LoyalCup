// LoyaltySettings.jsx
// Shop owner loyalty configuration - NEW SYSTEM

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useShop } from "../../context/ShopContext";
import { supabase } from "../../lib/supabase";
import { Info, TrendingUp, Users, Award, DollarSign } from "lucide-react";
import Loading from "../../components/Loading";

export default function LoyaltySettings() {
  const { shopId, shop, loading: shopLoading } = useShop();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({
    totalPointsGiven: 0,
    totalCustomers: 0,
    avgPointsPerCustomer: 0,
  });

  useEffect(() => {
    if (shopId) {
      loadLoyaltyData();
    }
  }, [shopId]);

  const loadLoyaltyData = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      // Load shop loyalty settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('shop_loyalty_settings')
        .select('*')
        .eq('shop_id', shopId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      // If no settings exist, create default
      if (!settingsData) {
        const { data: newSettings, error: createError } = await supabase
          .from('shop_loyalty_settings')
          .insert({
            shop_id: shopId,
            use_global_system: true,
            points_per_dollar: 5,
            min_redemption_points: 50,
            points_to_dollar_value: 0.01,
            bonus_multiplier: 1.0,
            bonus_active: false,
            is_active: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      } else {
        setSettings(settingsData);
      }

      // Load stats
      await loadStats();
    } catch (error) {
      console.error("Failed to load loyalty data:", error);
      toast.error("Failed to load loyalty settings");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total points given out by this shop
      const { data: transactions } = await supabase
        .from('points_transactions')
        .select('amount')
        .eq('shop_id', shopId)
        .eq('type', 'earned');

      const totalPoints = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // Get unique customers who earned points
      const { data: customers } = await supabase
        .from('points_transactions')
        .select('customer_id')
        .eq('shop_id', shopId)
        .eq('type', 'earned');

      const uniqueCustomers = new Set(customers?.map(c => c.customer_id) || []).size;

      setStats({
        totalPointsGiven: totalPoints,
        totalCustomers: uniqueCustomers,
        avgPointsPerCustomer: uniqueCustomers > 0 ? Math.floor(totalPoints / uniqueCustomers) : 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!shopId || !settings) return;

    try {
      const { error } = await supabase
        .from('shop_loyalty_settings')
        .update({
          use_global_system: settings.use_global_system,
          points_per_dollar: settings.points_per_dollar,
          min_redemption_points: settings.min_redemption_points,
          points_to_dollar_value: settings.points_to_dollar_value,
          bonus_multiplier: settings.bonus_multiplier,
          bonus_active: settings.bonus_active,
          is_active: settings.is_active,
          bonus_description: settings.bonus_description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('shop_id', shopId);

      if (error) throw error;

      toast.success("Loyalty settings saved successfully!");
      loadLoyaltyData();
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    }
  };

  if (shopLoading || loading) {
    return <Loading />;
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Loyalty Settings Found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Failed to load loyalty settings. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Loyalty Program</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure how customers earn and redeem points at your shop
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Total Points Given</p>
              <p className="text-3xl font-bold mt-1">{stats.totalPointsGiven.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-amber-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Loyalty Customers</p>
              <p className="text-3xl font-bold mt-1">{stats.totalCustomers.toLocaleString()}</p>
            </div>
            <Users className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Avg Points/Customer</p>
              <p className="text-3xl font-bold mt-1">{stats.avgPointsPerCustomer.toLocaleString()}</p>
            </div>
            <Award className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* System Selection */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            Loyalty System Type
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
              style={{ borderColor: settings.use_global_system ? '#d97706' : '#e5e7eb' }}>
              <input
                type="radio"
                checked={settings.use_global_system}
                onChange={() => setSettings({ ...settings, use_global_system: true })}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Global System (Recommended)</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Customers earn 10 points per $1 spent. Points can be used at any participating shop on LoyalCup.
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-500">
                  <Info className="w-4 h-4" />
                  <span>Standard rate - no configuration needed</span>
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
              style={{ borderColor: !settings.use_global_system ? '#d97706' : '#e5e7eb' }}>
              <input
                type="radio"
                checked={!settings.use_global_system}
                onChange={() => setSettings({ ...settings, use_global_system: false })}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Custom Shop System</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Set your own points rate. Points can only be used at your shop.
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-purple-600 dark:text-purple-500">
                  <Info className="w-4 h-4" />
                  <span>Full control over your loyalty program</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Custom Settings (only show if custom system) */}
        {!settings.use_global_system && (
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
            <h2 className="text-lg font-semibold mb-4">Custom Points Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Points per Dollar Spent
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.points_per_dollar}
                  onChange={(e) => setSettings({ ...settings, points_per_dollar: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: 5 points = $0.50 earned per $10 purchase
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Points to Redeem
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.min_redemption_points}
                  onChange={(e) => setSettings({ ...settings, min_redemption_points: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Customers must have this many points to redeem
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Points to Dollar Value
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max="1"
                  value={settings.points_to_dollar_value}
                  onChange={(e) => setSettings({ ...settings, points_to_dollar_value: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: 0.01 = 100 points = $1 off
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bonus Campaigns */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <h2 className="text-lg font-semibold mb-4">Bonus Campaigns</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Bonus Multiplier</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Temporarily increase points earned (e.g., 2x points weekends)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.bonus_active}
                  onChange={(e) => setSettings({ ...settings, bonus_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {settings.bonus_active && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bonus Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.1"
                    max="10"
                    value={settings.bonus_multiplier}
                    onChange={(e) => setSettings({ ...settings, bonus_multiplier: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-white dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    2.0 = double points, 1.5 = 50% more points
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Campaign Description
                  </label>
                  <input
                    type="text"
                    value={settings.bonus_description || ''}
                    onChange={(e) => setSettings({ ...settings, bonus_description: e.target.value })}
                    placeholder="e.g., Weekend 2x Points!"
                    className="w-full px-4 py-2 bg-white dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Program Status */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Loyalty Program Status</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {settings.is_active ? 'Customers can currently earn and redeem points' : 'Loyalty program is paused'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.is_active}
                onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={loadLoyaltyData}
            className="px-6 py-2 border-2 border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition font-semibold"
          >
            Save Loyalty Settings
          </button>
        </div>
      </form>
    </div>
  );
}