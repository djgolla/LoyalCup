// Orders no longer have a granular status flow. Everything that isn't
// completed/cancelled is simply "Placed".
export default function OrderStatusBadge({ status }) {
  const map = {
    pending:         { style: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: "☕", text: "Placed" },
    confirmed:       { style: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: "☕", text: "Placed" },
    payment_pending: { style: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", icon: "⏳", text: "Processing" },
    payment_failed:  { style: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", icon: "❌", text: "Payment failed" },
    completed:       { style: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", icon: "✔️", text: "Completed" },
    cancelled:       { style: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", icon: "❌", text: "Cancelled" },
  };

  const cfg = map[status] || map.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${cfg.style}`}>
      <span>{cfg.icon}</span>
      {cfg.text}
    </span>
  );
}