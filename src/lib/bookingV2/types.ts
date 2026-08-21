/** Booking V2 Instant Read Layer — Hawai contract: booking-v2-frontend-read-v1 */

export type BusinessDate = string; // YYYY-MM-DD
export type LocalTime = string; // HH:mm
export type BranchCode = "GLEEM" | "CAMP_CAESAR" | (string & {});

export type BookingModeV2 = "specific" | "nearest";

export interface BookingV2Salon {
  name: string;
  logoUrl: string | null;
  timezone: string;
  currency: string;
  bookingEnabled: boolean;
}

export interface BookingV2Settings {
  allowSpecificBarber: boolean;
  allowNearestBarber: boolean;
  defaultMode: BookingModeV2;
  slotIntervalMinutes: number;
  maxBookingDaysAhead: number;
  minNoticeMinutes: number;
  matrixDays?: number;
}

export interface BookingV2Branch {
  branchCode: BranchCode;
  branchName: string;
  shortName?: string | null;
  timeZone?: string | null;
  address?: string | null;
  phone?: string | null;
}

export interface BookingV2Service {
  id: number;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  price: number;
  durationMinutes: number;
  categoryName: string | null;
  isBookableOnline: boolean;
  imageUrl?: string | null;
}

export interface BookingV2BarberBranch {
  branchCode: BranchCode;
  branchName: string;
}

export interface BookingV2Barber {
  empId: number;
  id?: number;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  job?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  isBookableOnline: boolean;
  serviceIds?: number[];
  branches: BookingV2BarberBranch[];
}

export interface BookingV2Bootstrap {
  ok: boolean;
  contract?: string;
  salon: BookingV2Salon;
  settings: BookingV2Settings;
  branches: BookingV2Branch[];
  services: BookingV2Service[];
  barbers: BookingV2Barber[];
  etag?: string | null;
  fetchedAt: number;
  revision?: string | null;
}

/** Half-open free range on 48h business-day timeline (minutes from midnight). */
export interface FreeRange {
  startMin: number;
  endMin: number;
}

/** @deprecated prefer FreeRange startMin/endMin from Hawai matrix */
export interface FreeWindow {
  start: LocalTime;
  end: LocalTime;
  endDayOffset?: 0 | 1;
  startMin?: number;
  endMin?: number;
}

export type DayEmployeeStatus =
  | "available"
  | "day_off"
  | "fully_booked"
  | "closed"
  | "unknown";

export interface MatrixEmployeeDay {
  empId: number;
  empName?: string | null;
  status: DayEmployeeStatus;
  free: FreeWindow[];
  freeRanges: FreeRange[];
  branchCode?: BranchCode;
}

export interface MatrixBranchDay {
  branchCode: BranchCode;
  branchName?: string | null;
  employees: MatrixEmployeeDay[];
}

export interface MatrixDay {
  businessDate: BusinessDate;
  branches: MatrixBranchDay[];
}

export interface AvailabilityScope {
  mode: BookingModeV2;
  empId?: number;
  branchCodes: BranchCode[];
}

export interface AvailabilityMatrix {
  ok: boolean;
  fromBusinessDate: BusinessDate;
  toBusinessDate: BusinessDate;
  days: number;
  scope: AvailabilityScope;
  matrix: MatrixDay[];
  slotIntervalMinutes: number;
  etag?: string | null;
  fetchedAt: number;
  stale?: boolean;
}

export interface AvailabilityRequest {
  mode: BookingModeV2;
  empId?: number;
  branchCodes: BranchCode[];
  fromBusinessDate: BusinessDate;
  toBusinessDate: BusinessDate;
  days?: number;
}

export interface GeneratedSlot {
  businessDate: BusinessDate;
  time: LocalTime;
  dayOffset: 0 | 1;
  available: boolean;
  empId: number;
  barberName?: string | null;
  branchCode: BranchCode;
  durationMinutes: number;
  label?: string | null;
  startMin?: number;
}

export type LoadState = "idle" | "loading" | "ready" | "empty" | "error" | "stale";

export interface ResourceState<T> {
  status: LoadState;
  data: T | null;
  error: string | null;
  stale: boolean;
}
