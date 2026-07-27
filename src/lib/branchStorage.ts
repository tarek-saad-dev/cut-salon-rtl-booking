import type { PublicBranch } from "@/lib/booking-api";

const KEY = "cut_branch";

/** Persist only public codes/names — never BranchID. */
export type StoredBranch = Pick<
  PublicBranch,
  "branchCode" | "branchName" | "shortName"
>;

export function getSavedBranch(): StoredBranch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredBranch & { branchId?: number };
    if (!parsed?.branchCode) return null;
    return {
      branchCode: parsed.branchCode,
      branchName: parsed.branchName,
      shortName: parsed.shortName ?? null,
    };
  } catch {
    return null;
  }
}

export function saveBranch(branch: PublicBranch): void {
  if (typeof window === "undefined") return;
  const toStore: StoredBranch = {
    branchCode: branch.branchCode,
    branchName: branch.branchName,
    shortName: branch.shortName,
  };
  localStorage.setItem(KEY, JSON.stringify(toStore));
}

export function clearBranch(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
