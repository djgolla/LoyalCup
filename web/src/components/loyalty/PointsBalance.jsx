// PointsBalance.jsx
// points display with animation

import { useEffect, useState } from 'react';

export default function PointsBalance({ points, animated = false }) {
  const [displayPoints, setDisplayPoints] = useState(points);

  useEffect(() => {
    if (!animated) {
      return;
    }

    // animate points counting up
    const duration = 1000;
    const steps = 30;
    const increment = points / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= points) {
        setDisplayPoints(points);
        clearInterval(timer);
      } else {
        setDisplayPoints(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [points, animated]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">⭐</span>
      <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
        {displayPoints}
      </span>
    </div>
  );
}
