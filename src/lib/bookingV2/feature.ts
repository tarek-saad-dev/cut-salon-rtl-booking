/**
 * Booking V2 client feature gate + booking-base safety for local vs production.
 *
 * Local: allow localhost Hawai (:5500).
 * Production: require HTTPS production booking API; never ship localhost.
 */

function isLocalhostHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".localhost");
}

/** True when Booking V2 client path is enabled. */
export function isBookingV2ClientEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_BOOKING_V2_CLIENT;
  if (flag === "false") return false;
  if (flag === "true") return true;
  // Dev convenience: auto-enable when pointed at local Hawai.
  const bookingBase =
    process.env.NEXT_PUBLIC_BOOKING_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";
  return /localhost:5500/i.test(bookingBase);
}

/**
 * Environment-correct booking API base validation.
 * Replaces the former local-only “refuse casher-five” guard.
 */
export function assertBookingApiBaseForRuntime(base: string, ctx: string): void {
  const trimmed = String(base || "").trim();
  if (!trimmed) {
    throw new Error(
      `[${ctx}] Booking API base URL is empty. Set NEXT_PUBLIC_BOOKING_API_BASE_URL.`,
    );
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`[${ctx}] Invalid booking API base URL: "${trimmed}"`);
  }

  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (url.protocol !== "https:") {
      throw new Error(
        `[${ctx}] Production requires HTTPS booking API. Got: ${url.protocol}//${url.host}`,
      );
    }
    if (isLocalhostHostname(url.hostname)) {
      throw new Error(
        `[${ctx}] Production must not use localhost booking API (${url.origin}). ` +
          `Set NEXT_PUBLIC_BOOKING_API_BASE_URL to the production booking API.`,
      );
    }
    return;
  }

  // Development / test: allow http://localhost and https production hosts.
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`[${ctx}] Invalid protocol for booking API: ${url.protocol}`);
  }
}

/** @deprecated Prefer assertBookingApiBaseForRuntime — kept as alias for call-site clarity during cutover. */
export function assertNoProductionBookingBase(base: string, ctx: string): void {
  assertBookingApiBaseForRuntime(base, ctx);
}
