// Button.jsx
// subtle pressed animation

export default function Button({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}