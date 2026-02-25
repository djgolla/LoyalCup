import { MapPin, Star } from "lucide-react";

export default function ShopCard({ shop, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden hover:shadow-lg transition cursor-pointer"
    >
      {/* shop image */}
      {shop.banner_url ? (
        <img
          src={shop.banner_url}
          alt={shop.name}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
          <span className="text-4xl">☕</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {shop.name}
          </h3>
          
          <div className="flex items-center gap-1 text-sm">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-gray-900 dark:text-white">4.8</span>
          </div>
        </div>

        {shop.description && (
          <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1 line-clamp-2">
            {shop.description}
          </p>
        )}

        {shop.address && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-neutral-500">
            <MapPin size={12} />
            <span className="line-clamp-1">{shop.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}
