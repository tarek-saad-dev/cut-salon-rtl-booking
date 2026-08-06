/**
 * Shared fixtures for BookingModal / useBookingFlow Phase 8B1 tests.
 * Each test file must mock `@/lib/booking-api` itself — never raw fetch.
 */
import { vi } from "vitest";
import type {
  BookingPlan,
  BookingCreateResponse,
  AvailableDay,
  AvailableSlot,
  BookingService,
  BookingServiceCategory,
  ServicesCatalog,
  PublicBarber,
  BookingConfig,
} from "@/lib/booking-api";
import { BookingApiError } from "@/lib/booking-api/errors";

export const mockConfig: BookingConfig = {
  salon: {
    name: "Cut",
    logoUrl: null,
    timezone: "Africa/Cairo",
    currency: "EGP",
    bookingEnabled: true,
  },
  settings: {
    allowSpecificBarber: true,
    allowNearestBarber: true,
    defaultMode: "specific",
    slotIntervalMinutes: 15,
    maxBookingDaysAhead: 14,
    minNoticeMinutes: 30,
  },
};

export const mockServices: BookingService[] = [
  {
    id: 10,
    name: "Hair Cut",
    nameAr: "حلاقة",
    nameEn: "Hair Cut",
    price: 100,
    durationMinutes: 30,
    categoryId: "19",
    categoryName: "قص الشعر",
    categoryNameAr: "قص الشعر",
    categoryNameEn: "Hair Cut",
    isBookableOnline: true,
  },
  {
    id: 11,
    name: "Beard",
    nameAr: "ذقن",
    nameEn: "Beard",
    price: 50,
    durationMinutes: 15,
    categoryId: "20",
    categoryName: "خدمات اللحية",
    categoryNameAr: "خدمات اللحية",
    categoryNameEn: "Beard Cut",
    isBookableOnline: true,
  },
];

export const mockServiceCategories: BookingServiceCategory[] = [
  {
    id: "19",
    name: "قص الشعر",
    nameAr: "قص الشعر",
    nameEn: "Hair Cut",
    sortOrder: 10,
    serviceCount: 1,
    services: [mockServices[0]!],
  },
  {
    id: "20",
    name: "خدمات اللحية",
    nameAr: "خدمات اللحية",
    nameEn: "Beard Cut",
    sortOrder: 20,
    serviceCount: 1,
    services: [mockServices[1]!],
  },
];

export const mockServicesCatalog: ServicesCatalog = {
  services: mockServices,
  categories: mockServiceCategories,
  mostPopular: {
    id: "most_popular",
    title: "الأكثر طلباً",
    titleAr: "الأكثر طلباً",
    titleEn: "Most Popular",
    services: [
      {
        ...mockServices[0]!,
        popularityRank: 1,
        isMostRequested: true,
      },
    ],
  },
};

export const mockBarbers: PublicBarber[] = [
  { id: 5, name: "أحمد", nameAr: "أحمد", nameEn: "Ahmed", job: null, imageUrl: null, photoUrl: null, bio: null, isBookableOnline: true },
  { id: 6, name: "محمود", nameAr: "محمود", nameEn: "Mahmoud", job: null, imageUrl: null, photoUrl: null, bio: null, isBookableOnline: true },
];

export const mockDays: AvailableDay[] = [
  { date: "2026-07-28", available: true },
];

export const mockSlots: AvailableSlot[] = [
  { time: "10:00", label: "10:00 ص", dayOffset: 0, available: true },
  { time: "00:30", label: "12:30 ص", dayOffset: 1, available: true },
];

export const mockPlan: BookingPlan = {
  plan: [
    {
      serviceId: 10,
      serviceName: "حلاقة",
      empId: 5,
      empName: "أحمد",
      date: "2026-07-28",
      startTime: "10:00",
      endTime: "10:30",
      durationMinutes: 30,
      price: 120,
      bookingCode: "PLAN-TEMP",
    },
  ],
  totalDurationMinutes: 30,
  totalPrice: 120,
  bookingCodes: [],
  planToken: "plan_tok_test",
  planFingerprint: "fp_test",
  branchCode: "GLEEM",
  branchName: "جليم",
};

export const mockCreated: BookingCreateResponse = {
  bookingCode: "BK-LIVE-001",
  date: "2026-07-28",
  time: "10:00",
  barberName: "أحمد",
  services: ["حلاقة"],
  totalPrice: 120,
  branchCode: "GLEEM",
  branchName: "جليم",
  bookingAccessToken: "access_tok_test",
};

export function apiOk<T>(data: T) {
  return {
    data,
    metadata: {
      contractVersion: "booking-public-v1",
      contractUnverified: false,
      requestId: "req-test",
      rateLimit: {
        limit: 100,
        remaining: 99,
        resetAt: null,
        retryAfterSeconds: null,
      },
      deprecated: false,
      warning: null,
    },
  };
}

export function makeApiError(
  code: string,
  opts?: { httpStatus?: number; retryAfterSeconds?: number | null },
) {
  return new BookingApiError({
    code: code as never,
    message: `خطأ: ${code}`,
    technicalMessage: null,
    metadata: null,
    httpStatus: opts?.httpStatus ?? 409,
    requestId: "req-err",
    retryAfterSeconds: opts?.retryAfterSeconds ?? null,
    isRetryable: (opts?.httpStatus ?? 409) === 429 || (opts?.httpStatus ?? 409) >= 500,
    isBusinessConflict: (opts?.httpStatus ?? 409) === 409,
  });
}

export function createBookingApiMockFns() {
  let selectionVersion = 0;
  return {
    getBookingConfig: vi.fn(),
    getServices: vi.fn(),
    listBranchBarbers: vi.fn(),
    getAvailableDays: vi.fn(),
    getAvailableSlots: vi.fn(),
    createBookingPlan: vi.fn(),
    submitBookingFromPlan: vi.fn(),
    clearPlanSession: vi.fn(),
    abandonMutationId: vi.fn(),
    buildCreateOperationKey: vi.fn(() => "op-key"),
    incrementSelectionVersion: vi.fn(() => ++selectionVersion),
    isStaleResponse: vi.fn((v: number) => v < selectionVersion),
    getArabicErrorMessage: vi.fn((code: string) => `عربي:${code}`),
    listPublicBranches: vi.fn(),
    resetSelectionVersion: () => {
      selectionVersion = 0;
    },
  };
}

export type BookingApiMockFns = ReturnType<typeof createBookingApiMockFns>;

export function installDefaultCatalogMocks(fns: BookingApiMockFns) {
  fns.resetSelectionVersion();
  fns.getBookingConfig.mockResolvedValue(apiOk(mockConfig));
  fns.getServices.mockResolvedValue(apiOk(mockServicesCatalog));
  fns.listBranchBarbers.mockResolvedValue(apiOk(mockBarbers));
  fns.getAvailableDays.mockResolvedValue(apiOk(mockDays));
  fns.getAvailableSlots.mockResolvedValue(apiOk(mockSlots));
  fns.createBookingPlan.mockResolvedValue(apiOk(mockPlan));
  fns.submitBookingFromPlan.mockResolvedValue({
    outcome: "success",
    booking: mockCreated,
  });
}
