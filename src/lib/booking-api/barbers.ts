import { bookingApiRequest } from "./client";
import type {
  PublicBarber,
  PublicBarberBranch,
  BarberCalendarDay,
  BarberLocation,
  BookingApiResponse,
} from "./types";

interface BarbersResponse {
  ok: boolean;
  barbers: Array<
    PublicBarber & {
      empId?: number;
      nameAr?: string;
      job?: string | null;
    }
  >;
}

interface CalendarResponse {
  ok: boolean;
  days?: BarberCalendarDay[];
  calendar?: BarberCalendarDay[];
}

interface LocationApiResponse {
  ok: boolean;
  date: string;
  isWorking: boolean;
  status?: string | null;
  branch: BarberLocation["branch"];
}

function normalizeBarber(raw: BarbersResponse["barbers"][number]): PublicBarber {
  const id = Number(raw.id ?? raw.empId);
  const branches = (raw.branches ?? [])
    .filter((b) => b?.branchCode && b.branchCode.toUpperCase() !== "CAMP_CAESAR")
    .map(
      (b): PublicBarberBranch => ({
        branchCode: b.branchCode,
        branchName: b.branchName,
      }),
    );
  return {
    id,
    name: raw.name ?? raw.nameAr ?? "",
    job: raw.job ?? null,
    photoUrl: raw.photoUrl ?? null,
    bio: raw.bio ?? null,
    isBookableOnline: raw.isBookableOnline !== false,
    serviceIds: Array.isArray(raw.serviceIds)
      ? raw.serviceIds.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : undefined,
    branches: branches.length ? branches : undefined,
  };
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
  return { ...res, data: (res.data.barbers ?? []).map(normalizeBarber) };
}

export async function listGlobalBarbers(
  signal?: AbortSignal,
): Promise<BookingApiResponse<PublicBarber[]>> {
  const res = await bookingApiRequest<BarbersResponse>({
    path: "/api/public/booking/barbers",
    signal,
    timeoutMs: 15_000,
  });
  return { ...res, data: (res.data.barbers ?? []).map(normalizeBarber) };
}

/**
 * Resolve a public barber profile (branches + serviceIds) for barber-first entry.
 */
export async function getPublicBarberProfile(
  empId: number,
  signal?: AbortSignal,
): Promise<BookingApiResponse<PublicBarber | null>> {
  const res = await listGlobalBarbers(signal);
  const found = (res.data ?? []).find((b) => b.id === empId) ?? null;
  return { ...res, data: found };
}

export async function getBarberCalendar(
  empId: number,
  params?: { branchCode?: string; from?: string; to?: string },
  signal?: AbortSignal,
): Promise<BookingApiResponse<BarberCalendarDay[]>> {
  const res = await bookingApiRequest<CalendarResponse>({
    path: `/api/public/booking/barbers/${empId}/calendar`,
    query: {
      branchCode: params?.branchCode,
      from: params?.from,
      to: params?.to,
    },
    signal,
    timeoutMs: 15_000,
  });
  return { ...res, data: res.data.days ?? res.data.calendar ?? [] };
}

export async function getBarberLocation(
  empId: number,
  params: { date: string; serviceIds?: number[] },
  signal?: AbortSignal,
): Promise<BookingApiResponse<BarberLocation>> {
  const res = await bookingApiRequest<LocationApiResponse>({
    path: `/api/public/booking/barbers/${empId}/location`,
    query: {
      date: params.date,
      serviceIds: params.serviceIds?.length
        ? params.serviceIds.join(",")
        : undefined,
    },
    signal,
    timeoutMs: 15_000,
  });
  return {
    ...res,
    data: {
      date: res.data.date,
      isWorking: res.data.isWorking,
      status: res.data.status,
      branch:
        res.data.branch &&
        res.data.branch.branchCode?.toUpperCase() !== "CAMP_CAESAR"
          ? res.data.branch
          : null,
    },
  };
}
