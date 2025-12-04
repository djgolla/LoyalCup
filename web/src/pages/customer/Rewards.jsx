// Rewards.jsx
// main rewards hub showing all balances and available rewards

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Loading from '../../components/Loading';
import GlobalPointsBanner from '../../components/loyalty/GlobalPointsBanner';
import ShopLoyaltyCard from '../../components/loyalty/ShopLoyaltyCard';
import RedeemModal from '../../components/loyalty/RedeemModal';
import TransactionHistory from '../../components/loyalty/TransactionHistory';

export default function Rewards() {
  const [balances, setBalances] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // fetch balances
      const balancesRes = await fetch('/api/loyalty/balances');
      const balancesData = await balancesRes.json();
      setBalances(balancesData.balances || []);

      // fetch available rewards
      const rewardsRes = await fetch('/api/loyalty/rewards');
      const rewardsData = await rewardsRes.json();
      setRewards(rewardsData.rewards || []);

      // fetch transaction history
      const transactionsRes = await fetch('/api/loyalty/transactions');
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.transactions || []);
    } catch {
      toast.error('Failed to load rewards data');
    }
  };

  const handleRedeem = (reward) => {
    setSelectedReward(reward);
  };

  const confirmRedeem = async () => {
    if (!selectedReward) return;
    
    setRedeeming(true);
    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_id: selectedReward.id })
      });

      if (response.ok) {
        toast.success('Reward redeemed successfully! 🎉');
        setSelectedReward(null);
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to redeem reward');
      }
    } catch {
      toast.error('Failed to redeem reward');
    } finally {
      setRedeeming(false);
    }
  };

  if (!balances) return <Loading />;

  // separate global and shop balances
  const globalBalance = balances.find(b => b.shop_id === null) || { points: 0 };
  const shopBalances = balances.filter(b => b.shop_id !== null);

  // group rewards by shop
  const rewardsByShop = rewards.reduce((acc, reward) => {
    const shopId = reward.shop_id || 'global';
    if (!acc[shopId]) acc[shopId] = [];
    acc[shopId].push(reward);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          ⭐ My Rewards
        </h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition"
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      {showHistory && (
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Transaction History
          </h2>
          <TransactionHistory transactions={transactions} />
        </div>
      )}

      <GlobalPointsBanner points={globalBalance.points} />

      <div className="space-y-4">
        {shopBalances.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-neutral-500">
            Start ordering to earn rewards at your favorite shops!
          </div>
        )}

        {shopBalances.map(balance => {
          const shopRewards = rewardsByShop[balance.shop_id] || [];
          return (
            <ShopLoyaltyCard
              key={balance.shop_id}
              shop={{ id: balance.shop_id, name: balance.shop_name || 'Coffee Shop' }}
              balance={balance.points}
              rewards={shopRewards}
              onRedeem={handleRedeem}
            />
          );
        })}
      </div>

      <RedeemModal
        open={!!selectedReward}
        onClose={() => setSelectedReward(null)}
        reward={selectedReward}
        onConfirm={confirmRedeem}
        loading={redeeming}
      />
    </div>
  );
}
