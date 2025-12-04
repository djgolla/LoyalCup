import { Link, useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#181818]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You don't have permission to access this page.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Go Back
          </button>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
