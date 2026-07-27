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

function linkExternalAbort(external: AbortSignal | undefined, abort: () => void): void {
  if (!external) return;
  if (external.aborted) {
    abort();
    return;
  }
  external.addEventListener("abort", abort, { once: true });
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
  const query = {
    branchCode: params.branchCode,
    serviceIds: params.serviceIds.join(","),
    mode: params.mode,
    ...(params.mode === "specific" && params.empId != null
      ? { empId: params.empId }
      : {}),
  };
  const key = buildRequestKey("/api/public/booking/available-days", query);
  const { promise, abort } = deduplicatedRequest(key, async (dedupSignal) => {
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
    return { ...res, data: days };
  });
  linkExternalAbort(signal, abort);
  return promise;
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
  const query = {
    branchCode: params.branchCode,
    date: params.date,
    serviceIds: params.serviceIds.join(","),
    mode: params.mode,
    ...(params.mode === "specific" && params.empId != null
      ? { empId: params.empId }
      : {}),
  };
  const key = buildRequestKey("/api/public/booking/available-slots", query);
  const { promise, abort } = deduplicatedRequest(key, async (dedupSignal) => {
    const res = await bookingApiRequest<AvailableSlotsResponse>({
      path: "/api/public/booking/available-slots",
      query,
      signal: dedupSignal,
      timeoutMs: 15_000,
    });
    const slots = (res.data.slots ?? []).map((s) => {
      const raw = s as AvailableSlot & { isAvailable?: boolean };
      return {
        ...raw,
        // Compat: listed slots without an explicit flag are bookable.
        available: (raw.available ?? raw.isAvailable ?? true) === true,
      } satisfies AvailableSlot;
    });
    return { ...res, data: slots };
  });
  linkExternalAbort(signal, abort);
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
