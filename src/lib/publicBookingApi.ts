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

// ─── Future endpoints (ready to use) ──────────────────────────────────────────

export function getAvailableDaysUrl(params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return buildBookingApiUrl(`/api/public/booking/available-days?${qs}`);
}

export function getAvailableSlotsUrl(params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return buildBookingApiUrl(`/api/public/booking/available-slots?${qs}`);
}

export function getCheckSlotUrl(): string {
  return buildBookingApiUrl("/api/public/booking/check-slot");
}

export function getCreateBookingUrl(): string {
  return buildBookingApiUrl("/api/public/booking/create");
}
