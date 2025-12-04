import { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import { toast } from "sonner";

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

export default function Dashboard() {
  const [topToday, setTopToday] = useState([]);
  const [ordersToday, setOrdersToday] = useState(null);
  const [revenueWeek, setRevenueWeek] = useState(null);

  useEffect(() => {
    fetch("/api/analytics/top-today")
      .then((res) => res.json())
      .then((data) => setTopToday(data.items));

    fetch("/api/analytics/orders-today")
      .then((res) => res.json())
      .then((data) => setOrdersToday(data));

    fetch("/api/analytics/revenue-week")
      .then((res) => res.json())
      .then((data) => setRevenueWeek(data));

  }, []);

  return (
    <div className="space-y-6">

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <DashboardCard 
          title="Total Orders Today" 
          value="153"
          subtitle="Up 12% from yesterday"
        />
        <DashboardCard 
          title="Revenue Today" 
          value="$1,245"
          subtitle="Approx. based on completed orders"
        />
        <DashboardCard 
          title="Avg. Order Value" 
          value="$8.14"
          subtitle="Calculated from today's sales"
        />
      </div>

      {/* MOST ORDERED TODAY */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ☕ Most Ordered Today
        </h2>

        <div className="space-y-3">
          {topToday.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-neutral-800"
            >
              <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
              <span className="font-semibold text-primary-500">{item.count} orders</span>
            </div>
          ))}
        </div>
      </div>

      {/* ORDERS TODAY - LINE CHART */}
      {ordersToday && (
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📈 Orders per Hour (Today)
          </h2>

          <Line
            data={{
              labels: ordersToday.hours,
              datasets: [
                {
                  label: "Orders",
                  data: ordersToday.values,
                  borderColor: "#3B82F6",
                  backgroundColor: "rgba(59,130,246,0.3)",
                  tension: 0.4,
                },
              ],
            }}
            height={90}
          />
        </div>
      )}

      {/* REVENUE WEEK BAR CHART */}
      {revenueWeek && (
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            💵 Revenue (Last 7 Days)
          </h2>

          <Bar
            data={{
              labels: revenueWeek.days,
              datasets: [
                {
                  label: "Revenue ($)",
                  data: revenueWeek.values,
                  backgroundColor: "#10B981",
                },
              ],
            }}
            height={90}
          />
        </div>
      )}
    </div>
  );
}
