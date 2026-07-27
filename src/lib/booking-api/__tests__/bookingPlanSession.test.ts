import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  savePlanSession,
  getPlanSession,
  clearPlanSession,
  isPlanMatchingSelection,
  _resetPlanSession,
} from "../plan-session";
import type { BookingPlan } from "../types";

const mockPlan: BookingPlan = {
  plan: [],
  totalDurationMinutes: 30,
  totalPrice: 100,
  bookingCodes: ["BK-001"],
  planToken: "tok_abc123",
  planFingerprint: "fp_xyz",
  evaluatedAt: "2026-01-01T10:00:00Z",
};

const params = {
  branchCode: "GLEEM",
  mode: "specific" as const,
  empId: 5,
  serviceIds: [1, 2],
  date: "2026-01-01",
  time: "10:00",
};

describe("Plan Session", () => {
  beforeEach(() => {
    _resetPlanSession();
  });

  it("stores plan in memory and sessionStorage", () => {
    savePlanSession(mockPlan, params);
    const session = getPlanSession();
    expect(session).not.toBeNull();
    expect(session!.planToken).toBe("tok_abc123");

    const raw = sessionStorage.getItem("cut_booking_plan_session");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).planToken).toBe("tok_abc123");
  });

  it("does NOT store in localStorage", () => {
    savePlanSession(mockPlan, params);
    const keys = Object.keys(localStorage);
    const planKeys = keys.filter(k => k.includes("plan"));
    expect(planKeys).toHaveLength(0);
  });

  it("clears plan session", () => {
    savePlanSession(mockPlan, params);
    clearPlanSession();
    expect(getPlanSession()).toBeNull();
  });

  it("detects matching selection", () => {
    savePlanSession(mockPlan, params);
    expect(isPlanMatchingSelection(params)).toBe(true);
  });

  it("detects mismatched selection", () => {
    savePlanSession(mockPlan, params);
    expect(isPlanMatchingSelection({ ...params, time: "11:00" })).toBe(false);
  });

  it("returns null for expired plan", () => {
    savePlanSession(mockPlan, params);
    const session = getPlanSession()!;
    // Manually expire
    session.expiresAt = Date.now() - 1000;
    sessionStorage.setItem("cut_booking_plan_session", JSON.stringify(session));
    _resetPlanSession();
    expect(getPlanSession()).toBeNull();
  });
});
