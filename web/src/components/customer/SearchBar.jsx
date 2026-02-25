import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <Search 
        size={20} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500" 
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );
}
