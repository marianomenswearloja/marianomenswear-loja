import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type FilterContextValue = {
  activeDept: string | null;
  setActiveDept: (id: string | null) => void;
  activeCat: string | null;
  setActiveCat: (id: string | null) => void;
};

const noop = () => {};

const fallback: FilterContextValue = {
  activeDept: null,
  setActiveDept: noop,
  activeCat: null,
  setActiveCat: noop,
};

const FilterCtx = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  return (
    <FilterCtx.Provider value={{ activeDept, setActiveDept, activeCat, setActiveCat }}>
      {children}
    </FilterCtx.Provider>
  );
}

/** Safe to call outside <FilterProvider> — returns a no-op fallback in that case. */
export function useFilter() {
  return useContext(FilterCtx) ?? fallback;
}
