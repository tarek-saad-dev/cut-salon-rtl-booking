import { bookingApiRequest } from "./client";
import { resolveBarberPhotoUrl } from "./barber-photo";
import { TIMEOUT_MS } from "./timeout";
import { buildRequestKey, deduplicatedRequest } from "./request-dedup";
import {
  buildCrossBranchCacheKey,
  getCachedCrossBranch,
  getCachedGlobalBarbers,
  setCachedCrossBranch,
  setCachedGlobalBarbers,
} from "./session-cache";
import type {
  PublicBarber,
  PublicBarberBranch,
  BarberCalendarDay,
  BarberLocation,
  BookingApiResponse,
  CrossBranchAvailabilityResponse,
  CrossBranchSlot,
} from "./types";

export const CROSS_BRANCH_AVAILABILITY_MAX_DAYS = 14;
/** Initial window — keep short so barber-first slots feel snappy; UI can request more later. */
export const CROSS_BRANCH_AVAILABILITY_DEFAULT_DAYS = 4;

interface BarbersResponse {
  ok: boolean;
  barbers: Array<{
    id?: number;
    empId?: number;
    name?: string;
    nameAr?: string;
    nameEn?: string | null;
    job?: string | null;
    imageUrl?: string | null;
    photoUrl?: string | null;
    bio?: string | null;
    isBookableOnline?: boolean;
    serviceIds?: number[];
    branches?: PublicBarberBranch[];
  }>;
}

interface CalendarResponse {
  ok: boolean;
  days?: BarberCalendarDay[];
  calendar?: BarberCalendarDay[];
}

interface LocationApiResponse {
  ok: boolean;
  date: string;
  isWorking: boolean;
  status?: string | null;
  branch: BarberLocation["branch"];
}

function normalizeBarber(raw: BarbersResponse["barbers"][number]): PublicBarber {
  const id = Number(raw.id ?? raw.empId);
  // Keep CAMP_CAESAR here — public booking includes Camp when API returns it.
  // BranchContext no longer excludes Camp from the public picker.
  const branches = (raw.branches ?? [])
    .filter((b) => b?.branchCode)
    .map(
      (b): PublicBarberBranch => ({
        branchCode: b.branchCode,
        branchName: b.branchName,
      }),
    );
  const photo = resolveBarberPhotoUrl(raw);
  const nameAr = (raw.nameAr ?? raw.name ?? "").trim() || null;
  const nameEn = (raw.nameEn ?? "").trim() || null;
  return {
    id,
    name: nameAr || nameEn || "",
    nameAr,
    nameEn,
    job: raw.job ?? null,
    imageUrl: photo,
    photoUrl: photo,
    bio: raw.bio ?? null,
    isBookableOnline: raw.isBookableOnline !== false,
    serviceIds: Array.isArray(raw.serviceIds)
      ? raw.serviceIds.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : undefined,
    branches: branches.length ? branches : undefined,
  };
}

/** Cairo business calendar date as YYYY-MM-DD. */
export function cairoTodayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizeCrossBranchSlot(raw: Partial<CrossBranchSlot>): CrossBranchSlot | null {
  const branchCode = String(raw.branchCode ?? "").trim();
  const branchName = String(raw.branchName ?? "").trim() || branchCode;
  const date = String(raw.date ?? "").trim();
  const time = String(raw.time ?? "").trim();
  const dayOffset = raw.dayOffset === 1 ? 1 : 0;
  if (!branchCode || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !time) return null;
  return { branchCode, branchName, date, time, dayOffset };
}

/**
 * POST /api/public/booking/barbers/[empId]/cross-branch-availability
 * One request → all eligible public branches' slots (no invented availability).
 */
export async function getCrossBranchAvailability(
  empId: number,
  params: {
    serviceIds: number[];
    dateFrom?: string;
    days?: number;
  },
  signal?: AbortSignal,
): Promise<BookingApiResponse<CrossBranchAvailabilityResponse>> {
  const serviceIds = [...new Set(params.serviceIds)]
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 12);
  const days = Math.min(
    Math.max(1, params.days ?? CROSS_BRANCH_AVAILABILITY_DEFAULT_DAYS),
    CROSS_BRANCH_AVAILABILITY_MAX_DAYS,
  );
  const dateFrom = params.dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(params.dateFrom)
    ? params.dateFrom
    : cairoTodayYmd();

  const cacheKey = buildCrossBranchCacheKey(empId, serviceIds, dateFrom, days);
  const cached =
    getCachedCrossBranch<BookingApiResponse<CrossBranchAvailabilityResponse>>(cacheKey);
  if (cached) return cached;

  const res = await bookingApiRequest<CrossBranchAvailabilityResponse>({
    path: `/api/public/booking/barbers/${empId}/cross-branch-availability`,
    method: "POST",
    body: { serviceIds, dateFrom, days },
    signal,
    timeoutMs: TIMEOUT_MS.crossBranchAvailability,
  });

  const slots = (res.data.slots ?? [])
    .map((s) => normalizeCrossBranchSlot(s))
    .filter((s): s is CrossBranchSlot => s != null);

  const branches = (res.data.branches ?? [])
    .filter((b) => b?.branchCode)
    .map((b) => ({
      branchCode: b.branchCode,
      branchName: b.branchName || b.branchCode,
    }));

  const normalized: BookingApiResponse<CrossBranchAvailabilityResponse> = {
    ...res,
    data: {
      ok: res.data.ok !== false,
      barber: res.data.barber ?? { empId, nameAr: "" },
      branches,
      days: Array.isArray(res.data.days) ? res.data.days : [],
      slots,
      meta: res.data.meta,
    },
  };
  setCachedCrossBranch(cacheKey, normalized);
  return normalized;
}

export function crossBranchSlotKey(slot: CrossBranchSlot): string {
  return `${slot.date}|${slot.time}|${slot.dayOffset}|${slot.branchCode}`;
}

export async function listBranchBarbers(
  branchCode: string,
  signal?: AbortSignal,
): Promise<BookingApiResponse<PublicBarber[]>> {
  const res = await bookingApiRequest<BarbersResponse>({
    path: "/api/public/booking/barbers",
    query: { branchCode },
    signal,
    timeoutMs: 15_000,
  });
  return { ...res, data: (res.data.barbers ?? []).map(normalizeBarber) };
}

export async function listGlobalBarbers(
  signal?: AbortSignal,
): Promise<BookingApiResponse<PublicBarber[]>> {
  const cached = getCachedGlobalBarbers<BookingApiResponse<PublicBarber[]>>();
  if (cached) return cached;

  const key = buildRequestKey("/api/public/booking/barbers");
  const { promise } = deduplicatedRequest(key, async (dedupSignal) => {
    const linked = new AbortController();
    const onAbort = () => linked.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    dedupSignal.addEventListener("abort", onAbort, { once: true });
    try {
      const res = await bookingApiRequest<BarbersResponse>({
        path: "/api/public/booking/barbers",
        signal: linked.signal,
        timeoutMs: 15_000,
      });
      return { ...res, data: (res.data.barbers ?? []).map(normalizeBarber) };
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }
  });

  const result = await promise;
  setCachedGlobalBarbers(result);
  return result;
}

/**
 * Resolve a public barber profile (branches + serviceIds) for barber-first entry.
 * Prefers single-emp API; falls back to global list if profile route unavailable.
 */
export async function getPublicBarberProfile(
  empId: number,
  signal?: AbortSignal,
): Promise<BookingApiResponse<PublicBarber | null>> {
  try {
    const res = await bookingApiRequest<{
      ok: boolean;
      barber?: BarbersResponse["barbers"][number];
    }>({
      path: `/api/public/booking/barbers/${empId}`,
      signal,
      timeoutMs: 12_000,
    });
    if (res.data?.barber) {
      return { ...res, data: normalizeBarber(res.data.barber) };
    }
  } catch {
    /* fall through to roster */
  }
  const res = await listGlobalBarbers(signal);
  const found = (res.data ?? []).find((b) => b.id === empId) ?? null;
  return { ...res, data: found };
}

export async function getBarberCalendar(
  empId: number,
  params?: { branchCode?: string; from?: string; to?: string },
  signal?: AbortSignal,
): Promise<BookingApiResponse<BarberCalendarDay[]>> {
  const res = await bookingApiRequest<CalendarResponse>({
    path: `/api/public/booking/barbers/${empId}/calendar`,
    query: {
      branchCode: params?.branchCode,
      from: params?.from,
      to: params?.to,
    },
    signal,
    timeoutMs: 15_000,
  });
  return { ...res, data: res.data.days ?? res.data.calendar ?? [] };
}

export async function getBarberLocation(
  empId: number,
  params: { date: string; serviceIds?: number[] },
  signal?: AbortSignal,
): Promise<BookingApiResponse<BarberLocation>> {
  const res = await bookingApiRequest<LocationApiResponse>({
    path: `/api/public/booking/barbers/${empId}/location`,
    query: {
      date: params.date,
      serviceIds: params.serviceIds?.length
        ? params.serviceIds.join(",")
        : undefined,
    },
    signal,
    timeoutMs: 15_000,
  });
  return {
    ...res,
    data: {
      date: res.data.date,
      isWorking: res.data.isWorking,
      status: res.data.status,
      branch: res.data.branch ?? null,
    },
  };
}
