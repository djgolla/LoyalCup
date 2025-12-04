import { Check } from "lucide-react";

export default function OrderStatusTimeline({ status }) {
  const steps = [
    { key: "pending", label: "Order Placed" },
    { key: "accepted", label: "Accepted" },
    { key: "preparing", label: "Preparing" },
    { key: "ready", label: "Ready" },
    { key: "picked_up", label: "Picked Up" }
  ];

  const statusIndex = steps.findIndex(step => step.key === status);

  return (
    <div className="relative">
      {/* timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-neutral-700" />

      {/* steps */}
      <div className="space-y-6">
        {steps.map((step, index) => {
          const isCompleted = index <= statusIndex;
          const isCurrent = index === statusIndex;

          return (
            <div key={step.key} className="relative flex items-center gap-4">
              {/* step indicator */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  isCompleted
                    ? "border-primary-500 bg-primary-500"
                    : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                }`}
              >
                {isCompleted && (
                  <Check size={16} className="text-white" />
                )}
              </div>

              {/* step label */}
              <div className={`flex-1 ${isCurrent ? "font-semibold" : ""}`}>
                <p className={`text-sm ${
                  isCompleted
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-neutral-500"
                }`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-primary-500 mt-1">
                    Current status
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
