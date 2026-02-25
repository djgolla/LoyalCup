// RewardCard.jsx
// individual reward card showing reward details

export default function RewardCard({ reward, userPoints, onRedeem }) {
  const canRedeem = userPoints >= reward.points_required;

  return (
    <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg border border-gray-200 dark:border-neutral-700">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {reward.name}
          </h4>
          {reward.description && (
            <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
              {reward.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {reward.points_required} points
            </span>
            {canRedeem && (
              <span className="text-green-600 dark:text-green-400 text-sm">
                ✓ Available
              </span>
            )}
          </div>
        </div>
        {onRedeem && canRedeem && (
          <button
            onClick={() => onRedeem(reward)}
            className="px-3 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm"
          >
            Redeem
          </button>
        )}
      </div>
    </div>
  );
}
