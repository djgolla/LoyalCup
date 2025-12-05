import { Outlet } from "react-router-dom";
import ShopOwnerSidebar from "../components/navigation/ShopOwnerSidebar";

export default function ShopOwnerLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ShopOwnerSidebar />
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#181818]">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
