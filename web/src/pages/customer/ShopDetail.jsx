import { useParams } from "react-router-dom";

export default function ShopDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Coffee Shop {id}
      </h1>
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg"
            >
              <h3 className="font-semibold">Menu Item {i}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Description
              </p>
              <p className="text-amber-700 font-bold mt-2">$5.99</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
