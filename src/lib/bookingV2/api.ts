import { cachePeekEtag, swrFetch, cacheGet } from "./cache";
import { trackBookingRequest } from "./metrics";
import { addBusinessDays, todayBusinessDate } from "./businessDate";
import { assertBookingApiBaseForRuntime } from "./feature";
import { monotonicNowMs, pickEpochMs } from "./serverTime";
import type {
  AvailabilityMatrix,
  AvailabilityRequest,
  BookingV2Barber,
  BookingV2Bootstrap,
  BookingV2Branch,
  BookingV2Service,
  BookingV2Settings,
  FreeRange,
  MatrixBranchDay,
  MatrixDay,
  MatrixEmployeeDay,
} from "./types";

const BOOKING_API_BASE_URL =
  process.env.NEXT_PUBLIC_BOOKING_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_CASHER_API_BASE_URL ||
  "";

const BOOTSTRAP_KEY = "booking-v2:bootstrap";

function buildUrl(path: string): string {
  const base = BOOKING_API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/** Fail loudly if booking base is invalid for this runtime (e.g. localhost in production). */
function assertBookingApiBase(): void {
  assertBookingApiBaseForRuntime(BOOKING_API_BASE_URL, "booking-v2");
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function pickString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickNumber(...values: unknown[]): number | null {
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  }
  return null;
}

function normalizeFreeRange(raw: unknown): FreeRange | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const startMin = pickNumber(o.startMin, o.start);
  const endMin = pickNumber(o.endMin, o.end);
  if (startMin == null || endMin == null || endMin <= startMin) return null;
  return { startMin, endMin };
}

function normalizeService(raw: unknown): BookingV2Service | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = pickNumber(o.id, o.serviceId);
  if (id == null) return null;
  const bookable = o.isBookableOnline !== false && o.bookable !== false;
  return {
    id,
    name: pickString(o.name, o.nameAr, o.nameEn) ?? `Service ${id}`,
    nameAr: pickString(o.nameAr),
    nameEn: pickString(o.nameEn),
    price: pickNumber(o.price) ?? 0,
    durationMinutes: pickNumber(o.durationMinutes, o.duration) ?? 0,
    categoryName: pickString(o.categoryName, o.categoryNameAr, o.category),
    isBookableOnline: bookable,
    imageUrl: pickString(o.imageUrl, o.photoUrl),
  };
}

function normalizeBootstrapPayload(raw: unknown, etag: string | null): BookingV2Bootstrap {
  const root = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const branchesRaw = asArray(root.branches);
  const branches: BookingV2Branch[] = branchesRaw
    .map((b) => {
      if (!b || typeof b !== "object") return null;
      const o = b as Record<string, unknown>;
      const branchCode = pickString(o.branchCode, o.code);
      if (!branchCode) return null;
      return {
        branchCode,
        branchName: pickString(o.branchName, o.name) ?? branchCode,
        shortName: pickString(o.shortName),
        timeZone: pickString(o.timeZone, o.timezone),
        address: pickString(o.address),
        phone: pickString(o.phone),
      } satisfies BookingV2Branch;
    })
    .filter(Boolean) as BookingV2Branch[];

  const branchNameByCode = new Map(branches.map((b) => [String(b.branchCode).toUpperCase(), b.branchName]));

  // Hawai: employees[] + branchCodes[]
  const employees = asArray(
    Array.isArray(root.employees) && root.employees.length > 0
      ? root.employees
      : root.barbers,
  );
  const barbers: BookingV2Barber[] = employees
    .map((e) => {
      if (!e || typeof e !== "object") return null;
      const o = e as Record<string, unknown>;
      const empId = pickNumber(o.employeeId, o.empId, o.id);
      if (empId == null) return null;
      const codes = asArray(o.branchCodes).map(String);
      const nestedBranches = asArray(o.branches)
        .map((b) => {
          if (!b || typeof b !== "object") return null;
          const bo = b as Record<string, unknown>;
          const code = pickString(bo.branchCode, bo.code);
          if (!code) return null;
          return {
            branchCode: code,
            branchName: pickString(bo.branchName, bo.name) ?? branchNameByCode.get(code.toUpperCase()) ?? code,
          };
        })
        .filter(Boolean) as BookingV2Barber["branches"];

      const branchesForEmp =
        nestedBranches.length > 0
          ? nestedBranches
          : codes.map((code) => ({
              branchCode: code,
              branchName: branchNameByCode.get(code.toUpperCase()) ?? code,
            }));

      return {
        empId,
        id: empId,
        name: pickString(o.name, o.nameAr, o.nameEn) ?? `Barber ${empId}`,
        nameAr: pickString(o.nameAr),
        nameEn: pickString(o.nameEn),
        job: pickString(o.job, o.role),
        photoUrl: pickString(o.photoUrl, o.imageUrl),
        bio: pickString(o.bio, o.shortBio),
        isBookableOnline: o.isBookableOnline !== false,
        serviceIds: asArray(o.serviceIds).map(Number).filter(Number.isFinite),
        branches: branchesForEmp,
      } satisfies BookingV2Barber;
    })
    .filter(Boolean) as BookingV2Barber[];

  // Hawai: servicesByBranch
  const servicesMap = new Map<number, BookingV2Service>();
  const byBranch = root.servicesByBranch;
  if (byBranch && typeof byBranch === "object") {
    for (const list of Object.values(byBranch as Record<string, unknown>)) {
      for (const s of asArray(list).map(normalizeService).filter(Boolean) as BookingV2Service[]) {
        servicesMap.set(s.id, s);
      }
    }
  }
  for (const s of asArray(root.services).map(normalizeService).filter(Boolean) as BookingV2Service[]) {
    servicesMap.set(s.id, s);
  }

  const settingsByBranch = (root.settingsByBranch ?? {}) as Record<string, Record<string, unknown>>;
  const primarySettings =
    settingsByBranch.GLEEM ??
    settingsByBranch[Object.keys(settingsByBranch)[0] ?? ""] ??
    (root.settings as Record<string, unknown> | undefined) ??
    {};

  const settings: BookingV2Settings = {
    allowSpecificBarber: primarySettings.allowSpecificBarber !== false,
    allowNearestBarber: primarySettings.allowNearestBarber !== false,
    defaultMode: primarySettings.defaultMode === "specific" ? "specific" : "nearest",
    slotIntervalMinutes: pickNumber(primarySettings.slotIntervalMinutes) ?? 15,
    maxBookingDaysAhead: pickNumber(primarySettings.maxBookingDaysAhead) ?? 14,
    minNoticeMinutes: pickNumber(primarySettings.minNoticeMinutes) ?? 15,
    matrixDays: 14,
  };

  return {
    ok: root.ok !== false,
    contract: pickString(root.contract) ?? undefined,
    salon: {
      name: "Cut Salon",
      logoUrl: null,
      timezone: pickString(root.timezone, primarySettings.timezone) ?? "Africa/Cairo",
      currency: pickString(primarySettings.currency) ?? "EGP",
      bookingEnabled: primarySettings.bookingEnabled !== false,
    },
    settings,
    branches,
    services: [...servicesMap.values()].filter((s) => s.isBookableOnline),
    barbers: barbers.filter((b) => b.isBookableOnline),
    etag,
    revision: pickString(root.revision),
    fetchedAt: Date.now(),
  };
}

/**
 * Hawai returns flat days: Emp × Branch × BusinessDate.
 * Fold into MatrixDay[] keyed by businessDate for local UI.
 */
function normalizeAvailabilityPayload(
  raw: unknown,
  request: AvailabilityRequest,
  etag: string | null,
): AvailabilityMatrix {
  const root = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const flatDays = asArray(root.days ?? root.matrix);

  const byDate = new Map<string, MatrixDay>();

  for (const row of flatDays) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const businessDate = pickString(o.businessDate, o.date);
    const branchCode = pickString(o.branchCode, o.code) ?? "GLEEM";
    const empId = pickNumber(o.employeeId, o.empId, o.id);
    if (!businessDate || empId == null) continue;

    const freeRanges = asArray(o.freeRanges).map(normalizeFreeRange).filter(Boolean) as FreeRange[];
    const isAvailable = o.isAvailable === true || freeRanges.length > 0;

    let day = byDate.get(businessDate);
    if (!day) {
      day = { businessDate, branches: [] };
      byDate.set(businessDate, day);
    }

    let branch = day.branches.find(
      (b) => String(b.branchCode).toUpperCase() === branchCode.toUpperCase(),
    );
    if (!branch) {
      branch = { branchCode, branchName: pickString(o.branchName), employees: [] };
      day.branches.push(branch);
    }

    const emp: MatrixEmployeeDay = {
      empId,
      empName: pickString(o.empName, o.name, o.nameAr),
      status: isAvailable ? "available" : "fully_booked",
      free: freeRanges.map((r) => ({
        start: `${String(Math.floor(r.startMin / 60) % 24).padStart(2, "0")}:${String(r.startMin % 60).padStart(2, "0")}`,
        end: `${String(Math.floor(((r.endMin - 1) % 1440) / 60)).padStart(2, "0")}:${String((r.endMin - 1) % 60).padStart(2, "0")}`,
        endDayOffset: r.endMin > 1440 ? 1 : 0,
        startMin: r.startMin,
        endMin: r.endMin,
      })),
      freeRanges,
      branchCode,
    };
    branch.employees.push(emp);
  }

  const matrix = [...byDate.values()].sort((a, b) =>
    a.businessDate.localeCompare(b.businessDate),
  );

  return {
    ok: root.ok !== false,
    fromBusinessDate:
      pickString(root.fromBusinessDate, request.fromBusinessDate) ?? request.fromBusinessDate,
    toBusinessDate:
      pickString(root.toBusinessDate, request.toBusinessDate) ?? request.toBusinessDate,
    days: matrix.length || request.days || 14,
    scope: {
      mode: request.mode,
      empId: request.empId,
      branchCodes: request.branchCodes,
    },
    matrix,
    slotIntervalMinutes: pickNumber(root.slotIntervalMinutes) ?? 15,
    etag,
    fetchedAt: Date.now(),
    stale: false,
    generatedAtMs: pickEpochMs(root.generatedAtMs, root.generatedAt) ?? Date.now(),
    receivedAtMonoMs: monotonicNowMs(),
  };
}

async function fetchBootstrapRaw(etag: string | null): Promise<{
  data: BookingV2Bootstrap;
  etag: string | null;
  notModified: boolean;
}> {
  assertBookingApiBase();
  trackBookingRequest("bootstrap");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (etag) headers["If-None-Match"] = etag;

  const res = await fetch(buildUrl("/api/public/booking/v2/bootstrap"), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (res.status === 304 && etag) {
    const cached = cacheGet<BookingV2Bootstrap>(BOOTSTRAP_KEY);
    if (cached) return { data: cached.data, etag, notModified: true };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`bootstrap HTTP ${res.status}${text ? `: ${text.slice(0, 160)}` : ""}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("bootstrap returned non-JSON");
  }

  const json = await res.json();
  const nextEtag = res.headers.get("ETag") ?? res.headers.get("etag");
  return {
    data: normalizeBootstrapPayload(json, nextEtag),
    etag: nextEtag,
    notModified: false,
  };
}

async function fetchAvailabilityRaw(
  request: AvailabilityRequest,
  etag: string | null,
): Promise<{ data: AvailabilityMatrix; etag: string | null; notModified: boolean }> {
  assertBookingApiBase();
  trackBookingRequest("availability");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (etag) headers["If-None-Match"] = etag;

  // Hawai contract — employeeId + from/to BusinessDate (not days, not empId)
  const body: Record<string, unknown> = {
    fromBusinessDate: request.fromBusinessDate,
    toBusinessDate: request.toBusinessDate,
    branchCodes: request.branchCodes,
  };
  if (request.mode === "specific" && request.empId != null) {
    body.employeeId = request.empId;
  } else if (request.branchCodes.length === 1) {
    body.branchCode = request.branchCodes[0];
    delete body.branchCodes;
  }

  const res = await fetch(buildUrl("/api/public/booking/v2/availability"), {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(body),
  });

  if (res.status === 304 && etag) {
    return {
      data: {
        ok: true,
        fromBusinessDate: request.fromBusinessDate,
        toBusinessDate: request.toBusinessDate,
        days: request.days ?? 14,
        scope: {
          mode: request.mode,
          empId: request.empId,
          branchCodes: request.branchCodes,
        },
        matrix: [],
        slotIntervalMinutes: 15,
        etag,
        fetchedAt: Date.now(),
        stale: true,
      },
      etag,
      notModified: true,
    };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`availability HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("availability returned non-JSON");
  }

  const json = await res.json();
  const nextEtag = res.headers.get("ETag") ?? res.headers.get("etag");
  return {
    data: normalizeAvailabilityPayload(json, request, nextEtag),
    etag: nextEtag,
    notModified: false,
  };
}

export function getCachedBootstrap(): BookingV2Bootstrap | null {
  return cacheGet<BookingV2Bootstrap>(BOOTSTRAP_KEY)?.data ?? null;
}

export async function getBookingBootstrap(options?: {
  force?: boolean;
  onUpdate?: (data: BookingV2Bootstrap, meta: { fromCache: boolean; stale: boolean }) => void;
}): Promise<BookingV2Bootstrap> {
  const result = await swrFetch<BookingV2Bootstrap>({
    key: BOOTSTRAP_KEY,
    force: options?.force,
    onUpdate: options?.onUpdate,
    fetcher: fetchBootstrapRaw,
  });
  return result.data;
}

export function availabilityCacheKey(request: AvailabilityRequest): string {
  const branches = [...request.branchCodes].map((c) => String(c).toUpperCase()).sort().join(",");
  return `booking-v2:availability:${request.mode}:${request.empId ?? "any"}:${branches}:${request.fromBusinessDate}:${request.toBusinessDate}`;
}

export function getCachedAvailability(request: AvailabilityRequest): AvailabilityMatrix | null {
  return cacheGet<AvailabilityMatrix>(availabilityCacheKey(request))?.data ?? null;
}

export async function getAvailabilityMatrix(
  request: AvailabilityRequest,
  options?: {
    force?: boolean;
    onUpdate?: (data: AvailabilityMatrix, meta: { fromCache: boolean; stale: boolean }) => void;
  },
): Promise<AvailabilityMatrix> {
  const key = availabilityCacheKey(request);
  const result = await swrFetch<AvailabilityMatrix>({
    key,
    force: options?.force,
    onUpdate: options?.onUpdate,
    fetcher: async (etag) => {
      const res = await fetchAvailabilityRaw(request, etag);
      if (res.notModified) {
        const cached = cacheGet<AvailabilityMatrix>(key);
        if (cached) {
          return { data: { ...cached.data, stale: true }, etag: res.etag, notModified: true };
        }
      }
      return res;
    },
  });
  return { ...result.data, stale: result.stale };
}

export async function prefetchBootstrap(): Promise<void> {
  try {
    await getBookingBootstrap();
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[booking-v2] bootstrap prefetch failed", err);
    }
  }
}

export function defaultMatrixRequestFromScope(
  scope: { mode: "specific" | "nearest"; empId?: number; branchCodes: string[] },
  days = 14,
): AvailabilityRequest {
  const from = todayBusinessDate();
  const to = addBusinessDays(from, days - 1);
  return {
    mode: scope.mode,
    empId: scope.empId,
    branchCodes: scope.branchCodes,
    fromBusinessDate: from,
    toBusinessDate: to,
    days,
  };
}

export { cachePeekEtag, BOOTSTRAP_KEY, BOOKING_API_BASE_URL, buildUrl };
