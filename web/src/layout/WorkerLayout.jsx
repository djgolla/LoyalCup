import { Outlet } from "react-router-dom";
import WorkerHeader from "../components/navigation/WorkerHeader";

export default function WorkerLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#181818]">
      <WorkerHeader />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
