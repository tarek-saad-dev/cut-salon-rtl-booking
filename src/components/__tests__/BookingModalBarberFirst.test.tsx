import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  apiOk,
  installDefaultCatalogMocks,
  mockPlan,
  mockSlots,
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
    { branchCode: "GLEEM", branchName: "جليم" },
    { branchCode: "SMOUHA", branchName: "سموحة" },
  ],
};

describe("BookingModalBarberFirst", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installDefaultCatalogMocks(fns);
    fns.getPublicBarberProfile.mockResolvedValue(apiOk(barberProfile));
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
    expect(result.current.barber).toBeNull();
    expect(result.current.barberBranches).toEqual([]);
  });

  it("locks specific mode and loads barber profile on open", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        branchCode: undefined,
        entryMode: "barber_first",
        initialBarber: { id: 5, name: "أحمد" },
        skipModeStep: true,
      }),
    );

    await waitFor(() => expect(result.current.barberProfileLoading).toBe(false));
    expect(fns.getPublicBarberProfile).toHaveBeenCalledWith(5, expect.any(AbortSignal));
    expect(result.current.mode).toBe("specific");
    expect(result.current.isBarberFirst).toBe(true);
    expect(result.current.barber).toEqual({ id: 5, name: "أحمد" });
    expect(result.current.barberBranches.map((b) => b.branchCode)).toEqual([
      "GLEEM",
      "SMOUHA",
    ]);
    expect(result.current.barberProfileError).toBeNull();
  });

  it("ignores mode changes while barber-first is locked", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        branchCode: "GLEEM",
        entryMode: "barber_first",
        initialBarber: { id: 5, name: "أحمد" },
        skipModeStep: true,
      }),
    );
    await waitFor(() => expect(result.current.barberProfileLoading).toBe(false));
    act(() => {
      result.current.selectMode("nearest");
    });
    expect(result.current.mode).toBe("specific");
    expect(result.current.barber?.id).toBe(5);
  });

  it("filters services to barber serviceIds after branch catalog load", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        branchCode: "GLEEM",
        entryMode: "barber_first",
        initialBarber: { id: 5, name: "أحمد" },
        skipModeStep: true,
      }),
    );

    await waitFor(() => expect(result.current.barberProfileLoading).toBe(false));
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    expect(result.current.services.map((s) => s.id)).toEqual([10]);
    expect(result.current.mode).toBe("specific");
    expect(result.current.barber?.id).toBe(5);
  });

  it("keeps locked barber and clears services/date/slot/plan on branch change", async () => {
    const { result, rerender } = renderHook(
      ({ branchCode }: { branchCode: string }) =>
        useBookingFlow({
          open: true,
          branchCode,
          entryMode: "barber_first",
          initialBarber: { id: 5, name: "أحمد" },
          skipModeStep: true,
        }),
      { initialProps: { branchCode: "GLEEM" } },
    );

    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectServices([10]);
      result.current.setStep("date");
    });
    await waitFor(() => expect(result.current.daysLoading).toBe(false));
    act(() => {
      result.current.selectDate(new Date("2026-07-28T12:00:00"));
    });
    await waitFor(() => expect(result.current.slotsLoading).toBe(false));
    act(() => {
      result.current.selectSlot(mockSlots[0]);
      result.current.setCustomerName("عميل");
      result.current.setCustomerPhone("01012345678");
    });
    await act(async () => {
      await result.current.requestPlan();
    });
    expect(result.current.plan?.planToken).toBe(mockPlan.planToken);

    rerender({ branchCode: "SMOUHA" });

    await waitFor(() => expect(result.current.serviceIds).toEqual([]));
    expect(result.current.barber).toEqual({ id: 5, name: "أحمد" });
    expect(result.current.mode).toBe("specific");
    expect(result.current.selectedDate).toBeUndefined();
    expect(result.current.selectedSlot).toBeUndefined();
    expect(result.current.plan).toBeNull();
    expect(fns.clearPlanSession).toHaveBeenCalled();
  });

  it("clears services when barber changes in branch-first mode", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({
        open: true,
        branchCode: "GLEEM",
        entryMode: "branch_first",
      }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectBarber({ id: 5, name: "أحمد" });
      result.current.selectServices([10, 11]);
    });
    expect(result.current.serviceIds).toEqual([10, 11]);
    act(() => {
      result.current.selectBarber({ id: 6, name: "محمود" });
    });
    expect(result.current.serviceIds).toEqual([]);
    expect(result.current.barber?.id).toBe(6);
  });

  it("plans with locked specific empId in barber-first", async () => {
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
      result.current.setStep("date");
    });
    await waitFor(() => expect(result.current.daysLoading).toBe(false));
    expect(fns.getAvailableDays).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "specific", empId: 5, branchCode: "GLEEM" }),
      expect.any(AbortSignal),
    );
    act(() => {
      result.current.selectDate(new Date("2026-07-28T12:00:00"));
    });
    await waitFor(() => expect(result.current.slotsLoading).toBe(false));
    act(() => {
      result.current.selectSlot(mockSlots[0]);
      result.current.setCustomerName("عميل تجريبي");
      result.current.setCustomerPhone("01012345678");
    });
    await act(async () => {
      await result.current.requestPlan();
    });
    expect(fns.createBookingPlan).toHaveBeenCalled();
    expect(result.current.plan?.totalPrice).toBe(120);
    expect(fns.submitBookingFromPlan).not.toHaveBeenCalled();
  });
});
