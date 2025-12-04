import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs() {
  const location = useLocation();
  const paths = location.pathname.split("/").filter(Boolean);

  if (paths.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm mb-4">
      <Link
        to="/"
        className="text-gray-600 dark:text-gray-400 hover:text-amber-700 transition"
      >
        <Home size={16} />
      </Link>
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join("/")}`;
        const isLast = index === paths.length - 1;
        const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

        return (
          <div key={href} className="flex items-center gap-2">
            <ChevronRight size={16} className="text-gray-400" />
            {isLast ? (
              <span className="text-gray-900 dark:text-white font-medium">
                {label}
              </span>
            ) : (
              <Link
                to={href}
                className="text-gray-600 dark:text-gray-400 hover:text-amber-700 transition"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
