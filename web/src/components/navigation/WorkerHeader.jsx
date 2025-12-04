import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function WorkerHeader() {
  const { logout } = useAuth();

  return (
    <header className="bg-amber-700 text-white p-4 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Order Queue</h1>
          <p className="text-sm opacity-90">My Coffee Shop</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/worker/summary"
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            Summary
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
