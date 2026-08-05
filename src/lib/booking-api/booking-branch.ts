import type { Language } from "@/lib/i18n/types";
import type { BookingEntryMode, PublicBranch } from "./types";
import type { BarberBranchResolution } from "./resolve-bookable-branches";
import type { BarberAvailabilityScope } from "./barber-availability";
import { findBranchByCode } from "./booking-steps";
import { branchCodesEqual, normalizeBranchCode } from "./branch-code";

/**
 * Booking draft branch is the source of truth for the open booking.
 * Preferred/global BranchContext may initialize only when still valid —
 * never for multi-branch all_branches before a slot, and never as a silent
 * scope decision.
 */
export interface BookingBranchFlowState {
  /** Explicit draft / slot-committed branch code. */
  draftBranchCode?: string | null;
  /** Optional display name from API when draft is set. */
  draftBranchName?: string | null;
  /** Slot-level branch (nearest / cross-branch) before commit — same as draft once committed. */
  slotBranchCode?: string | null;
  preferredBranchCode?: string | null;
  publicBranches: PublicBranch[];
  /** For barber-first: intersection result. Null/undefined = use all public. */
  allowedBranches?: PublicBranch[] | null;
  branchResolution?: BarberBranchResolution | null;
  entryMode: BookingEntryMode;
  /** Multi-branch appointment search scope. */
  availabilityScope?: BarberAvailabilityScope | null;
  /** When true, barber works at multiple public branches. */
  multiBranchBarber?: boolean;
}

export interface EffectiveBookingBranch {
  branch: PublicBranch | null;
  branchCode: string | null;
  branchName: string | null;
  source: "draft" | "preferred" | "resolved" | "none";
}

function poolForFlow(state: BookingBranchFlowState): PublicBranch[] {
  if (state.entryMode === "barber_first") {
    return state.allowedBranches ?? [];
  }
  return state.publicBranches;
}

/**
 * Prefer draft/slot only. Suppress preferred when multi-branch scope is
 * all_branches (branch comes from the selected slot) or when scope is unset.
 */
export function getEffectiveBookingBranch(
  state: BookingBranchFlowState,
): EffectiveBookingBranch {
  const pool = poolForFlow(state);

  if (state.entryMode === "barber_first" && state.branchResolution === "none") {
    return { branch: null, branchCode: null, branchName: null, source: "none" };
  }

  const draftCode =
    normalizeBranchCode(state.draftBranchCode) ||
    normalizeBranchCode(state.slotBranchCode);

  if (draftCode) {
    const fromPool = findBranchByCode(pool, draftCode);
    if (fromPool) {
      return {
        branch: fromPool,
        branchCode: fromPool.branchCode,
        branchName: fromPool.branchName || state.draftBranchName || null,
        source: "draft",
      };
    }
    if (state.draftBranchName && draftCode) {
      return {
        branch: null,
        branchCode: draftCode,
        branchName: state.draftBranchName,
        source: "draft",
      };
    }
    return { branch: null, branchCode: null, branchName: null, source: "none" };
  }

  const suppressPreferred =
    state.entryMode === "barber_first" &&
    Boolean(state.multiBranchBarber) &&
    (state.availabilityScope == null ||
      state.availabilityScope === "all_branches" ||
      state.availabilityScope === "specific_branch");

  // specific_branch without draft: still no preferred silent pick
  if (suppressPreferred) {
    return { branch: null, branchCode: null, branchName: null, source: "none" };
  }

  const preferred = normalizeBranchCode(state.preferredBranchCode);
  if (preferred) {
    const match = findBranchByCode(pool, preferred);
    if (match) {
      return {
        branch: match,
        branchCode: match.branchCode,
        branchName: match.branchName,
        source: "preferred",
      };
    }
  }

  return { branch: null, branchCode: null, branchName: null, source: "none" };
}

export function getBookingBranchDisplay(
  state: BookingBranchFlowState,
  _lang: Language,
  notSetLabel: string,
  options?: {
    /** When all_branches and no slot yet — show "determined by time". */
    pendingAllBranchesLabel?: string;
  },
): { code: string | null; name: string; isSet: boolean } {
  const effective = getEffectiveBookingBranch(state);
  if (
    !effective.branchCode &&
    state.multiBranchBarber &&
    state.availabilityScope === "all_branches" &&
    options?.pendingAllBranchesLabel
  ) {
    return {
      code: null,
      name: options.pendingAllBranchesLabel,
      isSet: false,
    };
  }
  if (!effective.branchCode) {
    return { code: null, name: notSetLabel, isSet: false };
  }
  return {
    code: effective.branchCode,
    name: effective.branchName || effective.branchCode,
    isSet: true,
  };
}

/** True when preferred BranchContext branch may initialize this booking. */
export function isPreferredBranchValidForBooking(
  preferredCode: string | null | undefined,
  allowedOrPublic: PublicBranch[],
): boolean {
  if (!normalizeBranchCode(preferredCode)) return false;
  return allowedOrPublic.some((b) =>
    branchCodesEqual(b.branchCode, preferredCode),
  );
}

export function localizeBranchName(
  branch: {
    branchName?: string | null;
    branchNameAr?: string | null;
    branchNameEn?: string | null;
    shortName?: string | null;
  } | null | undefined,
  lang: Language,
): string {
  if (!branch) return "";
  if (lang === "en") {
    return (
      (branch.branchNameEn || "").trim() ||
      (branch.branchName || "").trim() ||
      (branch.shortName || "").trim() ||
      ""
    );
  }
  return (
    (branch.branchNameAr || "").trim() ||
    (branch.branchName || "").trim() ||
    (branch.shortName || "").trim() ||
    ""
  );
}
