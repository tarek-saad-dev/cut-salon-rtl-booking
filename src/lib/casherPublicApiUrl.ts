/** Public Casher API URLs must resolve to the configured ERP host.
 * Do not assume the customer website proxies /api/* to Cashier:
 * cutsaloon.com may be hosted separately without that nginx rule.
 */
import { getBookingApiBaseUrl } from "@/lib/booking-api/env";

export function getCasherPublicApiBaseUrl(): string {
  return getBookingApiBaseUrl();
}

export function buildCasherPublicApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getCasherPublicApiBaseUrl()}${cleanPath}`;
}
