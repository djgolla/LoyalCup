export default function OrderStatusBadge({ status }) {
  const getStatusStyle = () => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "accepted":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
      case "preparing":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
      case "ready":
        return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
      case "picked_up":
        return "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300";
      case "completed":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return "🟡";
      case "accepted":
        return "🔵";
      case "preparing":
        return "🟣";
      case "ready":
        return "🟢";
      case "picked_up":
        return "✅";
      case "completed":
        return "✔️";
      case "cancelled":
        return "❌";
      default:
        return "⚪";
    }
  };

  const getStatusText = () => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle()}`}>
      <span>{getStatusIcon()}</span>
      {getStatusText()}
    </span>
  );
}
