// Analytics.jsx
// Shop analytics and reports

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

export default function Analytics() {
  const revenueData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Revenue ($)",
        data: [320, 450, 380, 520, 680, 590, 450],
        backgroundColor: "#B45309",
      },
    ],
  };

  const ordersData = {
    labels: ["7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM"],
    datasets: [
      {
        label: "Orders",
        data: [5, 12, 18, 24, 28, 22, 20, 15, 10],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59,130,246,0.1)",
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <h2 className="text-xl font-semibold mb-4">💵 Revenue (Last 7 Days)</h2>
        <Bar data={revenueData} height={80} />
      </div>

      {/* Orders Chart */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <h2 className="text-xl font-semibold mb-4">📈 Orders per Hour (Today)</h2>
        <Line data={ordersData} height={80} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue (30d)</p>
          <p className="text-3xl font-bold">$12,450</p>
          <p className="text-sm text-green-600 mt-1">↑ 18% vs last month</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders (30d)</p>
          <p className="text-3xl font-bold">1,247</p>
          <p className="text-sm text-green-600 mt-1">↑ 12% vs last month</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Order Value</p>
          <p className="text-3xl font-bold">$9.98</p>
          <p className="text-sm text-green-600 mt-1">↑ 5% vs last month</p>
        </div>
      </div>
    </div>
  );
}
