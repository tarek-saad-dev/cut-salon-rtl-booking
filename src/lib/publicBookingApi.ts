// ─── Timezone Contract ───────────────────────────────────────────────────────
// Official timezone: Africa/Cairo
// Dates MUST be sent as YYYY-MM-DD (local Cairo date, never ISO UTC)
// Times MUST be sent as HH:mm (24h)
// DayOfWeek: 0=Sunday … 6=Saturday
// ─────────────────────────────────────────────────────────────────────────────

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

function assertLocalDate(date: string, ctx: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`[${ctx}] date must be YYYY-MM-DD, got: "${date}"`);
  }
}

function assertLocalTime(time: string, ctx: string): void {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new Error(`[${ctx}] time must be HH:mm, got: "${time}"`);
  }
}

export async function getAvailableSlots(
  params: GetAvailableSlotsParams,
): Promise<AvailableSlotsResponse> {
  assertLocalDate(params.date, "getAvailableSlots");
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

// ─── Create booking (legacy — kept for reference) ────────────────────────────

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
  constructor(public serverMessage?: string) {
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

// ─── Booking Plan (multi-service) ────────────────────────────────────────────

export interface BookingPlanRequest {
  customer: CreateBookingCustomer;
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
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  price: number;
  bookingCode: string;
  bookingId: number;
}

export interface BookingPlanResponse {
  ok: boolean;
  plan: BookingPlanItem[];
  totalDurationMinutes: number;
  totalPrice: number;
  bookingCodes: string[];
  message?: string;
}

export class BookingPlanError extends Error {
  constructor(public serverMessage?: string) {
    super(serverMessage ?? "BOOKING_PLAN_ERROR");
    this.name = "BookingPlanError";
  }
}

// ─── Client Profile ───────────────────────────────────────────────────────────

export interface ClientProfile {
  id: number | string;
  name: string;
  phone: string;
  registeredAt?: string | null;
}

export interface ClientProfileResponse {
  ok: boolean;
  client: ClientProfile | null;
  upcomingBookingsCount: number;
}

export async function getClientProfile(
  phone: string,
): Promise<ClientProfileResponse> {
  const url = buildBookingApiUrl("/api/public/client/profile");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[publicBookingApi] getClientProfile non-ok:",
          res.status,
          data,
        );
      }
      return { ok: false, client: null, upcomingBookingsCount: 0 };
    }
    return {
      ok: true,
      client: data.client ?? null,
      upcomingBookingsCount: data.upcomingBookingsCount ?? 0,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[publicBookingApi] getClientProfile error:", error);
    }
    return { ok: false, client: null, upcomingBookingsCount: 0 };
  }
}

// ─── Upcoming bookings ────────────────────────────────────────────────────────

export interface UpcomingBookingService {
  id?: number | string;
  name: string;
  price?: number | null;
  duration?: number | null;
}

export interface UpcomingBooking {
  id: number | string;
  customerName?: string | null;
  phone: string;
  date: string;
  time: string;
  barberId?: number | string | null;
  barberName?: string | null;
  services?: UpcomingBookingService[] | string[] | null;
  totalPrice?: number | null;
  totalDuration?: number | null;
  status?: string | null;
  canCancel?: boolean | null;
}

export interface UpcomingBookingsResponse {
  ok: boolean;
  bookings: UpcomingBooking[];
}

export interface CancelBookingResponse {
  ok: boolean;
  message?: string;
}

export async function getUpcomingBookings(
  phone: string,
): Promise<UpcomingBookingsResponse> {
  const url = buildBookingApiUrl("/api/public/booking/upcoming");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[publicBookingApi] getUpcomingBookings non-ok:",
          res.status,
          data,
        );
      }
      return { ok: false, bookings: [] };
    }
    return { ok: true, bookings: data.bookings ?? [] };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[publicBookingApi] getUpcomingBookings error:", error);
    }
    return { ok: false, bookings: [] };
  }
}

export async function cancelBooking(input: {
  bookingId: number | string;
  phone: string;
}): Promise<CancelBookingResponse> {
  const url = buildBookingApiUrl("/api/public/booking/cancel");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId: input.bookingId, phone: input.phone }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    message?: string;
    error?: string;
  };
  if (!res.ok || !data?.ok) {
    throw new Error(data?.message ?? data?.error ?? `HTTP ${res.status}`);
  }
  return { ok: true, message: data.message };
}

export async function createBookingPlan(
  body: BookingPlanRequest,
): Promise<BookingPlanResponse> {
  assertLocalDate(body.date, "createBookingPlan");
  if (body.time) assertLocalTime(body.time, "createBookingPlan");
  const url = buildBookingApiUrl("/api/public/booking/plan");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(body),
    });
    if (res.status === 409) {
      const raw = await res.text().catch(() => "{}");
      if (process.env.NODE_ENV === "development") {
        console.error("[booking plan] 409 response body (raw):", raw);
        try {
          console.error("[booking plan] 409 parsed:", JSON.parse(raw));
        } catch {
          /* not JSON */
        }
      }
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(raw);
      } catch {
        /* ignore */
      }
      throw new BookingConflictError(data?.message as string | undefined);
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new BookingPlanError(data?.message ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<BookingPlanResponse>;
  } catch (error) {
    if (error instanceof BookingConflictError) throw error;
    if (error instanceof BookingPlanError) throw error;
    if (process.env.NODE_ENV === "development") {
      console.error("[public booking api] createBookingPlan", url, error);
    }
    throw error;
  }
}
