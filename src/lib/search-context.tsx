import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type SearchMenuContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const noop = () => {};

const fallback: SearchMenuContextValue = {
  isOpen: false,
  setIsOpen: noop,
};

const SearchMenuCtx = createContext<SearchMenuContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return <SearchMenuCtx.Provider value={{ isOpen, setIsOpen }}>{children}</SearchMenuCtx.Provider>;
}

/** Safe to call outside <SearchProvider> — returns a no-op fallback. */
export function useSearchMenu() {
  return useContext(SearchMenuCtx) ?? fallback;
}
