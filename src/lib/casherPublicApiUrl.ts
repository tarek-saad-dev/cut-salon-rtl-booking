/** Public Casher routes use the configured ERP host (also used by PR #12). */
import { getBookingApiBaseUrl } from "@/lib/booking-api/env";

export function getCasherPublicApiBaseUrl(): string {
  return getBookingApiBaseUrl();
}

export function buildCasherPublicApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getCasherPublicApiBaseUrl()}${cleanPath}`;
}
