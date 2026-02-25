export default function Skeleton({ className = "", variant = "default" }) {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-neutral-800 rounded";
  
  const variants = {
    default: "h-4 w-full",
    text: "h-4 w-3/4",
    title: "h-8 w-1/2",
    circle: "rounded-full w-12 h-12",
    card: "h-64 w-full",
  };

  return <div className={`${baseClasses} ${variants[variant]} ${className}`}></div>;
}
