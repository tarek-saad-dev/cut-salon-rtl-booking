/**
 * Barber multi-branch availability — typed client for:
 * POST /api/public/booking/barbers/:empId/availability/days
 * POST /api/public/booking/barbers/:empId/availability/slots
 *
 * When the dedicated endpoints are not yet deployed, a temporary compat
 * path aggregates existing per-branch available-days/slots (documented
 * backend blocker). Do not invent availability — only merge public APIs.
 */

import { bookingApiRequest } from "./client";
import { BookingApiError } from "./errors";
import { buildRequestKey, deduplicatedRequest } from "./request-dedup";
import { TIMEOUT_MS } from "./timeout";
import { getAvailableDays, getAvailableSlots } from "./availability";
import { cairoTodayYmd } from "./barbers";
import { normalizeBranchCode } from "./branch-code";
import {
  getAggregateDaysCapability,
  getAggregateSlotsCapability,
  markAggregateDaysSupported,
  markAggregateDaysUnsupported,
  markAggregateSlotsSupported,
  markAggregateSlotsUnsupported,
  toWireAvailabilityScope,
} from "./aggregate-capability";
import { bookingPerfMark } from "./booking-perf";
import type {
  AvailableDay,
  AvailableSlot,
  BookingApiResponse,
  PublicBranch,
} from "./types";

export type BarberAvailabilityScope = "all_branches" | "specific_branch";

export interface BarberDayBranchSummary {
  branchCode: string;
  branchName?: string | null;
  branchNameAr?: string | null;
  branchNameEn?: string | null;
  slotsCount: number;
  earliestTime?: string | null;
  hasOvernightSlots?: boolean;
}

export interface BarberAvailableDay extends AvailableDay {
  branches?: BarberDayBranchSummary[];
}

export interface BarberAvailableSlot extends AvailableSlot {
  branchCode: string;
  branchName?: string | null;
  branchNameAr?: string | null;
  branchNameEn?: string | null;
  date: string;
  empId?: number | null;
  dayOffset?: number | null;
}

export interface BarberAvailabilityMeta {
  partial?: boolean;
  warnings?: string[];
  failedBranchCodes?: string[];
  /** True when response was built from legacy per-branch GETs. */
  compatFallback?: boolean;
}

export interface BarberAvailableDaysResult {
  days: BarberAvailableDay[];
  meta?: BarberAvailabilityMeta;
}

export interface BarberAvailableSlotsResult {
  slots: BarberAvailableSlot[];
  meta?: BarberAvailabilityMeta;
}

export interface GetBarberAvailableDaysParams {
  empId: number;
  serviceIds: number[];
  scope: BarberAvailabilityScope;
  branchCode?: string;
  dateFrom?: string;
  days?: number;
  /** Allowed public branches for this barber (compat + display). */
  allowedBranches?: PublicBranch[];
}

export interface GetBarberAvailableSlotsParams {
  empId: number;
  serviceIds: number[];
  scope: BarberAvailabilityScope;
  branchCode?: string;
  date: string;
  allowedBranches?: PublicBranch[];
}

const DAYS_CACHE_TTL_MS = 90_000;
const SLOTS_CACHE_TTL_MS = 60_000;
const daysCache = new Map<string, { at: number; value: BookingApiResponse<BarberAvailableDaysResult> }>();
const slotsCache = new Map<string, { at: number; value: BookingApiResponse<BarberAvailableSlotsResult> }>();

function cachingEnabled(): boolean {
  return process.env.NODE_ENV !== "test" && process.env.VITEST !== "true";
}

function normalizeServiceIdsKey(serviceIds: number[]): string {
  return [...new Set(serviceIds)]
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b)
    .join(",");
}

function buildDaysKey(params: GetBarberAvailableDaysParams): string {
  return buildRequestKey(`/api/public/booking/barbers/${params.empId}/availability/days`, {
    serviceIds: normalizeServiceIdsKey(params.serviceIds),
    scope: params.scope,
    branchCode: params.scope === "specific_branch" ? normalizeBranchCode(params.branchCode) ?? "" : "",
    dateFrom: params.dateFrom ?? cairoTodayYmd(),
    days: params.days ?? 30,
  });
}

function buildSlotsKey(params: GetBarberAvailableSlotsParams): string {
  return buildRequestKey(`/api/public/booking/barbers/${params.empId}/availability/slots`, {
    serviceIds: normalizeServiceIdsKey(params.serviceIds),
    scope: params.scope,
    branchCode: params.scope === "specific_branch" ? normalizeBranchCode(params.branchCode) ?? "" : "",
    date: params.date,
  });
}

function isHtmlBody(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html");
}

function normalizeDayBranch(raw: Partial<BarberDayBranchSummary>): BarberDayBranchSummary | null {
  const code = normalizeBranchCode(raw.branchCode);
  if (!code) return null;
  return {
    branchCode: code,
    branchName: raw.branchName ?? null,
    branchNameAr: raw.branchNameAr ?? null,
    branchNameEn: raw.branchNameEn ?? null,
    slotsCount: Number(raw.slotsCount) || 0,
    earliestTime: raw.earliestTime ?? null,
    hasOvernightSlots: Boolean(raw.hasOvernightSlots),
  };
}

function normalizeBarberDay(raw: Partial<BarberAvailableDay>): BarberAvailableDay | null {
  const date = String(raw.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const branches = Array.isArray(raw.branches)
    ? raw.branches.map(normalizeDayBranch).filter(Boolean) as BarberDayBranchSummary[]
    : undefined;
  const available =
    raw.available === true ||
    (branches != null && branches.some((b) => b.slotsCount > 0));
  return {
    date,
    available,
    reason: raw.reason ?? null,
    branches,
  };
}

function normalizeBarberSlot(
  raw: Partial<BarberAvailableSlot>,
  fallbackDate: string,
  empId: number,
): BarberAvailableSlot | null {
  const branchCode = normalizeBranchCode(raw.branchCode);
  const time = String(raw.time ?? "").trim();
  const date = String(raw.date ?? fallbackDate).trim();
  if (!branchCode || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const available = (raw.available ?? true) === true;
  if (!available) return null;
  return {
    time,
    label: raw.label ?? null,
    available: true,
    dayOffset: raw.dayOffset === 1 ? 1 : 0,
    empId: raw.empId ?? empId,
    barberName: raw.barberName ?? null,
    durationMinutes: raw.durationMinutes ?? null,
    reason: raw.reason ?? null,
    branchCode,
    branchName: raw.branchName ?? null,
    branchNameAr: raw.branchNameAr ?? null,
    branchNameEn: raw.branchNameEn ?? null,
    date,
  };
}

export function barberSlotKey(slot: {
  empId?: number | null;
  branchCode?: string | null;
  date?: string | null;
  time: string;
  dayOffset?: number | null;
}): string {
  return [
    slot.empId ?? "",
    normalizeBranchCode(slot.branchCode) ?? "",
    slot.date ?? "",
    slot.time,
    slot.dayOffset === 1 ? "1" : "0",
  ].join("|");
}

function compareSlotTime(a: BarberAvailableSlot, b: BarberAvailableSlot): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const ao = a.dayOffset === 1 ? 1 : 0;
  const bo = b.dayOffset === 1 ? 1 : 0;
  if (ao !== bo) return ao - bo;
  return a.time.localeCompare(b.time);
}

async function tryPrimaryDays(
  params: GetBarberAvailableDaysParams,
  signal?: AbortSignal,
): Promise<BookingApiResponse<BarberAvailableDaysResult> | null> {
  const capability = getAggregateDaysCapability();
  if (capability === "unsupported") return null;

  try {
    const res = await bookingApiRequest<{
      ok?: boolean;
      days?: Partial<BarberAvailableDay>[];
      partial?: boolean;
      warnings?: string[];
      failedBranchCodes?: string[];
      meta?: BarberAvailabilityMeta;
    }>({
      path: `/api/public/booking/barbers/${params.empId}/availability/days`,
      method: "POST",
      body: {
        serviceIds: params.serviceIds,
        scope: toWireAvailabilityScope(params.scope),
        ...(params.scope === "specific_branch"
          ? { branchCode: normalizeBranchCode(params.branchCode) }
          : {}),
        dateFrom: params.dateFrom ?? cairoTodayYmd(),
        days: params.days ?? 30,
      },
      signal,
      timeoutMs: TIMEOUT_MS.availableDays,
    });

    const days = (res.data.days ?? [])
      .map(normalizeBarberDay)
      .filter(Boolean) as BarberAvailableDay[];
    markAggregateDaysSupported();
    return {
      ...res,
      data: {
        days,
        meta: {
          partial: res.data.partial ?? res.data.meta?.partial,
          warnings: res.data.warnings ?? res.data.meta?.warnings,
          failedBranchCodes: res.data.failedBranchCodes ?? res.data.meta?.failedBranchCodes,
          compatFallback: false,
        },
      },
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    // Validation on a live route should surface; missing route / HTML → unsupported.
    if (err instanceof BookingApiError) {
      if (
        err.httpStatus === 400 ||
        err.httpStatus === 422 ||
        err.code === "INVALID_AVAILABILITY_SCOPE" ||
        err.code === "BRANCH_REQUIRED"
      ) {
        // Endpoint exists; do not mark unsupported — let caller decide.
        throw err;
      }
      if (err.httpStatus === 404 || err.code === "INTERNAL_ERROR" || err.httpStatus === 405) {
        markAggregateDaysUnsupported();
        return null;
      }
    }
    markAggregateDaysUnsupported();
    return null;
  }
}

async function tryPrimarySlots(
  params: GetBarberAvailableSlotsParams,
  signal?: AbortSignal,
): Promise<BookingApiResponse<BarberAvailableSlotsResult> | null> {
  const capability = getAggregateSlotsCapability();
  if (capability === "unsupported") return null;

  try {
    const res = await bookingApiRequest<{
      ok?: boolean;
      slots?: Partial<BarberAvailableSlot>[];
      partial?: boolean;
      warnings?: string[];
      failedBranchCodes?: string[];
      meta?: BarberAvailabilityMeta;
    }>({
      path: `/api/public/booking/barbers/${params.empId}/availability/slots`,
      method: "POST",
      body: {
        serviceIds: params.serviceIds,
        scope: toWireAvailabilityScope(params.scope),
        date: params.date,
        ...(params.scope === "specific_branch"
          ? { branchCode: normalizeBranchCode(params.branchCode) }
          : {}),
      },
      signal,
      timeoutMs: 15_000,
    });
    const slots = (res.data.slots ?? [])
      .map((s) => normalizeBarberSlot(s, params.date, params.empId))
      .filter(Boolean) as BarberAvailableSlot[];
    slots.sort(compareSlotTime);
    markAggregateSlotsSupported();
    return {
      ...res,
      data: {
        slots,
        meta: {
          partial: res.data.partial ?? res.data.meta?.partial,
          warnings: res.data.warnings ?? res.data.meta?.warnings,
          failedBranchCodes: res.data.failedBranchCodes ?? res.data.meta?.failedBranchCodes,
          compatFallback: false,
        },
      },
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (err instanceof BookingApiError) {
      if (
        err.httpStatus === 400 ||
        err.httpStatus === 422 ||
        err.code === "INVALID_AVAILABILITY_SCOPE" ||
        err.code === "BRANCH_REQUIRED"
      ) {
        throw err;
      }
      if (err.httpStatus === 404 || err.code === "INTERNAL_ERROR" || err.httpStatus === 405) {
        markAggregateSlotsUnsupported();
        return null;
      }
    }
    markAggregateSlotsUnsupported();
    return null;
  }
}

/**
 * Temporary: merge existing branch-scoped public APIs until backend ships
 * dedicated barber availability endpoints. Not a scheduling algorithm —
 * only aggregates public per-branch days/slots for this empId.
 */
async function compatDays(
  params: GetBarberAvailableDaysParams,
): Promise<BookingApiResponse<BarberAvailableDaysResult>> {
  const branches =
    params.scope === "specific_branch"
      ? (params.allowedBranches ?? []).filter(
          (b) => normalizeBranchCode(b.branchCode) === normalizeBranchCode(params.branchCode),
        )
      : params.allowedBranches ?? [];

  if (branches.length === 0) {
    throw new BookingApiError({
      message: "barberAvailabilityBranchesMissing",
      code: "INVALID_BRANCH",
      httpStatus: 400,
    });
  }

  const failedBranchCodes: string[] = [];
  const byDate = new Map<string, BarberAvailableDay>();

  await Promise.all(
    branches.map(async (branch) => {
      try {
        const res = await getAvailableDays({
          branchCode: branch.branchCode,
          serviceIds: params.serviceIds,
          mode: "specific",
          empId: params.empId,
        });
        for (const day of res.data ?? []) {
          if (!day.available) continue;
          const existing = byDate.get(day.date);
          const summary: BarberDayBranchSummary = {
            branchCode: normalizeBranchCode(branch.branchCode)!,
            branchName: branch.branchName,
            slotsCount: 1,
            earliestTime: null,
            hasOvernightSlots: false,
          };
          if (!existing) {
            byDate.set(day.date, {
              date: day.date,
              available: true,
              branches: [summary],
            });
          } else {
            const list = existing.branches ?? [];
            if (!list.some((b) => b.branchCode === summary.branchCode)) {
              list.push(summary);
            }
            existing.branches = list;
            existing.available = true;
          }
        }
      } catch {
        failedBranchCodes.push(branch.branchCode);
      }
    }),
  );

  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return {
    data: {
      days,
      meta: {
        partial: failedBranchCodes.length > 0,
        failedBranchCodes,
        warnings: failedBranchCodes.length
          ? ["partialBarberAvailability"]
          : undefined,
        compatFallback: true,
      },
    },
    metadata: {
      contractVersion: null,
      contractUnverified: true,
      requestId: null,
      rateLimit: { limit: null, remaining: null, resetAt: null, retryAfterSeconds: null },
      deprecated: false,
      warning: null,
    },
    httpStatus: 200,
  };
}

async function compatSlots(
  params: GetBarberAvailableSlotsParams,
): Promise<BookingApiResponse<BarberAvailableSlotsResult>> {
  const branches =
    params.scope === "specific_branch"
      ? (params.allowedBranches ?? []).filter(
          (b) => normalizeBranchCode(b.branchCode) === normalizeBranchCode(params.branchCode),
        )
      : params.allowedBranches ?? [];

  if (branches.length === 0) {
    throw new BookingApiError({
      message: "barberAvailabilityBranchesMissing",
      code: "INVALID_BRANCH",
      httpStatus: 400,
    });
  }

  const failedBranchCodes: string[] = [];
  const slots: BarberAvailableSlot[] = [];

  await Promise.all(
    branches.map(async (branch) => {
      try {
        const res = await getAvailableSlots({
          branchCode: branch.branchCode,
          date: params.date,
          serviceIds: params.serviceIds,
          mode: "specific",
          empId: params.empId,
        });
        for (const s of res.data ?? []) {
          if (!s.available) continue;
          slots.push({
            ...s,
            available: true,
            branchCode: normalizeBranchCode(branch.branchCode)!,
            branchName: branch.branchName,
            date: params.date,
            empId: s.empId ?? params.empId,
            dayOffset: s.dayOffset === 1 ? 1 : 0,
          });
        }
      } catch {
        failedBranchCodes.push(branch.branchCode);
      }
    }),
  );

  slots.sort(compareSlotTime);
  return {
    data: {
      slots,
      meta: {
        partial: failedBranchCodes.length > 0,
        failedBranchCodes,
        warnings: failedBranchCodes.length
          ? ["partialBarberAvailability"]
          : undefined,
        compatFallback: true,
      },
    },
    metadata: {
      contractVersion: null,
      contractUnverified: true,
      requestId: null,
      rateLimit: { limit: null, remaining: null, resetAt: null, retryAfterSeconds: null },
      deprecated: false,
      warning: null,
    },
    httpStatus: 200,
  };
}

export function peekCachedBarberAvailableDays(
  params: GetBarberAvailableDaysParams,
): BarberAvailableDaysResult | null {
  if (!cachingEnabled()) return null;
  const hit = daysCache.get(buildDaysKey(params));
  if (!hit || Date.now() - hit.at >= DAYS_CACHE_TTL_MS) return null;
  return hit.value.data;
}

export function peekCachedBarberAvailableSlots(
  params: GetBarberAvailableSlotsParams,
): BarberAvailableSlotsResult | null {
  if (!cachingEnabled()) return null;
  const hit = slotsCache.get(buildSlotsKey(params));
  if (!hit || Date.now() - hit.at >= SLOTS_CACHE_TTL_MS) return null;
  return hit.value.data;
}

export async function getBarberAvailableDays(
  params: GetBarberAvailableDaysParams,
  signal?: AbortSignal,
): Promise<BookingApiResponse<BarberAvailableDaysResult>> {
  if (params.scope === "specific_branch" && !normalizeBranchCode(params.branchCode)) {
    throw new BookingApiError({
      message: "barberAvailabilityBranchRequired",
      code: "BRANCH_REQUIRED",
      httpStatus: 400,
    });
  }
  const key = buildDaysKey(params);
  if (cachingEnabled()) {
    const hit = daysCache.get(key);
    if (hit && Date.now() - hit.at < DAYS_CACHE_TTL_MS) return hit.value;
  }
  const { promise } = deduplicatedRequest(key, async (dedupSignal) => {
    const linked = new AbortController();
    const onAbort = () => linked.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    dedupSignal.addEventListener("abort", onAbort, { once: true });
    try {
      // Never run primary + compat in parallel.
      if (getAggregateDaysCapability() === "unsupported") {
        const value = await compatDays(params);
        bookingPerfMark("catalog_request_complete", {
          empId: params.empId,
          compatAvailabilityFallback: true,
          source: "days",
        });
        if (cachingEnabled()) daysCache.set(key, { at: Date.now(), value });
        return value;
      }
      const primary = await tryPrimaryDays(params, linked.signal);
      const value = primary ?? (await compatDays(params));
      if (value.data.meta?.compatFallback) {
        bookingPerfMark("catalog_request_complete", {
          empId: params.empId,
          compatAvailabilityFallback: true,
          source: "days",
        });
      }
      if (cachingEnabled()) daysCache.set(key, { at: Date.now(), value });
      return value;
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }
  });
  return promise;
}

export async function getBarberAvailableSlots(
  params: GetBarberAvailableSlotsParams,
  signal?: AbortSignal,
): Promise<BookingApiResponse<BarberAvailableSlotsResult>> {
  if (params.scope === "specific_branch" && !normalizeBranchCode(params.branchCode)) {
    throw new BookingApiError({
      message: "barberAvailabilityBranchRequired",
      code: "BRANCH_REQUIRED",
      httpStatus: 400,
    });
  }
  const key = buildSlotsKey(params);
  if (cachingEnabled()) {
    const hit = slotsCache.get(key);
    if (hit && Date.now() - hit.at < SLOTS_CACHE_TTL_MS) return hit.value;
  }
  const { promise } = deduplicatedRequest(key, async (dedupSignal) => {
    const linked = new AbortController();
    const onAbort = () => linked.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    dedupSignal.addEventListener("abort", onAbort, { once: true });
    try {
      if (getAggregateSlotsCapability() === "unsupported") {
        const value = await compatSlots(params);
        bookingPerfMark("catalog_request_complete", {
          empId: params.empId,
          compatAvailabilityFallback: true,
          source: "slots",
        });
        if (cachingEnabled()) slotsCache.set(key, { at: Date.now(), value });
        return value;
      }
      const primary = await tryPrimarySlots(params, linked.signal);
      const value = primary ?? (await compatSlots(params));
      if (value.data.meta?.compatFallback) {
        bookingPerfMark("catalog_request_complete", {
          empId: params.empId,
          compatAvailabilityFallback: true,
          source: "slots",
        });
      }
      if (cachingEnabled()) slotsCache.set(key, { at: Date.now(), value });
      return value;
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }
  });
  return promise;
}

/** @internal test helper */
export function __clearBarberAvailabilityCachesForTests(): void {
  daysCache.clear();
  slotsCache.clear();
}

// silence unused helper
void isHtmlBody;
