// Stat card component for admin dashboard

import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, change, icon: Icon, trend }) {
  const isPositive = trend === "up";
  
  return (
    <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition">
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-400 text-sm">{title}</p>
        {Icon && <Icon className="w-5 h-5 text-gray-500" />}
      </div>
      
      <h2 className="text-3xl font-semibold text-white mb-2">{value}</h2>
      
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(change)}%</span>
          <span className="text-gray-500 ml-1">from yesterday</span>
        </div>
      )}
    </div>
  );
}
