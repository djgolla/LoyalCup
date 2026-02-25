export default function Spinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-3",
    lg: "w-8 h-8 border-4",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-amber-700 border-t-transparent rounded-full animate-spin ${className}`}
    ></div>
  );
}
