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
  peekCachedAvailableSlots,
  prefetchAvailableSlots,
  getCrossBranchAvailability,
  getBarberLocation,
  peekCachedAvailableDays,
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
  type BarberLocation,
  type BookingPlan,
  type BookingCreateResponse,
  type BookingMode,
  type BookingEntryMode,
  type BookingCustomer,
} from "@/lib/booking-api";
import { getCachedCatalog, setCachedCatalog } from "@/lib/booking-api/session-cache";

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

  const [step, setStep] = useState<BookingUiStep>("branch");
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

  /** Where the specific barber works on the selected calendar day. */
  const [dayLocation, setDayLocation] = useState<BarberLocation | null>(null);
  const [dayLocationLoading, setDayLocationLoading] = useState(false);
  const [dayLocationError, setDayLocationError] = useState<string | null>(null);

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
  const locationAbortRef = useRef<AbortController | null>(null);
  const planAbortRef = useRef<AbortController | null>(null);
  const prevBranchRef = useRef<string | undefined>(undefined);
  const createInFlightRef = useRef(false);
  const barberServiceIdsRef = useRef<number[] | null>(null);
  barberServiceIdsRef.current = barberServiceIds;

  // Calendar flow uses BranchContext branch; bookingBranch* remains for legacy cross-branch picks.
  const effectiveBranchCode = bookingBranchCode ?? branchCode;

  const bumpSelection = useCallback(() => {
    selectionVersionRef.current = incrementSelectionVersion();
    return selectionVersionRef.current;
  }, []);

  const clearDownstreamFromBranch = useCallback(() => {
    bumpSelection();
    daysAbortRef.current?.abort();
    slotsAbortRef.current?.abort();
    crossAbortRef.current?.abort();
    locationAbortRef.current?.abort();
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
    setDayLocation(null);
    setDayLocationError(null);
    setDayLocationLoading(false);
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
        setBarber({ id: profile.id, name: initialBarber.name || profile.name });
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

  // Branch change mid-flow
  useEffect(() => {
    const prev = prevBranchRef.current;
    prevBranchRef.current = branchCode;
    if (!open) return;
    if (prev === undefined || prev === branchCode) return;
    clearDownstreamFromBranch();
    setBookingBranchCode(undefined);
    setBookingBranchName(undefined);
    setStep(isBarberFirst || skipModeStep || initialMode ? "service" : "mode");
  }, [
    branchCode,
    open,
    clearDownstreamFromBranch,
    skipModeStep,
    initialMode,
    isBarberFirst,
  ]);

  // Catalog load — keyed only by branch. Do NOT restart when barber profile
  // finishes (that used to abort in-flight config/services and double the wait).
  useEffect(() => {
    if (!open) return;

    let catalogBranch: string | undefined;
    if (isBarberFirst) {
      // Wait for profile branches — avoid GLEEM warm → real-branch double catalog.
      if (!branchCode && barberBranches.length === 0) {
        if (barberProfileLoading) return;
        catalogBranch = "GLEEM";
      } else {
        catalogBranch =
          branchCode ?? pickCatalogBranchCode(barberBranches) ?? "GLEEM";
      }
    } else {
      if (!branchCode) return;
      catalogBranch = branchCode;
    }

    type CachedCatalog = {
      config: BookingConfig | null;
      services: BookingService[];
      barbers: PublicBarber[];
    };
    const cached = getCachedCatalog<CachedCatalog>(catalogBranch);
    if (cached) {
      let bookable = (cached.services ?? []).filter((s) => s.isBookableOnline);
      if (isBarberFirst && barberServiceIdsRef.current !== null) {
        const allowed = new Set(barberServiceIdsRef.current);
        bookable = bookable.filter((s) => allowed.has(s.id));
      }
      setConfig(cached.config);
      setServices(bookable);
      setBarbers((cached.barbers ?? []).filter((b) => b.isBookableOnline));
      setCatalogError(null);
      setCatalogLoading(false);
      if (isBarberFirst && initialBarber?.id != null) {
        setBarber({ id: initialBarber.id, name: initialBarber.name });
        setMode("specific");
      }
      return;
    }

    let cancelled = false;
    // Do NOT abort on cleanup — React Strict Mode remounts would cancel the
    // in-flight config/services call (and any deduped sharers), leaving
    // "تم إلغاء الطلب". Let the request finish and warm the session cache.
    if (services.length === 0) setCatalogLoading(true);
    setCatalogError(null);

    (async () => {
      try {
        const [cfg, svc, bar] = await Promise.all([
          getBookingConfig(catalogBranch!),
          getServices(catalogBranch!),
          isBarberFirst
            ? Promise.resolve({ data: [] as PublicBarber[] })
            : listBranchBarbers(catalogBranch!),
        ]);
        if (cancelled) return;
        setConfig(cfg.data);
        let bookable = (svc.data ?? []).filter((s) => s.isBookableOnline);
        if (isBarberFirst && barberServiceIdsRef.current !== null) {
          const allowed = new Set(barberServiceIdsRef.current);
          bookable = bookable.filter((s) => allowed.has(s.id));
        }
        setServices(bookable);
        const branchBarbers = (bar.data ?? []).filter((b) => b.isBookableOnline);
        setBarbers(branchBarbers);
        const existing = getCachedCatalog<CachedCatalog>(catalogBranch!);
        setCachedCatalog(catalogBranch!, {
          config: cfg.data,
          services: svc.data ?? [],
          // Barber-first skips branch barbers fetch — don't wipe a prior cache.
          barbers: isBarberFirst ? (existing?.barbers ?? []) : (bar.data ?? []),
        });

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
    };
  }, [
    open,
    branchCode,
    isBarberFirst,
    initialBarber?.id,
    initialBarber?.name,
    barberBranches,
    barberProfileLoading,
  ]);

  // Barber-first: filter catalog services by profile serviceIds (no network).
  useEffect(() => {
    if (!isBarberFirst || barberServiceIds === null) return;
    const allowed = new Set(barberServiceIds);
    setServices((prev) => {
      const filtered = prev.filter((s) => allowed.has(s.id));
      // If catalog not loaded yet, keep empty; catalog effect will set full list then this re-runs.
      if (prev.length === 0) return prev;
      // Avoid churn when already filtered.
      if (filtered.length === prev.length && filtered.every((s, i) => s.id === prev[i]?.id)) {
        return prev;
      }
      return filtered;
    });
  }, [isBarberFirst, barberServiceIds]);

  // Prefetch available-days while still on service/mode so the calendar often
  // appears instantly after Continue.
  // IMPORTANT: do not abort this request on cleanup — aborting would kill the
  // shared deduped in-flight call used by the date step.
  useEffect(() => {
    if (!open || !branchCode || serviceIds.length === 0) return;
    if (step !== "service" && step !== "mode") return;
    if (mode === "specific" && barber?.id == null) return;

    void getAvailableDays({
      branchCode,
      serviceIds,
      mode,
      empId: mode === "specific" ? barber?.id : undefined,
    }).catch(() => {
      /* warm-cache only */
    });
  }, [open, branchCode, serviceIds, mode, barber?.id, step]);

  // Available days (calendar date step)
  useEffect(() => {
    if (step !== "date" || !branchCode || serviceIds.length === 0) return;
    if (mode === "specific" && barber?.id == null) return;

    const daysParams = {
      branchCode,
      serviceIds,
      mode,
      empId: mode === "specific" ? barber?.id : undefined,
    };

    // Instant paint when prefetch / prior visit already warmed the cache.
    const cached = peekCachedAvailableDays(daysParams);
    if (cached) {
      setDays(cached);
      setDaysLoading(false);
      setDaysError(null);
      return;
    }

    let cancelled = false;
    // Capture selection version WITHOUT bumping — remount/abort must not
    // invalidate a shared in-flight available-days request.
    const version = selectionVersionRef.current;
    setDaysLoading(true);
    setDaysError(null);

    getAvailableDays(daysParams)
      .then((res) => {
        if (cancelled || isStaleResponse(version)) return;
        setDays(res.data ?? []);
        setDaysLoading(false);
      })
      .catch((err) => {
        if (cancelled || isStaleResponse(version)) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
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

    return () => {
      cancelled = true;
    };
  }, [step, branchCode, serviceIds, mode, barber?.id]);

  // Available slots (time step after calendar day)
  useEffect(() => {
    if (step !== "time" || !branchCode || !selectedDate || serviceIds.length === 0) return;
    if (mode === "specific" && barber?.id == null) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const slotsParams = {
      branchCode,
      date: dateStr,
      serviceIds,
      mode,
      empId: mode === "specific" ? barber?.id : undefined,
    };

    // Instant paint from prefetch/TTL cache — never flash a full skeleton over known slots.
    const cached = peekCachedAvailableSlots(slotsParams);
    if (cached) {
      setSlots(cached);
      setSlotsLoading(false);
      setSlotsError(null);
      return;
    }

    let cancelled = false;
    // Do not bumpSelection here — selectDate already bumped; remount must not
    // invalidate a shared in-flight slots prefetch.
    const version = selectionVersionRef.current;
    setSlotsLoading(true);
    setSlotsError(null);

    getAvailableSlots(slotsParams)
      .then((res) => {
        if (cancelled || isStaleResponse(version)) return;
        setSlots(res.data ?? []);
        setSlotsLoading(false);
      })
      .catch((err) => {
        if (cancelled || isStaleResponse(version)) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
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

    return () => {
      cancelled = true;
    };
  }, [step, branchCode, selectedDate, serviceIds, mode, barber?.id]);

  // Legacy cross-branch slots panel (kept for tests; main UI uses calendar again)
  useEffect(() => {
    if (!isBarberFirst) return;
    if (step !== "slots" || serviceIds.length === 0 || barber?.id == null) return;

    crossAbortRef.current?.abort();
    const controller = new AbortController();
    crossAbortRef.current = controller;
    const version = bumpSelection();

    setCrossSlotsLoading(true);
    setCrossSlotsError(null);
    // Keep prior cross-branch slots while refreshing (avoid empty flash).

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

  // Barber day-location: after a calendar day is chosen, resolve which branch
  // the specific barber works at that day (shown prominently on time step).
  useEffect(() => {
    if (step !== "time" || !selectedDate || mode !== "specific" || barber?.id == null) {
      return;
    }

    locationAbortRef.current?.abort();
    const controller = new AbortController();
    locationAbortRef.current = controller;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    setDayLocationLoading(true);
    setDayLocationError(null);

    getBarberLocation(
      barber.id,
      { date: dateStr, serviceIds: serviceIds.length ? serviceIds : undefined },
      controller.signal,
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        setDayLocation(res.data);
        if (res.data.branch?.branchCode) {
          setBookingBranchCode(res.data.branch.branchCode);
          setBookingBranchName(res.data.branch.branchName);
        }
        setDayLocationLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setDayLocationLoading(false);
        setDayLocation(null);
        if (err instanceof BookingApiError) {
          setDayLocationError(err.message);
        } else {
          setDayLocationError(null);
        }
      });

    return () => controller.abort();
  }, [step, selectedDate, mode, barber?.id, serviceIds]);

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
    setSlotsError(null);
    setDayLocationError(null);
    // Keep prior dayLocation visible until the new location resolves (no blank banner).
    setDayLocationLoading(true);
    setPlan(null);
    // Prefetch slots while transitioning to time step.
    if (branchCode && serviceIds.length > 0) {
      const dateStr = format(date, "yyyy-MM-dd");
      const cached = peekCachedAvailableSlots({
        branchCode,
        date: dateStr,
        serviceIds,
        mode,
        empId: mode === "specific" ? barber?.id : undefined,
      });
      if (cached) {
        setSlots(cached);
        setSlotsLoading(false);
      } else {
        setSlots([]);
        setSlotsLoading(true);
      }
      prefetchAvailableSlots({
        branchCode,
        date: dateStr,
        serviceIds,
        mode,
        empId: mode === "specific" ? barber?.id : undefined,
      });
    } else {
      setSlots([]);
    }
    setStep("time");
  }, [bumpSelection, branchCode, serviceIds, mode, barber?.id]);

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
    // Classic calendar day selection (restored from pre-cross-branch flow).
    setStep("date");
  }, []);

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
    locationAbortRef.current?.abort();
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
    setStep("branch");
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
    setDayLocation(null);
    setDayLocationLoading(false);
    setDayLocationError(null);
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
    dayLocation,
    dayLocationLoading,
    dayLocationError,
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
