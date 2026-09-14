/**
 * Canonical /book Booking V2 (O2) session — one matrix per scope, local picks.
 * First paint never awaits network.
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  bootstrapBarberForFlow,
  catalogFromBootstrap,
  deriveV2Days,
  deriveV2Slots,
  ensureBookingV2Bootstrap,
  loadV2Matrix,
  resolveV2Scope,
} from "@/hooks/bookingFlowV2Support";
import {
  BookingApiError,
  createBookingPlan,
  submitBookingFromPlan,
  type AvailableSlot,
  type BarberAvailableSlot,
  type BookingPlan,
  type BookingService,
  type BookingServiceCategory,
  type PublicBarber,
} from "@/lib/booking-api";
import { getCoreServiceIdSet } from "@/lib/bookingServiceGroups";
import { saveBookFlowConfirmation } from "@/lib/book-flow-confirmation";
import { buildBookHref } from "@/lib/book-o2/buildBookHref";
import { businessDateToLocalDate, localDateToBusinessDate } from "@/lib/bookingV2/businessDate";
import { findBootstrapBarber } from "@/lib/bookingV2/catalogMap";
import {
  applyLocalOccupancyToAllCachedMatrices,
  applyLocalOccupancyToMatrix,
  revalidateAvailabilityBusinessDate,
  slotStartMin,
} from "@/lib/bookingV2/occupyLocal";
import {
  isRecoverablePlanAvailabilityError,
  recoverStaleMinNoticeSlot,
  type StaleSlotNotice,
} from "@/lib/bookingV2/recoverStaleSlot";
import type { AvailabilityMatrix, BookingV2Bootstrap } from "@/lib/bookingV2/types";
import { trackBookingError } from "@/lib/bookingV2/metrics";
import { CAMP_CAESAR_BOOK_EVENT } from "@/lib/campaignEvents";
import { getPackageById, type ApiPackage } from "@/lib/packagesApi";
import {
  buildGroomCartModel,
  groomCartToResolvableServices,
  parseIdListParam,
  readGroomBookHandoff,
  saveGroomBookHandoff,
  type GroomCartModel,
} from "@/lib/book-o2/groomHandoff";

export type BookO2Step =
  | "intent"
  | "branch"
  | "barber"
  | "services"
  | "schedule"
  | "details"
  | "review";

export type BookO2Mode = "nearest" | "specific";

const MAX_SERVICES = 12;

/** Survives React Strict Mode remounts / rapid double taps. */
let bookO2WriteLock = false;

function normalizeEgyptianPhone(input: string): string | null {
  const d = input.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("01")) return d;
  if (d.length === 12 && d.startsWith("201")) return `0${d.slice(2)}`;
  if (d.length === 13 && d.startsWith("2001")) return `0${d.slice(3)}`;
  return null;
}

function parseEmpId(raw: string | null): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export { buildBookHref };

export function useBookO2Session() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modeParam = searchParams.get("mode");
  const empIdParam = parseEmpId(searchParams.get("empId"));
  const branchParam = (searchParams.get("branch") || "").trim() || null;
  const servicesParam = parseIdListParam(searchParams.get("services"));
  const packageIdParam = (() => {
    const n = Number(searchParams.get("packageId"));
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const addonsParam = parseIdListParam(searchParams.get("addons"));

  const initialStep = ((): BookO2Step => {
    if (modeParam === "nearest") return branchParam ? "services" : "branch";
    if (modeParam === "barber" && empIdParam) return "services";
    if (modeParam === "branch" && branchParam) return "services";
    if (modeParam === "barber") return "barber";
    if (modeParam === "branch") return "branch";
    return "intent";
  })();

  const [step, setStep] = useState<BookO2Step>(initialStep);
  const [mode, setMode] = useState<BookO2Mode>(
    modeParam === "nearest" || (modeParam === "branch" && !empIdParam)
      ? "nearest"
      : empIdParam
        ? "specific"
        : "nearest",
  );
  const [branchCode, setBranchCode] = useState<string | null>(branchParam);
  const [empId, setEmpId] = useState<number | null>(empIdParam);
  const [barberName, setBarberName] = useState<string>("");
  const [barberImage, setBarberImage] = useState<string | null>(null);
  const [serviceIds, setServiceIds] = useState<number[]>(servicesParam);
  const [packageId, setPackageId] = useState<number | null>(packageIdParam);
  const [addonProIds, setAddonProIds] = useState<number[]>(addonsParam);
  const [groomPack, setGroomPack] = useState<ApiPackage | null>(null);
  const [groomCart, setGroomCart] = useState<GroomCartModel | null>(null);
  const [groomHydrationStatus, setGroomHydrationStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >(packageIdParam ? "loading" : "idle");
  const [groomHydrationError, setGroomHydrationError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | undefined>();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [bootstrap, setBootstrap] = useState<BookingV2Bootstrap | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [matrix, setMatrix] = useState<AvailabilityMatrix | null>(null);
  const [matrixStatus, setMatrixStatus] = useState<
    "idle" | "loading" | "ready" | "empty" | "error"
  >("idle");
  const [matrixError, setMatrixError] = useState<string | null>(null);

  const [plan, setPlan] = useState<BookingPlan | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<
    "idle" | "planning" | "creating" | "error"
  >("idle");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [staleSlotNotice, setStaleSlotNotice] = useState<StaleSlotNotice | null>(null);
  const confirmInFlightRef = useRef(false);
  const matrixScopeKeyRef = useRef<string | null>(null);
  const stepHistoryRef = useRef<BookO2Step[]>([]);

  const goToStep = useCallback((next: BookO2Step) => {
    setStep((curr) => {
      if (curr !== next) stepHistoryRef.current.push(curr);
      return next;
    });
  }, []);

  useEffect(() => {
    const onCampCaesarBook = (event: Event) => {
      const code = (event as CustomEvent<{ branchCode?: string }>).detail?.branchCode?.trim();
      if (!code) return;

      stepHistoryRef.current = [];
      setMode("nearest");
      setEmpId(null);
      setBarberName("");
      setBarberImage(null);
      setBranchCode(code);
      setServiceIds([]);
      setSelectedDate(undefined);
      setSelectedSlot(undefined);
      setPlan(null);
      setConfirmStatus("idle");
      setConfirmError(null);
      setStep("services");
      router.replace(buildBookHref({ mode: "nearest", branch: code }));
    };

    window.addEventListener(CAMP_CAESAR_BOOK_EVENT, onCampCaesarBook);
    return () => window.removeEventListener(CAMP_CAESAR_BOOK_EVENT, onCampCaesarBook);
  }, [router]);

  const syncUrlForStep = useCallback(
    (target: BookO2Step, opts?: { empId?: number | null; branchCode?: string | null }) => {
      const nextEmp = opts?.empId === undefined ? empId : opts.empId;
      const nextBranch = opts?.branchCode === undefined ? branchCode : opts.branchCode;
      const packageOpts = {
        packageId,
        addonProIds: addonProIds.length ? addonProIds : undefined,
        serviceIds: serviceIds.length ? serviceIds : undefined,
      };
      if (target === "intent") {
        router.replace("/book");
        return;
      }
      if (target === "branch") {
        router.replace(buildBookHref({ mode: "branch", ...packageOpts }));
        return;
      }
      if (target === "barber") {
        router.replace(
          buildBookHref({
            mode: "barber",
            empId: nextEmp && nextEmp > 0 ? nextEmp : null,
            ...packageOpts,
          }),
        );
        return;
      }
      if (target === "services") {
        if (nextEmp && nextEmp > 0) {
          router.replace(
            buildBookHref({
              mode: "barber",
              empId: nextEmp,
              branch: nextBranch,
              ...packageOpts,
            }),
          );
        } else {
          router.replace(
            buildBookHref({
              mode: "nearest",
              branch: nextBranch,
              ...packageOpts,
            }),
          );
        }
      }
      // schedule / details / review keep current query intent
    },
    [router, empId, branchCode, packageId, addonProIds, serviceIds],
  );

  const goBack = useCallback(() => {
    const prev = stepHistoryRef.current.pop();
    if (prev) {
      if (prev === "intent") {
        setEmpId(null);
        setBarberName("");
        setBarberImage(null);
        setBranchCode(null);
        setMode("nearest");
        setStep("intent");
        router.replace("/book");
        return;
      }
      if (prev === "barber") {
        // Return to barber list (clear preselected employee)
        setEmpId(null);
        setBarberName("");
        setBarberImage(null);
        setMode("specific");
        setStep("barber");
        router.replace(buildBookHref({ mode: "barber" }));
        return;
      }
      if (prev === "branch") {
        setStep("branch");
        setMode("nearest");
        router.replace(buildBookHref({ mode: "branch", branch: branchCode }));
        return;
      }
      setStep(prev);
      syncUrlForStep(prev);
      return;
    }

    // No in-session history (deep-link entry) — leave to intent or home
    if (step === "intent") {
      router.push("/");
      return;
    }
    stepHistoryRef.current = [];
    setEmpId(null);
    setBarberName("");
    setBarberImage(null);
    setBranchCode(null);
    setMode("nearest");
    setStep("intent");
    // Clear deep-link query immediately so remounts don't snap back into services.
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(window.history.state, "", "/book");
    }
    router.replace("/book");
  }, [step, router, branchCode, syncUrlForStep]);

  const catalog = useMemo(
    () => (bootstrap ? catalogFromBootstrap(bootstrap) : null),
    [bootstrap],
  );

  const catalogServices: BookingService[] = catalog?.services ?? [];
  const categories: BookingServiceCategory[] = catalog?.categories ?? [];
  const barbers: PublicBarber[] = catalog?.barbers ?? [];
  const branches = bootstrap?.branches ?? [];

  // Merge package-resolvable overlays (hidden from All Services via groomContextOnly).
  const services: BookingService[] = useMemo(() => {
    if (!groomCart) return catalogServices;
    const byId = new Map(catalogServices.map((s) => [s.id, s]));
    for (const overlay of groomCartToResolvableServices(groomCart)) {
      const existing = byId.get(overlay.id);
      if (existing) {
        byId.set(overlay.id, {
          ...existing,
          // Keep catalog price for standalone browsing; cart uses package pricing.
          groomContextOnly: existing.groomContextOnly || overlay.groomContextOnly,
        });
        continue;
      }
      byId.set(overlay.id, {
        id: overlay.id,
        name: overlay.name,
        nameAr: overlay.nameAr,
        nameEn: overlay.nameEn,
        price: overlay.price,
        durationMinutes: overlay.durationMinutes,
        categoryName: overlay.categoryName,
        isBookableOnline: overlay.isBookableOnline,
        groomContextOnly: overlay.groomContextOnly,
      });
    }
    return [...byId.values()];
  }, [catalogServices, groomCart]);

  const selectedServices = useMemo(() => {
    if (groomCart) {
      // Package cart: surface add-ons as priced lines; package priced separately in UI.
      return groomCart.addons.map((addon) => ({
        id: addon.proId,
        name: addon.nameEn ?? addon.nameAr ?? `Service ${addon.proId}`,
        nameAr: addon.nameAr,
        nameEn: addon.nameEn,
        price: addon.price,
        durationMinutes: addon.durationMinutes ?? 0,
        categoryName:
          addon.mutuallyExclusiveGroup === "home_visit" ? "Home Visit" : "Groom Add-on",
        isBookableOnline: true,
        groomContextOnly: true,
      })) satisfies BookingService[];
    }
    return services.filter((s) => serviceIds.includes(s.id));
  }, [groomCart, services, serviceIds]);

  const durationMinutes = useMemo(() => {
    if (groomCart) return groomCart.totalDurationMinutes;
    return selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  }, [groomCart, selectedServices]);

  const displayTotalPrice = useMemo(() => {
    if (groomCart) return groomCart.totalPrice;
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [groomCart, selectedServices]);

  // Restore package handoff from sessionStorage when URL lacks packageId (refresh / back).
  useEffect(() => {
    if (packageId) return;
    const stored = readGroomBookHandoff();
    if (!stored?.packageId) return;
    setPackageId(stored.packageId);
    if (!addonProIds.length && stored.addonProIds.length) {
      setAddonProIds(stored.addonProIds);
    }
    if (!serviceIds.length && stored.serviceIds.length) {
      setServiceIds(stored.serviceIds);
    }
    if (stored.note && !notes) setNotes(stored.note);
    setGroomHydrationStatus("loading");
  }, [packageId, addonProIds.length, serviceIds.length, notes]);

  // Hydrate authoritative package from Cashier packages API.
  useEffect(() => {
    if (!packageId) {
      setGroomPack(null);
      setGroomCart(null);
      setGroomHydrationStatus("idle");
      setGroomHydrationError(null);
      return;
    }
    let cancelled = false;
    setGroomHydrationStatus("loading");
    setGroomHydrationError(null);
    getPackageById(packageId)
      .then((pack) => {
        if (cancelled) return;
        const cart = buildGroomCartModel(pack, addonProIds);
        if (cart.unresolvedAddonProIds.length) {
          console.error(
            "[groom-handoff] unresolved addon ProIDs",
            cart.unresolvedAddonProIds,
            { packageId },
          );
          setGroomHydrationError(
            `Unable to resolve add-on services: ${cart.unresolvedAddonProIds.join(", ")}`,
          );
          setGroomHydrationStatus("error");
          setGroomPack(pack);
          setGroomCart(cart);
          return;
        }
        setGroomPack(pack);
        setGroomCart(cart);
        setServiceIds(cart.serviceIds);
        setGroomHydrationStatus("ready");
        saveGroomBookHandoff({
          packageId: cart.packageId,
          addonProIds: cart.addons.map((a) => a.proId),
          serviceIds: cart.serviceIds,
          note: notes || null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[groom-handoff] package hydration failed", err);
        setGroomHydrationError(
          err instanceof Error ? err.message : "Unable to load groom package",
        );
        setGroomHydrationStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // notes intentionally excluded — do not re-hydrate on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId, addonProIds]);
  const intervalMinutes =
    catalog?.config?.settings.slotIntervalMinutes ??
    bootstrap?.settings.slotIntervalMinutes ??
    15;
  const minNoticeMinutes =
    catalog?.config?.settings.minNoticeMinutes ??
    bootstrap?.settings.minNoticeMinutes ??
    15;

  const v2Barber = useMemo(() => {
    if (!bootstrap || !empId) return null;
    return (
      findBootstrapBarber(bootstrap, empId) ??
      bootstrapBarberForFlow(bootstrap, empId)
    );
  }, [bootstrap, empId]);

  useEffect(() => {
    if (!empId || !v2Barber) return;
    const name = v2Barber.nameAr || v2Barber.nameEn || v2Barber.name || "";
    if (name) setBarberName(name);
    const img = v2Barber.photoUrl || v2Barber.imageUrl || null;
    if (img) setBarberImage(img);
  }, [empId, v2Barber]);

  const allBranchCodes = useMemo(
    () => branches.map((b) => b.branchCode),
    [branches],
  );

  const scope = useMemo(() => {
    if (!bootstrap) return null;
    if (mode === "specific" && !empId) return null;
    return resolveV2Scope({
      mode,
      empId,
      barber: v2Barber,
      selectedBranchCode: branchCode,
      allBranchCodes: allBranchCodes.length
        ? allBranchCodes
        : ["GLEEM", "CAMP_CAESAR"],
      availabilityScope:
        mode === "specific" && !branchCode
          ? "all_branches"
          : branchCode
            ? "specific_branch"
            : null,
      specificBranchCode: branchCode,
    });
  }, [bootstrap, mode, empId, v2Barber, branchCode, allBranchCodes]);

  useEffect(() => {
    let cancelled = false;
    setBootstrapStatus((s) => (s === "ready" ? s : "loading"));
    ensureBookingV2Bootstrap()
      .then((boot) => {
        if (cancelled) return;
        setBootstrap(boot);
        setBootstrapStatus("ready");
      })
      .catch((err) => {
        if (!cancelled) {
          trackBookingError("bootstrap_failure", {
            message: err instanceof Error ? err.message : "bootstrap_failed",
          });
          setBootstrapStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!scope) {
      setMatrix(null);
      setMatrixStatus("idle");
      return;
    }
    const key = `${scope.mode}:${scope.empId ?? "any"}:${(scope.branchCodes ?? []).join(",")}`;
    let cancelled = false;
    setMatrixStatus("loading");
    setMatrixError(null);
    matrixScopeKeyRef.current = key;

    loadV2Matrix(scope, 14)
      .then((m) => {
        if (cancelled || matrixScopeKeyRef.current !== key) return;
        setMatrix(m);
        const hasAny = m.matrix.some((d) =>
          d.branches.some((b) =>
            b.employees.some(
              (e) =>
                e.status !== "day_off" &&
                e.status !== "closed" &&
                ((e.freeRanges?.length ?? 0) > 0 || (e.free?.length ?? 0) > 0),
            ),
          ),
        );
        setMatrixStatus(hasAny ? "ready" : "empty");
      })
      .catch((err) => {
        if (cancelled || matrixScopeKeyRef.current !== key) return;
        setMatrix(null);
        setMatrixStatus("error");
        const message = err instanceof Error ? err.message : "availability_failed";
        trackBookingError("availability_failure", { message });
        setMatrixError(message);
      });

    return () => {
      cancelled = true;
    };
  }, [scope]);

  const calendarDuration = durationMinutes > 0 ? durationMinutes : 30;

  const { days, multiBranchDays } = useMemo(() => {
    if (!matrix) return { days: [], multiBranchDays: [] };
    return deriveV2Days(matrix, {
      mode,
      empId,
      branchCode: branchCode,
      durationMinutes: calendarDuration,
      intervalMinutes,
      minNoticeMinutes,
    });
  }, [matrix, mode, empId, branchCode, calendarDuration, intervalMinutes, minNoticeMinutes]);

  const { slots, multiBranchSlots } = useMemo(() => {
    if (!matrix || !selectedDate || durationMinutes <= 0) {
      return { slots: [], multiBranchSlots: [] };
    }
    return deriveV2Slots(matrix, selectedDate, {
      mode,
      empId,
      branchCode,
      durationMinutes,
      intervalMinutes,
      minNoticeMinutes,
    });
  }, [matrix, selectedDate, durationMinutes, mode, empId, branchCode, intervalMinutes, minNoticeMinutes]);

  const selectIntentNearest = useCallback(() => {
    setMode("nearest");
    setEmpId(null);
    setBarberName("");
    setPackageId(null);
    setAddonProIds([]);
    setGroomCart(null);
    setGroomPack(null);
    setServiceIds([]);
    router.replace(buildBookHref({ mode: "nearest", branch: branchCode }));
    goToStep(branchCode ? "services" : "branch");
  }, [router, branchCode, goToStep]);

  const selectIntentBranch = useCallback(() => {
    setMode("nearest");
    setEmpId(null);
    setPackageId(null);
    setAddonProIds([]);
    setGroomCart(null);
    setGroomPack(null);
    setServiceIds([]);
    router.replace(buildBookHref({ mode: "branch" }));
    goToStep("branch");
  }, [router, goToStep]);

  const selectIntentBarber = useCallback(() => {
    setMode("specific");
    setPackageId(null);
    setAddonProIds([]);
    setGroomCart(null);
    setGroomPack(null);
    setServiceIds([]);
    router.replace(buildBookHref({ mode: "barber" }));
    goToStep("barber");
  }, [router, goToStep]);

  const selectBranch = useCallback(
    (code: string) => {
      setBranchCode(code);
      const packageOpts = {
        packageId,
        addonProIds: addonProIds.length ? addonProIds : undefined,
        serviceIds: serviceIds.length ? serviceIds : undefined,
      };
      if (mode === "specific" && empId) {
        router.replace(
          buildBookHref({ mode: "barber", empId, branch: code, ...packageOpts }),
        );
        goToStep("services");
        return;
      }
      router.replace(buildBookHref({ mode: "nearest", branch: code, ...packageOpts }));
      goToStep("services");
    },
    [mode, empId, router, goToStep, packageId, addonProIds, serviceIds],
  );

  const selectBarber = useCallback(
    (barber: PublicBarber) => {
      setMode("specific");
      setEmpId(barber.id);
      setBarberName(barber.nameAr || barber.nameEn || barber.name || "");
      setBarberImage(barber.photoUrl || barber.imageUrl || null);
      const codes = (barber.branches ?? []).map((b) => b.branchCode);
      const nextBranch =
        codes.length === 1
          ? codes[0]
          : branchCode && codes.some((c) => c.toUpperCase() === branchCode.toUpperCase())
            ? branchCode
            : null;
      if (nextBranch) setBranchCode(nextBranch);
      else if (codes.length > 1) setBranchCode(null);
      router.replace(
        buildBookHref({
          mode: "barber",
          empId: barber.id,
          branch: nextBranch,
        }),
      );
      goToStep("services");
    },
    [router, branchCode, goToStep],
  );

  const selectServices = useCallback((ids: number[]) => {
    setServiceIds([...new Set(ids)].slice(0, MAX_SERVICES));
    setSelectedSlot(undefined);
    setPlan(null);
  }, []);

  const selectCoreService = useCallback(
    (id: number) => {
      const coreIds = getCoreServiceIdSet(services);
      const nonCore = serviceIds.filter((sid) => !coreIds.has(sid));
      selectServices([id, ...nonCore]);
    },
    [services, serviceIds, selectServices],
  );

  const toggleService = useCallback(
    (id: number) => {
      if (serviceIds.includes(id)) {
        selectServices(serviceIds.filter((sid) => sid !== id));
      } else if (serviceIds.length < MAX_SERVICES) {
        selectServices([...serviceIds, id]);
      }
    },
    [serviceIds, selectServices],
  );

  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(undefined);
    setPlan(null);
    setStaleSlotNotice(null);
  }, []);

  const selectSlot = useCallback((slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setPlan(null);
    setStaleSlotNotice(null);
    if (slot.branchCode) setBranchCode(String(slot.branchCode));
    goToStep("details");
  }, [goToStep]);

  const goSchedule = useCallback(() => {
    const ids = groomCart?.serviceIds ?? serviceIds;
    if (ids.length === 0) return;
    if (groomHydrationStatus === "error") return;
    goToStep("schedule");
  }, [groomCart?.serviceIds, serviceIds, groomHydrationStatus, goToStep]);

  const effectiveBranchCode =
    (selectedSlot?.branchCode ? String(selectedSlot.branchCode) : null) ||
    branchCode ||
    (mode === "nearest" ? allBranchCodes[0] ?? null : null);

  const requestPlan = useCallback(async () => {
    if (confirmInFlightRef.current || bookO2WriteLock) return;
    if (!effectiveBranchCode || !selectedDate || !selectedSlot) {
      return;
    }
    const planServiceIds = groomCart?.serviceIds ?? serviceIds;
    if (planServiceIds.length === 0) return;
    if (mode === "specific" && !empId) return;
    const phone = normalizeEgyptianPhone(customerPhone);
    const name = customerName.trim();
    if (!phone || name.length < 2) {
      setConfirmStatus("error");
      setConfirmError("invalidNamePhone");
      return;
    }

    bookO2WriteLock = true;
    confirmInFlightRef.current = true;
    setConfirmStatus("planning");
    setConfirmError(null);
    const dateStr =
      selectedSlot.businessDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedSlot.businessDate)
        ? selectedSlot.businessDate
        : localDateToBusinessDate(selectedDate);
    try {
      const groomNote =
        groomCart != null
          ? JSON.stringify({
              source: "groom-experience",
              packageId: groomCart.packageId,
              addonProIds: groomCart.addons.map((a) => a.proId),
              packagePrice: groomCart.packagePrice,
              totalPrice: groomCart.totalPrice,
            })
          : null;
      const mergedNotes = [notes.trim(), groomNote].filter(Boolean).join("\n") || undefined;

      const res = await createBookingPlan({
        branchCode: String(effectiveBranchCode),
        customer: { name, phone },
        mode,
        empId: mode === "specific" ? empId ?? undefined : undefined,
        serviceIds: groomCart?.serviceIds ?? serviceIds,
        date: dateStr,
        time: selectedSlot.time,
        dayOffset: selectedSlot.dayOffset ?? 0,
        notes: mergedNotes,
      });
      setPlan(res.data);
      setConfirmStatus("idle");
      goToStep("review");
    } catch (err) {
      const code = err instanceof BookingApiError ? err.code : undefined;
      if (err instanceof BookingApiError && isRecoverablePlanAvailabilityError(code) && scope) {
        trackBookingError("plan_failure", {
          message: err.message,
          httpStatus: err.httpStatus,
          code,
        });
        try {
          const recovered = await recoverStaleMinNoticeSlot({
            loadMatrix: () => loadV2Matrix(scope, 14, { force: true }),
            fromBusinessDate: dateStr,
            durationMinutes,
            intervalMinutes,
            minNoticeMinutes,
            mode,
            empId,
            branchCode,
          });
          setMatrix(recovered.matrix);
          const hasAny = recovered.matrix.matrix.some((d) =>
            d.branches.some((b) =>
              b.employees.some(
                (e) =>
                  e.status !== "day_off" &&
                  e.status !== "closed" &&
                  ((e.freeRanges?.length ?? 0) > 0 || (e.free?.length ?? 0) > 0),
              ),
            ),
          );
          setMatrixStatus(hasAny ? "ready" : "empty");
          if (recovered.nextLegacySlot && recovered.nextSlot) {
            setSelectedSlot(recovered.nextLegacySlot);
            setSelectedDate(businessDateToLocalDate(recovered.nextSlot.businessDate));
            if (recovered.nextSlot.branchCode) {
              setBranchCode(String(recovered.nextSlot.branchCode));
            }
          } else {
            setSelectedSlot(undefined);
          }
          setPlan(null);
          setStaleSlotNotice({
            kind: code === "MIN_NOTICE_NOT_MET" ? "min_notice_expired" : "plan_unavailable",
            previousTime: selectedSlot.time,
            nextTime: recovered.nextSlot?.time ?? null,
          });
          setConfirmStatus("idle");
          setConfirmError(null);
          goToStep("schedule");
        } catch {
          setConfirmStatus("error");
          setConfirmError(err.message);
        }
        return;
      }
      setConfirmStatus("error");
      const message = err instanceof BookingApiError ? err.message : "plan_failed";
      trackBookingError("plan_failure", {
        message,
        httpStatus: err instanceof BookingApiError ? err.httpStatus : undefined,
        code: err instanceof BookingApiError ? err.code : undefined,
      });
      setConfirmError(message);
    } finally {
      confirmInFlightRef.current = false;
      bookO2WriteLock = false;
    }
  }, [
    effectiveBranchCode,
    selectedDate,
    selectedSlot,
    serviceIds,
    groomCart,
    mode,
    empId,
    customerPhone,
    customerName,
    notes,
    goToStep,
    scope,
    durationMinutes,
    intervalMinutes,
    minNoticeMinutes,
    branchCode,
  ]);

  const confirmCreate = useCallback(async () => {
    if (confirmInFlightRef.current || bookO2WriteLock) return;
    if (!plan?.planToken) return;
    bookO2WriteLock = true;
    confirmInFlightRef.current = true;
    setConfirmStatus("creating");
    setConfirmError(null);
    try {
      const dateStr =
        selectedSlot?.businessDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedSlot.businessDate)
          ? selectedSlot.businessDate
          : selectedDate
            ? localDateToBusinessDate(selectedDate)
            : "";
      const result = await submitBookingFromPlan({
        plan,
        customer: {
          name: customerName.trim(),
          phone: normalizeEgyptianPhone(customerPhone) || customerPhone,
        },
        notes: notes.trim() || undefined,
        branchCode: String(effectiveBranchCode || ""),
        date: dateStr,
        time: selectedSlot?.time || "",
        dayOffset: selectedSlot?.dayOffset ?? 0,
        serviceIds,
        mode,
        empId: mode === "specific" ? empId ?? undefined : undefined,
      });
      if (result.outcome !== "success" || !result.booking) {
        const code = result.error?.code || "";
        const conflict =
          code === "SLOT_UNAVAILABLE" ||
          code === "CONFLICT" ||
          result.error?.httpStatus === 409;
        if (conflict) {
          trackBookingError("create_conflict", {
            code,
            httpStatus: result.error?.httpStatus,
            message: result.error?.message,
          });
        }
        if (conflict && selectedDate && scope) {
          const businessDate = localDateToBusinessDate(selectedDate);
          try {
            const dayMatrix = await revalidateAvailabilityBusinessDate({
              mode: scope.mode,
              empId: scope.empId,
              branchCodes: scope.branchCodes,
              businessDate,
            });
            setMatrix((prev) => {
              if (!prev) return dayMatrix;
              const day = dayMatrix.matrix.find((d) => d.businessDate === businessDate);
              if (!day) return prev;
              return {
                ...prev,
                matrix: prev.matrix.map((d) =>
                  d.businessDate === businessDate ? day : d,
                ),
              };
            });
          } catch {
            /* keep */
          }
          setSelectedSlot(undefined);
          setPlan(null);
          goToStep("schedule");
        }
        if (!conflict) {
          trackBookingError("create_server_error", {
            code,
            httpStatus: result.error?.httpStatus,
            message: result.error?.message,
          });
        }
        setConfirmStatus("error");
        setConfirmError(result.error?.message || "create_failed");
        return;
      }

      if (selectedDate && selectedSlot && durationMinutes > 0) {
        const occEmpId = selectedSlot.empId ?? empId;
        if (!occEmpId) {
          /* cannot occupy without employee */
        } else {
        const businessDate =
          selectedSlot.businessDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedSlot.businessDate)
            ? selectedSlot.businessDate
            : localDateToBusinessDate(selectedDate);
        const startMin = slotStartMin(selectedSlot);
        const occBranch = selectedSlot.branchCode || effectiveBranchCode;
        applyLocalOccupancyToAllCachedMatrices({
          empId: occEmpId,
          businessDate,
          startMin,
          durationMinutes,
          branchCode: occBranch,
        });
        setMatrix((prev) =>
          prev
            ? applyLocalOccupancyToMatrix(prev, {
                empId: occEmpId,
                businessDate,
                startMin,
                durationMinutes,
                branchCode: occBranch,
              })
            : prev,
        );
        void revalidateAvailabilityBusinessDate({
          mode: mode === "nearest" ? "nearest" : "specific",
          empId: mode === "specific" ? occEmpId : undefined,
          branchCodes:
            scope?.branchCodes ?? (effectiveBranchCode ? [effectiveBranchCode] : []),
          businessDate,
        }).then((dayMatrix) => {
          const day = dayMatrix.matrix.find((d) => d.businessDate === businessDate);
          if (!day) return;
          setMatrix((prev) => {
            if (!prev) return dayMatrix;
            return {
              ...prev,
              matrix: prev.matrix.map((d) =>
                d.businessDate === businessDate ? day : d,
              ),
            };
          });
        });
        }
      }

      const booking = result.booking;
      saveBookFlowConfirmation({
        customerName: customerName.trim(),
        date:
          booking.date ||
          (selectedDate ? localDateToBusinessDate(selectedDate) : ""),
        time: booking.time || selectedSlot?.time || "",
        branchName:
          booking.branchName ||
          branches.find((b) => b.branchCode === effectiveBranchCode)?.branchName ||
          String(effectiveBranchCode || ""),
        branchCode: booking.branchCode || effectiveBranchCode,
        barberName: booking.barberName || barberName || null,
        bookingCode: booking.bookingCode || null,
      });
      setConfirmStatus("idle");
      router.push("/book/confirmed");
    } catch (err) {
      setConfirmStatus("error");
      setConfirmError(err instanceof Error ? err.message : "create_failed");
    } finally {
      confirmInFlightRef.current = false;
      bookO2WriteLock = false;
    }
  }, [
    plan,
    selectedDate,
    scope,
    empId,
    selectedSlot,
    durationMinutes,
    effectiveBranchCode,
    mode,
    customerName,
    customerPhone,
    notes,
    serviceIds,
    branches,
    barberName,
    router,
    goToStep,
  ]);

  const branchName =
    branches.find(
      (b) =>
        String(b.branchCode).toUpperCase() ===
        String(effectiveBranchCode || "").toUpperCase(),
    )?.branchName ||
    effectiveBranchCode ||
    "";

  return {
    step,
    setStep: goToStep,
    goBack,
    mode,
    empId,
    barberName,
    barberImage,
    branchCode,
    effectiveBranchCode,
    branchName,
    serviceIds,
    selectedServices,
    durationMinutes,
    displayTotalPrice,
    packageId,
    addonProIds,
    groomCart,
    groomPack,
    groomHydrationStatus,
    groomHydrationError,
    selectedDate,
    selectedSlot,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    notes,
    setNotes,
    bootstrapStatus,
    matrixStatus,
    matrixError,
    services,
    categories,
    barbers,
    branches,
    days,
    multiBranchDays,
    slots,
    multiBranchSlots: multiBranchSlots as BarberAvailableSlot[],
    plan,
    confirmStatus,
    confirmError,
    staleSlotNotice,
    catalogLoading: bootstrapStatus === "loading" && !catalog,
    maxServices: MAX_SERVICES,
    isPhoneReady: () => normalizeEgyptianPhone(customerPhone) != null,
    selectIntentNearest,
    selectIntentBranch,
    selectIntentBarber,
    selectBranch,
    selectBarber,
    selectServices,
    selectCoreService,
    toggleService,
    selectDate,
    selectSlot,
    goSchedule,
    requestPlan,
    confirmCreate,
  };
}
