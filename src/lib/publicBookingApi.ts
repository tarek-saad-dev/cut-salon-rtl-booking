// ─── Base URL ─────────────────────────────────────────────────────────────────

const BOOKING_API_BASE_URL = process.env.NEXT_PUBLIC_BOOKING_API_BASE_URL || "";

function buildBookingApiUrl(path: string): string {
  const base = BOOKING_API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface BookingConfigResponse {
  ok: boolean;
  salon: BookingSalon;
  settings: BookingSettings;
}

export interface BookingService {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
  categoryName: string | null;
  isBookableOnline: boolean;
}

export interface BookingServicesResponse {
  ok: boolean;
  services: BookingService[];
}

export interface BookingBarber {
  id: number;
  name: string;
  job: string | null;
  photoUrl: string | null;
  bio: string | null;
  isBookableOnline: boolean;
}

export interface BookingBarbersResponse {
  ok: boolean;
  barbers: BookingBarber[];
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function apiFetch<T>(fullPath: string): Promise<T> {
  const url = buildBookingApiUrl(fullPath);
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[public booking api]", url, error);
    }
    throw error;
  }
}

// ─── Public functions ─────────────────────────────────────────────────────────

export async function getBookingConfig(): Promise<BookingConfigResponse> {
  return apiFetch<BookingConfigResponse>("/api/public/booking/config");
}

export async function getBookingServices(): Promise<BookingServicesResponse> {
  return apiFetch<BookingServicesResponse>("/api/public/booking/services");
}

export async function getBookingBarbers(): Promise<BookingBarbersResponse> {
  return apiFetch<BookingBarbersResponse>("/api/public/booking/barbers");
}

// ─── Available days ───────────────────────────────────────────────────────────

export interface AvailableDay {
  date: string;
  available: boolean;
  reason?: string | null;
}

export interface AvailableDaysResponse {
  ok: boolean;
  days: AvailableDay[];
}

export interface GetAvailableDaysParams {
  serviceIds: number[];
  mode: "specific" | "nearest";
  empId?: number;
}

export async function getAvailableDays(
  params: GetAvailableDaysParams,
): Promise<AvailableDaysResponse> {
  const qs = new URLSearchParams();
  qs.set("serviceIds", params.serviceIds.join(","));
  qs.set("mode", params.mode);
  if (params.mode === "specific" && params.empId != null) {
    qs.set("empId", String(params.empId));
  }
  return apiFetch<AvailableDaysResponse>(
    `/api/public/booking/available-days?${qs.toString()}`,
  );
}

// ─── Available slots ──────────────────────────────────────────────────────────

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
}

export interface AvailableSlotsResponse {
  ok: boolean;
  date: string;
  mode: string;
  empId?: number | null;
  slots: AvailableSlot[];
}

export interface GetAvailableSlotsParams {
  date: string;
  serviceIds: number[];
  mode: "specific" | "nearest";
  empId?: number;
}

export async function getAvailableSlots(
  params: GetAvailableSlotsParams,
): Promise<AvailableSlotsResponse> {
  const qs = new URLSearchParams();
  qs.set("date", params.date);
  qs.set("serviceIds", params.serviceIds.join(","));
  qs.set("mode", params.mode);
  if (params.mode === "specific" && params.empId != null) {
    qs.set("empId", String(params.empId));
  }
  return apiFetch<AvailableSlotsResponse>(
    `/api/public/booking/available-slots?${qs.toString()}`,
  );
}

// ─── Create booking ───────────────────────────────────────────────────────────

export interface CreateBookingCustomer {
  name: string;
  phone: string;
}

export interface CreateBookingRequest {
  customer: CreateBookingCustomer;
  serviceIds: number[];
  date: string;
  time: string;
  mode: "specific" | "nearest";
  empId: number;
  notes?: string;
}

export interface CreatedBooking {
  bookingCode: string;
  date: string;
  time: string;
  barberName: string;
  services: string[];
}

export interface CreateBookingResponse {
  ok: boolean;
  booking: CreatedBooking;
}

export class BookingConflictError extends Error {
  constructor() {
    super("CONFLICT");
    this.name = "BookingConflictError";
  }
}

export async function createBooking(
  body: CreateBookingRequest,
): Promise<CreateBookingResponse> {
  const url = buildBookingApiUrl("/api/public/booking/create");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(body),
    });
    if (res.status === 409) throw new BookingConflictError();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<CreateBookingResponse>;
  } catch (error) {
    if (error instanceof BookingConflictError) throw error;
    if (process.env.NODE_ENV === "development") {
      console.error("[public booking api] createBooking", url, error);
    }
    throw error;
  }
}
