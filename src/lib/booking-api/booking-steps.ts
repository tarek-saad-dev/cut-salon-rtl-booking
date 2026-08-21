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
 * Barber-first: auto all-branches (no scope/branch chooser), date before service.
 * Branch-first: unchanged Phase 1B sequence.
 */
export function getBookingSteps(input: GetBookingStepsInput): BookingStepId[] {
  const {
    entryMode,
    initialMode,
    branchResolved,
    servicePreselected = false,
  } = input;

  const steps: BookingStepId[] = [];
  const modeLocked = entryMode === "barber_first" || Boolean(initialMode);
  const isBarberFirst = entryMode === "barber_first";

  if (isBarberFirst) {
    // Skip appointment_scope + branch — availability is always all branches.
    if (!servicePreselected) {
      steps.push("date", "service", "time", "details", "review");
    } else {
      steps.push("date", "time", "details", "review");
    }
    return steps;
  }

  if (!branchResolved) {
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
  if (sequence.length === 0) return "date";
  const normalized =
    currentStep === "success"
      ? "review"
      : currentStep === "slots"
        ? "date"
        : currentStep === "appointment_scope" || currentStep === "branch"
          ? sequence[0]
          : currentStep;
  const idx = sequence.indexOf(normalized as BookingStepId);
  if (idx >= 0) return sequence[idx];
  if (sequence.includes("date")) return "date";
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
