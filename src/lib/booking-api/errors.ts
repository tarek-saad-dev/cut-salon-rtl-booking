import type { PublicBookingErrorCode, ResponseMetadata } from "./types";

export class BookingApiError extends Error {
  readonly code: PublicBookingErrorCode;
  readonly technicalMessage: string | null;
  readonly errorMetadata: Record<string, unknown> | null;
  readonly httpStatus: number;
  readonly requestId: string | null;
  readonly retryAfterSeconds: number | null;
  readonly isRateLimited: boolean;
  readonly isRetryable: boolean;
  readonly isBusinessConflict: boolean;
  readonly originalCause?: unknown;

  constructor(opts: {
    code: PublicBookingErrorCode;
    message: string;
    technicalMessage?: string | null;
    metadata?: Record<string, unknown> | null;
    httpStatus: number;
    requestId?: string | null;
    retryAfterSeconds?: number | null;
    isRetryable?: boolean;
    isBusinessConflict?: boolean;
    originalCause?: unknown;
  }) {
    super(opts.message);
    this.name = "BookingApiError";
    this.code = opts.code;
    this.technicalMessage = opts.technicalMessage ?? null;
    this.errorMetadata = opts.metadata ?? null;
    this.httpStatus = opts.httpStatus;
    this.requestId = opts.requestId ?? null;
    this.retryAfterSeconds = opts.retryAfterSeconds ?? null;
    this.isRateLimited = opts.code === "RATE_LIMIT_EXCEEDED" || opts.httpStatus === 429;
    this.isRetryable = opts.isRetryable ?? (opts.httpStatus >= 500 || opts.httpStatus === 429);
    this.isBusinessConflict = opts.isBusinessConflict ?? (opts.httpStatus === 409);
    this.originalCause = opts.originalCause;
  }
}

// ─── Arabic User Messages ────────────────────────────────────────────────────

const ARABIC_ERROR_MESSAGES: Partial<Record<PublicBookingErrorCode, string>> = {
  BRANCH_REQUIRED: "يرجى اختيار الفرع أولاً",
  INVALID_BRANCH: "الفرع المختار غير صالح",
  BOOKING_DISABLED: "الحجز معطل حالياً",
  SERVICE_NOT_FOUND: "الخدمة المختارة غير متوفرة",
  SERVICE_NOT_BOOKABLE: "الخدمة المختارة غير متاحة للحجز الإلكتروني",
  BARBER_NOT_FOUND: "الحلاق المختار غير متوفر",
  BARBER_NOT_AVAILABLE: "الحلاق المختار غير متاح في هذا الوقت",
  SLOT_NOT_AVAILABLE: "الموعد لم يعد متاحاً، يرجى اختيار وقت آخر",
  SLOT_CONFLICT: "الموعد محجوز بالفعل، يرجى اختيار وقت آخر",
  PLAN_TOKEN_EXPIRED: "انتهت صلاحية خطة الحجز، يرجى المراجعة وإعادة التأكيد",
  PLAN_TOKEN_REQUEST_MISMATCH: "تم تغيير بيانات الحجز، يرجى مراجعة الاختيارات وإعادة التأكيد",
  PLAN_TOKEN_REQUIRED: "يرجى مراجعة تفاصيل الحجز قبل التأكيد",
  PLAN_TOKEN_INVALID: "خطة الحجز غير صالحة، يرجى إعادة تجهيز الحجز",
  PLAN_CREATE_MISMATCH: "تعذر مطابقة خطة الحجز، يرجى إعادة الاختيار",
  SLOT_UNAVAILABLE: "الموعد لم يعد متاحاً، يرجى اختيار وقت آخر",
  NO_ELIGIBLE_BARBER: "لا يوجد حلاق متاح لهذه الاختيارات حالياً",
  EMPLOYEE_INTERVAL_BUSY_GLOBAL: "الموعد محجوز، يرجى اختيار وقت آخر",
  BARBER_FULLY_BOOKED: "الحلاق محجوز بالكامل في هذا الوقت",
  BOOKING_NOT_FOUND: "لم يتم العثور على الحجز",
  BOOKING_ALREADY_CANCELLED: "تم إلغاء هذا الحجز مسبقاً",
  CANCEL_NOT_ALLOWED: "لا يمكن إلغاء هذا الحجز",
  CANCEL_TOO_LATE: "لا يمكن إلغاء الحجز في هذا الوقت",
  CUSTOMER_PHONE_REQUIRED: "يرجى إدخال رقم الهاتف",
  CUSTOMER_NAME_REQUIRED: "يرجى إدخال الاسم",
  RATE_LIMIT_EXCEEDED: "عدد الطلبات كثير جداً، يرجى الانتظار قليلاً",
  VALIDATION_ERROR: "بيانات غير صالحة، يرجى المراجعة",
  IDEMPOTENT_REQUEST_CONFLICT: "يتم معالجة طلبك، يرجى الانتظار",
  INTERNAL_ERROR: "حدث خطأ، يرجى المحاولة لاحقاً",
  UNKNOWN_ERROR: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى",
};

export function getArabicErrorMessage(code: PublicBookingErrorCode): string {
  return ARABIC_ERROR_MESSAGES[code] ?? ARABIC_ERROR_MESSAGES.UNKNOWN_ERROR!;
}

// ─── Backend Error Parsing ───────────────────────────────────────────────────

interface BackendErrorShape {
  ok: false;
  error?: {
    code?: string;
    message?: string;
    technicalMessage?: string;
    metadata?: Record<string, unknown>;
  };
  message?: string;
  error_code?: string;
}

export function parseBackendError(
  body: unknown,
  httpStatus: number,
  metadata: ResponseMetadata,
): BookingApiError {
  const parsed = body as Partial<BackendErrorShape>;
  const errorObj = parsed?.error;
  const code = (errorObj?.code ?? parsed?.error_code ?? "UNKNOWN_ERROR") as PublicBookingErrorCode;

  let retryAfterSeconds = metadata.rateLimit.retryAfterSeconds;
  if (errorObj?.metadata?.retryAfterSeconds != null) {
    retryAfterSeconds = Number(errorObj.metadata.retryAfterSeconds);
  }

  return new BookingApiError({
    code,
    message: getArabicErrorMessage(code),
    technicalMessage: errorObj?.technicalMessage ?? errorObj?.message ?? parsed?.message ?? null,
    metadata: errorObj?.metadata ?? null,
    httpStatus,
    requestId: metadata.requestId,
    retryAfterSeconds,
    isRetryable: httpStatus >= 500 || httpStatus === 429,
    isBusinessConflict: httpStatus === 409,
  });
}

export function createNetworkError(
  cause: unknown,
  opts?: { abortedByTimeout?: boolean },
): BookingApiError {
  const isAbort = cause instanceof DOMException && cause.name === "AbortError";
  const abortedByTimeout = opts?.abortedByTimeout ?? false;

  return new BookingApiError({
    code: "UNKNOWN_ERROR",
    message: isAbort
      ? abortedByTimeout
        ? "انتهت مهلة الطلب. لم يتم تأكيد نتيجة العملية بعد."
        : "تم إلغاء الطلب"
      : "تعذر الاتصال بالخادم، يرجى التحقق من الاتصال بالإنترنت",
    httpStatus: 0,
    isRetryable: !isAbort ? true : abortedByTimeout,
    originalCause: cause,
  });
}

export function createMalformedResponseError(
  httpStatus: number,
  requestId: string | null,
  cause?: unknown,
): BookingApiError {
  return new BookingApiError({
    code: "INTERNAL_ERROR",
    message: "حدث خطأ في معالجة الاستجابة، يرجى المحاولة لاحقاً",
    httpStatus,
    requestId,
    isRetryable: true,
    originalCause: cause,
  });
}
