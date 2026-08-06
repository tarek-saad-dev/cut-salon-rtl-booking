/**
 * Development-only booking performance marks.
 * Never logs PII. No-ops in production and Vitest.
 */

export type BookingPerfMark =
  | "barber_card_click"
  | "modal_mounted"
  | "barber_profile_request_start"
  | "barber_profile_response"
  | "appointment_options_rendered"
  | "branch_picker_rendered"
  | "catalog_request_start"
  | "catalog_request_complete";

export type BookingPerfDetail = {
  empId?: number;
  cacheHit?: boolean;
  cacheMiss?: boolean;
  cold?: boolean;
  warm?: boolean;
  durationMs?: number;
  globalListFallback?: boolean;
  compatAvailabilityFallback?: boolean;
  source?: string;
};

const enabled =
  typeof process !== "undefined" &&
  process.env.NODE_ENV === "development" &&
  process.env.VITEST !== "true";

const session: {
  marks: Array<{ mark: BookingPerfMark; at: number; detail?: BookingPerfDetail }>;
} = { marks: [] };

export function bookingPerfMark(mark: BookingPerfMark, detail?: BookingPerfDetail): void {
  if (!enabled) return;
  const at = typeof performance !== "undefined" ? performance.now() : Date.now();
  session.marks.push({ mark, at, detail });
  try {
    performance.mark(`booking:${mark}`, { detail });
  } catch {
    /* older browsers */
  }
  // eslint-disable-next-line no-console
  console.debug(`[booking-perf] ${mark}`, detail ?? "");
}

export function bookingPerfMeasure(
  name: string,
  startMark: BookingPerfMark,
  endMark: BookingPerfMark,
): number | null {
  if (!enabled) return null;
  const start = [...session.marks].reverse().find((m) => m.mark === startMark);
  const end = [...session.marks].reverse().find((m) => m.mark === endMark);
  if (!start || !end) return null;
  const durationMs = Math.round(end.at - start.at);
  // eslint-disable-next-line no-console
  console.debug(`[booking-perf] measure ${name}=${durationMs}ms`);
  return durationMs;
}

export function getBookingPerfSnapshot() {
  return [...session.marks];
}

export function clearBookingPerfMarks(): void {
  session.marks = [];
}
