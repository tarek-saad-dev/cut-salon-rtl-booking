import type { PublicBranch, PublicBarberBranch } from "./types";
import { branchCodesEqual, normalizeBranchCode } from "./branch-code";

export type BarberBranchResolution =
  | "none"
  | "single"
  | "preferred"
  | "multiple";

export interface ResolveBookableBranchesInput {
  barberProfileBranches: PublicBarberBranch[] | null | undefined;
  publicBranches: PublicBranch[];
  preferredBranchCode?: string | null;
}

export interface ResolveBookableBranchesResult {
  allowedBranches: PublicBranch[];
  resolvedBranch: PublicBranch | null;
  resolution: BarberBranchResolution;
}

/**
 * Pure, language-neutral intersection of a barber's profile branches with
 * public bookable branches. Branch code is the only identity.
 */
export function resolveBookableBranchesForBarber(
  input: ResolveBookableBranchesInput,
): ResolveBookableBranchesResult {
  const publicByCode = new Map<string, PublicBranch>();
  for (const branch of input.publicBranches) {
    const code = normalizeBranchCode(branch.branchCode);
    if (!code) continue;
    publicByCode.set(code, branch);
  }

  const seen = new Set<string>();
  const allowedBranches: PublicBranch[] = [];
  for (const profileBranch of input.barberProfileBranches ?? []) {
    const code = normalizeBranchCode(profileBranch.branchCode);
    if (!code || seen.has(code)) continue;
    const match = publicByCode.get(code);
    if (!match) continue;
    seen.add(code);
    allowedBranches.push(match);
  }

  if (allowedBranches.length === 0) {
    return { allowedBranches, resolvedBranch: null, resolution: "none" };
  }

  if (allowedBranches.length === 1) {
    return {
      allowedBranches,
      resolvedBranch: allowedBranches[0],
      resolution: "single",
    };
  }

  const preferred = input.preferredBranchCode
    ? allowedBranches.find((b) =>
        branchCodesEqual(b.branchCode, input.preferredBranchCode),
      )
    : undefined;

  if (preferred) {
    return {
      allowedBranches,
      resolvedBranch: preferred,
      resolution: "preferred",
    };
  }

  return {
    allowedBranches,
    resolvedBranch: null,
    resolution: "multiple",
  };
}
