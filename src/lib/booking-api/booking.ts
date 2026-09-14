import { bookingApiRequest } from "./client";
import type {
  BookingPlan,
  BookingPlanRequest,
  BookingCreateRequest,
  BookingCreateResponse,
  BookingCancelRequest,
  BookingCancelResponse,
  PublicBooking,
  UpcomingBookingsResponse,
  BookingApiResponse,
  BookingCustomer,
} from "./types";
import { BookingApiError } from "./errors";
import {
  getOrCreateMutationId,
  completeMutationId,
  abandonMutationId,
  buildCreateOperationKey,
  buildCancelOperationKey,
} from "./idempotency";
import {
  savePlanSession,
  getPlanSession,
  clearPlanSession,
  isPlanMatchingSelection,
} from "./plan-session";
import { saveBookingAccess, getBookingAccess } from "./booking-access-store";
import { clampUpcomingLimit, normalizeBookingCode } from "./limits";

// ─── Plan ────────────────────────────────────────────────────────────────────

interface PlanApiResponse {
  ok: boolean;
  /** Legacy flat shape OR nested booking-plan-v1 object. */
  plan:
    | BookingPlan["plan"]
    | {
        contractVersion?: string;
        branch?: { branchCode?: string; branchName?: string };
        barber?: { empId?: number; nameAr?: string; nameEn?: string; name?: string };
        date?: string;
        time?: string;
        dayOffset?: number;
        startDateTime?: string;
        endDateTime?: string;
        services?: Array<{
          serviceId: number;
          nameAr?: string;
          nameEn?: string;
          price?: number;
          durationMinutes?: number;
        }>;
        totalDurationMinutes?: number;
        total?: number;
        totalPrice?: number;
        subtotal?: number;
        planToken?: string;
        planFingerprint?: string;
        planExpiresAt?: string;
        evaluatedAt?: string;
      };
  totalDurationMinutes?: number;
  totalPrice?: number;
  total?: number;
  bookingCodes?: string[];
  message?: string;
  branchCode?: string;
  branchName?: string;
  planToken?: string;
  planFingerprint?: string;
  evaluatedAt?: string;
}

function normalizePlanResponse(
  data: PlanApiResponse,
  params: BookingPlanRequest,
): BookingPlan {
  const nested =
    data.plan && !Array.isArray(data.plan) ? data.plan : null;
  const legacyItems = Array.isArray(data.plan) ? data.plan : null;

  const items: BookingPlan["plan"] =
    legacyItems ??
    (nested?.services ?? []).map((s) => ({
      serviceId: s.serviceId,
      serviceName: s.nameAr || s.nameEn || "",
      empId: nested?.barber?.empId ?? params.empId ?? 0,
      empName: nested?.barber?.nameAr || nested?.barber?.name || nested?.barber?.nameEn || "",
      empNameEn: nested?.barber?.nameEn?.trim() || null,
      date: nested?.date || params.date,
      startTime: nested?.time || params.time,
      endTime: "",
      durationMinutes: s.durationMinutes ?? 0,
      price: s.price ?? 0,
      bookingCode: "",
    }));

  return {
    plan: items,
    totalDurationMinutes:
      nested?.totalDurationMinutes ??
      data.totalDurationMinutes ??
      items.reduce((sum, i) => sum + (i.durationMinutes || 0), 0),
    totalPrice:
      nested?.total ??
      nested?.totalPrice ??
      data.totalPrice ??
      data.total ??
      items.reduce((sum, i) => sum + (i.price || 0), 0),
    bookingCodes: data.bookingCodes ?? [],
    message: data.message,
    branchCode: nested?.branch?.branchCode ?? data.branchCode ?? params.branchCode,
    branchName: nested?.branch?.branchName ?? data.branchName,
    planToken: nested?.planToken ?? data.planToken,
    planFingerprint: nested?.planFingerprint ?? data.planFingerprint,
    evaluatedAt: nested?.evaluatedAt ?? data.evaluatedAt,
  };
}

export async function createBookingPlan(
  params: BookingPlanRequest,
  signal?: AbortSignal,
): Promise<BookingApiResponse<BookingPlan>> {
  const res = await bookingApiRequest<PlanApiResponse>({
    path: "/api/public/booking/plan",
    method: "POST",
    body: params,
    signal,
    timeoutMs: 15_000,
  });

  const planData = normalizePlanResponse(res.data, params);

  if (planData.planToken) {
    savePlanSession(planData, {
      branchCode: params.branchCode,
      mode: params.mode,
      empId: params.empId,
      serviceIds: params.serviceIds,
      packageId: params.packageId,
      addonProIds: params.addonProIds,
      date: params.date,
      time: params.time,
      dayOffset: params.dayOffset,
    });
  }

  return { ...res, data: planData };
}

// ─── Create Orchestration ────────────────────────────────────────────────────

export type MutationOutcome = "success" | "known_failure" | "mutation_outcome_unknown";

export interface CreateBookingResult {
  outcome: MutationOutcome;
  booking?: BookingCreateResponse;
  error?: BookingApiError;
}

interface CreateApiResponse {
  ok: boolean;
  booking?: BookingCreateResponse & {
    code?: string;
    calendarDate?: string;
    workDate?: string;
    total?: number;
    barber?: { empId?: number; nameAr?: string; name?: string };
    branch?: { branchCode?: string; branchName?: string };
    services?: Array<{ nameAr?: string; nameEn?: string; name?: string } | string>;
  };
  bookingCode?: string;
  code?: string;
  bookingAccessToken?: string;
  message?: string;
  date?: string;
  time?: string;
  barberName?: string;
  services?: string[];
  totalPrice?: number;
  totalDurationMinutes?: number;
  branchCode?: string;
  branchName?: string;
}

/** Compat: live create may nest fields and use `code` instead of `bookingCode`. */
function normalizeCreateResponse(raw: CreateApiResponse): BookingCreateResponse {
  const nested = raw.booking && typeof raw.booking === "object" ? raw.booking : null;
  const src = nested ?? raw;

  const servicesRaw = (src as { services?: unknown }).services;
  const services: string[] = Array.isArray(servicesRaw)
    ? servicesRaw
        .map((s) => {
          if (typeof s === "string") return s.trim();
          if (s && typeof s === "object") {
            const item = s as { nameAr?: string; nameEn?: string; name?: string };
            return String(item.nameAr || item.nameEn || item.name || "").trim();
          }
          return "";
        })
        .filter(Boolean)
    : [];

  const nestedRec = nested as Record<string, unknown> | null;
  const srcRec = src as Record<string, unknown>;
  const barber = srcRec.barber as { nameAr?: string; nameEn?: string; name?: string } | undefined;
  const branch = srcRec.branch as { branchCode?: string; branchName?: string } | undefined;

  // Prefer calendarDate for customer-facing display when workDate differs (overnight).
  const date = String(
    srcRec.calendarDate ?? srcRec.date ?? srcRec.workDate ?? "",
  ).trim();

  return {
    bookingCode: String(
      srcRec.bookingCode ?? srcRec.code ?? raw.bookingCode ?? raw.code ?? "",
    ).trim(),
    bookingAccessToken: String(
      srcRec.bookingAccessToken ?? raw.bookingAccessToken ?? nestedRec?.bookingAccessToken ?? "",
    ).trim() || undefined,
    date,
    time: String(srcRec.time ?? "").trim(),
    barberName: String(
      srcRec.barberName ?? barber?.nameAr ?? barber?.name ?? barber?.nameEn ?? "",
    ).trim(),
    services,
    totalPrice:
      (srcRec.totalPrice as number | undefined) ??
      (srcRec.total as number | undefined) ??
      (nestedRec?.total as number | undefined),
    totalDurationMinutes:
      (srcRec.totalDurationMinutes as number | undefined) ??
      (nestedRec?.totalDurationMinutes as number | undefined),
    message: raw.message ?? (nestedRec?.message as string | undefined),
    branchCode: (
      (srcRec.branchCode as string | undefined) ??
      branch?.branchCode ??
      (nestedRec?.branch as { branchCode?: string } | undefined)?.branchCode ??
      ""
    ).trim() || undefined,
    branchName: (
      (srcRec.branchName as string | undefined) ??
      branch?.branchName ??
      (nestedRec?.branch as { branchName?: string } | undefined)?.branchName ??
      ""
    ).trim() || undefined,
  };
}

function normalizePublicBooking(raw: unknown): PublicBooking {
  const envelope = (raw && typeof raw === "object" ? raw : {}) as {
    ok?: boolean;
    booking?: Record<string, unknown>;
    bookingAccessToken?: string;
    meta?: { ownership?: string };
    ownershipLevel?: string;
  } & Record<string, unknown>;

  const nested =
    envelope.booking && typeof envelope.booking === "object"
      ? envelope.booking
      : envelope;
  const barber = nested.barber as { nameAr?: string; nameEn?: string; name?: string } | undefined;
  const branch = nested.branch as { branchCode?: string; branchName?: string } | undefined;
  const servicesRaw = nested.services;

  let services: PublicBooking["services"];
  if (Array.isArray(servicesRaw)) {
    services = servicesRaw.map((s) => {
      if (typeof s === "string") return { name: s };
      const item = s as {
        nameAr?: string;
        nameEn?: string;
        name?: string;
        price?: number;
        durationMinutes?: number;
        duration?: number;
      };
      return {
        name: String(item.nameAr || item.nameEn || item.name || ""),
        price: item.price ?? null,
        duration: item.durationMinutes ?? item.duration ?? null,
      };
    }) as PublicBooking["services"];
  } else if (typeof nested.servicesSummary === "string") {
    services = [nested.servicesSummary];
  }

  const ownership =
    envelope.meta?.ownership ??
    envelope.ownershipLevel ??
    (nested.ownershipLevel as string | undefined);

  return {
    bookingCode: String(nested.bookingCode ?? nested.code ?? ""),
    date: String(nested.date ?? nested.calendarDate ?? nested.workDate ?? ""),
    time: String(nested.time ?? ""),
    dayOffset: (nested.dayOffset as number | null | undefined) ?? null,
    barberName: String(nested.barberName ?? barber?.nameAr ?? barber?.name ?? barber?.nameEn ?? "") || null,
    services,
    totalPrice: (nested.totalPrice as number | null | undefined) ?? (nested.total as number | null | undefined) ?? null,
    totalDuration:
      (nested.totalDuration as number | null | undefined) ??
      (nested.totalDurationMinutes as number | null | undefined) ??
      null,
    status: (nested.status as string | null | undefined) ?? null,
    canCancel: (nested.canCancel as boolean | null | undefined) ?? null,
    branchCode: (nested.branchCode as string | null | undefined) ?? branch?.branchCode ?? null,
    branchName: (nested.branchName as string | null | undefined) ?? branch?.branchName ?? null,
    customerName: (nested.customerName as string | null | undefined) ?? null,
    ownershipLevel:
      ownership === "owner" ? "full" : ownership === "minimal" ? "minimal" : ownership ?? null,
  };
}

export async function submitBookingFromPlan(params: {
  plan: BookingPlan;
  customer: BookingCustomer;
  notes?: string;
  branchCode: string;
  date: string;
  time: string;
  dayOffset?: number;
  serviceIds: number[];
  packageId?: number | null;
  addonProIds?: number[];
  mode: "specific" | "nearest";
  empId?: number;
  signal?: AbortSignal;
}): Promise<CreateBookingResult> {
  const session = getPlanSession();
  if (!session) {
    return {
      outcome: "known_failure",
      error: new BookingApiError({
        code: "PLAN_TOKEN_REQUIRED",
        message: "يرجى مراجعة تفاصيل الحجز قبل التأكيد",
        httpStatus: 0,
        isRetryable: false,
      }),
    };
  }

  if (params.plan?.planToken && params.plan.planToken !== session.planToken) {
    clearPlanSession();
    return {
      outcome: "known_failure",
      error: new BookingApiError({
        code: "PLAN_TOKEN_REQUEST_MISMATCH",
        message: "تم تغيير بيانات الحجز، يرجى مراجعة الاختيارات وإعادة التأكيد",
        httpStatus: 0,
        isRetryable: false,
      }),
    };
  }

  if (
    !isPlanMatchingSelection({
      branchCode: params.branchCode,
      mode: params.mode,
      empId: params.empId,
      serviceIds: params.serviceIds,
      packageId: params.packageId,
      addonProIds: params.addonProIds,
      date: params.date,
      time: params.time,
      dayOffset: params.dayOffset,
    })
  ) {
    clearPlanSession();
    abandonMutationId(
      buildCreateOperationKey({
        branchCode: params.branchCode,
        date: params.date,
        time: params.time,
        serviceIds: params.serviceIds,
        mode: params.mode,
        empId: params.empId,
        dayOffset: params.dayOffset,
      }),
    );
    return {
      outcome: "known_failure",
      error: new BookingApiError({
        code: "PLAN_TOKEN_REQUEST_MISMATCH",
        message: "تم تغيير بيانات الحجز، يرجى مراجعة الاختيارات وإعادة التأكيد",
        httpStatus: 0,
        isRetryable: false,
      }),
    };
  }

  const opKey = buildCreateOperationKey({
    branchCode: params.branchCode,
    date: params.date,
    time: params.time,
    serviceIds: params.serviceIds,
    mode: params.mode,
    empId: params.empId,
    dayOffset: params.dayOffset,
  });
  const clientRequestId = getOrCreateMutationId(opKey);

  const body: BookingCreateRequest = {
    branchCode: params.branchCode,
    customer: params.customer,
    serviceIds: params.serviceIds,
    date: params.date,
    time: params.time,
    dayOffset: params.dayOffset ?? 0,
    mode: params.mode,
    empId: params.empId,
    notes: params.notes,
    planToken: session.planToken,
    clientRequestId,
    ...(params.packageId != null && params.packageId > 0
      ? { packageId: params.packageId }
      : {}),
    ...(params.addonProIds?.length ? { addonProIds: params.addonProIds } : {}),
  };

  try {
    const res = await bookingApiRequest<CreateApiResponse>({
      path: "/api/public/booking/create",
      method: "POST",
      body,
      idempotencyKey: clientRequestId,
      signal: params.signal,
      timeoutMs: 20_000,
    });

    // Success — prefer nested `booking`; compat may use `code` and nest tokens.
    const raw = res.data as unknown as CreateApiResponse;
    const booking = normalizeCreateResponse(raw);
    const accessToken = booking.bookingAccessToken;

    if (accessToken && booking.bookingCode) {
      saveBookingAccess({
        bookingCode: booking.bookingCode,
        bookingAccessToken: accessToken,
      });
    }

    clearPlanSession();
    completeMutationId(opKey);

    return { outcome: "success", booking };
  } catch (err) {
    if (err instanceof BookingApiError) {
      if (err.code === "PLAN_TOKEN_EXPIRED") {
        clearPlanSession();
        abandonMutationId(opKey);
        return { outcome: "known_failure", error: err };
      }
      if (err.code === "PLAN_TOKEN_REQUEST_MISMATCH") {
        clearPlanSession();
        abandonMutationId(opKey);
        return { outcome: "known_failure", error: err };
      }

      if (err.httpStatus === 0) {
        // Network / timeout / abort => outcome is uncertain; preserve mutation ID
        return { outcome: "mutation_outcome_unknown", error: err };
      }

      // Non-zero HTTP status => backend responded with a definitive result.
      // Preserve the idempotency key only when the error is retryable.
      if (!err.isRetryable) {
        abandonMutationId(opKey);
      }

      return { outcome: "known_failure", error: err };
    }

    // Unknown error — uncertain
    return {
      outcome: "mutation_outcome_unknown",
      error: new BookingApiError({
        code: "UNKNOWN_ERROR",
        message: "حدث خطأ غير متوقع",
        httpStatus: 0,
        isRetryable: true,
        originalCause: err,
      }),
    };
  }
}

// ─── Cancel Orchestration ────────────────────────────────────────────────────

export interface CancelBookingResult {
  outcome: MutationOutcome;
  response?: BookingCancelResponse;
  error?: BookingApiError;
}

export async function submitBookingCancellation(params: {
  code: string;
  phone?: string;
  bookingAccessToken?: string;
  reasonCode?: string;
  reasonText?: string;
  signal?: AbortSignal;
}): Promise<CancelBookingResult> {
  const code = normalizeBookingCode(params.code);
  const storedAccess = getBookingAccess(code);
  const token = params.bookingAccessToken ?? storedAccess?.bookingAccessToken;

  const opKey = buildCancelOperationKey(code);
  const clientRequestId = getOrCreateMutationId(opKey);

  const body: Record<string, unknown> = {
    code,
    clientRequestId,
  };

  if (token) {
    body.bookingAccessToken = token;
  } else if (params.phone) {
    body.phone = params.phone;
  }

  if (params.reasonCode) body.reasonCode = params.reasonCode;
  if (params.reasonText) body.reasonText = params.reasonText;

  try {
    const res = await bookingApiRequest<{ ok: boolean; cancelled?: boolean; message?: string }>({
      path: `/api/public/booking/${encodeURIComponent(code)}/cancel`,
      method: "POST",
      body,
      idempotencyKey: clientRequestId,
      signal: params.signal,
      timeoutMs: 20_000,
    });

    completeMutationId(opKey);
    return {
      outcome: "success",
      response: {
        cancelled: res.data.cancelled ?? res.data.ok ?? true,
        message: res.data.message,
      },
    };
  } catch (err) {
    if (err instanceof BookingApiError) {
      if (err.httpStatus === 0) {
        return { outcome: "mutation_outcome_unknown", error: err };
      }

      if (!err.isRetryable) {
        abandonMutationId(opKey);
        return { outcome: "known_failure", error: err };
      }

      return { outcome: "known_failure", error: err };
    }
    return {
      outcome: "mutation_outcome_unknown",
      error: new BookingApiError({
        code: "UNKNOWN_ERROR",
        message: "حدث خطأ غير متوقع",
        httpStatus: 0,
        isRetryable: true,
        originalCause: err,
      }),
    };
  }
}

// ─── Lookup ──────────────────────────────────────────────────────────────────

export async function lookupBooking(
  code: string,
  opts?: {
    bookingAccessToken?: string;
    phone?: string;
    signal?: AbortSignal;
  },
): Promise<BookingApiResponse<PublicBooking>> {
  const normalized = normalizeBookingCode(code);
  const storedAccess = getBookingAccess(normalized);
  const token = opts?.bookingAccessToken ?? storedAccess?.bookingAccessToken;

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await bookingApiRequest<unknown>({
    path: `/api/public/booking/${encodeURIComponent(normalized)}`,
    query: !token && opts?.phone ? { phone: opts.phone } : undefined,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    signal: opts?.signal,
    timeoutMs: 15_000,
  });

  const booking = normalizePublicBooking(res.data);
  const envelope = res.data as { bookingAccessToken?: string } | null;
  if (envelope?.bookingAccessToken && booking.bookingCode) {
    saveBookingAccess({
      bookingCode: booking.bookingCode,
      bookingAccessToken: envelope.bookingAccessToken,
    });
  }

  return { ...res, data: booking };
}

// ─── Upcoming ────────────────────────────────────────────────────────────────

export async function getUpcomingBookings(
  phone: string,
  opts?: { limit?: number; signal?: AbortSignal },
): Promise<BookingApiResponse<PublicBooking[]>> {
  const limit = clampUpcomingLimit(opts?.limit);
  const res = await bookingApiRequest<{ ok: boolean; bookings: unknown[] }>({
    path: "/api/public/booking/upcoming",
    method: "POST",
    body: { phone, limit },
    signal: opts?.signal,
    timeoutMs: 15_000,
  });
  const bookings = (res.data.bookings ?? []).map((b) => normalizePublicBooking(b));
  return { ...res, data: bookings };
}
