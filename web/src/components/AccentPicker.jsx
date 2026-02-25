// AccentPicker.jsx
// drop-down for accent colors (currently just coffee, but extendable)

import { useContext } from "react";
import { AccentContext } from "../context/AccentContext";

export default function AccentPicker() {
  const { accent, setAccent } = useContext(AccentContext);

  return (
    <select
      value={accent}
      onChange={(e) => setAccent(e.target.value)}
      className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-sm"
    >
      <option value="coffee">Coffee (default)</option>
      {/* You can add more colors later */}
    </select>
  );
}
