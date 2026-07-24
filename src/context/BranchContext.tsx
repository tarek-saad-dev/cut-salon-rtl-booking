"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchPublicBranches,
  type PublicBranch,
} from "@/lib/publicBookingApi";
import { getSavedBranch, saveBranch, clearBranch as clearBranchStorage } from "@/lib/branchStorage";

interface BranchContextValue {
  branches: PublicBranch[];
  isLoadingBranches: boolean;
  branchesError: string | null;
  selectedBranch: PublicBranch | null;
  /** True once the user has explicitly picked/confirmed a branch this session or a previous one. */
  hasConfirmedBranch: boolean;
  selectBranch: (branch: PublicBranch) => void;
  clearBranch: () => void;
  refetchBranches: () => void;
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<PublicBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<PublicBranch | null>(null);
  const [hasConfirmedBranch, setHasConfirmedBranch] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoadingBranches(true);
      setBranchesError(null);
      try {
        const res = await fetchPublicBranches();
        if (cancelled) return;
        const list = res.branches ?? [];
        setBranches(list);

        // Restore a previously confirmed branch only if it still exists & is active.
        const saved = getSavedBranch();
        if (saved) {
          const match = list.find((b) => b.branchCode === saved.branchCode);
          if (match) {
            setSelectedBranch(match);
            setHasConfirmedBranch(true);
          } else {
            clearBranchStorage();
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[BranchContext] failed to load branches:", err);
          }
          setBranchesError("تعذر تحميل قائمة الفروع");
        }
      } finally {
        if (!cancelled) setIsLoadingBranches(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const selectBranch = useCallback((branch: PublicBranch) => {
    setSelectedBranch(branch);
    setHasConfirmedBranch(true);
    saveBranch(branch);
  }, []);

  const clearBranch = useCallback(() => {
    setSelectedBranch(null);
    setHasConfirmedBranch(false);
    clearBranchStorage();
  }, []);

  const refetchBranches = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  const value = useMemo<BranchContextValue>(
    () => ({
      branches,
      isLoadingBranches,
      branchesError,
      selectedBranch,
      hasConfirmedBranch,
      selectBranch,
      clearBranch,
      refetchBranches,
    }),
    [branches, isLoadingBranches, branchesError, selectedBranch, hasConfirmedBranch, selectBranch, clearBranch, refetchBranches],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return ctx;
}
