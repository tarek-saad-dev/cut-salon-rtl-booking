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
  BOOKING_NOT_FOUND: "تعذر العثور على الحجز أو التحقق من الملكية",
  BOOKING_NOT_FOUND_OR_UNAUTHORIZED: "تعذر العثور على الحجز أو التحقق من الملكية",
  BOOKING_ALREADY_CANCELLED: "تم إلغاء هذا الحجز مسبقاً",
  BOOKING_ALREADY_IN_SERVICE: "لا يمكن إلغاء الحجز إلكترونياً بعد بدء الخدمة",
  BOOKING_ALREADY_COMPLETED: "هذا الحجز مكتمل ولا يمكن إلغاؤه",
  BOOKING_HAS_PAYMENT: "يوجد دفع مرتبط بهذا الحجز، يرجى التواصل مع الفرع",
  BOOKING_CANCELLATION_REQUIRES_STAFF: "إلغاء هذا الحجز يتطلب مساعدة الموظفين في الفرع",
  BOOKING_CANCELLATION_WINDOW_CLOSED: "انتهت فترة الإلغاء الإلكتروني لهذا الحجز",
  BOOKING_NOT_CANCELLABLE: "لا يمكن إلغاء هذا الحجز إلكترونياً",
  CANCEL_NOT_ALLOWED: "لا يمكن إلغاء هذا الحجز",
  CANCEL_TOO_LATE: "انتهت فترة الإلغاء الإلكتروني لهذا الحجز",
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

const ENGLISH_ERROR_MESSAGES: Partial<Record<PublicBookingErrorCode, string>> = {
  BRANCH_REQUIRED: "Please select a branch first",
  INVALID_BRANCH: "The selected branch is invalid",
  BOOKING_DISABLED: "Booking is currently disabled",
  SERVICE_NOT_FOUND: "The selected service is unavailable",
  SERVICE_NOT_BOOKABLE: "This service isn’t available for online booking",
  BARBER_NOT_FOUND: "The selected barber is unavailable",
  BARBER_NOT_AVAILABLE: "This barber isn’t available at that time",
  SLOT_NOT_AVAILABLE: "That slot is no longer available — please pick another time",
  SLOT_CONFLICT: "That slot is already booked — please pick another time",
  PLAN_TOKEN_EXPIRED: "Your booking plan expired — please review and confirm again",
  PLAN_TOKEN_REQUEST_MISMATCH: "Booking details changed — please review and confirm again",
  PLAN_TOKEN_REQUIRED: "Please review booking details before confirming",
  PLAN_TOKEN_INVALID: "Booking plan is invalid — please prepare the booking again",
  PLAN_CREATE_MISMATCH: "Couldn’t match the booking plan — please reselect",
  SLOT_UNAVAILABLE: "That slot is no longer available — please pick another time",
  NO_ELIGIBLE_BARBER: "No barber is available for these choices right now",
  EMPLOYEE_INTERVAL_BUSY_GLOBAL: "That slot is booked — please pick another time",
  BARBER_FULLY_BOOKED: "This barber is fully booked at that time",
  BOOKING_NOT_FOUND: "Couldn’t find the booking or verify ownership",
  BOOKING_NOT_FOUND_OR_UNAUTHORIZED: "Couldn’t find the booking or verify ownership",
  BOOKING_ALREADY_CANCELLED: "This booking was already cancelled",
  BOOKING_ALREADY_IN_SERVICE: "Online cancellation isn’t available after service has started",
  BOOKING_ALREADY_COMPLETED: "This booking is completed and can’t be cancelled",
  BOOKING_HAS_PAYMENT: "A payment is linked to this booking — please contact the branch",
  BOOKING_CANCELLATION_REQUIRES_STAFF: "Cancelling this booking requires staff at the branch",
  BOOKING_CANCELLATION_WINDOW_CLOSED: "The online cancellation window has closed",
  BOOKING_NOT_CANCELLABLE: "This booking can’t be cancelled online",
  CANCEL_NOT_ALLOWED: "This booking can’t be cancelled",
  CANCEL_TOO_LATE: "The online cancellation window has closed",
  CUSTOMER_PHONE_REQUIRED: "Please enter a phone number",
  CUSTOMER_NAME_REQUIRED: "Please enter your name",
  RATE_LIMIT_EXCEEDED: "Too many requests — please wait a moment",
  VALIDATION_ERROR: "Invalid data — please review",
  IDEMPOTENT_REQUEST_CONFLICT: "Your request is being processed — please wait",
  INTERNAL_ERROR: "Something went wrong — please try again later",
  UNKNOWN_ERROR: "An unexpected error occurred — please try again",
};

/** Locale-aware public booking API error message (UI display). */
export function getLocalizedBookingErrorMessage(
  code: PublicBookingErrorCode,
  lang: "ar" | "en" = "ar",
): string {
  if (lang === "en") {
    return ENGLISH_ERROR_MESSAGES[code] ?? ENGLISH_ERROR_MESSAGES.UNKNOWN_ERROR!;
  }
  return getArabicErrorMessage(code);
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
