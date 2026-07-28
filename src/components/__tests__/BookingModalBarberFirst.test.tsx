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
  job: null,
  photoUrl: null,
  bio: null,
  isBookableOnline: true,
  serviceIds: [10],
  branches: [
    { branchCode: "CAMP_CAESAR", branchName: "كامب شيزار" },
    { branchCode: "GLEEM", branchName: "جليم" },
  ],
};

const crossPayload = {
  ok: true,
  barber: { empId: 5, nameAr: "أحمد" },
  branches: [
    { branchCode: "CAMP_CAESAR", branchName: "كامب شيزار" },
    { branchCode: "GLEEM", branchName: "جليم" },
  ],
  days: ["2026-07-28"],
  slots: [
    {
      branchCode: "GLEEM",
      branchName: "جليم",
      date: "2026-07-28",
      time: "13:00",
      dayOffset: 0 as const,
    },
    {
      branchCode: "CAMP_CAESAR",
      branchName: "كامب شيزار",
      date: "2026-07-28",
      time: "13:00",
      dayOffset: 0 as const,
    },
    {
      branchCode: "GLEEM",
      branchName: "جليم",
      date: "2026-07-28",
      time: "01:15",
      dayOffset: 1 as const,
    },
  ],
  meta: { slotCount: 3, branchCount: 2, dayCount: 1 },
};

describe("BookingModalBarberFirst cross-branch (10D)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installDefaultCatalogMocks(fns);
    fns.getPublicBarberProfile.mockResolvedValue(apiOk(barberProfile));
    fns.getCrossBranchAvailability.mockResolvedValue(apiOk(crossPayload));
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
      expect(result.current.barberProfileError).toMatch(/معرف الحلاق/),
    );
    expect(fns.getPublicBarberProfile).not.toHaveBeenCalled();
  });

  it("starts on service step without branch requirement", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        branchCode: undefined,
        entryMode: "barber_first",
        initialBarber: { id: 5, name: "أحمد" },
        skipModeStep: true,
      }),
    );
    expect(result.current.step).toBe("service");
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    expect(result.current.services.map((s) => s.id)).toEqual([10]);
    expect(fns.listBranchBarbers).not.toHaveBeenCalled();
  });

  it("loads cross-branch once on slots step; tab change does not refetch", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        branchCode: undefined,
        entryMode: "barber_first",
        initialBarber: { id: 5, name: "أحمد" },
        skipModeStep: true,
      }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectServices([10]);
    });
    act(() => {
      result.current.goToSlotsStep();
    });
    await waitFor(() => expect(fns.getCrossBranchAvailability).toHaveBeenCalled());
    await waitFor(() => expect(result.current.crossSlotsLoading).toBe(false));
    expect(fns.getCrossBranchAvailability).toHaveBeenCalledTimes(1);
    expect(result.current.crossBranches.map((b) => b.branchCode)).toEqual([
      "CAMP_CAESAR",
      "GLEEM",
    ]);
    expect(result.current.crossSlots).toHaveLength(3);

    act(() => {
      result.current.setCrossBranchTab("GLEEM");
    });
    expect(fns.getCrossBranchAvailability).toHaveBeenCalledTimes(1);
    expect(result.current.crossTab).toBe("GLEEM");
  });

  it("Ahmed-like single branch keeps slots without requiring All tab data loss", async () => {
    fns.getCrossBranchAvailability.mockResolvedValue(
      apiOk({
        ...crossPayload,
        branches: [{ branchCode: "CAMP_CAESAR", branchName: "كامب شيزار" }],
        slots: [crossPayload.slots[1]],
        meta: { slotCount: 1, branchCount: 1, dayCount: 1 },
      }),
    );
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        entryMode: "barber_first",
        initialBarber: { id: 18, name: "احمد" },
        skipModeStep: true,
      }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectServices([10]);
    });
    act(() => {
      result.current.goToSlotsStep();
    });
    await waitFor(() => expect(result.current.crossSlots.length).toBe(1));
    expect(result.current.crossBranches).toHaveLength(1);
    expect(result.current.crossSlots[0].branchCode).toBe("CAMP_CAESAR");
  });

  it("selecting a slot stores branchCode/date/time/dayOffset for plan", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        entryMode: "barber_first",
        initialBarber: { id: 5, name: "أحمد" },
        skipModeStep: true,
      }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectServices([10]);
    });
    act(() => {
      result.current.goToSlotsStep();
    });
    await waitFor(() => expect(result.current.crossSlotsLoading).toBe(false));

    const overnight = crossPayload.slots[2];
    act(() => {
      result.current.selectCrossBranchSlot(overnight);
      result.current.setCustomerName("Smoke 10D");
      result.current.setCustomerPhone("01099887766");
    });
    expect(result.current.bookingBranchCode).toBe("GLEEM");
    expect(result.current.selectedSlot?.dayOffset).toBe(1);
    expect(result.current.selectedSlot?.time).toBe("01:15");
    expect(result.current.step).toBe("details");

    await act(async () => {
      await result.current.requestPlan();
    });
    expect(fns.createBookingPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        branchCode: "GLEEM",
        date: "2026-07-28",
        time: "01:15",
        dayOffset: 1,
        mode: "specific",
        empId: 5,
        serviceIds: [10],
      }),
      expect.any(AbortSignal),
    );
    expect(result.current.plan?.planToken).toBe(mockPlan.planToken);
  });

  it("same-time slots in different branches remain separate selections", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        entryMode: "barber_first",
        initialBarber: { id: 5, name: "أحمد" },
        skipModeStep: true,
      }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectServices([10]);
    });
    act(() => {
      result.current.goToSlotsStep();
    });
    await waitFor(() => expect(result.current.crossSlotsLoading).toBe(false));

    act(() => {
      result.current.selectCrossBranchSlot(crossPayload.slots[0]);
    });
    const keyGleem = result.current.selectedCrossSlotKey;
    act(() => {
      result.current.selectCrossBranchSlot(crossPayload.slots[1]);
    });
    const keyCamp = result.current.selectedCrossSlotKey;
    expect(keyGleem).not.toBe(keyCamp);
    expect(result.current.bookingBranchCode).toBe("CAMP_CAESAR");
  });

  it("changing services aborts and does not keep stale slots", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        entryMode: "barber_first",
        initialBarber: { id: 5, name: "أحمد" },
        skipModeStep: true,
      }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectServices([10]);
    });
    act(() => {
      result.current.goToSlotsStep();
    });
    await waitFor(() => expect(result.current.crossSlots.length).toBe(3));
    act(() => {
      result.current.selectServices([10]);
    });
    expect(result.current.crossSlots).toEqual([]);
    expect(result.current.bookingBranchCode).toBeUndefined();
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
