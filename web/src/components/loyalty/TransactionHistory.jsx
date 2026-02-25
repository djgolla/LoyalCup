// TransactionHistory.jsx
// list of points transaction history

export default function TransactionHistory({ transactions }) {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'earned':
        return '✨';
      case 'redeemed':
        return '🎁';
      case 'adjusted':
        return '⚙️';
      case 'expired':
        return '⏰';
      default:
        return '📝';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'earned':
        return 'text-green-600 dark:text-green-400';
      case 'redeemed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-neutral-400';
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-neutral-500">
        No transaction history yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction, idx) => (
        <div
          key={transaction.id || idx}
          className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-800 flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getTypeIcon(transaction.type)}</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white capitalize">
                {transaction.type}
              </p>
              {transaction.created_at && (
                <p className="text-sm text-gray-500 dark:text-neutral-500">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className={`text-lg font-semibold ${getTypeColor(transaction.type)}`}>
            {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
          </div>
        </div>
      ))}
    </div>
  );
}
