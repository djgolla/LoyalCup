// Admin dashboard main page
// Platform overview with key metrics

import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Users, Store } from "lucide-react";
import StatCard from "../../components/admin/StatCard";
import PendingActions from "../../components/admin/PendingActions";
import ActivityFeed from "../../components/admin/ActivityFeed";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [topShops, setTopShops] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetch("/api/v1/admin/dashboard")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Failed to fetch stats:", err));

    // Mock revenue chart data
    setRevenueData({
      labels: ["Nov 1", "Nov 8", "Nov 15", "Nov 22", "Nov 29", "Dec 4"],
      values: [8500, 9200, 10100, 11300, 11800, 12450],
    });

    // Mock top shops
    setTopShops([
      { name: "Corner Coffee Co", revenue: 2340 },
      { name: "The Daily Grind", revenue: 1890 },
      { name: "Brewed Awakening", revenue: 1456 },
      { name: "Java Junction", revenue: 1234 },
      { name: "Morning Buzz", revenue: 987 },
    ]);

    // Mock activities
    setActivities([
      { message: "New shop registered: Bean Dreams Cafe", time: "5 min ago" },
      { message: "User upgraded to owner: john@example.com", time: "15 min ago" },
      { message: "Shop approved: The Coffee Corner", time: "1 hour ago" },
      { message: "50 orders completed in last hour", time: "1 hour ago" },
      { message: "New user signup spike detected", time: "2 hours ago" },
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Platform Overview</h1>
        <select className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-gray-300 outline-none">
          <option>Today</option>
          <option>This Week</option>
          <option>This Month</option>
        </select>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Revenue"
            value={`$${stats.revenue.total.toLocaleString()}`}
            change={stats.revenue.change}
            trend={stats.revenue.trend}
            icon={DollarSign}
          />
          <StatCard
            title="Orders"
            value={stats.orders.total.toLocaleString()}
            change={stats.orders.change}
            trend={stats.orders.trend}
            icon={ShoppingBag}
          />
          <StatCard
            title="Users"
            value={stats.users.total.toLocaleString()}
            change={stats.users.change}
            trend={stats.users.trend}
            icon={Users}
          />
          <StatCard
            title="Shops"
            value={stats.shops.total}
            change={stats.shops.new}
            icon={Store}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-800">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Over Time</h3>
            {revenueData && (
              <Line
                data={{
                  labels: revenueData.labels,
                  datasets: [
                    {
                      label: "Revenue ($)",
                      data: revenueData.values,
                      borderColor: "#f59e0b",
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      tension: 0.4,
                      fill: true,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      ticks: { color: "#9ca3af" },
                      grid: { color: "#262626" },
                    },
                    x: {
                      ticks: { color: "#9ca3af" },
                      grid: { display: false },
                    },
                  },
                }}
                height={80}
              />
            )}
          </div>
        </div>

        <div>
          {stats && (
            <PendingActions
              actions={{
                shopsAwaitingApproval: stats.pending_actions?.shops_awaiting_approval || 0,
                reportedReviews: stats.pending_actions?.reported_reviews || 0,
                supportTickets: stats.pending_actions?.support_tickets || 0,
              }}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-800">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Shops</h3>
          <div className="space-y-3">
            {topShops.map((shop, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-mono text-sm">{idx + 1}.</span>
                  <span className="text-gray-300">{shop.name}</span>
                </div>
                <span className="font-semibold text-amber-500">${shop.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}
