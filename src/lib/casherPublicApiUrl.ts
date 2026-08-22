/**
 * Browser-facing URLs for Casher-backed public API routes.
 *
 * Production (cutsaloon.com): relative paths — nginx proxies /api/* to Casher.
 * Development: prefix NEXT_PUBLIC_BOOKING_API_BASE_URL when set (local Hawai / Casher).
 */
export function getCasherPublicApiBaseUrl(): string {
  if (process.env.NODE_ENV === "production") {
    return "";
  }

  return (
    process.env.NEXT_PUBLIC_BOOKING_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_CASHER_API_BASE_URL ||
    ""
  ).replace(/\/$/, "");
}

export function buildCasherPublicApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = getCasherPublicApiBaseUrl();
  return base ? `${base}${cleanPath}` : cleanPath;
}
