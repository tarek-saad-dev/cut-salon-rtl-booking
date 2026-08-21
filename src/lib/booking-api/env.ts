/**
 * Booking API environment configuration.
 * Prefer NEXT_PUBLIC_BOOKING_API_BASE_URL (single booking base for V2),
 * otherwise NEXT_PUBLIC_CASHER_API_BASE_URL / NEXT_PUBLIC_API_BASE_URL.
 *
 * Production: HTTPS only, never localhost.
 * Development: localhost Hawai allowed.
 */

import { assertBookingApiBaseForRuntime } from "@/lib/bookingV2/feature";

let _cachedBaseUrl: string | null = null;

function validateBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, "");
  if (!trimmed) {
    throw new Error(
      "[booking-api] Booking API base URL is not configured. " +
        "Set NEXT_PUBLIC_BOOKING_API_BASE_URL (preferred) or NEXT_PUBLIC_CASHER_API_BASE_URL.",
    );
  }
  try {
    const url = new URL(trimmed);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error(
        `[booking-api] Production requires HTTPS. Got: ${url.protocol}`,
      );
    }
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error(
        `[booking-api] Invalid protocol: ${url.protocol}`,
      );
    }
    return url.origin + url.pathname.replace(/\/+$/, "");
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("[booking-api]")) throw e;
    throw new Error(
      `[booking-api] Invalid booking API base URL: "${trimmed}"`,
    );
  }
}

export function getBookingApiBaseUrl(): string {
  if (_cachedBaseUrl !== null) return _cachedBaseUrl;
  const raw =
    process.env.NEXT_PUBLIC_BOOKING_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_CASHER_API_BASE_URL ||
    "";
  const validated = validateBaseUrl(raw);
  assertBookingApiBaseForRuntime(validated, "booking-api");
  _cachedBaseUrl = validated;
  return _cachedBaseUrl;
}

/** Only for testing */
export function _resetBaseUrlCache(): void {
  _cachedBaseUrl = null;
}
