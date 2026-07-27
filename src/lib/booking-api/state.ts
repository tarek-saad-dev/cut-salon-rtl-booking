/**
 * Booking flow state foundation.
 * Pure data model — no React dependency.
 * UI layer (context/hooks) will wrap this.
 */

import type {
  BookingMode,
  BookingEntryMode,
  BookingPlan,
  BookingCustomer,
  AvailableDay,
  AvailableSlot,
} from "./types";
import type { BookingApiError } from "./errors";
import type { MutationOutcome } from "./booking";

export interface BookingFlowState {
  entryMode: BookingEntryMode;
  branchCode: string | null;
  selectedServices: number[];
  selectedBarber: { id: number; name: string } | null;
  workDate: string | null;
  time: string | null;
  dayOffset: number;
  plan: BookingPlan | null;
  customer: Partial<BookingCustomer>;
  mutationState: {
    status: "idle" | "submitting" | "success" | "failed" | "mutation_outcome_unknown";
    outcome?: MutationOutcome;
    error?: BookingApiError;
  };
  lastApiError: BookingApiError | null;
}

export function createInitialBookingState(
  entryMode: BookingEntryMode = "branch_first",
): BookingFlowState {
  return {
    entryMode,
    branchCode: null,
    selectedServices: [],
    selectedBarber: null,
    workDate: null,
    time: null,
    dayOffset: 0,
    plan: null,
    customer: {},
    mutationState: { status: "idle" },
    lastApiError: null,
  };
}

// ─── State Transitions ───────────────────────────────────────────────────────

export function setBranch(
  state: BookingFlowState,
  branchCode: string,
): BookingFlowState {
  if (state.branchCode === branchCode) return state;
  return {
    ...state,
    branchCode,
    selectedBarber: null,
    selectedServices: [],
    workDate: null,
    time: null,
    dayOffset: 0,
    plan: null,
    mutationState: { status: "idle" },
    lastApiError: null,
  };
}

export function setServices(
  state: BookingFlowState,
  serviceIds: number[],
): BookingFlowState {
  return {
    ...state,
    selectedServices: serviceIds,
    workDate: null,
    time: null,
    dayOffset: 0,
    plan: null,
    lastApiError: null,
  };
}

export function setBarber(
  state: BookingFlowState,
  barber: { id: number; name: string } | null,
): BookingFlowState {
  return {
    ...state,
    selectedBarber: barber,
    workDate: null,
    time: null,
    dayOffset: 0,
    plan: null,
    lastApiError: null,
  };
}

export function setDate(
  state: BookingFlowState,
  date: string,
): BookingFlowState {
  return {
    ...state,
    workDate: date,
    time: null,
    dayOffset: 0,
    plan: null,
    lastApiError: null,
  };
}

export function setTime(
  state: BookingFlowState,
  time: string,
  dayOffset: number = 0,
): BookingFlowState {
  return {
    ...state,
    time,
    dayOffset,
    plan: null,
    lastApiError: null,
  };
}

export function setPlan(
  state: BookingFlowState,
  plan: BookingPlan,
): BookingFlowState {
  return { ...state, plan };
}

export function clearAfterSuccess(
  state: BookingFlowState,
): BookingFlowState {
  return {
    ...state,
    plan: null,
    customer: {},
    mutationState: { status: "success", outcome: "success" },
  };
}

export function resetBookingState(
  entryMode?: BookingEntryMode,
): BookingFlowState {
  return createInitialBookingState(entryMode);
}
