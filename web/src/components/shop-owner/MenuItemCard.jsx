// MenuItemCard.jsx
// Card component for menu items with quick actions

import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";

export default function MenuItemCard({ item, onEdit, onDelete, onToggleAvailability }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md overflow-hidden hover:shadow-lg transition group">
      
      {/* Image */}
      <div className="relative h-40 bg-gray-200 dark:bg-neutral-800">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">☕</span>
          </div>
        )}
        
        {/* Availability badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
          item.is_available 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {item.is_available ? 'Available' : 'Unavailable'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="text-xl font-bold text-amber-700 dark:text-amber-500">
          ${parseFloat(item.base_price).toFixed(2)}
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onEdit(item)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Pencil size={16} />
          Edit
        </button>
        <button
          onClick={() => onToggleAvailability(item)}
          className="px-3 py-2 bg-gray-200 dark:bg-neutral-800 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
          title={item.is_available ? 'Mark Unavailable' : 'Mark Available'}
        >
          {item.is_available ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          onClick={() => onDelete(item)}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
