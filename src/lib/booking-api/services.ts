import { bookingApiRequest } from "./client";
import { buildRequestKey, deduplicatedRequest } from "./request-dedup";
import type {
  BookingConfig,
  BookingService,
  BookingApiResponse,
} from "./types";

interface ConfigResponse {
  ok: boolean;
  salon: BookingConfig["salon"];
  settings: BookingConfig["settings"];
}

interface StatusResponse {
  ok: boolean;
  bookingEnabled: boolean;
  message?: string;
}

interface ServicesResponse {
  ok: boolean;
  services: Array<
    BookingService & {
      serviceId?: number;
      nameAr?: string;
      nameEn?: string;
      bookable?: boolean;
    }
  >;
}

export async function getBookingConfig(
  branchCode: string,
  signal?: AbortSignal,
): Promise<BookingApiResponse<BookingConfig>> {
  const key = buildRequestKey("/api/public/booking/config", { branchCode });
  const { promise } = deduplicatedRequest(key, async (dedupSignal) => {
    // Shared GET: do not wire caller AbortSignal into the shared request —
    // one remount abort must not cancel other waiters (React Strict Mode).
    void signal;
    const res = await bookingApiRequest<ConfigResponse>({
      path: "/api/public/booking/config",
      query: { branchCode },
      signal: dedupSignal,
      timeoutMs: 15_000,
    });
    return {
      ...res,
      data: { salon: res.data.salon, settings: res.data.settings },
    };
  });
  return promise;
}

export async function getBookingStatus(
  branchCode: string,
  signal?: AbortSignal,
): Promise<BookingApiResponse<{ bookingEnabled: boolean; message?: string }>> {
  const res = await bookingApiRequest<StatusResponse>({
    path: "/api/public/booking/status",
    query: { branchCode },
    signal,
    timeoutMs: 15_000,
  });
  return {
    ...res,
    data: { bookingEnabled: res.data.bookingEnabled, message: res.data.message },
  };
}

export async function getServices(
  branchCode: string,
  signal?: AbortSignal,
): Promise<BookingApiResponse<BookingService[]>> {
  const key = buildRequestKey("/api/public/booking/services", { branchCode });
  const { promise } = deduplicatedRequest(key, async (dedupSignal) => {
    void signal;
    const res = await bookingApiRequest<ServicesResponse>({
      path: "/api/public/booking/services",
      query: { branchCode },
      signal: dedupSignal,
      timeoutMs: 15_000,
    });
    const services = (res.data.services ?? []).map((raw) => {
      const id = Number(raw.id ?? raw.serviceId);
      const nameAr = (raw.nameAr ?? "").trim() || null;
      const nameEn = (raw.nameEn ?? "").trim() || null;
      const fallback = (raw.name ?? "").trim() || null;
      // English-leaning key for bookingServiceGroups matching.
      const name = nameEn || fallback || nameAr || "";
      return {
        id,
        name,
        nameAr,
        nameEn,
        price: Number(raw.price) || 0,
        durationMinutes: Number(raw.durationMinutes) || 0,
        categoryName: raw.categoryName ?? null,
        // Compat: backend may emit `bookable` instead of `isBookableOnline`.
        isBookableOnline: raw.isBookableOnline ?? raw.bookable !== false,
      } satisfies BookingService;
    });
    return { ...res, data: services };
  });
  return promise;
}
