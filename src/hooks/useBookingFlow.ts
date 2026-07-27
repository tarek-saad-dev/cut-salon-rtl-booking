/**
 * Phase 8B1 — controlled booking flow hook for BookingModal.
 * One selection source; plan then create; no legacy publicBookingApi.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  getBookingConfig,
  getServices,
  listBranchBarbers,
  getAvailableDays,
  getAvailableSlots,
  createBookingPlan,
  submitBookingFromPlan,
  clearPlanSession,
  abandonMutationId,
  buildCreateOperationKey,
  incrementSelectionVersion,
  isStaleResponse,
  BookingApiError,
  getArabicErrorMessage,
  type BookingConfig,
  type BookingService,
  type PublicBarber,
  type AvailableDay,
  type AvailableSlot,
  type BookingPlan,
  type BookingCreateResponse,
  type BookingMode,
  type BookingCustomer,
} from "@/lib/booking-api";

export type BookingUiStep =
  | "branch"
  | "mode"
  | "service"
  | "date"
  | "time"
  | "details"
  | "review"
  | "success";

const MAX_SERVICES = 12;

export type FlowMutationUi =
  | { kind: "idle" }
  | { kind: "planning" }
  | { kind: "creating" }
  | { kind: "unknown"; message: string; retryAfterSeconds?: number | null }
  | { kind: "rate_limited"; message: string; retryAfterSeconds: number; until: number }
  | { kind: "error"; message: string; code?: string };

function normalizeEgyptianPhone(input: string): string | null {
  const trimmed = input.trim();
  if (/[a-zA-Z]/.test(trimmed)) return null;
  if (trimmed.indexOf("+") > 0) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return hasPlus ? `+${digits}` : digits;
}

function isPhoneReady(input: string): boolean {
  return normalizeEgyptianPhone(input) != null;
}

export function useBookingFlow(opts: {
  open: boolean;
  branchCode: string | undefined;
  initialMode?: BookingMode;
  initialBarber?: { id?: number; name: string } | null;
  bookingNote?: string;
  skipModeStep?: boolean;
}) {
  const { open, branchCode, initialMode, initialBarber, bookingNote, skipModeStep } = opts;

  const [step, setStep] = useState<BookingUiStep>("branch");
  const [mode, setMode] = useState<BookingMode>(initialMode ?? "specific");
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [barber, setBarber] = useState<{ id: number; name: string } | null>(
    initialBarber?.id != null ? { id: initialBarber.id, name: initialBarber.name } : null,
  );

  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [services, setServices] = useState<BookingService[]>([]);
  const [barbers, setBarbers] = useState<PublicBarber[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [days, setDays] = useState<AvailableDay[]>([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [daysError, setDaysError] = useState<string | null>(null);

  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | undefined>();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState(bookingNote ?? "");

  const [plan, setPlan] = useState<BookingPlan | null>(null);
  const [created, setCreated] = useState<BookingCreateResponse | null>(null);
  const [mutationUi, setMutationUi] = useState<FlowMutationUi>({ kind: "idle" });
  const [rateLimitTick, setRateLimitTick] = useState(0);

  const selectionVersionRef = useRef(0);
  const daysAbortRef = useRef<AbortController | null>(null);
  const slotsAbortRef = useRef<AbortController | null>(null);
  const planAbortRef = useRef<AbortController | null>(null);
  const prevBranchRef = useRef<string | undefined>(undefined);
  const createInFlightRef = useRef(false);

  const bumpSelection = useCallback(() => {
    selectionVersionRef.current = incrementSelectionVersion();
    return selectionVersionRef.current;
  }, []);

  const clearDownstreamFromBranch = useCallback(() => {
    bumpSelection();
    daysAbortRef.current?.abort();
    slotsAbortRef.current?.abort();
    planAbortRef.current?.abort();
    setServiceIds([]);
    // Branch change always clears barber — IDs are not portable across branches.
    setBarber(null);
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
    setDays([]);
    setSlots([]);
    setPlan(null);
    clearPlanSession();
    setCreated(null);
    setMutationUi({ kind: "idle" });
    setDaysError(null);
    setSlotsError(null);
  }, [bumpSelection]);

  // Branch change mid-flow
  useEffect(() => {
    const prev = prevBranchRef.current;
    prevBranchRef.current = branchCode;
    if (!open) return;
    if (prev === undefined || prev === branchCode) return;
    clearDownstreamFromBranch();
    setStep(skipModeStep || initialMode ? "service" : "mode");
  }, [branchCode, open, clearDownstreamFromBranch, skipModeStep, initialMode]);

  // Catalog load
  useEffect(() => {
    if (!open || !branchCode) return;
    let cancelled = false;
    const controller = new AbortController();
    setCatalogLoading(true);
    setCatalogError(null);

    (async () => {
      try {
        const [cfg, svc, bar] = await Promise.all([
          getBookingConfig(branchCode, controller.signal),
          getServices(branchCode, controller.signal),
          listBranchBarbers(branchCode, controller.signal),
        ]);
        if (cancelled) return;
        setConfig(cfg.data);
        const bookable = (svc.data ?? []).filter((s) => s.isBookableOnline);
        setServices(bookable);
        setBarbers((bar.data ?? []).filter((b) => b.isBookableOnline));
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        if (err instanceof BookingApiError) {
          setCatalogError(err.message);
        } else {
          setCatalogError("تعذر تحميل بيانات الحجز، حاول مرة أخرى");
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, branchCode]);

  // Available days
  useEffect(() => {
    if (step !== "date" || !branchCode || serviceIds.length === 0) return;
    if (mode === "specific" && barber?.id == null) return;

    daysAbortRef.current?.abort();
    const controller = new AbortController();
    daysAbortRef.current = controller;
    const version = bumpSelection();

    setDaysLoading(true);
    setDaysError(null);
    setDays([]);

    getAvailableDays(
      {
        branchCode,
        serviceIds,
        mode,
        empId: mode === "specific" ? barber?.id : undefined,
      },
      controller.signal,
    )
      .then((res) => {
        if (isStaleResponse(version) || controller.signal.aborted) return;
        setDays(res.data ?? []);
        setDaysLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted || isStaleResponse(version)) return;
        setDaysLoading(false);
        if (err instanceof BookingApiError) {
          if (err.isRateLimited && err.retryAfterSeconds) {
            setDaysError(err.message);
            setMutationUi({
              kind: "rate_limited",
              message: err.message,
              retryAfterSeconds: err.retryAfterSeconds,
              until: Date.now() + err.retryAfterSeconds * 1000,
            });
          } else {
            setDaysError(err.message);
          }
        } else {
          setDaysError(getArabicErrorMessage("UNKNOWN_ERROR"));
        }
      });

    return () => controller.abort();
  }, [step, branchCode, serviceIds, mode, barber?.id, bumpSelection]);

  // Available slots
  useEffect(() => {
    if (step !== "time" || !branchCode || !selectedDate || serviceIds.length === 0) return;
    if (mode === "specific" && barber?.id == null) return;

    slotsAbortRef.current?.abort();
    const controller = new AbortController();
    slotsAbortRef.current = controller;
    const version = bumpSelection();
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    setSlotsLoading(true);
    setSlotsError(null);
    setSlots([]);

    getAvailableSlots(
      {
        branchCode,
        date: dateStr,
        serviceIds,
        mode,
        empId: mode === "specific" ? barber?.id : undefined,
      },
      controller.signal,
    )
      .then((res) => {
        if (isStaleResponse(version) || controller.signal.aborted) return;
        setSlots(res.data ?? []);
        setSlotsLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted || isStaleResponse(version)) return;
        setSlotsLoading(false);
        if (err instanceof BookingApiError) {
          setSlotsError(err.message);
          if (err.isRateLimited && err.retryAfterSeconds) {
            setMutationUi({
              kind: "rate_limited",
              message: err.message,
              retryAfterSeconds: err.retryAfterSeconds,
              until: Date.now() + err.retryAfterSeconds * 1000,
            });
          }
        } else {
          setSlotsError(getArabicErrorMessage("UNKNOWN_ERROR"));
        }
      });

    return () => controller.abort();
  }, [step, branchCode, selectedDate, serviceIds, mode, barber?.id, bumpSelection]);

  // Rate-limit countdown ticker
  useEffect(() => {
    if (mutationUi.kind !== "rate_limited") return;
    const id = setInterval(() => {
      setRateLimitTick((t) => t + 1);
      if (Date.now() >= mutationUi.until) {
        setMutationUi({ kind: "idle" });
      }
    }, 500);
    return () => clearInterval(id);
  }, [mutationUi]);

  const catalogPrice = services
    .filter((s) => serviceIds.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);
  const catalogDuration = services
    .filter((s) => serviceIds.includes(s.id))
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const selectServices = useCallback((ids: number[]) => {
    const unique = [...new Set(ids)].slice(0, MAX_SERVICES);
    bumpSelection();
    clearPlanSession();
    setServiceIds(unique);
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
    setDays([]);
    setSlots([]);
    setPlan(null);
    setMutationUi({ kind: "idle" });
  }, [bumpSelection]);

  const selectMode = useCallback((next: BookingMode) => {
    bumpSelection();
    clearPlanSession();
    setMode(next);
    if (next === "nearest") setBarber(null);
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
    setDays([]);
    setSlots([]);
    setPlan(null);
    setStep("service");
  }, [bumpSelection]);

  const selectBarber = useCallback((b: { id: number; name: string } | null) => {
    bumpSelection();
    clearPlanSession();
    setBarber(b);
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
    setDays([]);
    setSlots([]);
    setPlan(null);
  }, [bumpSelection]);

  const selectDate = useCallback((date: Date) => {
    bumpSelection();
    clearPlanSession();
    setSelectedDate(date);
    setSelectedSlot(undefined);
    setSlots([]);
    setPlan(null);
    setStep("time");
  }, [bumpSelection]);

  const selectSlot = useCallback((slot: AvailableSlot) => {
    clearPlanSession();
    setSelectedSlot(slot);
    setPlan(null);
    setMutationUi({ kind: "idle" });
    setStep("details");
  }, []);

  const invalidatePlan = useCallback(() => {
    clearPlanSession();
    setPlan(null);
  }, []);

  const requestPlan = useCallback(async () => {
    if (!branchCode || !selectedDate || !selectedSlot || serviceIds.length === 0) return;
    if (mode === "specific" && barber?.id == null) return;
    if (mutationUi.kind === "planning" || mutationUi.kind === "creating") return;
    if (mutationUi.kind === "rate_limited" && Date.now() < mutationUi.until) return;

    const phone = normalizeEgyptianPhone(customerPhone);
    const name = customerName.trim();
    if (!phone || name.length < 2) {
      setMutationUi({ kind: "error", message: "يرجى إدخال الاسم ورقم الهاتف بشكل صحيح" });
      return;
    }

    planAbortRef.current?.abort();
    const controller = new AbortController();
    planAbortRef.current = controller;
    setMutationUi({ kind: "planning" });

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dayOffset = selectedSlot.dayOffset ?? 0;
    const empId =
      mode === "specific"
        ? barber?.id
        : undefined;

    try {
      const res = await createBookingPlan(
        {
          branchCode,
          customer: { name, phone },
          serviceIds,
          date: dateStr,
          time: selectedSlot.time,
          dayOffset,
          mode,
          empId,
          notes: notes.trim() || undefined,
        },
        controller.signal,
      );

      if (controller.signal.aborted) return;

      const planData = res.data;
      if (!planData.planToken) {
        clearPlanSession();
        setMutationUi({
          kind: "error",
          message: "تعذر تجهيز خطة الحجز. يرجى المحاولة مرة أخرى.",
          code: "PLAN_TOKEN_REQUIRED",
        });
        return;
      }
      if (!planData.planFingerprint && process.env.NODE_ENV === "development") {
        console.warn("[booking-flow] planFingerprint missing — treating as compat gap");
      }

      setPlan(planData);
      setMutationUi({ kind: "idle" });
      setStep("review");
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof BookingApiError) {
        if (err.isRateLimited && err.retryAfterSeconds) {
          setMutationUi({
            kind: "rate_limited",
            message: err.message,
            retryAfterSeconds: err.retryAfterSeconds,
            until: Date.now() + err.retryAfterSeconds * 1000,
          });
          return;
        }
        setMutationUi({ kind: "error", message: err.message, code: err.code });
        return;
      }
      setMutationUi({ kind: "error", message: getArabicErrorMessage("UNKNOWN_ERROR") });
    }
  }, [
    branchCode,
    selectedDate,
    selectedSlot,
    serviceIds,
    mode,
    barber?.id,
    customerName,
    customerPhone,
    notes,
    mutationUi,
  ]);

  const confirmCreate = useCallback(async () => {
    if (!plan || !branchCode || !selectedDate || !selectedSlot) return;
    if (createInFlightRef.current) return;
    if (mutationUi.kind === "rate_limited" && Date.now() < mutationUi.until) return;
    if (mutationUi.kind === "creating") return;

    const phone = normalizeEgyptianPhone(customerPhone);
    const name = customerName.trim();
    if (!phone || name.length < 2 || !plan.planToken) return;

    createInFlightRef.current = true;
    setMutationUi({ kind: "creating" });

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dayOffset = selectedSlot.dayOffset ?? 0;
    const empId = mode === "specific" ? barber?.id : undefined;
    const customer: BookingCustomer = { name, phone };

    try {
      const result = await submitBookingFromPlan({
        plan,
        customer,
        notes: notes.trim() || undefined,
        branchCode,
        date: dateStr,
        time: selectedSlot.time,
        dayOffset,
        serviceIds,
        mode,
        empId,
      });

      if (result.outcome === "success" && result.booking) {
        setCreated(result.booking);
        setPlan(null);
        setMutationUi({ kind: "idle" });
        setStep("success");
        return;
      }

      if (result.outcome === "mutation_outcome_unknown") {
        setMutationUi({
          kind: "unknown",
          message:
            "تعذر التأكد من نتيجة الطلب. قد يكون الحجز تم بالفعل.",
          retryAfterSeconds: result.error?.retryAfterSeconds,
        });
        return;
      }

      const err = result.error;
      const code = err?.code;
      const conflictCodes = new Set([
        "SLOT_NOT_AVAILABLE",
        "SLOT_CONFLICT",
        "BARBER_NOT_AVAILABLE",
        "BARBER_NOT_FOUND",
        "PLAN_TOKEN_EXPIRED",
        "PLAN_TOKEN_REQUEST_MISMATCH",
        "PLAN_TOKEN_REQUIRED",
        "PLAN_TOKEN_INVALID",
        "PLAN_CREATE_MISMATCH",
        "NO_ELIGIBLE_BARBER",
        "EMPLOYEE_INTERVAL_BUSY_GLOBAL",
        "BARBER_FULLY_BOOKED",
        "SLOT_UNAVAILABLE",
      ]);

      if (err?.isRateLimited && err.retryAfterSeconds) {
        setMutationUi({
          kind: "rate_limited",
          message: err.message,
          retryAfterSeconds: err.retryAfterSeconds,
          until: Date.now() + err.retryAfterSeconds * 1000,
        });
        return;
      }

      if (code && conflictCodes.has(code)) {
        clearPlanSession();
        setPlan(null);
        setSelectedSlot(undefined);
        setSlots([]);
        setDays([]);
        setMutationUi({
          kind: "error",
          message: err?.message ?? getArabicErrorMessage(code as never),
          code,
        });
        setStep("time");
        return;
      }

      setMutationUi({
        kind: "error",
        message: err?.message ?? getArabicErrorMessage("UNKNOWN_ERROR"),
        code,
      });
    } finally {
      createInFlightRef.current = false;
    }
  }, [
    plan,
    branchCode,
    selectedDate,
    selectedSlot,
    customerName,
    customerPhone,
    notes,
    serviceIds,
    mode,
    barber?.id,
    mutationUi,
  ]);

  const safeRetryCreate = useCallback(() => {
    // Reuses in-flight mutation ID via submitBookingFromPlan / getOrCreateMutationId
    void confirmCreate();
  }, [confirmCreate]);

  const resetAll = useCallback(() => {
    bumpSelection();
    daysAbortRef.current?.abort();
    slotsAbortRef.current?.abort();
    planAbortRef.current?.abort();
    if (branchCode && selectedDate && selectedSlot) {
      abandonMutationId(
        buildCreateOperationKey({
          branchCode,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedSlot.time,
          serviceIds,
          mode,
          empId: mode === "specific" ? barber?.id : undefined,
          dayOffset: selectedSlot.dayOffset ?? 0,
        }),
      );
    }
    clearPlanSession();
    setStep("branch");
    setMode(initialMode ?? "specific");
    setServiceIds([]);
    setBarber(
      initialBarber?.id != null ? { id: initialBarber.id, name: initialBarber.name } : null,
    );
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
    setDays([]);
    setSlots([]);
    setPlan(null);
    setCreated(null);
    setCustomerName("");
    setCustomerPhone("");
    setNotes(bookingNote ?? "");
    setMutationUi({ kind: "idle" });
    setCatalogError(null);
    setDaysError(null);
    setSlotsError(null);
  }, [
    bumpSelection,
    branchCode,
    selectedDate,
    selectedSlot,
    serviceIds,
    mode,
    barber?.id,
    initialMode,
    initialBarber,
    bookingNote,
  ]);

  const rateLimitRemainingSeconds =
    mutationUi.kind === "rate_limited"
      ? Math.max(0, Math.ceil((mutationUi.until - Date.now()) / 1000))
      : 0;

  // silence unused tick dependency warning by reading it
  void rateLimitTick;

  return {
    step,
    setStep,
    mode,
    config,
    services,
    barbers,
    catalogLoading,
    catalogError,
    serviceIds,
    selectServices,
    selectMode,
    barber,
    selectBarber,
    days,
    daysLoading,
    daysError,
    slots,
    slotsLoading,
    slotsError,
    selectedDate,
    selectedSlot,
    selectDate,
    selectSlot,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    notes,
    setNotes,
    isPhoneReady,
    normalizeEgyptianPhone,
    catalogPrice,
    catalogDuration,
    plan,
    created,
    mutationUi,
    rateLimitRemainingSeconds,
    requestPlan,
    confirmCreate,
    safeRetryCreate,
    invalidatePlan,
    resetAll,
    maxServices: MAX_SERVICES,
  };
}
