import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
      >
        <User size={20} />
        <span className="hidden sm:inline text-sm">{user.full_name || user.email}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg z-20">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-t-lg transition"
              onClick={() => setIsOpen(false)}
            >
              <User size={16} />
              Profile
            </Link>
            <Link
              to="/profile/edit"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              onClick={() => setIsOpen(false)}
            >
              <Settings size={16} />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-b-lg transition text-left text-red-600"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
