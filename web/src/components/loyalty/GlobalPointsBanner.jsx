// GlobalPointsBanner.jsx
// prominent display of global loyalty points

import PointsBalance from './PointsBalance';

export default function GlobalPointsBanner({ points }) {
  return (
    <div className="bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 p-6 rounded-xl shadow-lg text-white">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
            🌐 LOYALCUP GLOBAL
          </h2>
          <p className="text-amber-100">
            Use at any participating shop!
          </p>
        </div>
        <PointsBalance points={points} animated />
      </div>
    </div>
  );
}
