/**
 * Typed API contracts for booking-public-v1.
 * Wire-format types matching the backend public API.
 * No internal IDs (BookingID, BranchID, CustomerID) exposed.
 */

// ─── Branch ──────────────────────────────────────────────────────────────────

export interface PublicBranch {
  branchCode: string;
  branchName: string;
  shortName: string | null;
  address: string | null;
  phone: string | null;
  timeZone: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface BookingSalon {
  name: string;
  logoUrl: string | null;
  timezone: string;
  currency: string;
  bookingEnabled: boolean;
}

export interface BookingSettings {
  allowSpecificBarber: boolean;
  allowNearestBarber: boolean;
  defaultMode: "specific" | "nearest";
  slotIntervalMinutes: number;
  maxBookingDaysAhead: number;
  minNoticeMinutes: number;
}

export interface BookingConfig {
  salon: BookingSalon;
  settings: BookingSettings;
}

// ─── Services ────────────────────────────────────────────────────────────────

export interface ServiceCategory {
  name: string;
  services: BookingService[];
}

export interface BookingService {
  id: number;
  /** Matching / fallback label (prefer English for grouping). */
  name: string;
  nameAr: string | null;
  nameEn: string | null;
  price: number;
  durationMinutes: number;
  categoryName: string | null;
  isBookableOnline: boolean;
}

// ─── Barbers ─────────────────────────────────────────────────────────────────

export interface PublicBarberBranch {
  branchCode: string;
  branchName: string;
}

export interface PublicBarber {
  id: number;
  /** Display fallback (usually Arabic / API `name`). Prefer nameAr/nameEn via resolveBarberDisplayName. */
  name: string;
  nameAr: string | null;
  nameEn: string | null;
  job: string | null;
  /** Canonical photo from API (imageUrl preferred; photoUrl is compat alias). */
  imageUrl: string | null;
  /** Compat alias — same value as imageUrl when API sends both. */
  photoUrl: string | null;
  bio: string | null;
  isBookableOnline: boolean;
  /** Public service IDs this barber can perform (when returned by catalog). */
  serviceIds?: number[];
  /** Public branches/locations where this barber appears. */
  branches?: PublicBarberBranch[];
}

export interface BarberLocation {
  date: string;
  isWorking: boolean;
  status?: string | null;
  branch: {
    branchCode: string;
    branchName: string;
    address: string | null;
    phone: string | null;
  } | null;
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export interface BarberCalendarDay {
  date: string;
  available: boolean;
  shifts?: { start: string; end: string }[];
}

// ─── Availability ────────────────────────────────────────────────────────────

export interface AvailableDay {
  date: string;
  available: boolean;
  reason?: string | null;
}

export interface AvailableSlot {
  time: string;
  label?: string | null;
  available: boolean;
  dayOffset?: number | null;
  empId?: number | null;
  barberName?: string | null;
  durationMinutes?: number | null;
  durationSource?: string | null;
  reason?: string | null;
  /** Set when selected from cross-branch availability (barber-first). */
  branchCode?: string | null;
  branchName?: string | null;
  /** Calendar date YYYY-MM-DD when selected from cross-branch availability. */
  date?: string | null;
}

// ─── Cross-branch availability (Phase 10C / 10D) ─────────────────────────────

export interface CrossBranchSlot {
  branchCode: string;
  branchName: string;
  date: string;
  time: string;
  dayOffset: 0 | 1;
}

export interface CrossBranchAvailabilityMeta {
  slotCount: number;
  branchCount: number;
  dayCount: number;
  queryCount?: number;
  timingMs?: Record<string, number>;
  cacheHit?: boolean;
  failedBranchCodes?: string[];
  contractVersion?: string;
  generatedAt?: string;
}

export interface CrossBranchAvailabilityResponse {
  ok: boolean;
  barber: { empId: number; nameAr: string };
  branches: PublicBarberBranch[];
  days: string[];
  slots: CrossBranchSlot[];
  meta?: CrossBranchAvailabilityMeta;
}

// ─── Check Slot ──────────────────────────────────────────────────────────────

export interface CheckSlotRequest {
  branchCode: string;
  date: string;
  time: string;
  serviceIds: number[];
  mode: "specific" | "nearest";
  empId?: number;
  dayOffset?: number;
}

export interface CheckSlotResponse {
  available: boolean;
  reason?: string | null;
}

// ─── Plan ────────────────────────────────────────────────────────────────────

export interface BookingPlanRequest {
  branchCode: string;
  customer: BookingCustomer;
  serviceIds: number[];
  date: string;
  time: string;
  dayOffset?: number;
  mode: "specific" | "nearest";
  empId?: number;
  notes?: string;
}

export interface BookingPlanItem {
  serviceId: number;
  serviceName: string;
  empId: number;
  empName: string;
  /** English barber name when API provides nameEn. */
  empNameEn?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  price: number;
  bookingCode: string;
}

export interface BookingPlan {
  plan: BookingPlanItem[];
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

// ─── Create ──────────────────────────────────────────────────────────────────

export interface BookingCustomer {
  name: string;
  phone: string;
}

export interface BookingCreateRequest {
  branchCode: string;
  customer: BookingCustomer;
  serviceIds: number[];
  date: string;
  time: string;
  dayOffset?: number;
  mode: "specific" | "nearest";
  empId?: number;
  notes?: string;
  planToken: string;
  clientRequestId: string;
}

export interface BookingCreateResponse {
  bookingCode: string;
  bookingAccessToken?: string;
  date: string;
  time: string;
  barberName: string;
  services: string[];
  totalPrice?: number;
  totalDurationMinutes?: number;
  message?: string;
  branchCode?: string;
  branchName?: string;
}

// ─── Lookup ──────────────────────────────────────────────────────────────────

export interface PublicBooking {
  bookingCode: string;
  date: string;
  time: string;
  dayOffset?: number | null;
  barberName?: string | null;
  services?: { name: string; price?: number | null; duration?: number | null }[] | string[];
  totalPrice?: number | null;
  totalDuration?: number | null;
  status?: string | null;
  canCancel?: boolean | null;
  branchCode?: string | null;
  branchName?: string | null;
  customerName?: string | null;
  /** When backend returns limited public fields without ownership proof */
  ownershipLevel?: "full" | "minimal" | string | null;
}

// ─── Upcoming ────────────────────────────────────────────────────────────────

export interface UpcomingBookingsResponse {
  bookings: PublicBooking[];
}

// ─── Cancel ──────────────────────────────────────────────────────────────────

export interface BookingCancelRequest {
  code?: string;
  phone?: string;
  bookingAccessToken?: string;
  reasonCode?: string;
  reasonText?: string;
  clientRequestId: string;
}

export interface BookingCancelResponse {
  cancelled: boolean;
  message?: string;
}

// ─── Error Codes ─────────────────────────────────────────────────────────────

export type PublicBookingErrorCode =
  | "BRANCH_REQUIRED"
  | "INVALID_BRANCH"
  | "BOOKING_DISABLED"
  | "SERVICE_NOT_FOUND"
  | "SERVICE_NOT_BOOKABLE"
  | "BARBER_NOT_FOUND"
  | "BARBER_NOT_AVAILABLE"
  | "SLOT_NOT_AVAILABLE"
  | "SLOT_CONFLICT"
  | "PLAN_TOKEN_EXPIRED"
  | "PLAN_TOKEN_REQUEST_MISMATCH"
  | "PLAN_TOKEN_REQUIRED"
  | "PLAN_TOKEN_INVALID"
  | "PLAN_CREATE_MISMATCH"
  | "SLOT_UNAVAILABLE"
  | "NO_ELIGIBLE_BARBER"
  | "EMPLOYEE_INTERVAL_BUSY_GLOBAL"
  | "BARBER_FULLY_BOOKED"
  | "BOOKING_NOT_FOUND"
  | "BOOKING_NOT_FOUND_OR_UNAUTHORIZED"
  | "BOOKING_ALREADY_CANCELLED"
  | "BOOKING_ALREADY_IN_SERVICE"
  | "BOOKING_ALREADY_COMPLETED"
  | "BOOKING_HAS_PAYMENT"
  | "BOOKING_CANCELLATION_REQUIRES_STAFF"
  | "BOOKING_CANCELLATION_WINDOW_CLOSED"
  | "BOOKING_NOT_CANCELLABLE"
  | "CANCEL_NOT_ALLOWED"
  | "CANCEL_TOO_LATE"
  | "CUSTOMER_PHONE_REQUIRED"
  | "CUSTOMER_NAME_REQUIRED"
  | "RATE_LIMIT_EXCEEDED"
  | "VALIDATION_ERROR"
  | "IDEMPOTENT_REQUEST_CONFLICT"
  | "INTERNAL_ERROR"
  | "UNKNOWN_ERROR";

// ─── Booking Mode ────────────────────────────────────────────────────────────

export type BookingMode = "specific" | "nearest";

// ─── Entry Mode ──────────────────────────────────────────────────────────────

export type BookingEntryMode = "branch_first" | "barber_first";

// ─── Response Metadata ───────────────────────────────────────────────────────

export interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
  retryAfterSeconds: number | null;
}

export interface ResponseMetadata {
  contractVersion: string | null;
  contractUnverified: boolean;
  requestId: string | null;
  rateLimit: RateLimitInfo;
  deprecated: boolean;
  warning: string | null;
}

// ─── API Response wrapper ────────────────────────────────────────────────────

export interface BookingApiResponse<T> {
  data: T;
  metadata: ResponseMetadata;
  httpStatus: number;
}
