import { bookingApiRequest } from "./client";
import { buildRequestKey, deduplicatedRequest } from "./request-dedup";
import { TIMEOUT_MS } from "./timeout";
import type {
  AvailableDay,
  AvailableSlot,
  CheckSlotRequest,
  CheckSlotResponse,
  BookingApiResponse,
} from "./types";

/** Short TTL so back-navigation feels instant without serving very stale calendars. */
const DAYS_CACHE_TTL_MS = 90_000;
const SLOTS_CACHE_TTL_MS = 60_000;
const daysResultCache = new Map<string, { at: number; value: BookingApiResponse<AvailableDay[]> }>();
const slotsResultCache = new Map<string, { at: number; value: BookingApiResponse<AvailableSlot[]> }>();

function cachingEnabled(): boolean {
  return process.env.NODE_ENV !== "test" && process.env.VITEST !== "true";
}

interface AvailableDaysResponse {
  ok: boolean;
  days: AvailableDay[];
}

interface AvailableSlotsResponse {
  ok: boolean;
  date: string;
  mode: string;
  empId?: number | null;
  slots: AvailableSlot[];
}

function normalizeServiceIdsKey(serviceIds: number[]): string {
  return [...new Set(serviceIds)]
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b)
    .join(",");
}

function buildAvailableDaysKey(params: {
  branchCode: string;
  serviceIds: number[];
  mode: "specific" | "nearest";
  empId?: number;
}): { query: Record<string, string | number>; key: string } {
  const query = {
    branchCode: params.branchCode,
    serviceIds: normalizeServiceIdsKey(params.serviceIds),
    mode: params.mode,
    ...(params.mode === "specific" && params.empId != null
      ? { empId: params.empId }
      : {}),
  };
  return { query, key: buildRequestKey("/api/public/booking/available-days", query) };
}

/** Sync cache read — used to paint the calendar without a loading flash. */
export function peekCachedAvailableDays(params: {
  branchCode: string;
  serviceIds: number[];
  mode: "specific" | "nearest";
  empId?: number;
}): AvailableDay[] | null {
  if (!cachingEnabled()) return null;
  const { key } = buildAvailableDaysKey(params);
  const hit = daysResultCache.get(key);
  if (!hit || Date.now() - hit.at >= DAYS_CACHE_TTL_MS) return null;
  return hit.value.data ?? [];
}

export async function getAvailableDays(
  params: {
    branchCode: string;
    serviceIds: number[];
    mode: "specific" | "nearest";
    empId?: number;
  },
  signal?: AbortSignal,
): Promise<BookingApiResponse<AvailableDay[]>> {
  void signal; // shared GET — caller abort must not cancel other waiters / prefetch
  const { query, key } = buildAvailableDaysKey(params);
  if (cachingEnabled()) {
    const hit = daysResultCache.get(key);
    if (hit && Date.now() - hit.at < DAYS_CACHE_TTL_MS) {
      return hit.value;
    }
  }
  const { promise } = deduplicatedRequest(key, async (dedupSignal) => {
    const res = await bookingApiRequest<AvailableDaysResponse>({
      path: "/api/public/booking/available-days",
      query,
      signal: dedupSignal,
      timeoutMs: TIMEOUT_MS.availableDays,
    });
    // Compat: backend may emit `isAvailable` instead of `available`.
    const days = (res.data.days ?? []).map((d) => {
      const raw = d as AvailableDay & { isAvailable?: boolean; status?: string };
      return {
        date: raw.date,
        available: raw.available ?? raw.isAvailable === true,
        reason: raw.reason ?? raw.status ?? null,
      } satisfies AvailableDay;
    });
    const normalized = { ...res, data: days };
    if (cachingEnabled()) {
      daysResultCache.set(key, { at: Date.now(), value: normalized });
    }
    return normalized;
  });
  return promise;
}

function buildAvailableSlotsKey(params: {
  branchCode: string;
  date: string;
  serviceIds: number[];
  mode: "specific" | "nearest";
  empId?: number;
}): { query: Record<string, string | number>; key: string } {
  const query = {
    branchCode: params.branchCode,
    date: params.date,
    serviceIds: normalizeServiceIdsKey(params.serviceIds),
    mode: params.mode,
    ...(params.mode === "specific" && params.empId != null
      ? { empId: params.empId }
      : {}),
  };
  return { query, key: buildRequestKey("/api/public/booking/available-slots", query) };
}

/** Sync cache read for slots — paint time step without a loading flash. */
export function peekCachedAvailableSlots(params: {
  branchCode: string;
  date: string;
  serviceIds: number[];
  mode: "specific" | "nearest";
  empId?: number;
}): AvailableSlot[] | null {
  if (!cachingEnabled()) return null;
  const { key } = buildAvailableSlotsKey(params);
  const hit = slotsResultCache.get(key);
  if (!hit || Date.now() - hit.at >= SLOTS_CACHE_TTL_MS) return null;
  return hit.value.data ?? [];
}

/** Prefetch slots into TTL cache (e.g. on day hover / select while still on calendar). */
export function prefetchAvailableSlots(
  params: {
    branchCode: string;
    date: string;
    serviceIds: number[];
    mode: "specific" | "nearest";
    empId?: number;
  },
  signal?: AbortSignal,
): void {
  void getAvailableSlots(params, signal).catch(() => undefined);
}

export async function getAvailableSlots(
  params: {
    branchCode: string;
    date: string;
    serviceIds: number[];
    mode: "specific" | "nearest";
    empId?: number;
  },
  signal?: AbortSignal,
): Promise<BookingApiResponse<AvailableSlot[]>> {
  void signal; // shared GET — caller abort must not cancel other waiters / prefetch
  const { query, key } = buildAvailableSlotsKey(params);
  if (cachingEnabled()) {
    const hit = slotsResultCache.get(key);
    if (hit && Date.now() - hit.at < SLOTS_CACHE_TTL_MS) {
      return hit.value;
    }
  }
  const { promise } = deduplicatedRequest(key, async (dedupSignal) => {
    const res = await bookingApiRequest<AvailableSlotsResponse>({
      path: "/api/public/booking/available-slots",
      query,
      signal: dedupSignal,
      timeoutMs: 15_000,
    });
    const slots = (res.data.slots ?? []).map((s) => {
      const raw = s as AvailableSlot & {
        isAvailable?: boolean;
        barbers?: Array<{ empId?: number; nameAr?: string; name?: string }>;
      };
      const firstBarber = Array.isArray(raw.barbers) ? raw.barbers[0] : undefined;
      return {
        ...raw,
        available: (raw.available ?? raw.isAvailable ?? true) === true,
        empId: raw.empId ?? firstBarber?.empId ?? null,
        barberName:
          raw.barberName ?? firstBarber?.nameAr ?? firstBarber?.name ?? null,
      } satisfies AvailableSlot;
    });
    const normalized = { ...res, data: slots };
    if (cachingEnabled()) {
      slotsResultCache.set(key, { at: Date.now(), value: normalized });
    }
    return normalized;
  });
  return promise;
}

export async function checkSlot(
  body: CheckSlotRequest,
  signal?: AbortSignal,
): Promise<BookingApiResponse<CheckSlotResponse>> {
  const res = await bookingApiRequest<{ ok: boolean; available: boolean; reason?: string | null }>({
    path: "/api/public/booking/check-slot",
    method: "POST",
    body,
    signal,
    timeoutMs: 10_000,
  });
  return {
    ...res,
    data: {
      available: res.data.available,
      reason: res.data.reason,
    },
  };
}
