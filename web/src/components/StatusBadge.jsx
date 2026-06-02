// StatusBadge.jsx
// Minimal badge. We no longer track preparing/ready/picked_up — orders are
// simply Placed, Completed, or Cancelled (for history/accounting only).

const LABELS = {
  pending:         'Placed',
  confirmed:       'Placed',
  payment_pending: 'Processing',
  payment_failed:  'Payment failed',
  completed:       'Completed',
  cancelled:       'Cancelled',
};

const STYLES = {
  pending:         'bg-amber-100 text-amber-700',
  confirmed:       'bg-amber-100 text-amber-700',
  payment_pending: 'bg-yellow-100 text-yellow-700',
  payment_failed:  'bg-red-100 text-red-700',
  completed:       'bg-green-100 text-green-700',
  cancelled:       'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }) {
  const label = LABELS[status] || 'Placed';
  const style = STYLES[status] || 'bg-gray-200 text-gray-700';
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}