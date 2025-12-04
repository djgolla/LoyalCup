// LoyaltySettings.jsx
// shop owner loyalty program configuration

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Loading from '../../components/Loading';

export default function LoyaltySettings() {
  const [settings, setSettings] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [stats, setStats] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  const [showRewardForm, setShowRewardForm] = useState(false);
  
  // mock shop id - in production would come from auth/context
  const shopId = 'shop_123';

  useEffect(() => {
    const loadData = async () => {
      try {
        // fetch settings
        const settingsRes = await fetch(`/api/shops/${shopId}/loyalty/settings`);
        const settingsData = await settingsRes.json();
        setSettings(settingsData);

        // fetch rewards
        const rewardsRes = await fetch(`/api/shops/${shopId}/loyalty/rewards`);
        const rewardsData = await rewardsRes.json();
        setRewards(rewardsData.rewards || []);

        // fetch stats
        const statsRes = await fetch(`/api/shops/${shopId}/loyalty/stats`);
        const statsData = await statsRes.json();
        setStats(statsData);
      } catch {
        toast.error('Failed to load loyalty settings');
      }
    };

    loadData();
  }, [shopId]);

  const reloadData = async () => {
    try {
      // fetch settings
      const settingsRes = await fetch(`/api/shops/${shopId}/loyalty/settings`);
      const settingsData = await settingsRes.json();
      setSettings(settingsData);

      // fetch rewards
      const rewardsRes = await fetch(`/api/shops/${shopId}/loyalty/rewards`);
      const rewardsData = await rewardsRes.json();
      setRewards(rewardsData.rewards || []);

      // fetch stats
      const statsRes = await fetch(`/api/shops/${shopId}/loyalty/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch {
      toast.error('Failed to load loyalty settings');
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await fetch(`/api/shops/${shopId}/loyalty/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      setSettings(newSettings);
      toast.success('Settings updated');
    } catch {
      toast.error('Failed to update settings');
    }
  };

  const saveReward = async (reward) => {
    try {
      if (reward.id) {
        // update existing
        await fetch(`/api/shops/${shopId}/loyalty/rewards/${reward.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reward)
        });
        toast.success('Reward updated');
      } else {
        // create new
        await fetch(`/api/shops/${shopId}/loyalty/rewards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reward)
        });
        toast.success('Reward created');
      }
      setShowRewardForm(false);
      setEditingReward(null);
      reloadData();
    } catch {
      toast.error('Failed to save reward');
    }
  };

  const deleteReward = async (rewardId) => {
    if (!confirm('Delete this reward?')) return;
    
    try {
      await fetch(`/api/shops/${shopId}/loyalty/rewards/${rewardId}`, {
        method: 'DELETE'
      });
      toast.success('Reward deleted');
      reloadData();
    } catch {
      toast.error('Failed to delete reward');
    }
  };

  if (!settings) return <Loading />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        ⭐ Loyalty Program Settings
      </h1>

      {/* points earning */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Points Earning
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              Points per $1 spent
            </label>
            <select
              value={settings.points_per_dollar}
              onChange={(e) => updateSettings({ ...settings, points_per_dollar: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
            >
              {[1, 5, 10, 15, 20, 25].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <p className="text-sm text-gray-500 dark:text-neutral-500 mt-2">
              Example: A $5.00 order earns {settings.points_per_dollar * 5} points
            </p>
          </div>
        </div>
      </div>

      {/* global program */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Global LoyalCup Program
        </h2>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={settings.participates_in_global_loyalty}
            onChange={(e) => updateSettings({ ...settings, participates_in_global_loyalty: e.target.checked })}
            className="mt-1"
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Participate in Global Rewards
            </p>
            <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
              When enabled, customers also earn Global LoyalCup points they can use at any participating shop.
              This can bring new customers to your shop!
            </p>
          </div>
        </label>
      </div>

      {/* rewards */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Rewards
          </h2>
          <button
            onClick={() => setShowRewardForm(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
          >
            + Add Reward
          </button>
        </div>

        {rewards.length === 0 ? (
          <p className="text-gray-500 dark:text-neutral-500">
            No rewards yet. Create one to get started!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map(reward => (
              <div
                key={reward.id}
                className="p-4 border border-gray-200 dark:border-neutral-700 rounded-lg"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {reward.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
                  {reward.description}
                </p>
                <p className="text-amber-600 dark:text-amber-400 font-medium mt-2">
                  {reward.points_required} points
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setEditingReward(reward);
                      setShowRewardForm(true);
                    }}
                    className="px-3 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteReward(reward.id)}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* stats */}
      {stats && (
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Loyalty Stats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-neutral-400">
                Total points issued
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total_points_issued || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-neutral-400">
                Points redeemed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.points_redeemed || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-neutral-400">
                Active members
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.active_members || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* reward form modal */}
      {showRewardForm && (
        <RewardFormModal
          reward={editingReward}
          onSave={saveReward}
          onClose={() => {
            setShowRewardForm(false);
            setEditingReward(null);
          }}
        />
      )}
    </div>
  );
}

// reward form modal component
function RewardFormModal({ reward, onSave, onClose }) {
  const [formData, setFormData] = useState(
    reward || { name: '', description: '', points_required: 100, is_active: true }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center backdrop-blur-sm z-50">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-md w-full max-w-md border border-gray-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {reward ? 'Edit Reward' : 'Create Reward'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Reward Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Points Required
            </label>
            <input
              type="number"
              value={formData.points_required}
              onChange={(e) => setFormData({ ...formData, points_required: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
              min="1"
              required
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <span className="text-sm text-gray-700 dark:text-neutral-300">
              Active
            </span>
          </label>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
