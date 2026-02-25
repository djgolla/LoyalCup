// RedeemModal.jsx
// confirmation modal for redeeming rewards

import Modal from '../Modal';

export default function RedeemModal({ open, onClose, reward, onConfirm, loading }) {
  if (!reward) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Redeem Reward?
        </h2>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="font-semibold text-gray-900 dark:text-white">
            {reward.name}
          </p>
          {reward.description && (
            <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
              {reward.description}
            </p>
          )}
          <p className="text-amber-600 dark:text-amber-400 font-medium mt-2">
            -{reward.points_required} points
          </p>
        </div>

        <p className="text-sm text-gray-600 dark:text-neutral-400">
          This will deduct {reward.points_required} points from your balance.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
          >
            {loading ? 'Redeeming...' : 'Confirm'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
