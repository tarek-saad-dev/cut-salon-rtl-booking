import { bookingApiRequest } from "./client";
import type {
  PublicBarber,
  BarberCalendarDay,
  BookingApiResponse,
} from "./types";

interface BarbersResponse {
  ok: boolean;
  barbers: PublicBarber[];
}

interface CalendarResponse {
  ok: boolean;
  calendar: BarberCalendarDay[];
}

interface LocationResponse {
  ok: boolean;
  location: Record<string, unknown>;
}

export async function listBranchBarbers(
  branchCode: string,
  signal?: AbortSignal,
): Promise<BookingApiResponse<PublicBarber[]>> {
  const res = await bookingApiRequest<BarbersResponse>({
    path: "/api/public/booking/barbers",
    query: { branchCode },
    signal,
    timeoutMs: 15_000,
  });
  return { ...res, data: res.data.barbers };
}

export async function listGlobalBarbers(
  signal?: AbortSignal,
): Promise<BookingApiResponse<PublicBarber[]>> {
  const res = await bookingApiRequest<BarbersResponse>({
    path: "/api/public/booking/barbers",
    signal,
    timeoutMs: 15_000,
  });
  return { ...res, data: res.data.barbers };
}

export async function getBarberCalendar(
  empId: number,
  params?: { branchCode?: string },
  signal?: AbortSignal,
): Promise<BookingApiResponse<BarberCalendarDay[]>> {
  const res = await bookingApiRequest<CalendarResponse>({
    path: `/api/public/booking/barbers/${empId}/calendar`,
    query: params?.branchCode ? { branchCode: params.branchCode } : undefined,
    signal,
    timeoutMs: 15_000,
  });
  return { ...res, data: res.data.calendar };
}

export async function getBarberLocation(
  empId: number,
  signal?: AbortSignal,
): Promise<BookingApiResponse<Record<string, unknown>>> {
  const res = await bookingApiRequest<LocationResponse>({
    path: `/api/public/booking/barbers/${empId}/location`,
    signal,
    timeoutMs: 15_000,
  });
  return { ...res, data: res.data.location };
}
