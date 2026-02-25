export default function PageLoader() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#181818]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
