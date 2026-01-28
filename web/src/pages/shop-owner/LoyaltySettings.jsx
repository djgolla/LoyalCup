// LoyaltySettings.jsx
// Configure loyalty program

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useShop } from "../../context/ShopContext";
import supabase from "../../lib/supabase";
import { Plus, Trash2, Pencil } from "lucide-react";
import Modal from "../../components/Modal";
import ImageUploader from "../../components/shop-owner/ImageUploader";
import Loading from "../../components/Loading";

export default function LoyaltySettings() {
  const { shopId, loading: shopLoading } = useShop();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    points_per_dollar: 10,
    participates_in_global: true,
  });
  const [rewards, setRewards] = useState([]);
  const [rewardEditorOpen, setRewardEditorOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm, setRewardForm] = useState({
    name: "",
    description: "",
    points_required: 0,
    image_url: "",
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
      // Load shop settings
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('loyalty_points_per_dollar, participates_in_global_loyalty')
        .eq('id', shopId)
        .single();

      if (shopError) throw shopError;

      setSettings({
        points_per_dollar: shopData.loyalty_points_per_dollar || 10,
        participates_in_global: shopData.participates_in_global_loyalty || false,
      });

      // Load rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('shop_id', shopId)
        .order('points_required', { ascending: true });

      if (rewardsError) throw rewardsError;

      setRewards(rewardsData || []);
    } catch (error) {
      console.error("Failed to load loyalty data:", error);
      toast.error("Failed to load loyalty data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!shopId) return;

    try {
      const { error } = await supabase
        .from('shops')
        .update({
          loyalty_points_per_dollar: settings.points_per_dollar,
          participates_in_global_loyalty: settings.participates_in_global,
        })
        .eq('id', shopId);

      if (error) throw error;

      toast.success("Loyalty settings saved");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const handleAddReward = () => {
    setEditingReward(null);
    setRewardForm({
      name: "",
      description: "",
      points_required: 0,
      image_url: "",
    });
    setRewardEditorOpen(true);
  };

  const handleEditReward = (reward) => {
    setEditingReward(reward);
    setRewardForm({
      name: reward.name,
      description: reward.description,
      points_required: reward.points_required,
      image_url: reward.image_url || "",
    });
    setRewardEditorOpen(true);
  };

  const handleSaveReward = async (e) => {
    e.preventDefault();
    if (!shopId || !rewardForm.name.trim()) return;

    try {
      if (editingReward) {
        // Update existing reward
        const { error } = await supabase
          .from('loyalty_rewards')
          .update({
            name: rewardForm.name.trim(),
            description: rewardForm.description.trim(),
            points_required: parseInt(rewardForm.points_required),
            image_url: rewardForm.image_url,
          })
          .eq('id', editingReward.id)
          .eq('shop_id', shopId);

        if (error) throw error;
        toast.success("Reward updated");
      } else {
        // Create new reward
        const { error } = await supabase
          .from('loyalty_rewards')
          .insert({
            shop_id: shopId,
            name: rewardForm.name.trim(),
            description: rewardForm.description.trim(),
            points_required: parseInt(rewardForm.points_required),
            image_url: rewardForm.image_url,
            is_active: true,
          });

        if (error) throw error;
        toast.success("Reward created");
      }

      setRewardEditorOpen(false);
      loadLoyaltyData();
    } catch (error) {
      console.error("Failed to save reward:", error);
      toast.error("Failed to save reward");
    }
  };

  const handleDeleteReward = async (reward) => {
    if (!confirm(`Delete reward "${reward.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .delete()
        .eq('id', reward.id)
        .eq('shop_id', shopId);

      if (error) throw error;
      
      toast.success("Reward deleted");
      loadLoyaltyData();
    } catch (error) {
      console.error("Failed to delete reward:", error);
      toast.error("Failed to delete reward");
    }
  };

  const handleImageUpload = (file, url) => {
    setRewardForm({ ...rewardForm, image_url: url });
  };

  if (shopLoading || loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Loyalty Settings</h1>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
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

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
          >
            Save Settings
          </button>
        </div>
      </form>

      {/* Rewards Section */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Rewards</h2>
          <button
            type="button"
            onClick={handleAddReward}
            className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
          >
            <Plus size={18} />
            Add Reward
          </button>
        </div>

        {rewards.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No rewards created yet. Add your first reward to give customers something to work toward!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="border border-gray-200 dark:border-neutral-700 rounded-lg p-4 hover:shadow-md transition"
              >
                {reward.image_url && (
                  <img
                    src={reward.image_url}
                    alt={reward.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-semibold mb-1">{reward.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {reward.description}
                </p>
                <p className="text-amber-700 font-semibold mb-3">
                  {reward.points_required} points
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditReward(reward)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteReward(reward)}
                    className="flex items-center justify-center px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reward Editor Modal */}
      <Modal open={rewardEditorOpen} onClose={() => setRewardEditorOpen(false)}>
        <h2 className="text-2xl font-semibold mb-6">
          {editingReward ? "Edit Reward" : "Add New Reward"}
        </h2>

        <form onSubmit={handleSaveReward} className="space-y-4">
          <ImageUploader
            onUpload={handleImageUpload}
            currentImage={rewardForm.image_url}
            label="Reward Image (Optional)"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Reward Name *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
              value={rewardForm.name}
              onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
              placeholder="e.g., Free Coffee"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              rows="3"
              value={rewardForm.description}
              onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
              placeholder="Describe the reward..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Points Required *</label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
              value={rewardForm.points_required}
              onChange={(e) => setRewardForm({ ...rewardForm, points_required: e.target.value })}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setRewardEditorOpen(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-neutral-800 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
            >
              {editingReward ? "Update" : "Create"} Reward
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
