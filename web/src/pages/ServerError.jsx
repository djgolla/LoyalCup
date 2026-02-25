import { Link } from "react-router-dom";

export default function ServerError() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#181818]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Server Error
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Something went wrong on our end. Please try again later.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
