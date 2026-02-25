import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-700 dark:text-gray-300"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-[#1b1b1b] border-b border-gray-200 dark:border-neutral-800 shadow-lg">
          <nav className="flex flex-col p-4 gap-2">
            {user && (
              <>
                <Link
                  to="/rewards"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
                  onClick={() => setIsOpen(false)}
                >
                  Rewards
                </Link>
                <Link
                  to="/profile"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/orders"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
                  onClick={() => setIsOpen(false)}
                >
                  Order History
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
