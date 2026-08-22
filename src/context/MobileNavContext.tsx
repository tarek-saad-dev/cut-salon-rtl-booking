"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MobileNavBack = {
  /** When set, overrides default back visibility (home = hidden). */
  visible?: boolean;
  action?: () => void;
};

type MobileNavContextValue = {
  back: MobileNavBack;
  setBack: (back: MobileNavBack) => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [back, setBackState] = useState<MobileNavBack>({});

  const setBack = useCallback((next: MobileNavBack) => {
    setBackState(next);
  }, []);

  const value = useMemo(() => ({ back, setBack }), [back, setBack]);

  return <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) {
    throw new Error("useMobileNav must be used within MobileNavProvider");
  }
  return ctx;
}

/** Optional hook for pages that may render outside provider during SSR edge cases. */
export function useMobileNavOptional() {
  return useContext(MobileNavContext);
}
