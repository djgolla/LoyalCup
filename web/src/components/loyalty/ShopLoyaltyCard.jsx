// ShopLoyaltyCard.jsx
// displays loyalty info for a single shop

import PointsBalance from './PointsBalance';
import ProgressBar from './ProgressBar';
import RewardCard from './RewardCard';

export default function ShopLoyaltyCard({ shop, balance, rewards, onRedeem }) {
  // find next achievable reward
  const sortedRewards = [...rewards].sort((a, b) => a.points_required - b.points_required);
  const nextReward = sortedRewards.find(r => r.points_required > balance);
  const availableRewards = rewards.filter(r => r.points_required <= balance);

  return (
    <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            ☕ {shop.name}
          </h3>
        </div>
        <PointsBalance points={balance} />
      </div>

      {nextReward && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-2">
            Next reward: {nextReward.name}
          </p>
          <ProgressBar current={balance} required={nextReward.points_required} />
        </div>
      )}

      {availableRewards.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-neutral-300">
            Available Rewards:
          </p>
          {availableRewards.map(reward => (
            <RewardCard
              key={reward.id}
              reward={reward}
              userPoints={balance}
              onRedeem={onRedeem}
            />
          ))}
        </div>
      )}

      {rewards.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-neutral-500">
          Keep ordering to earn rewards!
        </p>
      )}
    </div>
  );
}
