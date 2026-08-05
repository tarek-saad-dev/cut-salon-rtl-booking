import type { PublicBarber, PublicBarberBranch, PublicBranch } from "./types";
import { resolveBookableBranchesForBarber } from "./resolve-bookable-branches";
import { branchCodesEqual, normalizeBranchCode } from "./branch-code";

export type BarberWithBranches = Pick<
  PublicBarber,
  "id" | "isBookableOnline" | "branches"
> & {
  branches?: PublicBarberBranch[];
};

/**
 * Global discovery: bookable online and intersects at least one public branch.
 * Camp-only barbers are eligible when Camp is public.
 */
export function isBarberEligibleForPublicDiscovery(
  barber: BarberWithBranches,
  publicBranches: PublicBranch[],
): boolean {
  if (barber.isBookableOnline === false) return false;
  if (!Number.isFinite(barber.id) || barber.id <= 0) return false;
  const { resolution } = resolveBookableBranchesForBarber({
    barberProfileBranches: barber.branches ?? [],
    publicBranches,
  });
  return resolution !== "none";
}

export function filterBarbersForPublicDiscovery<T extends BarberWithBranches>(
  barbers: T[],
  publicBranches: PublicBranch[],
): T[] {
  return barbers.filter((b) =>
    isBarberEligibleForPublicDiscovery(b, publicBranches),
  );
}

/**
 * Branch roster: barber assigned to the given public branch code.
 */
export function isBarberAssignedToBranch(
  barber: BarberWithBranches,
  branchCode: string,
): boolean {
  const target = normalizeBranchCode(branchCode);
  if (!target) return false;
  return (barber.branches ?? []).some((b) =>
    branchCodesEqual(b.branchCode, target),
  );
}

export function filterBarbersForBranchRoster<T extends BarberWithBranches>(
  barbers: T[],
  branchCode: string,
  publicBranches: PublicBranch[],
): T[] {
  const publicCodes = new Set(
    publicBranches.map((b) => normalizeBranchCode(b.branchCode)).filter(Boolean),
  );
  if (!publicCodes.has(normalizeBranchCode(branchCode))) return [];
  return barbers.filter(
    (b) =>
      b.isBookableOnline !== false &&
      isBarberAssignedToBranch(b, branchCode),
  );
}
