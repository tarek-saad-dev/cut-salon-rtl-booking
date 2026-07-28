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
  getPublicBarberProfile,
  getAvailableDays,
  getAvailableSlots,
  getCrossBranchAvailability,
  crossBranchSlotKey,
  cairoTodayYmd,
  CROSS_BRANCH_AVAILABILITY_DEFAULT_DAYS,
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
  type PublicBarberBranch,
  type AvailableDay,
  type AvailableSlot,
  type CrossBranchSlot,
  type BookingPlan,
  type BookingCreateResponse,
  type BookingMode,
  type BookingEntryMode,
  type BookingCustomer,
} from "@/lib/booking-api";

export type BookingUiStep =
  | "branch"
  | "mode"
  | "service"
  | "date"
  | "time"
  | "slots"
  | "details"
  | "review"
  | "success";

const MAX_SERVICES = 12;
const ALL_CROSS_TAB = "all";

function pickCatalogBranchCode(branches: PublicBarberBranch[]): string | undefined {
  if (!branches.length) return undefined;
  const gleem = branches.find((b) => b.branchCode.toUpperCase() === "GLEEM");
  return (gleem ?? branches[0]).branchCode;
}

function parseYmdToLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

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
  entryMode?: BookingEntryMode;
}) {
  const {
    open,
    branchCode,
    initialMode,
    initialBarber,
    bookingNote,
    skipModeStep,
    entryMode = "branch_first",
  } = opts;

  const isBarberFirst = entryMode === "barber_first";

  const [step, setStep] = useState<BookingUiStep>(
    isBarberFirst ? "service" : "branch",
  );
  const [mode, setMode] = useState<BookingMode>(
    isBarberFirst ? "specific" : (initialMode ?? "specific"),
  );
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [barber, setBarber] = useState<{ id: number; name: string } | null>(
    initialBarber?.id != null ? { id: initialBarber.id, name: initialBarber.name } : null,
  );

  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [services, setServices] = useState<BookingService[]>([]);
  const [barbers, setBarbers] = useState<PublicBarber[]>([]);
  const [barberBranches, setBarberBranches] = useState<PublicBarberBranch[]>([]);
  const [barberServiceIds, setBarberServiceIds] = useState<number[] | null>(null);
  const [barberProfileLoading, setBarberProfileLoading] = useState(false);
  const [barberProfileError, setBarberProfileError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [days, setDays] = useState<AvailableDay[]>([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [daysError, setDaysError] = useState<string | null>(null);

  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [crossSlots, setCrossSlots] = useState<CrossBranchSlot[]>([]);
  const [crossBranches, setCrossBranches] = useState<PublicBarberBranch[]>([]);
  const [crossSlotsLoading, setCrossSlotsLoading] = useState(false);
  const [crossSlotsError, setCrossSlotsError] = useState<string | null>(null);
  const [crossTab, setCrossTab] = useState<string>(ALL_CROSS_TAB);
  const [crossReloadToken, setCrossReloadToken] = useState(0);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | undefined>();
  /** Barber-first booking branch (may be CAMP_CAESAR; not BranchContext). */
  const [bookingBranchCode, setBookingBranchCode] = useState<string | undefined>();
  const [bookingBranchName, setBookingBranchName] = useState<string | undefined>();

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
  const crossAbortRef = useRef<AbortController | null>(null);
  const planAbortRef = useRef<AbortController | null>(null);
  const prevBranchRef = useRef<string | undefined>(undefined);
  const createInFlightRef = useRef(false);

  const effectiveBranchCode = isBarberFirst ? bookingBranchCode : branchCode;

  const bumpSelection = useCallback(() => {
    selectionVersionRef.current = incrementSelectionVersion();
    return selectionVersionRef.current;
  }, []);

  const clearDownstreamFromBranch = useCallback(() => {
    bumpSelection();
    daysAbortRef.current?.abort();
    slotsAbortRef.current?.abort();
    crossAbortRef.current?.abort();
    planAbortRef.current?.abort();
    setServiceIds([]);
    // Barber-first keeps the entry barber locked; branch-first clears it.
    if (!isBarberFirst) {
      setBarber(null);
    } else if (initialBarber?.id != null) {
      setBarber({ id: initialBarber.id, name: initialBarber.name });
      setMode("specific");
    }
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
    setBookingBranchCode(undefined);
    setBookingBranchName(undefined);
    setDays([]);
    setSlots([]);
    setCrossSlots([]);
    setCrossBranches([]);
    setCrossTab(ALL_CROSS_TAB);
    setCrossSlotsError(null);
    setPlan(null);
    clearPlanSession();
    setCreated(null);
    setMutationUi({ kind: "idle" });
    setDaysError(null);
    setSlotsError(null);
  }, [bumpSelection, isBarberFirst, initialBarber]);

  // Barber-first: load public branches + serviceIds for the selected barber
  const [barberProfileReload, setBarberProfileReload] = useState(0);
  const retryBarberProfile = useCallback(() => {
    setBarberProfileReload((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!open || !isBarberFirst) {
      setBarberBranches([]);
      setBarberServiceIds(null);
      setBarberProfileError(null);
      setBarberProfileLoading(false);
      return;
    }

    if (initialBarber?.id == null || !Number.isFinite(initialBarber.id) || initialBarber.id <= 0) {
      setBarberBranches([]);
      setBarberServiceIds(null);
      setBarberProfileLoading(false);
      setBarberProfileError("تعذر بدء الحجز: معرف الحلاق غير متاح");
      setBarber(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setBarberProfileLoading(true);
    setBarberProfileError(null);
    setMode("specific");
    setBarber({ id: initialBarber.id, name: initialBarber.name });

    (async () => {
      try {
        const res = await getPublicBarberProfile(initialBarber.id!, controller.signal);
        if (cancelled) return;
        const profile = res.data;
        if (!profile) {
          setBarberProfileError("هذا الحلاق غير متاح للحجز الإلكتروني حالياً");
          setBarberBranches([]);
          setBarberServiceIds(null);
          return;
        }
        setBarber({ id: profile.id, name: profile.name || initialBarber.name });
        setBarberBranches(profile.branches ?? []);
        setBarberServiceIds(
          Array.isArray(profile.serviceIds) ? profile.serviceIds : [],
        );
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        if (err instanceof BookingApiError) {
          setBarberProfileError(err.message);
        } else {
          setBarberProfileError("تعذر تحميل فروع الحلاق، حاول مرة أخرى");
        }
        setBarberBranches([]);
        setBarberServiceIds(null);
      } finally {
        if (!cancelled) setBarberProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, isBarberFirst, initialBarber?.id, initialBarber?.name, barberProfileReload]);

  // Branch change mid-flow (branch-first only — barber-first does not use BranchContext)
  useEffect(() => {
    if (isBarberFirst) return;
    const prev = prevBranchRef.current;
    prevBranchRef.current = branchCode;
    if (!open) return;
    if (prev === undefined || prev === branchCode) return;
    clearDownstreamFromBranch();
    setStep(skipModeStep || initialMode ? "service" : "mode");
  }, [
    branchCode,
    open,
    clearDownstreamFromBranch,
    skipModeStep,
    initialMode,
    isBarberFirst,
  ]);

  // Catalog load
  useEffect(() => {
    if (!open) return;

    let catalogBranch: string | undefined;
    if (isBarberFirst) {
      if (barberServiceIds === null && !barberProfileError) {
        setCatalogLoading(true);
        return;
      }
      catalogBranch = pickCatalogBranchCode(barberBranches);
      if (!catalogBranch) {
        if (!barberProfileLoading && barberServiceIds !== null) {
          setCatalogError("لا توجد فروع متاحة لتحميل خدمات هذا الحلاق");
          setCatalogLoading(false);
        }
        return;
      }
    } else {
      if (!branchCode) return;
      catalogBranch = branchCode;
    }

    let cancelled = false;
    const controller = new AbortController();
    setCatalogLoading(true);
    setCatalogError(null);

    (async () => {
      try {
        const [cfg, svc, bar] = await Promise.all([
          getBookingConfig(catalogBranch!, controller.signal),
          getServices(catalogBranch!, controller.signal),
          isBarberFirst
            ? Promise.resolve({ data: [] as PublicBarber[] })
            : listBranchBarbers(catalogBranch!, controller.signal),
        ]);
        if (cancelled) return;
        setConfig(cfg.data);
        let bookable = (svc.data ?? []).filter((s) => s.isBookableOnline);
        if (isBarberFirst && barberServiceIds !== null) {
          const allowed = new Set(barberServiceIds);
          bookable = bookable.filter((s) => allowed.has(s.id));
        }
        setServices(bookable);
        const branchBarbers = (bar.data ?? []).filter((b) => b.isBookableOnline);
        setBarbers(branchBarbers);

        if (isBarberFirst && initialBarber?.id != null) {
          setBarber({ id: initialBarber.id, name: initialBarber.name });
          setMode("specific");
        } else if (!isBarberFirst && initialBarber?.id != null) {
          const stillHere = branchBarbers.some((b) => b.id === initialBarber.id);
          if (stillHere) {
            setBarber({ id: initialBarber.id, name: initialBarber.name });
          }
        }
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
  }, [
    open,
    branchCode,
    isBarberFirst,
    barberBranches,
    barberServiceIds,
    barberProfileError,
    barberProfileLoading,
    initialBarber?.id,
    initialBarber?.name,
  ]);

  // Available days (branch-first date step only)
  useEffect(() => {
    if (isBarberFirst) return;
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
  }, [step, branchCode, serviceIds, mode, barber?.id, bumpSelection, isBarberFirst]);

  // Available slots (branch-first time step only)
  useEffect(() => {
    if (isBarberFirst) return;
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
  }, [step, branchCode, selectedDate, serviceIds, mode, barber?.id, bumpSelection, isBarberFirst]);

  // Cross-branch slots (barber-first) — one request per barber/service selection
  useEffect(() => {
    if (!isBarberFirst) return;
    if (step !== "slots" || serviceIds.length === 0 || barber?.id == null) return;

    crossAbortRef.current?.abort();
    const controller = new AbortController();
    crossAbortRef.current = controller;
    const version = bumpSelection();

    setCrossSlotsLoading(true);
    setCrossSlotsError(null);
    setCrossSlots([]);
    setCrossBranches([]);
    setCrossTab(ALL_CROSS_TAB);

    getCrossBranchAvailability(
      barber.id,
      {
        serviceIds,
        dateFrom: cairoTodayYmd(),
        days: CROSS_BRANCH_AVAILABILITY_DEFAULT_DAYS,
      },
      controller.signal,
    )
      .then((res) => {
        if (isStaleResponse(version) || controller.signal.aborted) return;
        setCrossSlots(res.data.slots ?? []);
        setCrossBranches(res.data.branches ?? []);
        setCrossSlotsLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted || isStaleResponse(version)) return;
        setCrossSlotsLoading(false);
        if (err instanceof BookingApiError) {
          setCrossSlotsError(err.message);
          if (err.isRateLimited && err.retryAfterSeconds) {
            setMutationUi({
              kind: "rate_limited",
              message: err.message,
              retryAfterSeconds: err.retryAfterSeconds,
              until: Date.now() + err.retryAfterSeconds * 1000,
            });
          }
        } else {
          setCrossSlotsError(getArabicErrorMessage("UNKNOWN_ERROR"));
        }
      });

    return () => controller.abort();
  }, [
    isBarberFirst,
    step,
    serviceIds,
    barber?.id,
    bumpSelection,
    crossReloadToken,
  ]);

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
    crossAbortRef.current?.abort();
    setServiceIds(unique);
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
    setBookingBranchCode(undefined);
    setBookingBranchName(undefined);
    setDays([]);
    setSlots([]);
    setCrossSlots([]);
    setCrossBranches([]);
    setCrossTab(ALL_CROSS_TAB);
    setCrossSlotsError(null);
    setPlan(null);
    setMutationUi({ kind: "idle" });
  }, [bumpSelection]);

  const selectMode = useCallback((next: BookingMode) => {
    if (isBarberFirst) return;
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
  }, [bumpSelection, isBarberFirst]);

  const selectBarber = useCallback((b: { id: number; name: string } | null) => {
    bumpSelection();
    clearPlanSession();
    crossAbortRef.current?.abort();
    setBarber(b);
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
    setBookingBranchCode(undefined);
    setBookingBranchName(undefined);
    setDays([]);
    setSlots([]);
    setCrossSlots([]);
    setCrossBranches([]);
    setCrossTab(ALL_CROSS_TAB);
    setPlan(null);
    // Changing barber invalidates services selection
    setServiceIds([]);
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

  const selectCrossBranchSlot = useCallback((slot: CrossBranchSlot) => {
    clearPlanSession();
    setBookingBranchCode(slot.branchCode);
    setBookingBranchName(slot.branchName);
    setSelectedDate(parseYmdToLocalDate(slot.date));
    setSelectedSlot({
      time: slot.time,
      available: true,
      dayOffset: slot.dayOffset,
      branchCode: slot.branchCode,
      branchName: slot.branchName,
      date: slot.date,
    });
    setPlan(null);
    setMutationUi({ kind: "idle" });
    setStep("details");
  }, []);

  const setCrossBranchTab = useCallback((tab: string) => {
    // Local filter only — never re-fetch
    setCrossTab(tab);
  }, []);

  const retryCrossBranchSlots = useCallback(() => {
    setCrossReloadToken((n) => n + 1);
  }, []);

  const goToSlotsStep = useCallback(() => {
    setStep(isBarberFirst ? "slots" : "date");
  }, [isBarberFirst]);

  const invalidatePlan = useCallback(() => {
    clearPlanSession();
    setPlan(null);
  }, []);

  const requestPlan = useCallback(async () => {
    if (!effectiveBranchCode || !selectedDate || !selectedSlot || serviceIds.length === 0) return;
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

    const dateStr =
      selectedSlot.date && /^\d{4}-\d{2}-\d{2}$/.test(selectedSlot.date)
        ? selectedSlot.date
        : format(selectedDate, "yyyy-MM-dd");
    const dayOffset = selectedSlot.dayOffset ?? 0;
    const empId =
      mode === "specific"
        ? barber?.id
        : undefined;

    try {
      const res = await createBookingPlan(
        {
          branchCode: effectiveBranchCode,
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
    effectiveBranchCode,
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
    if (!plan || !effectiveBranchCode || !selectedDate || !selectedSlot) return;
    if (createInFlightRef.current) return;
    if (mutationUi.kind === "rate_limited" && Date.now() < mutationUi.until) return;
    if (mutationUi.kind === "creating") return;

    const phone = normalizeEgyptianPhone(customerPhone);
    const name = customerName.trim();
    if (!phone || name.length < 2 || !plan.planToken) return;

    createInFlightRef.current = true;
    setMutationUi({ kind: "creating" });

    const dateStr =
      selectedSlot.date && /^\d{4}-\d{2}-\d{2}$/.test(selectedSlot.date)
        ? selectedSlot.date
        : format(selectedDate, "yyyy-MM-dd");
    const dayOffset = selectedSlot.dayOffset ?? 0;
    const empId = mode === "specific" ? barber?.id : undefined;
    const customer: BookingCustomer = { name, phone };

    try {
      const result = await submitBookingFromPlan({
        plan,
        customer,
        notes: notes.trim() || undefined,
        branchCode: effectiveBranchCode,
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
        setBookingBranchCode(undefined);
        setBookingBranchName(undefined);
        setSlots([]);
        setDays([]);
        setCrossSlots([]);
        setMutationUi({
          kind: "error",
          message: err?.message ?? getArabicErrorMessage(code as never),
          code,
        });
        setStep(isBarberFirst ? "slots" : "time");
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
    effectiveBranchCode,
    selectedDate,
    selectedSlot,
    customerName,
    customerPhone,
    notes,
    serviceIds,
    mode,
    barber?.id,
    mutationUi,
    isBarberFirst,
  ]);

  const safeRetryCreate = useCallback(() => {
    // Reuses in-flight mutation ID via submitBookingFromPlan / getOrCreateMutationId
    void confirmCreate();
  }, [confirmCreate]);

  const resetAll = useCallback(() => {
    bumpSelection();
    daysAbortRef.current?.abort();
    slotsAbortRef.current?.abort();
    crossAbortRef.current?.abort();
    planAbortRef.current?.abort();
    if (effectiveBranchCode && selectedDate && selectedSlot) {
      abandonMutationId(
        buildCreateOperationKey({
          branchCode: effectiveBranchCode,
          date:
            selectedSlot.date && /^\d{4}-\d{2}-\d{2}$/.test(selectedSlot.date)
              ? selectedSlot.date
              : format(selectedDate, "yyyy-MM-dd"),
          time: selectedSlot.time,
          serviceIds,
          mode,
          empId: mode === "specific" ? barber?.id : undefined,
          dayOffset: selectedSlot.dayOffset ?? 0,
        }),
      );
    }
    clearPlanSession();
    setStep(isBarberFirst ? "service" : "branch");
    setMode(isBarberFirst ? "specific" : (initialMode ?? "specific"));
    setServiceIds([]);
    setBarber(
      initialBarber?.id != null ? { id: initialBarber.id, name: initialBarber.name } : null,
    );
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
    setBookingBranchCode(undefined);
    setBookingBranchName(undefined);
    setDays([]);
    setSlots([]);
    setCrossSlots([]);
    setCrossBranches([]);
    setCrossTab(ALL_CROSS_TAB);
    setCrossSlotsError(null);
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
    effectiveBranchCode,
    selectedDate,
    selectedSlot,
    serviceIds,
    mode,
    barber?.id,
    initialMode,
    initialBarber,
    bookingNote,
    isBarberFirst,
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
    entryMode,
    isBarberFirst,
    config,
    services,
    barbers,
    barberBranches,
    barberProfileLoading,
    barberProfileError,
    retryBarberProfile,
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
    crossSlots,
    crossBranches,
    crossSlotsLoading,
    crossSlotsError,
    crossTab,
    setCrossBranchTab,
    retryCrossBranchSlots,
    goToSlotsStep,
    selectedDate,
    selectedSlot,
    bookingBranchCode,
    bookingBranchName,
    effectiveBranchCode,
    selectDate,
    selectSlot,
    selectCrossBranchSlot,
    selectedCrossSlotKey:
      selectedSlot?.branchCode && selectedSlot.date
        ? crossBranchSlotKey({
            branchCode: selectedSlot.branchCode,
            branchName: selectedSlot.branchName || selectedSlot.branchCode,
            date: selectedSlot.date,
            time: selectedSlot.time,
            dayOffset: selectedSlot.dayOffset === 1 ? 1 : 0,
          })
        : null,
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
