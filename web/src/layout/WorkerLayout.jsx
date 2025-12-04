import { Outlet } from "react-router-dom";
import { Coffee } from "lucide-react";

export default function WorkerLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#181818]">
      {/* simple header for worker portal */}
      <header className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Coffee size={24} className="text-primary-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Worker Portal
            </h1>
          </div>
        </div>
      </header>

      {/* main content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
