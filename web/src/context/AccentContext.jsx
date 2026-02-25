import { createContext, useState } from "react";

export const AccentContext = createContext();

export function AccentProvider({ children }) {
  const [accent, setAccent] = useState("coffee");

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
}
