// Card.jsx
// reusable card component — subtle shadows, theme aware

export default function Card({ title, children }) {
  return (
    <div className="bg-white dark:bg-neutral-900 shadow-md p-5 rounded-xl border border-gray-200 dark:border-neutral-800 transition-all duration-300">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {children}
    </div>
  );
}

