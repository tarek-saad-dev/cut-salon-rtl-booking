/**
 * Backward-compatible entry for the service step.
 * Phase 1E implementation lives in BookingServiceStep.
 */
"use client";

export { default } from "./booking-services/BookingServiceStep";
export type { BookingServiceStepProps as BookingServiceSelectProps } from "./booking-services/BookingServiceStep";
