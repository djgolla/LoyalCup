// ProgressBar.jsx
// progress bar showing points progress to next reward

export default function ProgressBar({ current, required }) {
  const percentage = Math.min((current / required) * 100, 100);
  const remaining = Math.max(required - current, 0);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600 dark:text-neutral-400">
        <span>{remaining} more points needed</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-3 overflow-hidden">
        <div
          className="bg-amber-600 dark:bg-amber-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
