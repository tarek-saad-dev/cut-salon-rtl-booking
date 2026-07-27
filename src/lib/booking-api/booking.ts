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

// ─── Plan ────────────────────────────────────────────────────────────────────

interface PlanApiResponse {
  ok: boolean;
  plan: BookingPlan["plan"];
  totalDurationMinutes: number;
  totalPrice: number;
  bookingCodes: string[];
  message?: string;
  branchCode?: string;
  branchName?: string;
  planToken?: string;
  planFingerprint?: string;
  evaluatedAt?: string;
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

  const planData: BookingPlan = {
    plan: res.data.plan,
    totalDurationMinutes: res.data.totalDurationMinutes,
    totalPrice: res.data.totalPrice,
    bookingCodes: res.data.bookingCodes,
    message: res.data.message,
    branchCode: res.data.branchCode,
    branchName: res.data.branchName,
    planToken: res.data.planToken,
    planFingerprint: res.data.planFingerprint,
    evaluatedAt: res.data.evaluatedAt,
  };

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
  const storedAccess = getBookingAccess(params.code);
  const token = params.bookingAccessToken ?? storedAccess?.bookingAccessToken;

  const opKey = buildCancelOperationKey(params.code);
  const clientRequestId = getOrCreateMutationId(opKey);

  const body: Record<string, unknown> = {
    code: params.code,
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
      path: `/api/public/booking/${encodeURIComponent(params.code)}/cancel`,
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
  opts?: { bookingAccessToken?: string; signal?: AbortSignal },
): Promise<BookingApiResponse<PublicBooking>> {
  const storedAccess = getBookingAccess(code);
  const token = opts?.bookingAccessToken ?? storedAccess?.bookingAccessToken;

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return bookingApiRequest<PublicBooking>({
    path: `/api/public/booking/${encodeURIComponent(code)}`,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    signal: opts?.signal,
    timeoutMs: 15_000,
  });
}

// ─── Upcoming ────────────────────────────────────────────────────────────────

export async function getUpcomingBookings(
  phone: string,
  signal?: AbortSignal,
): Promise<BookingApiResponse<PublicBooking[]>> {
  const res = await bookingApiRequest<{ ok: boolean; bookings: PublicBooking[] }>({
    path: "/api/public/booking/upcoming",
    method: "POST",
    body: { phone },
    signal,
    timeoutMs: 15_000,
  });
  return { ...res, data: res.data.bookings ?? [] };
}
