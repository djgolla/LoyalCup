// Analytics page
// Deep analytics and reporting

import { useState } from "react";
import { Bar, Line } from "react-chartjs-2";
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
  const [period, setPeriod] = useState("month");
  
  // Mock data initialized directly
  const orderData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    values: [156, 189, 234, 268],
  };

  const revenueData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    values: [1450, 1890, 2340, 2890],
  };

  const userGrowth = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    values: [45, 67, 89, 112],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-gray-300 outline-none"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-800">
          <p className="text-gray-400 text-sm mb-2">Total Orders</p>
          <h2 className="text-3xl font-semibold text-white mb-1">847</h2>
          <p className="text-xs text-green-500">+12.5% from last period</p>
        </div>
        <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-800">
          <p className="text-gray-400 text-sm mb-2">Total Revenue</p>
          <h2 className="text-3xl font-semibold text-white mb-1">$12,450</h2>
          <p className="text-xs text-green-500">+18.2% from last period</p>
        </div>
        <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-800">
          <p className="text-gray-400 text-sm mb-2">Avg Order Value</p>
          <h2 className="text-3xl font-semibold text-white mb-1">$14.70</h2>
          <p className="text-xs text-green-500">+4.8% from last period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-800">
          <h3 className="text-lg font-semibold text-white mb-4">Orders Trend</h3>
          <Bar
            data={{
              labels: orderData.labels,
              datasets: [
                {
                  label: "Orders",
                  data: orderData.values,
                  backgroundColor: "#3b82f6",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { ticks: { color: "#9ca3af" }, grid: { color: "#262626" } },
                x: { ticks: { color: "#9ca3af" }, grid: { display: false } },
              },
            }}
            height={100}
          />
        </div>

        <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-800">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          <Line
            data={{
              labels: revenueData.labels,
              datasets: [
                {
                  label: "Revenue ($)",
                  data: revenueData.values,
                  borderColor: "#10b981",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  tension: 0.4,
                  fill: true,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { ticks: { color: "#9ca3af" }, grid: { color: "#262626" } },
                x: { ticks: { color: "#9ca3af" }, grid: { display: false } },
              },
            }}
            height={100}
          />
        </div>
      </div>

      <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-800">
        <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
        <Line
          data={{
            labels: userGrowth.labels,
            datasets: [
              {
                label: "New Users",
                data: userGrowth.values,
                borderColor: "#f59e0b",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                tension: 0.4,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { ticks: { color: "#9ca3af" }, grid: { color: "#262626" } },
              x: { ticks: { color: "#9ca3af" }, grid: { display: false } },
            },
          }}
          height={80}
        />
      </div>
    </div>
  );
}
