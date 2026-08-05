import type { BookingEntryMode, BookingMode, PublicBranch } from "./types";
import type { BarberAvailabilityScope } from "./barber-availability";
import { branchCodesEqual, normalizeBranchCode } from "./branch-code";

export type BookingStepId =
  | "appointment_scope"
  | "branch"
  | "mode"
  | "service"
  | "date"
  | "time"
  | "details"
  | "review";

export interface GetBookingStepsInput {
  entryMode: BookingEntryMode;
  /** Locked mode from entry (nearest/specific) when supplied. */
  initialMode?: BookingMode;
  /** True when the booking draft already has a valid resolved branch. */
  branchResolved: boolean;
  /** True when barber-first has a locked barber (empId present). */
  barberResolved: boolean;
  /** Groom / package flow with services already chosen. */
  servicePreselected?: boolean;
  /** Barber has more than one public bookable branch. */
  multiBranchBarber?: boolean;
  /** Selected appointment search scope (multi-branch only). */
  availabilityScope?: BarberAvailabilityScope | null;
}

/**
 * Single source of visible booking steps for desktop and mobile steppers.
 *
 * Multi-branch barber-first:
 *   appointment_scope → branch (only if specific_branch) → service → date → …
 * Single-branch / branch-first: unchanged Phase 1B sequence.
 */
export function getBookingSteps(input: GetBookingStepsInput): BookingStepId[] {
  const {
    entryMode,
    initialMode,
    branchResolved,
    servicePreselected = false,
    multiBranchBarber = false,
    availabilityScope = null,
  } = input;

  const steps: BookingStepId[] = [];
  const modeLocked = entryMode === "barber_first" || Boolean(initialMode);
  const isBarberFirst = entryMode === "barber_first";

  if (isBarberFirst && multiBranchBarber) {
    steps.push("appointment_scope");
    if (availabilityScope === "specific_branch" && !branchResolved) {
      steps.push("branch");
    }
  } else if (!branchResolved) {
    steps.push("branch");
  }

  if (!modeLocked) {
    steps.push("mode");
  }

  if (!servicePreselected) {
    steps.push("service");
  }

  steps.push("date", "time", "details", "review");
  return steps;
}

/** Map UI step aliases (slots/success) onto the visible sequence. */
export function normalizeStepForSequence(
  step: string,
): BookingStepId | "success" | "slots" {
  if (step === "success") return "success";
  if (step === "slots") return "slots";
  return step as BookingStepId;
}

/**
 * When the visible sequence changes, move to the nearest valid previous step
 * (or the first step) without inventing missing steps.
 */
export function recoverStepInSequence(
  currentStep: string,
  sequence: BookingStepId[],
): BookingStepId {
  if (sequence.length === 0) return "service";
  const normalized =
    currentStep === "success"
      ? "review"
      : currentStep === "slots"
        ? "date"
        : currentStep;
  const idx = sequence.indexOf(normalized as BookingStepId);
  if (idx >= 0) return sequence[idx];
  if (sequence.includes("appointment_scope")) return "appointment_scope";
  if (sequence.includes("service")) return "service";
  return sequence[0];
}

export function findBranchByCode(
  branches: PublicBranch[],
  code: string | null | undefined,
): PublicBranch | null {
  if (!normalizeBranchCode(code)) return null;
  return branches.find((b) => branchCodesEqual(b.branchCode, code)) ?? null;
}
