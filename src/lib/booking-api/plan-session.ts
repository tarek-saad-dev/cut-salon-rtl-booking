/**
 * Plan token lifecycle management.
 * Stores plan data in memory + sessionStorage. Never localStorage.
 * planToken must be sent unchanged to /create.
 */

import type { BookingPlan, BookingMode } from "./types";

const SESSION_STORAGE_KEY = "cut_booking_plan_session";
const DEFAULT_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export interface PlanSession {
  planToken: string;
  planFingerprint: string | null;
  branchCode: string;
  mode: BookingMode;
  empId: number | null;
  serviceIds: number[];
  packageId: number | null;
  addonProIds: number[];
  date: string;
  time: string;
  dayOffset: number;
  subtotal: number;
  totalDurationMinutes: number;
  createdAt: number;
  evaluatedAt: string | null;
  expiresAt: number;
}

// In-memory primary store
let _currentSession: PlanSession | null = null;

function writeToBacking(session: PlanSession | null): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    if (session === null) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  } catch (e) {
    void e;
    // Private browsing or quota exceeded — memory-only is fine
  }
}

function readFromBacking(): PlanSession | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlanSession;
    if (!parsed.planToken || !parsed.branchCode) return null;
    return {
      ...parsed,
      packageId: parsed.packageId ?? null,
      addonProIds: Array.isArray(parsed.addonProIds) ? parsed.addonProIds : [],
      serviceIds: Array.isArray(parsed.serviceIds) ? parsed.serviceIds : [],
    };
  } catch (e) {
    void e;
    return null;
  }
}

export function savePlanSession(
  plan: BookingPlan,
  params: {
    branchCode: string;
    mode: BookingMode;
    empId?: number | null;
    serviceIds: number[];
    packageId?: number | null;
    addonProIds?: number[];
    date: string;
    time: string;
    dayOffset?: number;
  },
): PlanSession {
  if (!plan.planToken) {
    throw new Error("[plan-session] Plan response missing planToken");
  }

  const session: PlanSession = {
    planToken: plan.planToken,
    planFingerprint: plan.planFingerprint ?? null,
    branchCode: params.branchCode,
    mode: params.mode,
    empId: params.empId ?? null,
    serviceIds: [...params.serviceIds].sort((a, b) => a - b),
    packageId: params.packageId ?? null,
    addonProIds: [...(params.addonProIds ?? [])].sort((a, b) => a - b),
    date: params.date,
    time: params.time,
    dayOffset: params.dayOffset ?? 0,
    subtotal: plan.totalPrice,
    totalDurationMinutes: plan.totalDurationMinutes,
    createdAt: Date.now(),
    evaluatedAt: plan.evaluatedAt ?? null,
    expiresAt: Date.now() + DEFAULT_EXPIRY_MS,
  };

  _currentSession = session;
  writeToBacking(session);
  return session;
}

export function getPlanSession(): PlanSession | null {
  if (_currentSession) {
    if (Date.now() > _currentSession.expiresAt) {
      clearPlanSession();
      return null;
    }
    return _currentSession;
  }
  const backed = readFromBacking();
  if (backed && Date.now() <= backed.expiresAt) {
    _currentSession = backed;
    return backed;
  }
  clearPlanSession();
  return null;
}

export function clearPlanSession(): void {
  _currentSession = null;
  writeToBacking(null);
}

/**
 * Check if current plan matches the intended create parameters.
 */
export function isPlanMatchingSelection(params: {
  branchCode: string;
  mode: BookingMode;
  empId?: number | null;
  serviceIds: number[];
  packageId?: number | null;
  addonProIds?: number[];
  dayOffset?: number;
  date: string;
  time: string;
}): boolean {
  const session = getPlanSession();
  if (!session) return false;

  const sortedIds = [...params.serviceIds].sort((a, b) => a - b);
  const sortedAddons = [...(params.addonProIds ?? [])].sort((a, b) => a - b);
  const sessionAddons = [...(session.addonProIds ?? [])].sort((a, b) => a - b);
  return (
    session.branchCode === params.branchCode &&
    session.mode === params.mode &&
    session.date === params.date &&
    session.time === params.time &&
    JSON.stringify(session.serviceIds) === JSON.stringify(sortedIds) &&
    (session.packageId ?? null) === (params.packageId ?? null) &&
    JSON.stringify(sessionAddons) === JSON.stringify(sortedAddons) &&
    session.dayOffset === (params.dayOffset ?? 0) &&
    session.empId === (params.empId ?? null)
  );
}

/** Only for testing */
export function _resetPlanSession(): void {
  _currentSession = null;
  try {
    sessionStorage?.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    void e;
  }
}
