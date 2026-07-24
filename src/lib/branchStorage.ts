import type { PublicBranch } from "./publicBookingApi";

const KEY = "cut_branch";

export type StoredBranch = Pick<
  PublicBranch,
  "branchId" | "branchCode" | "branchName" | "shortName"
>;

export function getSavedBranch(): StoredBranch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredBranch;
    if (!parsed?.branchCode) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveBranch(branch: PublicBranch): void {
  if (typeof window === "undefined") return;
  const toStore: StoredBranch = {
    branchId: branch.branchId,
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
