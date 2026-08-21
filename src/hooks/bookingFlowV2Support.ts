/**
 * Shared V2 availability derivation for BookingModal / useBookingFlow.
 * Pure helpers — no React. Network only via getAvailabilityMatrix / bootstrap APIs.
 */
import {
  getAvailabilityMatrix,
  getBookingBootstrap,
  getCachedAvailability,
  getCachedBootstrap,
} from "@/lib/bookingV2/api";
import {
  findBootstrapBarber,
  mapBootstrapBarbers,
  mapBootstrapConfig,
  mapBootstrapServices,
} from "@/lib/bookingV2/catalogMap";
import {
  generateSlotsForBusinessDate,
  matrixToAvailableDays,
  toLegacyAvailableSlot,
} from "@/lib/bookingV2/localAvailability";
import { resolveAvailabilityScope, toAvailabilityRequest } from "@/lib/bookingV2/scope";
import { localDateToBusinessDate, todayBusinessDate } from "@/lib/bookingV2/businessDate";
import type {
  AvailabilityMatrix,
  AvailabilityScope,
  BookingV2Bootstrap,
  BookingV2Barber,
} from "@/lib/bookingV2/types";
import type {
  AvailableDay,
  AvailableSlot,
  BarberAvailableDay,
  BarberAvailableSlot,
  BookingConfig,
  BookingService,
  BookingServiceCategory,
  PublicBarber,
} from "@/lib/booking-api/types";

export async function ensureBookingV2Bootstrap(): Promise<BookingV2Bootstrap> {
  const cached = getCachedBootstrap();
  if (cached) {
    void getBookingBootstrap().catch(() => undefined);
    return cached;
  }
  return getBookingBootstrap({ force: false });
}

export function catalogFromBootstrap(boot: BookingV2Bootstrap): {
  config: BookingConfig;
  services: BookingService[];
  categories: BookingServiceCategory[];
  barbers: PublicBarber[];
} {
  const { services, categories } = mapBootstrapServices(boot);
  return {
    config: mapBootstrapConfig(boot),
    services,
    categories,
    barbers: mapBootstrapBarbers(boot),
  };
}

export function resolveV2Scope(input: {
  mode: "specific" | "nearest";
  empId?: number | null;
  barber?: BookingV2Barber | null;
  selectedBranchCode?: string | null;
  allBranchCodes: string[];
  availabilityScope?: "all_branches" | "specific_branch" | null;
  specificBranchCode?: string | null;
}): AvailabilityScope {
  if (input.mode === "nearest") {
    return resolveAvailabilityScope({
      mode: "nearest",
      selectedBranchCode: input.selectedBranchCode,
      allBranchCodes: input.allBranchCodes,
    });
  }

  const barber = input.barber ?? null;
  const base = resolveAvailabilityScope({
    mode: "specific",
    empId: input.empId ?? undefined,
    barber,
    selectedBranchCode: input.selectedBranchCode,
    allBranchCodes: input.allBranchCodes,
  });

  // UI "specific_branch" narrows an already multi-branch barber to one code for filtering,
  // but we still prefer one matrix covering all barber branches when all_branches or Zeyad.
  if (input.availabilityScope === "specific_branch" && input.specificBranchCode) {
    return {
      mode: "specific",
      empId: base.empId,
      branchCodes: [input.specificBranchCode],
    };
  }

  return base;
}

export async function loadV2Matrix(
  scope: AvailabilityScope,
  days = 14,
): Promise<AvailabilityMatrix> {
  const from = todayBusinessDate();
  const request = toAvailabilityRequest(scope, from, days);
  const cached = getCachedAvailability(request);
  if (cached && cached.matrix.length > 0 && !cached.stale) {
    // Fresh enough — avoid immediate duplicate SWR on every effect re-run.
    // Background refresh only if older than 60s.
    if (Date.now() - cached.fetchedAt < 60_000) return cached;
  }
  return getAvailabilityMatrix(request, { force: false });
}

export function deriveV2Days(
  matrix: AvailabilityMatrix | null,
  opts: {
    mode: "specific" | "nearest";
    empId?: number | null;
    branchCode?: string | null;
    durationMinutes: number;
    intervalMinutes: number;
    minNoticeMinutes?: number;
  },
): { days: AvailableDay[]; multiBranchDays: BarberAvailableDay[] } {
  if (!matrix) return { days: [], multiBranchDays: [] };

  // A day is available if any local start fits for current duration.
  const days: AvailableDay[] = matrix.matrix.map((day) => {
    const slots = generateSlotsForBusinessDate({
      matrix,
      businessDate: day.businessDate,
      durationMinutes: opts.durationMinutes,
      intervalMinutes: opts.intervalMinutes,
      minNoticeMinutes: opts.minNoticeMinutes,
      branchCode: opts.branchCode,
      empId: opts.mode === "specific" ? opts.empId : null,
      mode: opts.mode,
    });
    return {
      date: day.businessDate,
      available: slots.length > 0,
      reason: slots.length > 0 ? null : "no_free_windows",
    };
  });

  const multiBranchDays: BarberAvailableDay[] = days.map((d) => {
    const matrixDay = matrix.matrix.find((x) => x.businessDate === d.date);
    const branches =
      matrixDay?.branches
        .map((b) => {
          if (opts.branchCode && String(b.branchCode).toUpperCase() !== String(opts.branchCode).toUpperCase()) {
            return null;
          }
          const slots = generateSlotsForBusinessDate({
            matrix,
            businessDate: d.date,
            durationMinutes: opts.durationMinutes,
            intervalMinutes: opts.intervalMinutes,
            minNoticeMinutes: opts.minNoticeMinutes,
            branchCode: b.branchCode,
            empId: opts.mode === "specific" ? opts.empId : null,
            mode: opts.mode,
          });
          if (slots.length === 0) return null;
          return {
            branchCode: b.branchCode,
            branchName: b.branchName ?? b.branchCode,
            slotsCount: slots.length,
            earliestTime: slots[0]?.time ?? null,
            hasOvernightSlots: slots.some((s) => s.dayOffset === 1),
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x));
    return { ...d, branches };
  });

  return { days, multiBranchDays };
}

export function deriveV2Slots(
  matrix: AvailabilityMatrix | null,
  selectedDate: Date | undefined,
  opts: {
    mode: "specific" | "nearest";
    empId?: number | null;
    branchCode?: string | null;
    durationMinutes: number;
    intervalMinutes: number;
    minNoticeMinutes?: number;
  },
): { slots: AvailableSlot[]; multiBranchSlots: BarberAvailableSlot[] } {
  if (!matrix || !selectedDate || opts.durationMinutes <= 0) {
    return { slots: [], multiBranchSlots: [] };
  }
  const businessDate = localDateToBusinessDate(selectedDate);
  const generated = generateSlotsForBusinessDate({
    matrix,
    businessDate,
    durationMinutes: opts.durationMinutes,
    intervalMinutes: opts.intervalMinutes,
    minNoticeMinutes: opts.minNoticeMinutes,
    branchCode: opts.branchCode,
    empId: opts.mode === "specific" ? opts.empId : null,
    mode: opts.mode,
  });

  const slots = generated.map((s) => {
    const legacy = toLegacyAvailableSlot(s);
    return {
      ...legacy,
      date: s.businessDate,
      businessDate: s.businessDate,
      startMin: s.startMin,
    } satisfies AvailableSlot;
  });

  const multiBranchSlots: BarberAvailableSlot[] = slots.map((s) => ({
    ...s,
    branchCode: s.branchCode ?? opts.branchCode ?? "GLEEM",
    branchName: s.branchName ?? s.branchCode ?? null,
    date: s.businessDate ?? businessDate,
    empId: s.empId,
    dayOffset: s.dayOffset,
  }));

  return { slots, multiBranchSlots };
}

export function bootstrapBarberForFlow(
  boot: BookingV2Bootstrap | null,
  empId: number | null | undefined,
): BookingV2Barber | null {
  return findBootstrapBarber(boot, empId);
}

/** Re-export for calendar empty-state when matrix has days but duration filters all. */
export { matrixToAvailableDays };
