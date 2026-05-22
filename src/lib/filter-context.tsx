import { createContext, useContext, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

type FilterMenuContextValue = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  activeDept: string | null;
  setActiveDept: (id: string | null) => void;
  activeCat: string | null;
  setActiveCat: (id: string | null) => void;
};

const noop = () => {};

const fallback: FilterMenuContextValue = {
  isOpen: false,
  setIsOpen: noop,
  activeDept: null,
  setActiveDept: noop,
  activeCat: null,
  setActiveCat: noop,
};

const FilterMenuCtx = createContext<FilterMenuContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  return (
    <FilterMenuCtx.Provider
      value={{ isOpen, setIsOpen, activeDept, setActiveDept, activeCat, setActiveCat }}
    >
      {children}
    </FilterMenuCtx.Provider>
  );
}

/** Safe to call outside <FilterProvider> — returns a no-op fallback. */
export function useFilterMenu() {
  return useContext(FilterMenuCtx) ?? fallback;
}
