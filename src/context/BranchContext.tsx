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
import { listPublicBranches, type PublicBranch } from "@/lib/booking-api";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";
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

/** Public branches come from the API list as returned — no hardcoded code exclusions. */
function normalizePublicBranches(raw: PublicBranch[] | null | undefined): PublicBranch[] {
  const seen = new Set<string>();
  const out: PublicBranch[] = [];
  for (const branch of raw ?? []) {
    const code = normalizeBranchCode(branch.branchCode);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push({
      ...branch,
      branchCode: code,
      branchName: branch.branchName || code,
      shortName: branch.shortName ?? null,
      address: branch.address ?? null,
      phone: branch.phone ?? null,
      timeZone: branch.timeZone || "Africa/Cairo",
    });
  }
  return out;
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<PublicBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<PublicBranch | null>(null);
  const [hasConfirmedBranch, setHasConfirmedBranch] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setIsLoadingBranches(true);
      setBranchesError(null);
      try {
        const res = await listPublicBranches(controller.signal);
        if (cancelled) return;
        const list = normalizePublicBranches(res.data ?? []);
        setBranches(list);

        const saved = getSavedBranch();
        if (saved) {
          const match = list.find(
            (b) => normalizeBranchCode(b.branchCode) === normalizeBranchCode(saved.branchCode),
          );
          if (match) {
            setSelectedBranch(match);
            setHasConfirmedBranch(true);
          } else {
            clearBranchStorage();
            setSelectedBranch(null);
            setHasConfirmedBranch(false);
          }
        }

        // Single public branch: preselect for UX; name still comes from API.
        if (!saved && list.length === 1) {
          setSelectedBranch(list[0]);
          // Do not mark confirmed until user taps confirm (explicit pick).
        }
      } catch (err) {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[BranchContext] failed to load branches");
          }
          setBranchesError("branchesLoadFailed");
        }
      } finally {
        if (!cancelled) setIsLoadingBranches(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadToken]);

  const selectBranch = useCallback((branch: PublicBranch) => {
    const code = normalizeBranchCode(branch.branchCode);
    if (!code) return;
    const normalized: PublicBranch = {
      ...branch,
      branchCode: code,
      branchName: branch.branchName || code,
    };
    setSelectedBranch(normalized);
    setHasConfirmedBranch(true);
    saveBranch(normalized);
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
    [
      branches,
      isLoadingBranches,
      branchesError,
      selectedBranch,
      hasConfirmedBranch,
      selectBranch,
      clearBranch,
      refetchBranches,
    ],
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
