import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  apiOk,
  installDefaultCatalogMocks,
  mockPlan,
} from "./bookingModalTestUtils";

const { fns } = vi.hoisted(() => {
  let selectionVersion = 0;
  const fns = {
    getBookingConfig: vi.fn(),
    getServices: vi.fn(),
    listBranchBarbers: vi.fn(),
    getPublicBarberProfile: vi.fn(),
    getAvailableDays: vi.fn(),
    getAvailableSlots: vi.fn(),
    getBarberAvailableDays: vi.fn(),
    getBarberAvailableSlots: vi.fn(),
    getCrossBranchAvailability: vi.fn(),
    createBookingPlan: vi.fn(),
    submitBookingFromPlan: vi.fn(),
    clearPlanSession: vi.fn(),
    abandonMutationId: vi.fn(),
    buildCreateOperationKey: vi.fn(() => "op-key"),
    incrementSelectionVersion: vi.fn(() => ++selectionVersion),
    isStaleResponse: vi.fn((v: number) => v < selectionVersion),
    getArabicErrorMessage: vi.fn((code: string) => `عربي:${code}`),
    resetSelectionVersion: () => {
      selectionVersion = 0;
    },
  };
  return { fns };
});

vi.mock("@/lib/booking-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/booking-api")>("@/lib/booking-api");
  return {
    ...actual,
    getBookingConfig: (...a: unknown[]) => fns.getBookingConfig(...a),
    getServices: (...a: unknown[]) => fns.getServices(...a),
    listBranchBarbers: (...a: unknown[]) => fns.listBranchBarbers(...a),
    getPublicBarberProfile: (...a: unknown[]) => fns.getPublicBarberProfile(...a),
    getAvailableDays: (...a: unknown[]) => fns.getAvailableDays(...a),
    getAvailableSlots: (...a: unknown[]) => fns.getAvailableSlots(...a),
    getBarberAvailableDays: (...a: unknown[]) => fns.getBarberAvailableDays(...a),
    getBarberAvailableSlots: (...a: unknown[]) => fns.getBarberAvailableSlots(...a),
    getCrossBranchAvailability: (...a: unknown[]) => fns.getCrossBranchAvailability(...a),
    createBookingPlan: (...a: unknown[]) => fns.createBookingPlan(...a),
    submitBookingFromPlan: (...a: unknown[]) => fns.submitBookingFromPlan(...a),
    clearPlanSession: (...a: unknown[]) => fns.clearPlanSession(...a),
    abandonMutationId: (...a: unknown[]) => fns.abandonMutationId(...a),
    buildCreateOperationKey: (...a: unknown[]) => fns.buildCreateOperationKey(...a),
    incrementSelectionVersion: (...a: unknown[]) => fns.incrementSelectionVersion(...a),
    isStaleResponse: (...a: unknown[]) => fns.isStaleResponse(...a),
    getArabicErrorMessage: (...a: unknown[]) => fns.getArabicErrorMessage(...a),
  };
});

import { useBookingFlow } from "@/hooks/useBookingFlow";

const barberProfile = {
  id: 5,
  name: "أحمد",
  nameAr: "أحمد",
  nameEn: "Ahmed",
  job: null,
  imageUrl: null,
  photoUrl: null,
  bio: null,
  isBookableOnline: true,
  serviceIds: [10],
  branches: [
    { branchCode: "CAMP_CAESAR", branchName: "كامب شيزار" },
    { branchCode: "GLEEM", branchName: "جليم" },
  ],
};

describe("BookingModalBarberFirst calendar flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installDefaultCatalogMocks(fns);
    fns.getPublicBarberProfile.mockResolvedValue(apiOk(barberProfile));
    fns.getAvailableDays.mockResolvedValue(
      apiOk([{ date: "2026-07-28", available: true }]),
    );
    fns.getAvailableSlots.mockResolvedValue(
      apiOk([{ time: "13:00", available: true, dayOffset: 0 as const }]),
    );
    fns.getBarberAvailableDays.mockResolvedValue(
      apiOk({
        days: [{ date: "2026-07-28", available: true, branches: [{ branchCode: "GLEEM", slotsCount: 1 }] }],
      }),
    );
    fns.getBarberAvailableSlots.mockResolvedValue(
      apiOk({
        slots: [
          {
            time: "13:00",
            available: true,
            dayOffset: 0 as const,
            branchCode: "GLEEM",
            branchName: "جليم",
            date: "2026-07-28",
          },
        ],
      }),
    );
    fns.createBookingPlan.mockResolvedValue(apiOk(mockPlan));
    localStorage.clear();
  });

  it("rejects barber-first open without empId", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        branchCode: undefined,
        entryMode: "barber_first",
        initialBarber: { name: "محمد" },
        skipModeStep: true,
      }),
    );

    await waitFor(() =>
      expect(result.current.barberProfileError).toBe("barberIdMissing"),
    );
    expect(fns.getPublicBarberProfile).not.toHaveBeenCalled();
  });

  it("starts on date step then loads filtered services for a branch", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        branchCode: "GLEEM",
        entryMode: "barber_first",
        initialBarber: { id: 5, name: "أحمد" },
        skipModeStep: true,
      }),
    );
    await waitFor(() => expect(result.current.step).toBe("date"));
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    expect(result.current.services.map((s) => s.id)).toEqual([10]);
    expect(fns.listBranchBarbers).not.toHaveBeenCalled();
  });

  it("calendar loads on date before services (not cross-branch slots)", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        branchCode: "GLEEM",
        entryMode: "barber_first",
        initialBarber: { id: 5, name: "أحمد" },
        skipModeStep: true,
      }),
    );
    await waitFor(() => expect(result.current.step).toBe("date"));
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    await waitFor(() => expect(fns.getBarberAvailableDays).toHaveBeenCalled());
    expect(fns.getCrossBranchAvailability).not.toHaveBeenCalled();
  });

  it("selecting a calendar day then service then time stores plan inputs", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        branchCode: "GLEEM",
        entryMode: "barber_first",
        initialBarber: { id: 5, name: "أحمد" },
        skipModeStep: true,
      }),
    );
    await waitFor(() => expect(result.current.step).toBe("date"));
    await waitFor(() => expect(result.current.daysLoading).toBe(false));

    act(() => {
      result.current.selectDate(new Date(2026, 6, 28));
    });
    expect(result.current.step).toBe("service");

    act(() => {
      result.current.selectServices([10]);
      result.current.setStep("time");
    });
    expect(result.current.step).toBe("time");
    await waitFor(() => expect(result.current.slotsLoading).toBe(false));

    act(() => {
      result.current.selectSlot({ time: "13:00", available: true, dayOffset: 0 });
      result.current.setCustomerName("Smoke calendar");
      result.current.setCustomerPhone("01099887766");
    });
    expect(result.current.step).toBe("details");

    await act(async () => {
      await result.current.requestPlan();
    });
    expect(fns.createBookingPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        branchCode: "GLEEM",
        date: "2026-07-28",
        time: "13:00",
        mode: "specific",
        empId: 5,
        serviceIds: [10],
      }),
      expect.any(AbortSignal),
    );
    expect(result.current.plan?.planToken).toBe(mockPlan.planToken);
  });

  it("legacy slots step still loads cross-branch when forced", async () => {
    fns.getCrossBranchAvailability.mockResolvedValue(
      apiOk({
        ok: true,
        barber: { empId: 5, nameAr: "أحمد" },
        branches: barberProfile.branches,
        days: ["2026-07-28"],
        slots: [
          {
            branchCode: "GLEEM",
            branchName: "جليم",
            date: "2026-07-28",
            time: "13:00",
            dayOffset: 0 as const,
          },
        ],
        meta: { slotCount: 1, branchCount: 2, dayCount: 1 },
      }),
    );
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        branchCode: "GLEEM",
        entryMode: "barber_first",
        initialBarber: { id: 5, name: "أحمد" },
        skipModeStep: true,
      }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectServices([10]);
      result.current.setStep("slots");
    });
    await waitFor(() => expect(result.current.crossSlotsLoading).toBe(false));
    expect(fns.getCrossBranchAvailability).toHaveBeenCalledTimes(1);
    expect(result.current.crossSlots).toHaveLength(1);
  });

  it("branch-first still uses per-branch days/slots APIs", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        branchCode: "GLEEM",
        entryMode: "branch_first",
        initialMode: "nearest",
        skipModeStep: true,
      }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectMode("nearest");
      result.current.selectServices([10]);
      result.current.setStep("date");
    });
    await waitFor(() => expect(result.current.daysLoading).toBe(false));
    expect(fns.getAvailableDays).toHaveBeenCalled();
    expect(fns.getCrossBranchAvailability).not.toHaveBeenCalled();
  });
});
