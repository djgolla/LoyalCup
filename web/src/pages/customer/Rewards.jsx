import { useEffect, useState } from "react";
import { toast } from "sonner";
import supabase from "../../lib/supabase";
import Loading from "../../components/Loading";

export default function Rewards() {
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [shops, setShops] = useState([]);

  useEffect(() => {
    loadLoyaltyData();
  }, [selectedShop]);

  const loadLoyaltyData = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to view rewards");
        return;
      }

      // Get all shops for filter
      const { data: shopsData } = await supabase
        .from('shops')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      
      setShops(shopsData || []);

      // Get loyalty balances
      let query = supabase
        .from('loyalty_balances')
        .select('*, shops(name)')
        .eq('user_id', user.id);
      
      if (selectedShop) {
        query = query.eq('shop_id', selectedShop);
      }

      const { data: balances } = await query;

      // Calculate total points
      const total = balances?.reduce((sum, b) => sum + (b.balance || 0), 0) || 0;
      setTotalPoints(total);

      // Get rewards
      let rewardsQuery = supabase
        .from('loyalty_rewards')
        .select('*, shops(name)')
        .order('points_required');

      if (selectedShop) {
        rewardsQuery = rewardsQuery.eq('shop_id', selectedShop);
      }

      const { data: rewardsData } = await rewardsQuery;
      setRewards(rewardsData || []);
    } catch (error) {
      console.error("Failed to load loyalty data:", error);
      toast.error("Failed to load loyalty data");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to redeem rewards");
        return;
      }

      // Check if user has enough points for this shop
      const { data: balance } = await supabase
        .from('loyalty_balances')
        .select('balance')
        .eq('user_id', user.id)
        .eq('shop_id', reward.shop_id)
        .single();

      if (!balance || balance.balance < reward.points_required) {
        toast.error("Not enough points to redeem this reward");
        return;
      }

      // Call redemption API (would need to be implemented in backend)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/loyalty/redeem/${reward.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to redeem reward');
      }

      toast.success("Reward redeemed successfully!");
      loadLoyaltyData(); // Reload to update points
    } catch (error) {
      console.error("Failed to redeem reward:", error);
      toast.error("Failed to redeem reward");
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Loyalty Rewards
        </h1>
        <select
          value={selectedShop || ""}
          onChange={(e) => setSelectedShop(e.target.value || null)}
          className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
        >
          <option value="">All Shops</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 mb-6">
        <div className="text-center mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {selectedShop ? "Shop Points" : "Total Points"}
          </p>
          <p className="text-5xl font-bold text-amber-700">{totalPoints}</p>
        </div>

        {rewards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No rewards available yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg"
              >
                {reward.image_url && (
                  <img
                    src={reward.image_url}
                    alt={reward.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">
                  {reward.name}
                </h3>
                {reward.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {reward.description}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {reward.points_required} points required
                </p>
                {!selectedShop && reward.shops && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                    at {reward.shops.name}
                  </p>
                )}
                <button
                  onClick={() => handleRedeem(reward)}
                  className="w-full px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={totalPoints < reward.points_required}
                >
                  {totalPoints < reward.points_required ? "Not Enough Points" : "Redeem"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
