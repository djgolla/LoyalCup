import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/navigation/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-800">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
