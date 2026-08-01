import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  apiOk,
  installDefaultCatalogMocks,
  makeApiError,
  mockCreated,
  mockPlan,
  mockSlots,
} from "./bookingModalTestUtils";

const { fns } = vi.hoisted(() => {
  let selectionVersion = 0;
  const fns = {
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
  return { fns };
});

vi.mock("@/lib/booking-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/booking-api")>("@/lib/booking-api");
  return {
    ...actual,
    getBookingConfig: (...a: unknown[]) => fns.getBookingConfig(...a),
    getServices: (...a: unknown[]) => fns.getServices(...a),
    listBranchBarbers: (...a: unknown[]) => fns.listBranchBarbers(...a),
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

async function advanceToDetails(result: { current: ReturnType<typeof useBookingFlow> }) {
  await waitFor(() => expect(result.current.catalogLoading).toBe(false));
  act(() => {
    result.current.selectMode("specific");
    result.current.selectBarber({ id: 5, name: "أحمد" });
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
  });
  act(() => {
    result.current.setCustomerName("عميل تجريبي");
    result.current.setCustomerPhone("01012345678");
  });
}

describe("BookingModalBranchSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installDefaultCatalogMocks(fns);
    localStorage.clear();
  });

  it("loads catalog through typed client for the selected branchCode", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    expect(fns.getServices).toHaveBeenCalledWith("GLEEM");
    expect(fns.listBranchBarbers).toHaveBeenCalledWith("GLEEM");
    expect(result.current.services.map((s) => s.id)).toEqual([10, 11]);
  });

  it("branch change clears barber/date/time/plan", async () => {
    const { result, rerender } = renderHook(
      ({ branchCode }: { branchCode: string }) =>
        useBookingFlow({ open: true, branchCode }),
      { initialProps: { branchCode: "GLEEM" } },
    );
    await advanceToDetails(result);
    act(() => {
      result.current.selectSlot(mockSlots[0]);
    });
    // seed a plan
    await act(async () => {
      await result.current.requestPlan();
    });
    expect(result.current.plan?.planToken).toBe("plan_tok_test");

    rerender({ branchCode: "OTHER" });
    await waitFor(() => {
      expect(result.current.barber).toBeNull();
      expect(result.current.selectedDate).toBeUndefined();
      expect(result.current.selectedSlot).toBeUndefined();
      expect(result.current.plan).toBeNull();
    });
    expect(fns.clearPlanSession).toHaveBeenCalled();
  });
});

describe("BookingModalServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installDefaultCatalogMocks(fns);
  });

  it("service change clears date/time/plan", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await advanceToDetails(result);
    await act(async () => {
      await result.current.requestPlan();
    });
    expect(result.current.plan).not.toBeNull();

    act(() => {
      result.current.selectServices([10, 11]);
    });
    expect(result.current.selectedDate).toBeUndefined();
    expect(result.current.selectedSlot).toBeUndefined();
    expect(result.current.plan).toBeNull();
  });

  it("enforces max 12 unique service IDs", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectServices([1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    });
    expect(result.current.serviceIds).toHaveLength(12);
    expect(new Set(result.current.serviceIds).size).toBe(12);
  });
});

describe("BookingModalAvailability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installDefaultCatalogMocks(fns);
  });

  it("does not request available-days before prerequisites", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => result.current.setStep("date"));
    await act(async () => {
      await Promise.resolve();
    });
    expect(fns.getAvailableDays).not.toHaveBeenCalled();
  });

  it("requests days after branch+services+specific barber", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectMode("specific");
      result.current.selectBarber({ id: 5, name: "أحمد" });
      result.current.selectServices([10]);
      result.current.setStep("date");
    });
    await waitFor(() => expect(fns.getAvailableDays).toHaveBeenCalled());
    const args = fns.getAvailableDays.mock.calls[0][0];
    expect(args.empId).toBe(5);
    expect(args.mode).toBe("specific");
  });

  it("nearest mode sends no empId", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectMode("nearest");
      result.current.selectServices([10]);
      result.current.setStep("date");
    });
    await waitFor(() => expect(fns.getAvailableDays).toHaveBeenCalled());
    const args = fns.getAvailableDays.mock.calls.at(-1)![0];
    expect(args.mode).toBe("nearest");
    expect(args.empId).toBeUndefined();
  });

  it("ignores stale availability responses", async () => {
    let resolveFirst!: (v: unknown) => void;
    fns.getAvailableDays.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    act(() => {
      result.current.selectMode("nearest");
      result.current.selectServices([10]);
      result.current.setStep("date");
    });
    await waitFor(() => expect(fns.getAvailableDays).toHaveBeenCalledTimes(1));

    // Change selection → bump version; first response must be ignored
    act(() => {
      result.current.selectServices([11]);
    });
    await waitFor(() => expect(fns.getAvailableDays.mock.calls.length).toBeGreaterThanOrEqual(1));

    await act(async () => {
      resolveFirst(apiOk([{ date: "2099-01-01", available: true }]));
      await Promise.resolve();
    });
    expect(result.current.days.some((d) => d.date === "2099-01-01")).toBe(false);
  });
});

describe("BookingModalOvernight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installDefaultCatalogMocks(fns);
  });

  it("preserves dayOffset=1 on plan request", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await advanceToDetails(result);
    act(() => {
      result.current.selectSlot(mockSlots[1]); // dayOffset 1
      result.current.setCustomerName("عميل");
      result.current.setCustomerPhone("01012345678");
    });
    await act(async () => {
      await result.current.requestPlan();
    });
    const body = fns.createBookingPlan.mock.calls[0][0];
    expect(body.dayOffset).toBe(1);
    expect(body.time).toBe("00:30");
  });
});

describe("BookingModalPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installDefaultCatalogMocks(fns);
  });

  it("plan success opens review, not confirmation", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await advanceToDetails(result);
    await act(async () => {
      await result.current.requestPlan();
    });
    expect(result.current.step).toBe("review");
    expect(result.current.created).toBeNull();
    expect(result.current.plan?.totalPrice).toBe(120);
    expect(result.current.plan?.totalDurationMinutes).toBe(30);
    expect(result.current.plan?.totalPrice).not.toBe(100); // catalog was 100
  });
});

describe("BookingModalCreate / Idempotency / Unknown / RateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installDefaultCatalogMocks(fns);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("create uses planToken and does not invent BookingID", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await advanceToDetails(result);
    await act(async () => {
      await result.current.requestPlan();
    });
    await act(async () => {
      await result.current.confirmCreate();
    });
    expect(fns.submitBookingFromPlan).toHaveBeenCalledTimes(1);
    const args = fns.submitBookingFromPlan.mock.calls[0][0];
    expect(args.plan.planToken).toBe("plan_tok_test");
    expect(result.current.step).toBe("success");
    expect(result.current.created?.bookingCode).toBe("BK-LIVE-001");
    expect(JSON.stringify(result.current.created)).not.toMatch(/BookingID|branchId/i);
  });

  it("double-click create fires one mutation", async () => {
    let resolveCreate!: (v: unknown) => void;
    fns.submitBookingFromPlan.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await advanceToDetails(result);
    await act(async () => {
      await result.current.requestPlan();
    });
    act(() => {
      void result.current.confirmCreate();
      void result.current.confirmCreate();
    });
    expect(fns.submitBookingFromPlan).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveCreate({ outcome: "success", booking: mockCreated });
      await Promise.resolve();
    });
  });

  it("uncertain outcome preserves safe retry path", async () => {
    fns.submitBookingFromPlan.mockResolvedValueOnce({
      outcome: "mutation_outcome_unknown",
      error: makeApiError("UNKNOWN_ERROR", { httpStatus: 0 }),
    });
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await advanceToDetails(result);
    await act(async () => {
      await result.current.requestPlan();
    });
    await act(async () => {
      await result.current.confirmCreate();
    });
    expect(result.current.mutationUi.kind).toBe("unknown");
    expect(result.current.mutationUi.kind === "unknown" && result.current.mutationUi.message).toMatch(
      /تعذر التأكد|قد يكون الحجز/,
    );
    expect(result.current.step).toBe("review");

    fns.submitBookingFromPlan.mockResolvedValueOnce({
      outcome: "success",
      booking: mockCreated,
    });
    await act(async () => {
      result.current.safeRetryCreate();
    });
    await waitFor(() => expect(fns.submitBookingFromPlan).toHaveBeenCalledTimes(2));
  });

  it("slot conflict clears plan and returns to availability", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await advanceToDetails(result);
    await act(async () => {
      await result.current.requestPlan();
    });
    fns.submitBookingFromPlan.mockResolvedValueOnce({
      outcome: "known_failure",
      error: makeApiError("SLOT_UNAVAILABLE", { httpStatus: 409 }),
    });
    await act(async () => {
      await result.current.confirmCreate();
    });
    expect(result.current.plan).toBeNull();
    expect(result.current.step).toBe("time");
    expect(fns.clearPlanSession).toHaveBeenCalled();
  });

  it("plan token expiry clears plan", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await advanceToDetails(result);
    await act(async () => {
      await result.current.requestPlan();
    });
    fns.submitBookingFromPlan.mockResolvedValueOnce({
      outcome: "known_failure",
      error: makeApiError("PLAN_TOKEN_EXPIRED", { httpStatus: 409 }),
    });
    await act(async () => {
      await result.current.confirmCreate();
    });
    expect(result.current.plan).toBeNull();
    expect(mockPlan.planToken).toBeTruthy(); // token not reused from state
  });

  it("rate limit shows countdown state", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await advanceToDetails(result);
    fns.createBookingPlan.mockRejectedValueOnce(
      makeApiError("RATE_LIMIT_EXCEEDED", { httpStatus: 429, retryAfterSeconds: 30 }),
    );
    await act(async () => {
      await result.current.requestPlan();
    });
    expect(result.current.mutationUi.kind).toBe("rate_limited");
    expect(result.current.rateLimitRemainingSeconds).toBeGreaterThan(0);
  });

  it("does not write cut_customer_phone", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await advanceToDetails(result);
    await act(async () => {
      await result.current.requestPlan();
    });
    await act(async () => {
      await result.current.confirmCreate();
    });
    expect(localStorage.getItem("cut_customer_phone")).toBeNull();
  });

  it("resetAll clears draft and plan", async () => {
    const { result } = renderHook(() =>
      useBookingFlow({ open: true, branchCode: "GLEEM" }),
    );
    await advanceToDetails(result);
    await act(async () => {
      await result.current.requestPlan();
    });
    act(() => {
      result.current.resetAll();
    });
    expect(result.current.step).toBe("branch");
    expect(result.current.plan).toBeNull();
    expect(result.current.customerPhone).toBe("");
    expect(result.current.created).toBeNull();
  });
});

describe("BookingModalSecurity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installDefaultCatalogMocks(fns);
  });

  it("BookingModal source has no publicBookingApi import", async () => {
    const src = await import("@/components/BookingModal?raw").catch(() => null);
    // Fallback: static assertion via grep-friendly string check in this suite
    const fs = await import("node:fs");
    const path = await import("node:path");
    const file = fs.readFileSync(
      path.resolve(__dirname, "../BookingModal.tsx"),
      "utf8",
    );
    expect(file).not.toMatch(/publicBookingApi/);
    expect(file).not.toMatch(/cut_customer_phone/);
    expect(file).not.toMatch(/BookingID|BranchID/);
    void src;
  });
});
