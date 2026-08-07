/**
 * Phase 8B1 — controlled booking flow hook for BookingModal.
 * One selection source; plan then create; no legacy publicBookingApi.
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  getBookingConfig,
  getServices,
  filterCatalogByServiceIds,
  listBranchBarbers,
  getPublicBarberProfile,
  getAvailableDays,
  getAvailableSlots,
  peekCachedAvailableSlots,
  prefetchAvailableSlots,
  getBarberAvailableDays,
  getBarberAvailableSlots,
  peekCachedBarberAvailableDays,
  peekCachedBarberAvailableSlots,
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
  resolveBookableBranchesForBarber,
  seedBarberProfileCache,
  peekBarberProfileCache,
  profileFromSeed,
  seedIsCompleteForBranchDecision,
  clearBarberProfileCache,
  bookingPerfMark,
  type BarberProfileSeed,
  type BookingConfig,
  type BookingService,
  type BookingServiceCategory,
  type BookingMostPopularSection,
  type ServicesCatalog,
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
  type BarberAvailabilityScope,
  type BarberAvailableDay,
  type BarberAvailableSlot,
  type BarberAvailabilityMeta,
  type PublicBranch,
} from "@/lib/booking-api";
import { getCachedCatalog, setCachedCatalog } from "@/lib/booking-api/session-cache";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";

export type BookingUiStep =
  | "appointment_scope"
  | "branch"
  | "mode"
  | "service"
  | "date"
  | "time"
  | "slots"
  | "details"
  | "review"
  | "success";

/** UI status for barber-first profile / branch loading. */
export type BarberProfileUiStatus =
  | "idle"
  | "loading"
  | "slow_loading"
  | "success"
  | "empty"
  | "request_error"
  | "aborted";

const PROFILE_SLOW_MS = 2_000;
const PROFILE_RETRY_HINT_MS = 5_000;

const MAX_SERVICES = 12;
const ALL_CROSS_TAB = "all";
const EMPTY_PUBLIC_BRANCHES: PublicBranch[] = [];

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
  /** Explicit branch from a branch-specific CTA (not browsing persistence). */
  explicitEntryBranchCode?: string | null;
  /** Preselect scope when entry CTA is branch-specific. */
  initialAvailabilityScope?: BarberAvailabilityScope | null;
  /** Public branches intersecting the barber (from modal resolver). */
  allowedPublicBranches?: PublicBranch[];
  /** Lightweight profile seed from discovery / prefetch (not trusted for plan/create). */
  profileSeed?: BarberProfileSeed | null;
}) {
  const {
    open,
    branchCode,
    initialMode,
    initialBarber,
    bookingNote,
    skipModeStep,
    entryMode = "branch_first",
    explicitEntryBranchCode = null,
    initialAvailabilityScope = null,
    allowedPublicBranches = EMPTY_PUBLIC_BRANCHES,
    profileSeed = null,
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
  const [serviceCategories, setServiceCategories] = useState<BookingServiceCategory[]>([]);
  const [serviceMostPopular, setServiceMostPopular] =
    useState<BookingMostPopularSection | null>(null);
  const [barbers, setBarbers] = useState<PublicBarber[]>([]);
  const [barberBranches, setBarberBranches] = useState<PublicBarberBranch[]>([]);
  const [barberServiceIds, setBarberServiceIds] = useState<number[] | null>(null);
  const [barberProfileLoading, setBarberProfileLoading] = useState(false);
  const [barberProfileError, setBarberProfileError] = useState<string | null>(null);
  const [barberProfileStatus, setBarberProfileStatus] = useState<BarberProfileUiStatus>("idle");
  const [barberProfileShowRetry, setBarberProfileShowRetry] = useState(false);
  const [barberProfileStaleWarning, setBarberProfileStaleWarning] = useState(false);
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

  /** Multi-branch appointment search scope (barber-first only). */
  const [availabilityScope, setAvailabilityScopeState] = useState<BarberAvailabilityScope | null>(
    initialAvailabilityScope,
  );
  const [selectedSpecificBranchCode, setSelectedSpecificBranchCode] = useState<string | null>(
    normalizeBranchCode(explicitEntryBranchCode),
  );
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");
  const [multiBranchDays, setMultiBranchDays] = useState<BarberAvailableDay[]>([]);
  const [multiBranchSlots, setMultiBranchSlots] = useState<BarberAvailableSlot[]>([]);
  const [multiBranchDaysMeta, setMultiBranchDaysMeta] = useState<BarberAvailabilityMeta | null>(null);
  const [multiBranchSlotsMeta, setMultiBranchSlotsMeta] = useState<BarberAvailabilityMeta | null>(null);
  const [explicitEntryBranch, setExplicitEntryBranch] = useState<string | null>(
    normalizeBranchCode(explicitEntryBranchCode),
  );

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

  const clearDateSlotPlan = useCallback(() => {
    bumpSelection();
    daysAbortRef.current?.abort();
    slotsAbortRef.current?.abort();
    locationAbortRef.current?.abort();
    planAbortRef.current?.abort();
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
    setDays([]);
    setSlots([]);
    setMultiBranchDays([]);
    setMultiBranchSlots([]);
    setMultiBranchDaysMeta(null);
    setMultiBranchSlotsMeta(null);
    setDayLocation(null);
    setPlan(null);
    clearPlanSession();
    setMutationUi({ kind: "idle" });
    setDaysError(null);
    setSlotsError(null);
  }, [bumpSelection]);

  const allowedBarberBranches = useMemo(() => {
    if (!isBarberFirst) return allowedPublicBranches;
    if (!barberBranches.length || !allowedPublicBranches.length) return [];
    return resolveBookableBranchesForBarber({
      barberProfileBranches: barberBranches,
      publicBranches: allowedPublicBranches,
      preferredBranchCode: null,
    }).allowedBranches;
  }, [isBarberFirst, barberBranches, allowedPublicBranches]);

  const allowedBranchesKey = allowedBarberBranches
    .map((b) => b.branchCode)
    .join("|");

  const usesBarberAvailabilityApi =
    isBarberFirst &&
    Boolean(availabilityScope) &&
    (availabilityScope === "all_branches" ||
      (availabilityScope === "specific_branch" &&
        Boolean(normalizeBranchCode(selectedSpecificBranchCode))));

  const setAvailabilityScope = useCallback(
    (scope: BarberAvailabilityScope) => {
      bumpSelection();
      clearPlanSession();
      setAvailabilityScopeState(scope);
      setSelectedDate(undefined);
      setSelectedSlot(undefined);
      setDays([]);
      setSlots([]);
      setMultiBranchDays([]);
      setMultiBranchSlots([]);
      setMultiBranchDaysMeta(null);
      setMultiBranchSlotsMeta(null);
      setPlan(null);
      setMutationUi({ kind: "idle" });
      setDaysError(null);
      setSlotsError(null);
      // Clear slot-committed branch; keep specific selection only for that scope.
      setBookingBranchCode(undefined);
      setBookingBranchName(undefined);
      if (scope === "all_branches") {
        setSelectedSpecificBranchCode(null);
        setSelectedBranchFilter("all");
        setStep("service");
      } else {
        const explicit = normalizeBranchCode(explicitEntryBranch);
        if (explicit) {
          setSelectedSpecificBranchCode(explicit);
          const match = allowedPublicBranches.find(
            (b) => normalizeBranchCode(b.branchCode) === explicit,
          );
          if (match) {
            setBookingBranchCode(match.branchCode);
            setBookingBranchName(match.branchName);
          }
          setStep("service");
        } else {
          setSelectedSpecificBranchCode(null);
          setStep("branch");
        }
      }
    },
    [bumpSelection, explicitEntryBranch, allowedPublicBranches],
  );

  const selectSpecificBranch = useCallback(
    (branch: PublicBranch) => {
      const code = normalizeBranchCode(branch.branchCode);
      if (!code) return;
      bumpSelection();
      clearPlanSession();
      setSelectedSpecificBranchCode(code);
      setBookingBranchCode(branch.branchCode);
      setBookingBranchName(branch.branchName);
      setSelectedDate(undefined);
      setSelectedSlot(undefined);
      setDays([]);
      setSlots([]);
      setMultiBranchDays([]);
      setMultiBranchSlots([]);
      setPlan(null);
      setMutationUi({ kind: "idle" });
      setStep("service");
    },
    [bumpSelection],
  );

  // Sync explicit entry props when modal session opens with a branch CTA.
  useEffect(() => {
    if (!open) return;
    const code = normalizeBranchCode(explicitEntryBranchCode);
    setExplicitEntryBranch(code);
    if (initialAvailabilityScope) {
      setAvailabilityScopeState(initialAvailabilityScope);
    }
    if (code && initialAvailabilityScope === "specific_branch") {
      setSelectedSpecificBranchCode(code);
    }
  }, [open, explicitEntryBranchCode, initialAvailabilityScope]);

  // Barber-first: load public branches + serviceIds (cache + seed + SWR)
  const [barberProfileReload, setBarberProfileReload] = useState(0);
  const retryBarberProfile = useCallback(() => {
    setBarberProfileReload((n) => n + 1);
  }, []);
  const appliedProfileEmpRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !isBarberFirst) {
      setBarberBranches([]);
      setBarberServiceIds(null);
      setBarberProfileError(null);
      setBarberProfileLoading(false);
      setBarberProfileStatus("idle");
      setBarberProfileShowRetry(false);
      setBarberProfileStaleWarning(false);
      appliedProfileEmpRef.current = null;
      return;
    }

    if (initialBarber?.id == null || !Number.isFinite(initialBarber.id) || initialBarber.id <= 0) {
      setBarberBranches([]);
      setBarberServiceIds(null);
      setBarberProfileLoading(false);
      setBarberProfileError("barberIdMissing");
      setBarberProfileStatus("request_error");
      setBarber(null);
      return;
    }

    const empId = initialBarber.id;
    let cancelled = false;
    const controller = new AbortController();
    setMode("specific");
    setBarber({ id: empId, name: initialBarber.name });

    const applyProfile = (profile: PublicBarber | null, opts?: { fromCache?: boolean }) => {
      if (cancelled) return;
      if (!profile) {
        setBarberBranches([]);
        setBarberServiceIds(null);
        setBarberProfileError("barberNotBookableOnline");
        setBarberProfileStatus("empty");
        setBarberProfileLoading(false);
        return;
      }
      const branches = profile.branches ?? [];
      setBarber({ id: profile.id, name: initialBarber.name || profile.name });
      setBarberBranches(branches);
      setBarberServiceIds(Array.isArray(profile.serviceIds) ? profile.serviceIds : []);
      setBarberProfileError(null);
      if (branches.length === 0) {
        setBarberProfileStatus("empty");
      } else {
        setBarberProfileStatus("success");
      }
      setBarberProfileLoading(false);
      if (opts?.fromCache) {
        bookingPerfMark("appointment_options_rendered", {
          empId,
          cacheHit: true,
        });
      }
    };

    // Seed discovery data into session cache when complete enough for branch decision.
    if (profileSeed && seedIsCompleteForBranchDecision(profileSeed) && profileSeed.empId === empId) {
      seedBarberProfileCache(profileSeed);
    }

    const cached = peekBarberProfileCache(empId);
    const seedProfile =
      profileSeed && profileSeed.empId === empId && seedIsCompleteForBranchDecision(profileSeed)
        ? profileFromSeed(profileSeed)
        : null;
    const immediate = cached ?? seedProfile;

    if (immediate && (immediate.branches?.length ?? 0) >= 0 && immediate.branches != null) {
      applyProfile(immediate, { fromCache: true });
      // Revalidate in background; keep UI unblocked.
      setBarberProfileStaleWarning(false);
    } else {
      setBarberProfileLoading(true);
      setBarberProfileError(null);
      setBarberProfileStatus("loading");
      setBarberProfileShowRetry(false);
      setBarberProfileStaleWarning(false);
    }

    const needsBlockingLoad = !(immediate && immediate.branches != null);
    const slowTimer = needsBlockingLoad
      ? window.setTimeout(() => {
          if (cancelled) return;
          setBarberProfileStatus((s) => (s === "loading" ? "slow_loading" : s));
        }, PROFILE_SLOW_MS)
      : 0;
    const retryTimer = needsBlockingLoad
      ? window.setTimeout(() => {
          if (cancelled) return;
          setBarberProfileShowRetry(true);
        }, PROFILE_RETRY_HINT_MS)
      : 0;

    const force = barberProfileReload > 0;
    if (force) {
      clearBarberProfileCache(empId);
    }

    // Prefer mocked getPublicBarberProfile in tests; production path uses shared cache.
    getPublicBarberProfile(empId, controller.signal)
      .then((res) => {
        if (cancelled) return;
        if (appliedProfileEmpRef.current != null && appliedProfileEmpRef.current !== empId) {
          return;
        }
        appliedProfileEmpRef.current = empId;
        const profile = res.data;
        if (!profile) {
          if (immediate?.branches != null) {
            setBarberProfileStaleWarning(true);
            setBarberProfileStatus("success");
            setBarberProfileLoading(false);
            return;
          }
          applyProfile(null);
          return;
        }
        applyProfile(profile);
        setBarberProfileStaleWarning(false);
      })
      .catch((err) => {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) {
          if (!cancelled) {
            setBarberProfileStatus("aborted");
            setBarberProfileLoading(false);
          }
          return;
        }
        if (immediate?.branches != null) {
          setBarberProfileStaleWarning(true);
          setBarberProfileStatus("success");
          setBarberProfileLoading(false);
          return;
        }
        if (err instanceof BookingApiError) {
          setBarberProfileError(err.message);
        } else {
          setBarberProfileError("barberBranchesLoadFailed");
        }
        setBarberBranches([]);
        setBarberServiceIds(null);
        setBarberProfileStatus("request_error");
        setBarberProfileLoading(false);
        setBarberProfileShowRetry(true);
      })
      .finally(() => {
        window.clearTimeout(slowTimer);
        window.clearTimeout(retryTimer);
      });

    appliedProfileEmpRef.current = empId;

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(slowTimer);
      window.clearTimeout(retryTimer);
    };
    // selectedSpecificBranchCode intentionally omitted — only used for post-revalidate guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    isBarberFirst,
    initialBarber?.id,
    initialBarber?.name,
    barberProfileReload,
    profileSeed?.empId,
    profileSeed?.publicBranches,
  ]);

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
      categories?: BookingServiceCategory[];
      mostPopular?: BookingMostPopularSection | null;
      barbers: PublicBarber[];
    };
    const cached = getCachedCatalog<CachedCatalog>(catalogBranch);
    if (cached) {
      const catalog: ServicesCatalog = {
        services: cached.services ?? [],
        categories: cached.categories ?? [],
        mostPopular: cached.mostPopular ?? null,
      };
      const allowed =
        isBarberFirst && barberServiceIdsRef.current !== null
          ? new Set(barberServiceIdsRef.current)
          : null;
      const filtered = filterCatalogByServiceIds(catalog, allowed, true);
      setConfig(cached.config);
      setServices(filtered.services);
      setServiceCategories(filtered.categories);
      setServiceMostPopular(filtered.mostPopular);
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
        const catalog = svc.data ?? { services: [], categories: [], mostPopular: null };
        const allowed =
          isBarberFirst && barberServiceIdsRef.current !== null
            ? new Set(barberServiceIdsRef.current)
            : null;
        const filtered = filterCatalogByServiceIds(catalog, allowed, true);
        setServices(filtered.services);
        setServiceCategories(filtered.categories);
        setServiceMostPopular(filtered.mostPopular);
        const branchBarbers = (bar.data ?? []).filter((b) => b.isBookableOnline);
        setBarbers(branchBarbers);
        const existing = getCachedCatalog<CachedCatalog>(catalogBranch!);
        setCachedCatalog(catalogBranch!, {
          config: cfg.data,
          services: catalog.services,
          categories: catalog.categories,
          mostPopular: catalog.mostPopular,
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
          setCatalogError("catalogLoadFailed");
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
      if (prev.length === 0) return prev;
      if (filtered.length === prev.length && filtered.every((s, i) => s.id === prev[i]?.id)) {
        return prev;
      }
      return filtered;
    });
    setServiceCategories((prev) =>
      prev
        .map((cat) => {
          const services = cat.services.filter((s) => allowed.has(s.id));
          return { ...cat, services, serviceCount: services.length };
        })
        .filter((cat) => cat.services.length > 0),
    );
    setServiceMostPopular((prev) => {
      if (!prev) return prev;
      const services = prev.services.filter((s) => allowed.has(s.id));
      return services.length > 0 ? { ...prev, services } : null;
    });
  }, [isBarberFirst, barberServiceIds]);

  // Prefetch available-days while still on service/mode so the calendar often
  // appears instantly after Continue.
  // IMPORTANT: do not abort this request on cleanup — aborting would kill the
  // shared deduped in-flight call used by the date step.
  useEffect(() => {
    if (!open || serviceIds.length === 0) return;
    if (step !== "service" && step !== "mode") return;
    if (mode === "specific" && barber?.id == null) return;

    if (usesBarberAvailabilityApi && barber?.id != null && availabilityScope) {
      void getBarberAvailableDays({
        empId: barber.id,
        serviceIds,
        scope: availabilityScope,
        branchCode: selectedSpecificBranchCode ?? undefined,
        allowedBranches: allowedBarberBranches,
      }).catch(() => undefined);
      return;
    }

    if (!branchCode) return;
    void getAvailableDays({
      branchCode,
      serviceIds,
      mode,
      empId: mode === "specific" ? barber?.id : undefined,
    }).catch(() => {
      /* warm-cache only */
    });
  }, [
    open,
    branchCode,
    serviceIds,
    mode,
    barber?.id,
    step,
    usesBarberAvailabilityApi,
    availabilityScope,
    selectedSpecificBranchCode,
    allowedBranchesKey,
  ]);

  // Available days (calendar date step)
  useEffect(() => {
    if (step !== "date" || serviceIds.length === 0) return;
    if (mode === "specific" && barber?.id == null) return;

    if (usesBarberAvailabilityApi && barber?.id != null && availabilityScope) {
      if (allowedBarberBranches.length === 0) return;
      const daysParams = {
        empId: barber.id,
        serviceIds,
        scope: availabilityScope,
        branchCode: selectedSpecificBranchCode ?? undefined,
        allowedBranches: allowedBarberBranches,
      };
      const cached = peekCachedBarberAvailableDays(daysParams);
      if (cached) {
        setMultiBranchDays(cached.days);
        setDays(cached.days);
        setMultiBranchDaysMeta(cached.meta ?? null);
        setDaysLoading(false);
        setDaysError(null);
        return;
      }
      let cancelled = false;
      const version = selectionVersionRef.current;
      setDaysLoading(true);
      setDaysError(null);
      getBarberAvailableDays(daysParams)
        .then((res) => {
          if (cancelled || isStaleResponse(version)) return;
          setMultiBranchDays(res.data.days);
          setDays(res.data.days);
          setMultiBranchDaysMeta(res.data.meta ?? null);
          setDaysLoading(false);
        })
        .catch((err) => {
          if (cancelled || isStaleResponse(version)) return;
          if (err instanceof DOMException && err.name === "AbortError") return;
          setDaysLoading(false);
          setMultiBranchDays([]);
          setDays([]);
          if (err instanceof BookingApiError) {
            setDaysError(err.message);
          } else {
            setDaysError("daysLoadFailed");
          }
        });
      return () => {
        cancelled = true;
      };
    }

    if (!branchCode) return;

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
  }, [
    step,
    branchCode,
    serviceIds,
    mode,
    barber?.id,
    usesBarberAvailabilityApi,
    availabilityScope,
    selectedSpecificBranchCode,
    allowedBranchesKey,
  ]);

  // Available slots (time step after calendar day)
  useEffect(() => {
    if (step !== "time" || !selectedDate || serviceIds.length === 0) return;
    if (mode === "specific" && barber?.id == null) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    if (usesBarberAvailabilityApi && barber?.id != null && availabilityScope) {
      if (allowedBarberBranches.length === 0) return;
      const slotsParams = {
        empId: barber.id,
        serviceIds,
        scope: availabilityScope,
        branchCode: selectedSpecificBranchCode ?? undefined,
        date: dateStr,
        allowedBranches: allowedBarberBranches,
      };
      const cached = peekCachedBarberAvailableSlots(slotsParams);
      if (cached) {
        setMultiBranchSlots(cached.slots);
        setSlots(cached.slots);
        setMultiBranchSlotsMeta(cached.meta ?? null);
        setSlotsLoading(false);
        setSlotsError(null);
        return;
      }
      let cancelled = false;
      const version = selectionVersionRef.current;
      setSlotsLoading(true);
      setSlotsError(null);
      getBarberAvailableSlots(slotsParams)
        .then((res) => {
          if (cancelled || isStaleResponse(version)) return;
          setMultiBranchSlots(res.data.slots);
          setSlots(res.data.slots);
          setMultiBranchSlotsMeta(res.data.meta ?? null);
          setSlotsLoading(false);
        })
        .catch((err) => {
          if (cancelled || isStaleResponse(version)) return;
          if (err instanceof DOMException && err.name === "AbortError") return;
          setSlotsLoading(false);
          setMultiBranchSlots([]);
          setSlots([]);
          if (err instanceof BookingApiError) {
            setSlotsError(err.message);
          } else {
            setSlotsError("slotsLoadFailed");
          }
        });
      return () => {
        cancelled = true;
      };
    }

    if (!branchCode) return;

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
  }, [
    step,
    branchCode,
    selectedDate,
    serviceIds,
    mode,
    barber?.id,
    usesBarberAvailabilityApi,
    availabilityScope,
    selectedSpecificBranchCode,
    allowedBranchesKey,
  ]);

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
    // Keep specific-branch draft; clear slot-committed branch for all_branches.
    if (availabilityScope !== "specific_branch") {
      setBookingBranchCode(undefined);
      setBookingBranchName(undefined);
    }
    setDays([]);
    setSlots([]);
    setMultiBranchDays([]);
    setMultiBranchSlots([]);
    setCrossSlots([]);
    setCrossBranches([]);
    setCrossTab(ALL_CROSS_TAB);
    setCrossSlotsError(null);
    setPlan(null);
    setMutationUi({ kind: "idle" });
  }, [bumpSelection, availabilityScope]);

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
    setAvailabilityScopeState(null);
    setSelectedSpecificBranchCode(null);
    setDays([]);
    setSlots([]);
    setMultiBranchDays([]);
    setMultiBranchSlots([]);
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
    const dateStr = format(date, "yyyy-MM-dd");
    if (usesBarberAvailabilityApi && barber?.id != null && availabilityScope) {
      const cached = peekCachedBarberAvailableSlots({
        empId: barber.id,
        serviceIds,
        scope: availabilityScope,
        branchCode: selectedSpecificBranchCode ?? undefined,
        date: dateStr,
        allowedBranches: allowedBarberBranches,
      });
      if (cached) {
        setMultiBranchSlots(cached.slots);
        setSlots(cached.slots);
        setSlotsLoading(false);
      } else {
        setMultiBranchSlots([]);
        setSlots([]);
        setSlotsLoading(true);
      }
      void getBarberAvailableSlots({
        empId: barber.id,
        serviceIds,
        scope: availabilityScope,
        branchCode: selectedSpecificBranchCode ?? undefined,
        date: dateStr,
        allowedBranches: allowedBarberBranches,
      }).catch(() => undefined);
    } else if (branchCode && serviceIds.length > 0) {
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
  }, [
    bumpSelection,
    branchCode,
    serviceIds,
    mode,
    barber?.id,
    usesBarberAvailabilityApi,
    availabilityScope,
    selectedSpecificBranchCode,
    allowedBranchesKey,
  ]);

  const selectSlot = useCallback((slot: AvailableSlot) => {
    clearPlanSession();
    setSelectedSlot(slot);
    setPlan(null);
    setMutationUi({ kind: "idle" });
    // Commit slot branch into the booking draft (all_branches or cross-branch).
    const code = normalizeBranchCode(slot.branchCode);
    if (code) {
      setBookingBranchCode(code);
      setBookingBranchName(slot.branchName || code);
    }
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

  /** Explicit booking-draft branch commit (auto-resolve, picker, day location). */
  const commitDraftBranch = useCallback(
    (branch: { branchCode: string; branchName?: string | null } | null) => {
      if (!branch?.branchCode) {
        setBookingBranchCode(undefined);
        setBookingBranchName(undefined);
        return;
      }
      setBookingBranchCode(branch.branchCode);
      setBookingBranchName(branch.branchName || branch.branchCode);
    },
    [],
  );

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
      setMutationUi({ kind: "error", message: "invalidNamePhone", code: "invalidNamePhone" });
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
          message: "planPrepareFailed",
          code: "planPrepareFailed",
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
          message: "outcomeUnknown",
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
    setAvailabilityScopeState(initialAvailabilityScope);
    setSelectedSpecificBranchCode(normalizeBranchCode(explicitEntryBranchCode));
    setExplicitEntryBranch(normalizeBranchCode(explicitEntryBranchCode));
    setSelectedBranchFilter("all");
    setMultiBranchDays([]);
    setMultiBranchSlots([]);
    setMultiBranchDaysMeta(null);
    setMultiBranchSlotsMeta(null);
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
    initialAvailabilityScope,
    explicitEntryBranchCode,
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
    serviceCategories,
    serviceMostPopular,
    barbers,
    barberBranches,
    barberProfileLoading,
    barberProfileError,
    barberProfileStatus,
    barberProfileShowRetry,
    barberProfileStaleWarning,
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
    commitDraftBranch,
    availabilityScope,
    setAvailabilityScope,
    allowedBranchesKey,
    selectedSpecificBranchCode,
    selectSpecificBranch,
    selectedBranchFilter,
    setSelectedBranchFilter,
    multiBranchDays,
    multiBranchSlots,
    multiBranchDaysMeta,
    multiBranchSlotsMeta,
    explicitEntryBranch,
    usesBarberAvailabilityApi,
    clearDateSlotPlan,
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
