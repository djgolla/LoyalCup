import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function MainLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      
      {/* left sidebar */}
      <Sidebar />

      {/* main content */}
      <div className="flex flex-col flex-1 bg-gray-50 dark:bg-[#181818] transition-colors duration-300">
        
        <Header />

        {/* page content */}
        <main className="p-6 overflow-y-auto h-full animate-fadeIn">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
