/**
 * Booking API environment configuration.
 * Single source of truth for NEXT_PUBLIC_CASHER_API_BASE_URL.
 */

let _cachedBaseUrl: string | null = null;

function validateBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, "");
  if (!trimmed) {
    throw new Error(
      "[booking-api] NEXT_PUBLIC_CASHER_API_BASE_URL is not configured. " +
      "Set it in .env.local or your deployment environment."
    );
  }
  try {
    const url = new URL(trimmed);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error(
        `[booking-api] Production requires HTTPS. Got: ${url.protocol}`
      );
    }
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error(
        `[booking-api] Invalid protocol: ${url.protocol}`
      );
    }
    return url.origin + url.pathname.replace(/\/+$/, "");
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("[booking-api]")) throw e;
    throw new Error(
      `[booking-api] Invalid NEXT_PUBLIC_CASHER_API_BASE_URL: "${trimmed}"`
    );
  }
}

export function getBookingApiBaseUrl(): string {
  if (_cachedBaseUrl !== null) return _cachedBaseUrl;
  const raw = process.env.NEXT_PUBLIC_CASHER_API_BASE_URL ?? "";
  _cachedBaseUrl = validateBaseUrl(raw);
  return _cachedBaseUrl;
}

/** Only for testing */
export function _resetBaseUrlCache(): void {
  _cachedBaseUrl = null;
}
