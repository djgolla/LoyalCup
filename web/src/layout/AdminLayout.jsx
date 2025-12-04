// Admin layout with dark theme
// Separate layout for admin pages

import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-black">
      <AdminSidebar />

      <div className="flex flex-col flex-1 bg-neutral-950">
        <header className="h-14 border-b border-neutral-800 flex items-center px-6 bg-neutral-900">
          <h2 className="text-lg font-medium text-white">Platform Control Center</h2>
        </header>

        <main className="p-6 overflow-y-auto h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
