// Modal.jsx
// simple modal with fade animation

export default function Modal({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center backdrop-blur-sm z-50 transition-all duration-300">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-md w-full max-w-md border border-gray-200 dark:border-neutral-800">
        {children}

        <button
          className="mt-4 w-full bg-gray-200 dark:bg-neutral-700 px-4 py-2 rounded-lg transition"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}