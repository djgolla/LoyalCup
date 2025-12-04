// Sidebar.jsx
// left sidebar navigation — simple + clean + latte accent

import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AccentContext } from "../context/AccentContext";
import ThemeToggle from "./ThemeToggle";
import AccentPicker from "./AccentPicker";

export default function Sidebar() {
  const { accent } = useContext(AccentContext);

  const linkClasses =
    "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200";

  return (
    <aside className="w-64 bg-white dark:bg-[#1f1f1f] border-r border-gray-200 dark:border-neutral-800 p-4 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-amber-700 select-none">
        Coffee Admin
      </h1>

      <nav className="flex flex-col gap-2">

        <NavLink
          to="/"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          Orders
        </NavLink>

        <NavLink
          to="/menu"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          Menu
        </NavLink>

        <NavLink
          to="/account"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          Account
        </NavLink>
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <ThemeToggle />
        <AccentPicker />
      </div>
    </aside>
  );
}