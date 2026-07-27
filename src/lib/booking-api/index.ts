// Central booking API client
export { bookingApiRequest } from "./client";
export { getBookingApiBaseUrl } from "./env";
export { BookingApiError, getArabicErrorMessage } from "./errors";

// API modules
export { listPublicBranches } from "./branches";
export { getBookingConfig, getBookingStatus, getServices } from "./services";
export { listBranchBarbers, listGlobalBarbers, getBarberCalendar, getBarberLocation } from "./barbers";
export { getAvailableDays, getAvailableSlots, checkSlot } from "./availability";
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
