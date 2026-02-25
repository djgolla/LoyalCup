// StatusBadge.jsx
// small pill badge for statuses

export default function StatusBadge({ status }) {
  let style = {
    pending: "bg-yellow-100 text-yellow-700",
    preparing: "bg-blue-100 text-blue-700",
    ready: "bg-green-100 text-green-700",
    completed: "bg-amber-100 text-amber-700",
  }[status] || "bg-gray-200 text-gray-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  );
}