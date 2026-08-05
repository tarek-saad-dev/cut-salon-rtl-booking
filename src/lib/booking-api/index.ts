// Central booking API client
export { bookingApiRequest } from "./client";
export { getBookingApiBaseUrl } from "./env";
export { BookingApiError, getArabicErrorMessage, getLocalizedBookingErrorMessage } from "./errors";

// API modules
export { listPublicBranches } from "./branches";
export { normalizeBranchCode, branchCodesEqual } from "./branch-code";
export {
  resolveBookableBranchesForBarber,
  type BarberBranchResolution,
  type ResolveBookableBranchesResult,
} from "./resolve-bookable-branches";
export {
  getBookingSteps,
  recoverStepInSequence,
  findBranchByCode,
  type BookingStepId,
} from "./booking-steps";
export {
  getEffectiveBookingBranch,
  getBookingBranchDisplay,
  isPreferredBranchValidForBooking,
  localizeBranchName,
} from "./booking-branch";
export {
  getBarberAvailableDays,
  getBarberAvailableSlots,
  peekCachedBarberAvailableDays,
  peekCachedBarberAvailableSlots,
  barberSlotKey,
  type BarberAvailabilityScope,
  type BarberAvailableDay,
  type BarberAvailableSlot,
  type BarberDayBranchSummary,
  type BarberAvailabilityMeta,
} from "./barber-availability";
export {
  isBarberEligibleForPublicDiscovery,
  filterBarbersForPublicDiscovery,
  isBarberAssignedToBranch,
  filterBarbersForBranchRoster,
} from "./barber-eligibility";
export { getBookingConfig, getBookingStatus, getServices } from "./services";
export {
  listBranchBarbers,
  listGlobalBarbers,
  getPublicBarberProfile,
  getBarberCalendar,
  getBarberLocation,
  getCrossBranchAvailability,
  crossBranchSlotKey,
  cairoTodayYmd,
  CROSS_BRANCH_AVAILABILITY_DEFAULT_DAYS,
  CROSS_BRANCH_AVAILABILITY_MAX_DAYS,
} from "./barbers";
export { resolveBarberPhotoUrl } from "./barber-photo";
export { resolveBarberDisplayName } from "./barber-name";
export {
  serviceNameAr,
  serviceNameEn,
  formatServiceLabelBilingual,
  formatServicesSummary,
} from "./service-name";
export { getAvailableDays, getAvailableSlots, peekCachedAvailableDays, peekCachedAvailableSlots, prefetchAvailableSlots, checkSlot } from "./availability";
export {
  createBookingPlan,
  submitBookingFromPlan,
  submitBookingCancellation,
  lookupBooking,
  getUpcomingBookings,
} from "./booking";

// Idempotency
export {
  createClientRequestId,
  getOrCreateMutationId,
  completeMutationId,
  abandonMutationId,
  buildCreateOperationKey,
  buildCancelOperationKey,
} from "./idempotency";

// Plan session
export {
  savePlanSession,
  getPlanSession,
  clearPlanSession,
  isPlanMatchingSelection,
} from "./plan-session";

// Booking access store
export {
  saveBookingAccess,
  getBookingAccess,
  removeBookingAccess,
  clearExpiredBookingAccess,
} from "./booking-access-store";

// Request dedup
export {
  deduplicatedRequest,
  abortRequestsMatching,
  abortAllRequests,
  buildRequestKey,
  incrementSelectionVersion,
  isStaleResponse,
} from "./request-dedup";

// Timeout
export { TIMEOUT_MS, getTimeoutMs } from "./timeout";

// Contract limits (booking-public-v1)
export {
  UPCOMING_BOOKINGS_MAX_LIMIT,
  UPCOMING_BOOKINGS_DEFAULT_LIMIT,
  BOOKING_CODE_MAX_LENGTH,
  BOOKING_CODE_MIN_LENGTH,
  clampUpcomingLimit,
  normalizeBookingCode,
  isValidBookingCodeShape,
} from "./limits";

// State
export {
  createInitialBookingState,
  setBranch,
  setServices,
  setBarber,
  setDate,
  setTime,
  setPlan,
  clearAfterSuccess,
  resetBookingState,
} from "./state";

// Types
export type * from "./types";
