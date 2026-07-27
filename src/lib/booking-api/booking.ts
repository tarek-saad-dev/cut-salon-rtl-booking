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
        barber?: { empId?: number; nameAr?: string; name?: string };
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
      empName: nested?.barber?.nameAr || nested?.barber?.name || "",
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
  booking: BookingCreateResponse;
  bookingAccessToken?: string;
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

    // Success — prefer nested `booking`; compat may flatten fields onto the root.
    const raw = res.data as unknown as CreateApiResponse & Partial<BookingCreateResponse>;
    const booking: BookingCreateResponse = raw.booking ?? {
      bookingCode: String(raw.bookingCode ?? ""),
      date: String(raw.date ?? ""),
      time: String(raw.time ?? ""),
      barberName: String(raw.barberName ?? ""),
      services: Array.isArray(raw.services) ? raw.services : [],
      totalPrice: raw.totalPrice,
      totalDurationMinutes: raw.totalDurationMinutes,
      message: raw.message,
      branchCode: raw.branchCode,
      branchName: raw.branchName,
      bookingAccessToken: raw.bookingAccessToken,
    };
    const accessToken = raw.bookingAccessToken ?? booking.bookingAccessToken;

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

  return bookingApiRequest<PublicBooking>({
    path: `/api/public/booking/${encodeURIComponent(normalized)}`,
    query: !token && opts?.phone ? { phone: opts.phone } : undefined,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    signal: opts?.signal,
    timeoutMs: 15_000,
  });
}

// ─── Upcoming ────────────────────────────────────────────────────────────────

export async function getUpcomingBookings(
  phone: string,
  opts?: { limit?: number; signal?: AbortSignal },
): Promise<BookingApiResponse<PublicBooking[]>> {
  const limit = clampUpcomingLimit(opts?.limit);
  const res = await bookingApiRequest<{ ok: boolean; bookings: PublicBooking[] }>({
    path: "/api/public/booking/upcoming",
    method: "POST",
    body: { phone, limit },
    signal: opts?.signal,
    timeoutMs: 15_000,
  });
  return { ...res, data: res.data.bookings ?? [] };
}
