/**
 * Client limits aligned with backend booking-public-v1.
 * Single source of truth — do not duplicate these numbers elsewhere.
 */

/** Maximum `limit` accepted by POST /api/public/booking/upcoming */
export const UPCOMING_BOOKINGS_MAX_LIMIT = 25;

/** Default upcoming page size when caller omits limit */
export const UPCOMING_BOOKINGS_DEFAULT_LIMIT = 20;

/** Maximum public bookingCode length (trim + uppercase applied separately) */
export const BOOKING_CODE_MAX_LENGTH = 32;

/** Minimum plausible bookingCode length after normalization */
export const BOOKING_CODE_MIN_LENGTH = 4;

export function clampUpcomingLimit(limit?: number): number {
  const raw = limit ?? UPCOMING_BOOKINGS_DEFAULT_LIMIT;
  return Math.min(Math.max(1, raw), UPCOMING_BOOKINGS_MAX_LIMIT);
}

export function normalizeBookingCode(input: string): string {
  return input.trim().toUpperCase().slice(0, BOOKING_CODE_MAX_LENGTH);
}

export function isValidBookingCodeShape(code: string): boolean {
  const n = normalizeBookingCode(code);
  return n.length >= BOOKING_CODE_MIN_LENGTH && n.length <= BOOKING_CODE_MAX_LENGTH;
}
