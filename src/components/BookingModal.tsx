"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  WifiOff,
  Zap,
  UserCheck,
  Copy,
  MapPin,
  Scissors,
  CalendarDays,
  Clock,
} from "lucide-react";
import ConfettiBurst from "./ConfettiBurst";
import BookingStepHeader from "./BookingStepHeader";
import { BookingNavFooter } from "./BookingNavFooter";
import BookingInfoPanel from "./BookingInfoPanel";
import BookingCalendar from "./BookingCalendar";
import BookingTimeSlots from "./BookingTimeSlots";
import BookingMultiBranchTimeSlots from "./BookingMultiBranchTimeSlots";
import BookingAvailabilityScopeStep from "./BookingAvailabilityScope";
import BookingServiceSelect from "./BookingServiceSelect";
import BranchPicker from "./BranchPicker";
import CrossBranchSlotsPanel from "@/components/CrossBranchSlotsPanel";
import BarberPhoto from "./BarberPhoto";
import { useBranch } from "@/context/BranchContext";
import { getCoreServiceIdSet } from "@/lib/bookingServiceGroups";
import { useBookingFlow, type BookingUiStep } from "@/hooks/useBookingFlow";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import { saveClient } from "@/lib/clientStorage";
import { getBranchAccent } from "@/lib/branchTheme";
import {
  resolveBarberDisplayName,
  serviceNameAr,
  serviceNameEn,
  getLocalizedBookingErrorMessage,
  resolveBookableBranchesForBarber,
  getBookingSteps,
  recoverStepInSequence,
  getEffectiveBookingBranch,
  getBookingBranchDisplay,
  localizeBranchName,
  type PublicBranch,
  type BookingMode,
  type BookingEntryMode,
  type BookingService,
  type PublicBookingErrorCode,
  type BookingStepId,
  type BarberAvailabilityScope,
  type BarberAvailableSlot,
} from "@/lib/booking-api";

type ClientLookupStatus = "idle" | "loading" | "found" | "new";

const FLOW_ERROR_KEYS = new Set([
  "barberIdMissing",
  "barberNotBookableOnline",
  "barberBranchesLoadFailed",
  "noPublicBranchesForBarber",
  "barberProfileUnavailable",
  "selectedBranchNoLongerAvailable",
  "branchResolutionFailed",
  "invalidBookingStep",
  "barberNotAvailableAtBranch",
  "catalogLoadFailed",
  "invalidNamePhone",
  "planPrepareFailed",
  "outcomeUnknown",
  "branchesLoadFailed",
]);

function SelectedServicesBilingual({
  services,
  compact = false,
  dark = false,
}: {
  services: BookingService[];
  compact?: boolean;
  dark?: boolean;
}) {
  const { lang } = useBookingTranslations();
  if (services.length === 0) return null;
  return (
    <div className={compact ? "space-y-0.5" : "space-y-1.5"}>
      {services.map((s) => {
        const ar = serviceNameAr(s);
        const en = serviceNameEn(s);
        const primary = lang === "en" ? en || ar : ar;
        const secondary = lang === "en" ? (ar && ar !== primary ? ar : null) : en && en !== ar ? en : null;
        const primaryLang = lang === "en" && en ? "en" : "ar";
        const secondaryLang = primaryLang === "en" ? "ar" : "en";
        return (
          <div key={s.id} className="min-w-0">
            <p
              className={`font-heading font-bold leading-tight ${
                dark ? "text-cut-ivory" : "text-cut-black"
              } ${compact ? "text-xs" : "text-sm"}`}
              lang={primaryLang}
              dir={primaryLang === "ar" ? "rtl" : "ltr"}
            >
              {primary}
            </p>
            {secondary ? (
              <p
                className={`font-editorial leading-snug tracking-wide ${
                  dark ? "text-[var(--booking-sidebar-muted)]" : "text-[var(--booking-text-secondary)]"
                } text-[13px]`}
                lang={secondaryLang}
                dir={secondaryLang === "ar" ? "rtl" : "ltr"}
              >
                {secondary}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export interface BarberBookingInfo {
  id?: number;
  name: string;
  /** Absolute API photo URL, or null for initials placeholder. */
  image: string | null;
  role?: string;
  specialty?: string;
  rating?: number;
  reviewCount?: string;
  location?: string;
}

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber: BarberBookingInfo;
  initialMode?: BookingMode;
  initialServiceMatches?: string[];
  initialServiceIds?: number[];
  bookingNote?: string;
  /** barber_first locks specific mode and filters branches to that barber. */
  entryMode?: BookingEntryMode;
  /** Explicit branch from a branch-specific CTA (not browsing persistence). */
  explicitEntryBranchCode?: string | null;
  /** Preselect scope when entry CTA is branch-specific. */
  initialAvailabilityScope?: BarberAvailabilityScope | null;
}

function stepForHeader(step: BookingUiStep): string {
  if (step === "success") return "review";
  return step;
}

const BookingModal = ({
  open,
  onOpenChange,
  barber,
  initialMode,
  initialServiceMatches,
  initialServiceIds,
  bookingNote,
  entryMode = "branch_first",
  explicitEntryBranchCode = null,
  initialAvailabilityScope = null,
}: BookingModalProps) => {
  const { lang, dir, t, format } = useBookingTranslations();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const resolveError = (msg?: string | null, code?: string | null) => {
    const key =
      (code && FLOW_ERROR_KEYS.has(code) ? code : null) ||
      (msg && FLOW_ERROR_KEYS.has(msg) ? msg : null);
    if (key) return t(`errors.${key}`);
    if (code) return getLocalizedBookingErrorMessage(code as PublicBookingErrorCode, lang);
    if (msg && FLOW_ERROR_KEYS.has(msg)) return t(`errors.${msg}`);
    return msg ?? "";
  };

  const branchAccentLabel = (accentKey: string) => {
    if (accentKey === "camp") return t("branch.chipCamp");
    if (accentKey === "gleem") return t("branch.chipGleem");
    return t("branch.label");
  };

  const {
    branches,
    isLoadingBranches,
    branchesError,
    selectedBranch,
    hasConfirmedBranch,
    selectBranch,
    refetchBranches,
  } = useBranch();

  const isBarberFirst = entryMode === "barber_first";
  const hasBarberEmpId =
    barber.id != null && Number.isFinite(barber.id) && barber.id > 0;
  const effectiveInitialMode = isBarberFirst ? "specific" : initialMode;

  /** Live branch fed into useBookingFlow — draft / resolved only, never a stale preferred. */
  const [flowBranchCode, setFlowBranchCode] = useState<string | undefined>(undefined);

  const flow = useBookingFlow({
    open: open && (!isBarberFirst || hasBarberEmpId),
    branchCode: flowBranchCode,
    initialMode: effectiveInitialMode,
    initialBarber: hasBarberEmpId ? barber : isBarberFirst ? null : barber,
    bookingNote,
    skipModeStep: Boolean(effectiveInitialMode) || isBarberFirst,
    entryMode,
    explicitEntryBranchCode,
    initialAvailabilityScope,
    /** All public branches — hook intersects with barber profile branches. */
    allowedPublicBranches: branches,
  });

  const branchResolution = useMemo(() => {
    if (isBarberFirst) {
      return resolveBookableBranchesForBarber({
        barberProfileBranches: flow.barberBranches,
        publicBranches: branches,
        // Do not seed multi-branch scope from browsing preferred.
        preferredBranchCode: flow.bookingBranchCode ?? null,
      });
    }
    const preferred = selectedBranch
      ? branches.find((b) => b.branchCode === selectedBranch.branchCode) ?? selectedBranch
      : null;
    return {
      allowedBranches: branches,
      resolvedBranch: hasConfirmedBranch ? preferred : null,
      resolution: hasConfirmedBranch && preferred
        ? ("preferred" as const)
        : branches.length === 1
          ? ("single" as const)
          : branches.length === 0
            ? ("none" as const)
            : ("multiple" as const),
    };
  }, [
    isBarberFirst,
    flow.barberBranches,
    flow.bookingBranchCode,
    branches,
    selectedBranch,
    hasConfirmedBranch,
  ]);

  const allowedBranches = branchResolution.allowedBranches;

  const multiBranchBarber =
    isBarberFirst &&
    (branchResolution.resolution === "multiple" ||
      branchResolution.resolution === "preferred" ||
      allowedBranches.length > 1);

  const effectiveBranch = useMemo(
    () =>
      getEffectiveBookingBranch({
        draftBranchCode: flow.bookingBranchCode,
        draftBranchName: flow.bookingBranchName,
        slotBranchCode: flow.selectedSlot?.branchCode,
        preferredBranchCode: selectedBranch?.branchCode,
        publicBranches: branches,
        allowedBranches: isBarberFirst ? allowedBranches : branches,
        branchResolution: branchResolution.resolution,
        entryMode,
        multiBranchBarber,
        availabilityScope: flow.availabilityScope,
      }),
    [
      flow.bookingBranchCode,
      flow.bookingBranchName,
      flow.selectedSlot?.branchCode,
      flow.availabilityScope,
      selectedBranch?.branchCode,
      branches,
      allowedBranches,
      branchResolution.resolution,
      entryMode,
      isBarberFirst,
      multiBranchBarber,
    ],
  );

  const branchDisplay = useMemo(
    () =>
      getBookingBranchDisplay(
        {
          draftBranchCode: flow.bookingBranchCode,
          draftBranchName: flow.bookingBranchName,
          slotBranchCode: flow.selectedSlot?.branchCode,
          preferredBranchCode: selectedBranch?.branchCode,
          publicBranches: branches,
          allowedBranches: isBarberFirst ? allowedBranches : branches,
          branchResolution: branchResolution.resolution,
          entryMode,
          multiBranchBarber,
          availabilityScope: flow.availabilityScope,
        },
        lang,
        t("infoPanel.notSetYet"),
        {
          pendingAllBranchesLabel: t("infoPanel.determinedByTime"),
        },
      ),
    [
      flow.bookingBranchCode,
      flow.bookingBranchName,
      flow.selectedSlot?.branchCode,
      flow.availabilityScope,
      selectedBranch?.branchCode,
      branches,
      allowedBranches,
      branchResolution.resolution,
      entryMode,
      isBarberFirst,
      multiBranchBarber,
      lang,
      t,
    ],
  );

  const branchResolved = useMemo(() => {
    if (!isBarberFirst) {
      return Boolean(effectiveBranch.branchCode) && hasConfirmedBranch;
    }
    if (branchResolution.resolution === "none") return false;
    if (multiBranchBarber) {
      if (flow.availabilityScope === "all_branches") return true;
      if (flow.availabilityScope === "specific_branch") {
        return Boolean(
          flow.selectedSpecificBranchCode || flow.bookingBranchCode,
        );
      }
      return false;
    }
    return (
      Boolean(effectiveBranch.branchCode) &&
      branchResolution.resolution === "single"
    );
  }, [
    isBarberFirst,
    effectiveBranch.branchCode,
    hasConfirmedBranch,
    branchResolution.resolution,
    multiBranchBarber,
    flow.availabilityScope,
    flow.selectedSpecificBranchCode,
    flow.bookingBranchCode,
  ]);

  const visibleStepIds = useMemo(
    () =>
      getBookingSteps({
        entryMode,
        initialMode: effectiveInitialMode,
        branchResolved,
        barberResolved: isBarberFirst && hasBarberEmpId,
        servicePreselected: false,
        multiBranchBarber,
        availabilityScope: flow.availabilityScope,
      }),
    [
      entryMode,
      effectiveInitialMode,
      branchResolved,
      isBarberFirst,
      hasBarberEmpId,
      multiBranchBarber,
      flow.availabilityScope,
    ],
  );

  const steps = useMemo(
    () =>
      visibleStepIds.map((id, index) => ({
        id,
        label: t(`steps.${id}` as const),
        number: index + 1,
      })),
    [visibleStepIds, t],
  );

  // Keep flow branch input aligned with effective booking draft.
  useEffect(() => {
    const next = effectiveBranch.branchCode ?? undefined;
    setFlowBranchCode((prev) => (prev === next ? prev : next));
  }, [effectiveBranch.branchCode]);

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<ClientLookupStatus>("idle");
  const [lookedUpName, setLookedUpName] = useState<string | null>(null);
  /** Local draft for appointment_scope cards before Continue commits via setAvailabilityScope. */
  const [scopeDraft, setScopeDraft] = useState<BarberAvailabilityScope | null>(null);

  // Debounced phone → client name lookup (returning customers).
  useEffect(() => {
    if (!open) return;
    const digits = flow.customerPhone.replace(/\D/g, "");
    if (digits.length < 8) {
      setLookupStatus("idle");
      setLookedUpName(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLookupStatus("loading");
      const controller = new AbortController();
      const kill = setTimeout(() => controller.abort(), 2500);
      try {
        const res = await fetch(
          `/api/client/lookup?mobile=${encodeURIComponent(digits)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          ok?: boolean;
          found?: boolean;
          client?: { id?: number; name?: string; mobile?: string };
        };
        if (cancelled) return;
        if (data.ok && data.found && data.client?.name) {
          const name = String(data.client.name).trim();
          setLookedUpName(name);
          flow.setCustomerName(name);
          setLookupStatus("found");
          saveClient({
            id: data.client.id,
            name,
            phone: String(data.client.mobile || digits).replace(/\D/g, "") || digits,
          });
        } else {
          setLookedUpName(null);
          setLookupStatus("new");
        }
      } catch {
        if (!cancelled) {
          setLookedUpName(null);
          setLookupStatus("new");
        }
      } finally {
        clearTimeout(kill);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flow.customerPhone]);

  // Celebrate once when create lands on success.
  useEffect(() => {
    if (!open || flow.step !== "success") return;
    setConfettiTrigger((p) => p + 1);
  }, [open, flow.step]);

  // Barber-first: auto-resolve only single-branch barbers (never preferred/multi).
  useEffect(() => {
    if (!open || !isBarberFirst) return;
    if (flow.barberProfileLoading) return;
    if (multiBranchBarber) return;
    if (branchResolution.resolution !== "single") return;
    const resolved = branchResolution.resolvedBranch;
    if (!resolved) return;
    flow.commitDraftBranch(resolved);
    if (
      !selectedBranch ||
      selectedBranch.branchCode.toUpperCase() !== resolved.branchCode.toUpperCase()
    ) {
      selectBranch(resolved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    isBarberFirst,
    multiBranchBarber,
    flow.barberProfileLoading,
    branchResolution.resolution,
    branchResolution.resolvedBranch?.branchCode,
  ]);

  // Recover current step when visible sequence changes (e.g. branch auto-resolved).
  useEffect(() => {
    if (!open) return;
    if (flow.step === "success" || flow.step === "slots") return;
    const next = recoverStepInSequence(flow.step, visibleStepIds);
    if (next !== flow.step) {
      flow.setStep(next as BookingUiStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visibleStepIds.join("|"), flow.step]);

  // Optional groom service preselect: exact serviceId matches take priority, with
  // fuzzy name matching as a fallback for services without a known ID.
  useEffect(() => {
    if (!open || flow.services.length === 0) return;
    if (!initialServiceIds?.length && !initialServiceMatches?.length) return;
    if (flow.serviceIds.length > 0) return;
    const knownIds = new Set(flow.services.map((s) => s.id));
    const idMatched = (initialServiceIds ?? []).filter((id) => knownIds.has(id));
    const normalizedMatches = (initialServiceMatches ?? []).map((m) => m.trim().toLowerCase());
    const nameMatched = normalizedMatches.length
      ? flow.services
          .filter((service) =>
            normalizedMatches.some(
              (match) =>
                service.name.trim().toLowerCase().includes(match) ||
                match.includes(service.name.trim().toLowerCase()),
            ),
          )
          .map((s) => s.id)
      : [];
    const matched = [...new Set([...idMatched, ...nameMatched])];
    if (matched.length) {
      flow.selectServices(matched);
      flow.setStep("date");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialServiceIds, initialServiceMatches, flow.services]);

  // Enter after branch when draft is valid and still on branch step (single / non-multi).
  useEffect(() => {
    if (!open) return;
    if (!effectiveBranch.branchCode || flow.step !== "branch") return;
    if (isBarberFirst && branchResolution.resolution === "none") return;
    if (multiBranchBarber) return;
    flow.setStep(effectiveInitialMode || isBarberFirst ? "service" : "mode");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    effectiveBranch.branchCode,
    flow.step,
    isBarberFirst,
    multiBranchBarber,
    branchResolution.resolution,
    effectiveInitialMode,
  ]);

  const handleClose = () => {
    if (flow.mutationUi.kind === "creating" || flow.mutationUi.kind === "unknown") {
      const ok = window.confirm(t("errors.closeWhilePending"));
      if (!ok) return;
    }
    onOpenChange(false);
    setTimeout(() => {
      flow.resetAll();
      setFlowBranchCode(undefined);
      setCopied(false);
      setLookupStatus("idle");
      setLookedUpName(null);
      setScopeDraft(null);
    }, 300);
  };

  const handleBranchSelect = (branch: PublicBranch) => {
    if (isBarberFirst) {
      const ok = allowedBranches.some(
        (b) => b.branchCode.toUpperCase() === branch.branchCode.toUpperCase(),
      );
      if (!ok) return;
    }
    if (multiBranchBarber && flow.availabilityScope === "specific_branch") {
      flow.selectSpecificBranch(branch);
      return;
    }
    flow.commitDraftBranch(branch);
    selectBranch(branch);
    flow.setStep(effectiveInitialMode || isBarberFirst ? "service" : "mode");
  };

  const handleCoreServiceSelect = (id: number) => {
    const coreIds = getCoreServiceIdSet(flow.services);
    const nonCore = flow.serviceIds.filter((sid) => !coreIds.has(sid));
    flow.selectServices([id, ...nonCore]);
  };

  const handleToggleService = (id: number) => {
    if (flow.serviceIds.includes(id)) {
      flow.selectServices(flow.serviceIds.filter((sid) => sid !== id));
    } else if (flow.serviceIds.length < flow.maxServices) {
      flow.selectServices([...flow.serviceIds, id]);
    }
  };

  const handleBack = () => {
    flow.invalidatePlan();
    const seq = visibleStepIds;
    const current =
      flow.step === "slots" ? "date" : (flow.step as BookingStepId);
    const idx = seq.indexOf(current);
    if (idx > 0) {
      flow.setStep(seq[idx - 1] as BookingUiStep);
      return;
    }
    if (flow.step === "appointment_scope") return;
    if (flow.step === "mode") flow.setStep("branch");
    else if (flow.step === "service") {
      if (seq.includes("mode")) flow.setStep("mode");
      else if (seq.includes("branch")) flow.setStep("branch");
      else if (seq.includes("appointment_scope")) flow.setStep("appointment_scope");
    } else if (flow.step === "slots") flow.setStep("service");
    else if (flow.step === "date") flow.setStep("service");
    else if (flow.step === "time") flow.setStep("date");
    else if (flow.step === "details") flow.setStep("time");
    else if (flow.step === "review") flow.setStep("details");
  };

  const selectedServices = flow.services.filter((s) => flow.serviceIds.includes(s.id));
  // Nearest entry keeps mode=nearest; slot barber is display-only (sidebar), not entryMode.
  const isNearestMode = flow.mode === "nearest";
  const displayBarberName = isNearestMode
    ? t("header.nearestBarber")
    : flow.barber?.name ?? barber.name;
  const sidebarBarberName = isNearestMode
    ? flow.selectedSlot?.barberName ?? t("header.nearestBarber")
    : displayBarberName;
  const displayBranchName =
    branchDisplay.isSet ||
    (multiBranchBarber && flow.availabilityScope === "all_branches")
      ? branchDisplay.name
      : undefined;
  const displayBranchCode = branchDisplay.code ?? undefined;
  const branchAccent = getBranchAccent(displayBranchCode, displayBranchName);

  const allowSpecific = flow.config?.settings.allowSpecificBarber !== false;
  const allowNearest = flow.config?.settings.allowNearestBarber !== false;
  const envBookingEnabled = process.env.NEXT_PUBLIC_BOOKING_ENABLED !== "false";
  const isBookingEnabled =
    flow.config?.salon?.bookingEnabled !== false && envBookingEnabled;

  const resolveConfirmationDate = (raw: string, fallback?: Date) => {
    let dateObj: Date | undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parsed = new Date(`${raw}T12:00:00`);
      if (!Number.isNaN(parsed.getTime())) dateObj = parsed;
    } else if (fallback) {
      dateObj = fallback;
    }
    if (!dateObj) {
      const fallbackLabel = fallback ? format.date(fallback) : "";
      return {
        weekday: "",
        dateLine: raw || fallbackLabel || "—",
        full: raw || fallbackLabel || "—",
      };
    }
    const weekday = format.weekday(dateObj);
    const dateLine = format.monthDay(dateObj);
    return {
      weekday,
      dateLine,
      full: lang === "ar" ? `${weekday}، ${dateLine}` : `${weekday}, ${dateLine}`,
    };
  };

  const canPlan =
    flow.customerName.trim().length >= 2 &&
    flow.isPhoneReady(flow.customerPhone) &&
    flow.mutationUi.kind !== "planning" &&
    flow.mutationUi.kind !== "creating" &&
    !(flow.mutationUi.kind === "rate_limited" && flow.rateLimitRemainingSeconds > 0);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const renderMutationBanner = () => {
    if (flow.mutationUi.kind === "idle") return null;
    if (flow.mutationUi.kind === "planning" || flow.mutationUi.kind === "creating") {
      return (
        <div
          className="mx-6 mt-4 p-3 rounded-xl bg-cut-gold/10 border border-cut-gold/20 text-cut-black text-sm text-center flex items-center justify-center gap-2"
          aria-live="polite"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          {flow.mutationUi.kind === "planning"
            ? t("loading.planning")
            : t("loading.creating")}
        </div>
      );
    }
    if (flow.mutationUi.kind === "rate_limited") {
      return (
        <div
          className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center"
          aria-live="polite"
        >
          {resolveError(flow.mutationUi.message)}
          {flow.rateLimitRemainingSeconds > 0 && (
            <p className="mt-1 font-bold tabular-nums">
              {t("errors.retryAfterSeconds", { n: flow.rateLimitRemainingSeconds })}
            </p>
          )}
        </div>
      );
    }
    if (flow.mutationUi.kind === "unknown") {
      return (
        <div
          className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm text-center space-y-2"
          aria-live="assertive"
        >
          <p className="font-bold">{t("errors.outcomeUnknown")}</p>
          <p>{t("errors.outcomeUnknownDetail")}</p>
          <button
            type="button"
            onClick={() => flow.safeRetryCreate()}
            className="px-4 py-2 rounded-lg bg-cut-gold text-black text-xs font-bold"
          >
            {t("actions.safeRetry")}
          </button>
        </div>
      );
    }
    return (
      <div
        className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center"
        aria-live="assertive"
      >
        {resolveError(
          flow.mutationUi.message,
          "code" in flow.mutationUi ? flow.mutationUi.code : undefined,
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isBarberFirst && !hasBarberEmpId) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-cut-black/85 font-medium">
            {t("errors.barberIdMissing")}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-cut-gold/15 text-sm text-cut-black/70 hover:bg-cut-black/[0.04] transition-colors"
          >
            {t("actions.close")}
          </button>
        </div>
      );
    }

    if (flow.step === "appointment_scope") {
      const scopeValue = scopeDraft ?? flow.availabilityScope;
      return (
        <BookingAvailabilityScopeStep
          barberName={barber.name}
          value={scopeValue}
          onChange={setScopeDraft}
          onContinue={() => {
            if (!scopeValue) return;
            flow.setAvailabilityScope(scopeValue);
          }}
          onBack={visibleStepIds[0] === "appointment_scope" ? undefined : handleBack}
        />
      );
    }

    if (flow.step === "branch") {
      const specificScopeBranch =
        multiBranchBarber && flow.availabilityScope === "specific_branch";
      const selectedCode = specificScopeBranch
        ? flow.selectedSpecificBranchCode
        : effectiveBranch.branchCode;
      return (
        <div className="p-5 md:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-heading font-bold text-cut-black mb-1">
              {isBarberFirst
                ? t("branch.titleBarberFirst", { name: barber.name })
                : t("branch.title")}
            </h3>
            <p className="text-cut-black/50 text-xs">
              {isBarberFirst ? t("branch.subtitleBarberFirst") : t("branch.subtitle")}
            </p>
          </div>
          {(flow.barberProfileError || branchesError) && (
            <div
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center space-y-3"
              role="alert"
            >
              <p>
                {flow.barberProfileError
                  ? resolveError(flow.barberProfileError)
                  : t("errors.branchesLoadFailed")}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (flow.barberProfileError) flow.retryBarberProfile();
                  if (branchesError) refetchBranches();
                }}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 text-xs font-bold hover:bg-red-50 transition-colors"
              >
                {t("actions.retry")}
              </button>
            </div>
          )}
          {!flow.barberProfileLoading && (
            <BranchPicker
              branches={allowedBranches}
              selectedBranchCode={selectedCode ?? undefined}
              isLoading={isLoadingBranches || (isBarberFirst && flow.barberProfileLoading)}
              error={
                !flow.barberProfileError &&
                !branchesError &&
                isBarberFirst &&
                !flow.barberProfileLoading &&
                branchResolution.resolution === "none"
                  ? t("errors.noPublicBranchesForBarber")
                  : null
              }
              variant="light"
              onSelect={handleBranchSelect}
            />
          )}
          {specificScopeBranch && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => flow.setAvailabilityScope("all_branches")}
                className="w-full py-3 rounded-xl border border-[var(--booking-border)] text-sm font-bold text-[var(--booking-text)] hover:bg-cut-black/[0.03] transition-colors"
              >
                {t("actions.viewAllBranches")}
              </button>
              <BookingNavFooter onBack={handleBack} />
            </div>
          )}
          {isBarberFirst && branchResolution.resolution === "none" && !flow.barberProfileLoading && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-xl border border-[var(--booking-border)] text-sm font-bold text-[var(--booking-text)]"
              >
                {t("branch.chooseAnotherBarber")}
              </button>
            </div>
          )}
          {!specificScopeBranch &&
            hasConfirmedBranch &&
            effectiveBranch.branch &&
            allowedBranches.some(
              (b) => b.branchCode === effectiveBranch.branch!.branchCode,
            ) && (
              <button
                type="button"
                onClick={() => handleBranchSelect(effectiveBranch.branch!)}
                className={`w-full mt-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#D4AF37]/20 ${
                  getBranchAccent(
                    effectiveBranch.branch.branchCode,
                    effectiveBranch.branch.branchName,
                  ).key === "camp"
                    ? "bg-[#E8A317] text-black hover:bg-[#D4920F]"
                    : "bg-[#D4AF37] text-black hover:bg-[#C4A030]"
                }`}
              >
                <Check className="w-4 h-4" />
                {t("actions.confirmBranchContinue", {
                  name:
                    effectiveBranch.branch.shortName ||
                    effectiveBranch.branch.branchName,
                })}
              </button>
            )}
        </div>
      );
    }

    if (flow.catalogLoading && flow.services.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4" aria-live="polite">
          <Loader2 className="w-8 h-8 animate-spin text-cut-gold" />
          <p className="text-cut-black/50 text-sm">{t("loading.catalog")}</p>
        </div>
      );
    }

    if (flow.catalogError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <WifiOff className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-cut-black/85 font-medium">{resolveError(flow.catalogError)}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg border border-cut-gold/15 text-sm text-cut-black/70 hover:bg-cut-black/[0.04] transition-colors"
          >
            {t("actions.retry")}
          </button>
        </div>
      );
    }

    if (!isBookingEnabled) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 p-6 text-center">
          <AlertCircle className="w-7 h-7 text-amber-400" />
          <p className="text-cut-black/85 font-semibold text-base">{t("errors.bookingDisabledToday")}</p>
          <p className="text-cut-black/50 text-sm">{t("errors.bookingDisabledHint")}</p>
        </div>
      );
    }

    switch (flow.step) {
      case "mode":
        return (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="p-5 md:p-6 flex-1">
              <div className="mb-5">
                <h3 className="text-lg font-heading font-bold text-cut-black mb-1">
                  {t("mode.title")}
                </h3>
                <p className="text-cut-black/50 text-xs">{t("mode.subtitle")}</p>
              </div>
              <div className="space-y-3">
                {allowNearest && (
                  <button
                    type="button"
                    onClick={() => flow.selectMode("nearest")}
                    className="w-full rounded-2xl border border-cut-gold/20 bg-gradient-to-l from-cut-gold/[0.06] to-transparent p-5 text-start transition-all duration-200 group cursor-pointer hover:border-cut-gold/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cut-gold/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-cut-gold" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-heading font-bold text-base text-cut-black mb-1">
                          {t("mode.nearestTitle")}
                        </h4>
                        <p className="text-cut-black/60 text-xs leading-relaxed">
                          {t("mode.nearestDesc")}
                        </p>
                      </div>
                    </div>
                  </button>
                )}
                {allowSpecific && (
                  <button
                    type="button"
                    onClick={() => {
                      if (barber.id != null) {
                        flow.selectBarber({ id: barber.id, name: barber.name });
                      }
                      flow.selectMode("specific");
                    }}
                    className="w-full rounded-2xl border border-cut-gold/15 bg-cut-ivory p-5 text-start transition-all duration-200 group cursor-pointer hover:border-cut-gold/40"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cut-black/[0.04] flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-6 h-6 text-cut-black/50 group-hover:text-cut-gold" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-heading font-bold text-base text-cut-black mb-1">
                          {t("mode.specificTitle")}
                        </h4>
                        <p className="text-cut-black/60 text-xs leading-relaxed">
                          {t("mode.specificDesc")}
                        </p>
                        {barber.name && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-cut-gold/20 flex-shrink-0">
                              <BarberPhoto
                                src={barber.image}
                                name={barber.name}
                                imgClassName="w-full h-full object-cover object-top"
                              />
                            </div>
                            <span className="text-cut-black/70 text-xs font-medium">{barber.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
            <BookingNavFooter onBack={handleBack} />
          </div>
        );

      case "service": {
        // Specific without barber id: pick from public barbers list
        const needsBarberPick =
          flow.mode === "specific" && flow.barber?.id == null && flow.barbers.length > 0;
        return (
          <div className="flex flex-col min-h-0 flex-1">
            {needsBarberPick && (
              <div className="px-5 pt-4 space-y-2">
                <p className="text-sm font-bold text-cut-black">{t("mode.pickBarber")}</p>
                <div className="flex flex-wrap gap-2">
                  {flow.barbers.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => flow.selectBarber({ id: b.id, name: b.name })}
                      className="px-3 py-2 rounded-xl border border-cut-gold/20 text-xs font-medium hover:border-cut-gold/50"
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <BookingServiceSelect
              services={flow.services}
              selectedIds={flow.serviceIds}
              onCoreSelect={handleCoreServiceSelect}
              onToggleService={handleToggleService}
              isLoading={flow.catalogLoading}
              totalPrice={flow.catalogPrice}
              totalDuration={flow.catalogDuration}
              selectedCount={selectedServices.length}
              onContinue={() => {
                if (flow.mode === "specific" && flow.barber?.id == null) return;
                flow.goToSlotsStep();
              }}
            />
            <BookingNavFooter onBack={handleBack} />
          </div>
        );
      }

      case "slots":
        return (
          <div>
            {renderMutationBanner()}
            <CrossBranchSlotsPanel
              branches={flow.crossBranches}
              slots={flow.crossSlots}
              activeTab={flow.crossTab}
              onTabChange={flow.setCrossBranchTab}
              selectedKey={flow.selectedCrossSlotKey}
              onSelect={flow.selectCrossBranchSlot}
              isLoading={flow.crossSlotsLoading}
              error={flow.crossSlotsError}
              onRetry={flow.retryCrossBranchSlots}
            />
            <BookingNavFooter onBack={handleBack} backLabel={t("actions.backToServices")} />
          </div>
        );

      case "date": {
        const calendarDays = flow.usesBarberAvailabilityApi
          ? flow.multiBranchDays
          : flow.days;
        const showBranchIndicators =
          flow.usesBarberAvailabilityApi &&
          flow.availabilityScope === "all_branches";
        const activeBranchCode =
          flow.usesBarberAvailabilityApi &&
          flow.availabilityScope === "specific_branch"
            ? flow.selectedSpecificBranchCode
            : null;
        const specificBranch = activeBranchCode
          ? allowedBranches.find(
              (b) =>
                b.branchCode.toUpperCase() === activeBranchCode.toUpperCase(),
            )
          : null;
        const specificBranchLabel = specificBranch
          ? localizeBranchName(specificBranch, lang) || specificBranch.branchName
          : null;

        return (
          <div>
            {renderMutationBanner()}
            {specificBranchLabel && (
              <div className="mx-5 md:mx-6 mt-4 mb-0 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--booking-border)] bg-white px-3 py-2.5">
                <p className="text-sm font-bold text-cut-black">
                  {t("date.branchContext", { name: specificBranchLabel })}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => flow.setStep("branch")}
                    className="text-xs font-bold text-cut-black/70 underline-offset-2 hover:underline"
                  >
                    {t("actions.changeBranch")}
                  </button>
                  <button
                    type="button"
                    onClick={() => flow.setAvailabilityScope("all_branches")}
                    className="text-xs font-bold text-cut-black/70 underline-offset-2 hover:underline"
                  >
                    {t("actions.viewAllBranches")}
                  </button>
                </div>
              </div>
            )}
            {flow.multiBranchDaysMeta?.partial && (
              <p className="px-6 pt-3 text-sm text-amber-800" role="status">
                {t("errors.partialBarberAvailability")}
              </p>
            )}
            {flow.daysLoading && calendarDays.length === 0 && (
              <p className="px-6 pt-4 text-sm text-cut-black/60" aria-live="polite">
                {t("date.loading")}
              </p>
            )}
            {flow.daysError && !flow.daysLoading && (
              <p className="px-6 pt-4 text-sm text-red-600" aria-live="assertive">
                {resolveError(flow.daysError)}
              </p>
            )}
            {!flow.daysLoading && !flow.daysError && calendarDays.length > 0 &&
              calendarDays.every((d) => !d.available) && (
                <p className="px-6 pt-4 text-sm text-cut-black/60">
                  {t("date.emptyForSelection")}
                </p>
              )}
            <BookingCalendar
              selectedDate={flow.selectedDate}
              onDateSelect={flow.selectDate}
              availableDays={calendarDays}
              isLoading={flow.daysLoading && calendarDays.length === 0}
              maxDaysAhead={flow.config?.settings?.maxBookingDaysAhead ?? 60}
              showBranchIndicators={showBranchIndicators}
              legend={showBranchIndicators}
              activeBranchCode={activeBranchCode}
            />
            <BookingNavFooter onBack={handleBack} backLabel={t("actions.backToServices")} />
          </div>
        );
      }

      case "time": {
        const locBranch = flow.dayLocation?.branch;
        const bannerCode = locBranch?.branchCode ?? displayBranchCode;
        const bannerName = locBranch?.branchName ?? displayBranchName;
        const bannerAccent = getBranchAccent(bannerCode, bannerName);
        const dateLabel = flow.selectedDate ? format.date(flow.selectedDate) : "";
        const showBranchBanner =
          flow.mode === "specific" &&
          Boolean(flow.barber?.id) &&
          !(flow.usesBarberAvailabilityApi && flow.availabilityScope === "all_branches");
        const slotsBusy =
          flow.slotsLoading &&
          (flow.usesBarberAvailabilityApi
            ? flow.multiBranchSlots.length === 0
            : flow.slots.length === 0);
        const useMultiSlots =
          flow.usesBarberAvailabilityApi &&
          flow.availabilityScope === "all_branches";

        return (
          <div className={useMultiSlots ? "bg-[var(--booking-bg)] min-h-full" : "bg-[#0a0a0a] min-h-full"}>
            {renderMutationBanner()}
            {showBranchBanner && (
              <div
                className="mx-5 md:mx-6 mt-4 mb-1 rounded-2xl border-2 border-[#D4AF37]/45 bg-black px-4 py-3.5 shadow-[inset_0_0_0_1px_rgba(212,175,55,0.12)]"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-black font-black"
                    style={{ backgroundColor: bannerAccent.swatch }}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold tracking-wide text-white/55 mb-0.5">
                      {t("time.barberLocationLabel")}
                      {dateLabel ? ` · ${dateLabel}` : ""}
                    </p>
                    {flow.dayLocation && !flow.dayLocation.isWorking ? (
                      <p className="text-sm font-bold text-amber-300">
                        {t("time.barberNotWorking", { name: displayBarberName })}
                      </p>
                    ) : bannerName ? (
                      <>
                        <p className="text-base md:text-lg font-heading font-black leading-snug text-white">
                          {t("time.barberAtBranch", {
                            name: displayBarberName,
                            branch: branchAccentLabel(bannerAccent.key),
                          })}
                        </p>
                        <p className="text-sm font-semibold text-[#D4AF37] mt-1 flex items-center gap-2 flex-wrap">
                          <span>{bannerName}</span>
                          {flow.dayLocationLoading && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/45">
                              <Loader2 className="w-3 h-3 animate-spin text-[#D4AF37]" />
                              {t("time.confirming")}
                            </span>
                          )}
                        </p>
                        {locBranch?.address && (
                          <p className="text-xs text-white/55 mt-0.5 leading-relaxed">
                            {locBranch.address}
                          </p>
                        )}
                      </>
                    ) : flow.dayLocationError ? (
                      <p className="text-sm font-medium text-white/70">
                        {t("time.locationError")}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-white/70 flex items-center gap-2">
                        {flow.dayLocationLoading && (
                          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                        )}
                        {t("time.checkingBranch", { name: displayBarberName })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {flow.slotsError && (
              <p className={`px-6 pt-4 text-sm ${useMultiSlots ? "text-red-600" : "text-red-400"}`} aria-live="assertive">
                {resolveError(flow.slotsError)}
              </p>
            )}
            {useMultiSlots ? (
              <BookingMultiBranchTimeSlots
                slots={flow.multiBranchSlots}
                selectedSlot={flow.selectedSlot as BarberAvailableSlot | undefined}
                onSelect={(slot) => flow.selectSlot(slot)}
                isLoading={slotsBusy}
                branchFilter={flow.selectedBranchFilter}
                onBranchFilterChange={flow.setSelectedBranchFilter}
                allowedBranches={allowedBranches}
                partialWarning={Boolean(flow.multiBranchSlotsMeta?.partial)}
              />
            ) : (
              <BookingTimeSlots
                selectedTime={flow.selectedSlot?.time}
                selectedSlot={flow.selectedSlot}
                onTimeSelect={flow.selectSlot}
                onNextDay={() => {
                  const current = flow.selectedDate ?? new Date();
                  const next = new Date(current);
                  next.setDate(next.getDate() + 1);
                  flow.selectDate(next);
                }}
                onSwitchToNearest={
                  flow.mode === "specific" && !flow.usesBarberAvailabilityApi
                    ? () => {
                        flow.selectMode("nearest");
                        flow.setStep("date");
                      }
                    : undefined
                }
                slots={
                  flow.usesBarberAvailabilityApi ? flow.multiBranchSlots : flow.slots
                }
                isLoading={slotsBusy}
              />
            )}
            <BookingNavFooter onBack={handleBack} backLabel={t("actions.backToDate")} />
          </div>
        );
      }

      case "details":
        return (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="p-6 flex-1">
              <h3 className="text-xl font-heading font-bold text-cut-black mb-4">{t("details.title")}</h3>
              {renderMutationBanner()}
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-medium text-cut-black/70 mb-1" htmlFor="bk-phone">
                    {t("details.phone")}
                  </label>
                  <div className="relative">
                    <input
                      id="bk-phone"
                      type="tel"
                      value={flow.customerPhone}
                      onChange={(e) => flow.setCustomerPhone(e.target.value)}
                      placeholder={t("details.phonePlaceholder")}
                      className="cut-input ps-10"
                      dir="ltr"
                      autoComplete="tel"
                    />
                    {lookupStatus === "loading" && (
                      <Loader2 className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cut-gold animate-spin" />
                    )}
                    {lookupStatus === "found" && (
                      <UserCheck className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                </div>

                {lookupStatus === "found" && lookedUpName && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-emerald-800 text-sm font-medium">
                      {t("details.welcomeBack", { name: lookedUpName })}
                    </span>
                  </div>
                )}
                {lookupStatus === "new" && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cut-gold/10 border border-cut-gold/25">
                    <AlertCircle className="w-4 h-4 text-cut-gold flex-shrink-0" />
                    <span className="text-cut-black/80 text-sm">{t("details.newCustomer")}</span>
                  </div>
                )}

                {/* Name: auto-filled when found; editable otherwise once phone is long enough */}
                {(lookupStatus === "found" ||
                  lookupStatus === "new" ||
                  flow.customerPhone.replace(/\D/g, "").length >= 8) && (
                  <div>
                    <label className="block text-xs font-medium text-cut-black/70 mb-1" htmlFor="bk-name">
                      {t("details.name")}
                    </label>
                    <input
                      id="bk-name"
                      type="text"
                      value={flow.customerName}
                      onChange={(e) => flow.setCustomerName(e.target.value)}
                      placeholder={t("details.namePlaceholder")}
                      readOnly={lookupStatus === "found"}
                      className={
                        lookupStatus === "found"
                          ? "cut-input bg-emerald-50/60 border-emerald-200 cursor-default"
                          : "cut-input"
                      }
                      autoComplete="name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-cut-black/70 mb-1" htmlFor="bk-notes">
                    {t("details.notes")}
                  </label>
                  <input
                    id="bk-notes"
                    type="text"
                    value={flow.notes}
                    onChange={(e) => flow.setNotes(e.target.value)}
                    className="cut-input"
                  />
                </div>
              </div>
              <div className="bg-cut-black/[0.04] rounded-xl p-4 mb-4 border border-cut-gold/15 space-y-2 text-sm">
                {displayBranchName && (
                  <div className="flex justify-between items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md border ${branchAccent.chip} ${branchAccent.chipText}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${branchAccent.dot}`} aria-hidden />
                      {displayBranchName}
                    </span>
                    <span className="text-cut-black/50 text-xs">{t("branch.label")}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3 items-start">
                  <SelectedServicesBilingual services={selectedServices} />
                  <span className="text-cut-black/50 text-xs flex-shrink-0">{t("details.services")}</span>
                </div>
                {flow.selectedDate && (
                  <div className="flex justify-between">
                    <span>{format.date(flow.selectedDate)}</span>
                    <span className="text-cut-black/50 text-xs">{t("details.date")}</span>
                  </div>
                )}
                {flow.selectedSlot && (
                  <div className="flex justify-between">
                    <span>
                      {format.time(flow.selectedSlot.time)}
                      {flow.selectedSlot.dayOffset === 1
                        ? ` — ${t("overnight.afterMidnight")}`
                        : ""}
                    </span>
                    <span className="text-cut-black/50 text-xs">{t("details.time")}</span>
                  </div>
                )}
                <p className="text-[11px] text-cut-black/45 pt-1">
                  {t("details.planPriceHint")}
                </p>
              </div>
            </div>
            <BookingNavFooter
              onBack={handleBack}
              onContinue={() => void flow.requestPlan()}
              continueLabel={t("actions.continueToReview")}
              continueDisabled={!canPlan}
            />
          </div>
        );

      case "review": {
        const p = flow.plan;
        return (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="p-6 flex-1">
              <h3 className="text-xl font-heading font-bold text-cut-black mb-1">{t("review.title")}</h3>
              <p className="text-cut-black/50 text-xs mb-4">
                {t("review.subtitle")}
              </p>
              {renderMutationBanner()}
              <div className="bg-cut-black/[0.04] rounded-xl p-5 mb-4 border border-cut-gold/15 space-y-2.5 text-sm">
                <div className="flex justify-between items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md border ${branchAccent.chip} ${branchAccent.chipText}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${branchAccent.dot}`} aria-hidden />
                    {p?.branchName ?? displayBranchName}
                  </span>
                  <span className="text-cut-black/50 text-xs">{t("branch.label")}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {isNearestMode
                      ? resolveBarberDisplayName(
                          {
                            nameAr: p?.plan?.[0]?.empName,
                            nameEn: p?.plan?.[0]?.empNameEn,
                          },
                          lang,
                        ) || t("review.barberPending")
                      : displayBarberName ||
                        resolveBarberDisplayName(
                          {
                            nameAr: p?.plan?.[0]?.empName,
                            nameEn: p?.plan?.[0]?.empNameEn,
                          },
                          lang,
                        )}
                  </span>
                  <span className="text-cut-black/50 text-xs">{t("review.barber")}</span>
                </div>
                {(p?.plan ?? []).map((item) => (
                  <div key={`${item.serviceId}-${item.startTime}`} className="flex justify-between text-xs">
                    <span>
                      {item.serviceName} · {format.time(item.startTime)}
                    </span>
                    <span>
                      {format.price(item.price)} · {format.duration(item.durationMinutes)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-cut-gold/15">
                  <span className="font-bold text-cut-gold">
                    {p?.totalPrice != null ? format.price(p.totalPrice) : "—"}
                  </span>
                  <span className="text-cut-black/50 text-xs">{t("review.totalFinal")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">
                    {p?.totalDurationMinutes != null
                      ? format.duration(p.totalDurationMinutes)
                      : "—"}
                  </span>
                  <span className="text-cut-black/50 text-xs">{t("review.durationFinal")}</span>
                </div>
                <div className="flex justify-between">
                  <span>{flow.customerName.trim()}</span>
                  <span className="text-cut-black/50 text-xs">{t("review.name")}</span>
                </div>
                <div className="flex justify-between" dir="ltr">
                  <span>{flow.customerPhone.trim()}</span>
                  <span className="text-cut-black/50 text-xs" dir={dir}>
                    {t("review.phone")}
                  </span>
                </div>
              </div>
            </div>
            <BookingNavFooter
              onBack={handleBack}
              backLabel={t("actions.editSelections")}
              onContinue={() => void flow.confirmCreate()}
              continueLabel={t("actions.confirmBooking")}
              continueDisabled={
                flow.mutationUi.kind === "creating" ||
                (flow.mutationUi.kind === "rate_limited" &&
                  flow.rateLimitRemainingSeconds > 0)
              }
              continueLoading={flow.mutationUi.kind === "creating"}
            />
          </div>
        );
      }

      case "success": {
        const booking = flow.created;
        // Always prefer create response; fall back to in-flow selection so nearest
        // mode never lands on an empty summary if wire normalize is partial.
        const confirmedBranch =
          (booking?.branchName || "").trim() || displayBranchName || "";
        const confirmedBranchAccent = getBranchAccent(
          displayBranchCode,
          confirmedBranch,
        );
        const confirmedBarber =
          (booking?.barberName || "").trim() ||
          (flow.selectedSlot?.barberName || "").trim() ||
          (isNearestMode ? t("header.nearestBarber") : displayBarberName) ||
          "";
        const confirmedDateRaw = (booking?.date || "").trim();
        const confirmedDateParts = resolveConfirmationDate(
          confirmedDateRaw,
          flow.selectedDate,
        );
        const confirmedTimeRaw =
          (booking?.time || "").trim() || flow.selectedSlot?.time || "";
        const confirmedTime = confirmedTimeRaw
          ? format.time(confirmedTimeRaw)
          : "—";
        const confirmedServices = (
          booking?.services?.map((s) => String(s || "").trim()).filter(Boolean) ??
          []
        ).length
          ? booking!.services!.map((s) => String(s || "").trim()).filter(Boolean)
          : selectedServices.map((s) =>
              lang === "en"
                ? s.nameEn || s.nameAr || s.name
                : s.nameAr || s.nameEn || s.name,
            ).filter(Boolean);
        const confirmedTotal =
          booking?.totalPrice ??
          flow.catalogPrice ??
          (selectedServices.reduce((sum, s) => sum + (s.price || 0), 0) || null);

        return (
          <div className="p-5 md:p-6">
            {/* Success banner */}
            <div className="rounded-2xl bg-[#0a0a0a] text-cut-ivory px-5 py-5 mb-4 text-center border border-[#D4AF37]/30 shadow-[0_0_24px_rgba(212,175,55,0.12)]">
              <div className="w-14 h-14 rounded-full bg-[#D4AF37] flex items-center justify-center mx-auto mb-3 shadow-[0_0_24px_rgba(212,175,55,0.45)]">
                <Check className="w-7 h-7 text-black" strokeWidth={3} />
              </div>
              <h3 className="text-xl md:text-2xl font-heading font-black text-[#D4AF37] mb-1">
                {t("success.title")}
              </h3>
              <p className="text-white/65 text-xs md:text-sm">
                {t("success.subtitle")}
              </p>
              {booking?.bookingCode && (
                <div className="mt-4 inline-flex flex-col sm:flex-row items-center gap-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-3 py-2">
                  <span className="text-white/55 text-[11px]">{t("success.bookingCode")}</span>
                  <span className="font-mono font-bold text-[#D4AF37] tracking-wide text-sm">
                    {booking.bookingCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyCode(booking.bookingCode)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#D4AF37] text-black text-[11px] font-bold hover:bg-[#C4A030]"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? t("actions.copied") : t("actions.copy")}
                  </button>
                </div>
              )}
            </div>

            {/* Key confirmation details — classic black + yellow */}
            <div
              className="rounded-2xl bg-[#0a0a0a] border border-[#D4AF37]/20 overflow-hidden mb-4"
              role="status"
              aria-live="polite"
              aria-label={t("success.confirmationDetailsAria")}
            >
              <div className="px-4 py-2.5 border-b border-[#D4AF37]/15 bg-[#D4AF37]/[0.06]">
                <p className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase text-center">
                  {t("success.summary")}
                </p>
              </div>

              <div className="divide-y divide-[#D4AF37]/15">
                {/* Branch */}
                <div className="flex items-start gap-3 px-4 py-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${confirmedBranchAccent.softBg}`}
                  >
                    <MapPin className={`w-5 h-5 ${confirmedBranchAccent.icon}`} />
                  </div>
                  <div className="min-w-0 flex-1 text-start">
                    <p className="text-white/45 text-[11px] mb-1">{t("branch.label")}</p>
                    <p
                      className={`inline-flex items-center gap-1.5 text-base font-bold px-2.5 py-1 rounded-lg border ${confirmedBranchAccent.chip} ${confirmedBranchAccent.chipText}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${confirmedBranchAccent.dot}`}
                        aria-hidden
                      />
                      {confirmedBranch || "—"}
                    </p>
                  </div>
                </div>

                {/* Barber */}
                <div className="flex items-start gap-3 px-4 py-4">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
                    <Scissors className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="min-w-0 flex-1 text-start">
                    <p className="text-white/45 text-[11px] mb-1">{t("success.craftsman")}</p>
                    <p className="text-white text-lg font-heading font-bold leading-snug">
                      {confirmedBarber || "—"}
                    </p>
                  </div>
                </div>

                {/* Day + Date + Time grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-[#D4AF37]/15">
                  <div className="flex items-start gap-3 px-4 py-4">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div className="min-w-0 flex-1 text-start">
                      <p className="text-white/45 text-[11px] mb-1">{t("success.dayAndDate")}</p>
                      {confirmedDateParts.weekday ? (
                        <>
                          <p className="text-white text-lg font-heading font-bold leading-snug">
                            {confirmedDateParts.weekday}
                          </p>
                          <p className="text-white/80 text-sm mt-0.5 font-medium">
                            {confirmedDateParts.dateLine}
                          </p>
                        </>
                      ) : (
                        <p className="text-white text-base font-bold">
                          {confirmedDateParts.full}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-4">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div className="min-w-0 flex-1 text-start">
                      <p className="text-white/45 text-[11px] mb-1">{t("success.clock")}</p>
                      <p className="text-[#D4AF37] text-2xl font-heading font-black tabular-nums leading-none tracking-tight">
                        {confirmedTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary details */}
            {(confirmedServices.length > 0 || confirmedTotal != null) && (
              <div className="rounded-xl border border-cut-gold/20 bg-white px-4 py-3 mb-4 space-y-2 text-sm">
                {confirmedServices.length > 0 && (
                  <div className="flex justify-between gap-3 items-start">
                    <span className="font-semibold text-cut-black text-start">
                      {confirmedServices.join(" + ")}
                    </span>
                    <span className="text-cut-black/45 text-xs shrink-0">{t("success.services")}</span>
                  </div>
                )}
                {confirmedTotal != null && (
                  <div className="flex justify-between gap-3 items-center border-t border-cut-black/5 pt-2">
                    <span className="text-cut-gold font-black text-base">
                      {format.price(confirmedTotal)}
                    </span>
                    <span className="text-cut-black/45 text-xs shrink-0">{t("success.total")}</span>
                  </div>
                )}
              </div>
            )}

            {booking?.message && (
              <p className="text-cut-black/60 text-xs mb-4 text-center">{booking.message}</p>
            )}

            <div className="flex flex-col gap-2">
              {booking?.bookingCode && (
                <a
                  href={`/booking?code=${encodeURIComponent(booking.bookingCode)}`}
                  className="w-full py-3 rounded-xl border border-cut-gold/30 text-cut-black font-bold text-center"
                >
                  {t("success.viewDetails")}
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setConfettiTrigger((p) => p + 1);
                  setTimeout(handleClose, 400);
                }}
                className="w-full py-3.5 rounded-xl bg-[#D4AF37] text-black font-bold text-base hover:bg-[#C4A030] shadow-md shadow-[#D4AF37]/25"
              >
                {t("actions.doneThanks")}
              </button>
            </div>
          </div>
        );
      }
    }
  };

  const activeStepId = stepForHeader(flow.step);
  const headerSteps = steps;

  return (
    <>
      <ConfettiBurst trigger={confettiTrigger} particleCount={55} />
      <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
        <DialogContent
          hideDefaultClose
          className="max-w-4xl w-[95vw] max-h-[92vh] p-0 bg-[var(--booking-bg)] border border-[#D4AF37]/25 overflow-hidden gap-0 rounded-2xl shadow-2xl booking-modal-shell"
          dir={dir}
          lang={lang}
        >
          <VisuallyHidden>
            <DialogTitle>
              {isNearestMode
                ? t("header.bookNearest")
                : t("header.bookWith", { name: barber.name })}
            </DialogTitle>
          </VisuallyHidden>
          <DialogDescription className="sr-only">
            {t("header.dialogDescription")}
          </DialogDescription>

          <BookingStepHeader
            steps={headerSteps}
            currentStep={activeStepId}
            barberName={displayBarberName}
            onClose={handleClose}
            nearest={isNearestMode}
          />

          <div
            className="flex flex-col md:flex-row overflow-hidden"
            style={{ maxHeight: "calc(92vh - 130px)" }}
          >
            <div className="hidden md:block w-72 flex-shrink-0 border-e border-cut-gold/15 overflow-y-auto">
              <BookingInfoPanel
                barber={{ ...barber, name: sidebarBarberName }}
                selectedDate={flow.selectedDate}
                selectedTime={flow.selectedSlot?.time}
                service={
                  selectedServices.length > 0 ? (
                    <SelectedServicesBilingual services={selectedServices} dark />
                  ) : undefined
                }
                servicePrice={
                  flow.plan?.totalPrice ??
                  (flow.catalogPrice || undefined)
                }
                serviceDuration={
                  flow.plan?.totalDurationMinutes ??
                  (flow.catalogDuration || undefined)
                }
                mode={flow.mode}
                branchName={displayBranchName}
                branchCode={displayBranchCode}
              />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div
                className={`flex-1 bg-[var(--booking-bg)] ${
                  flow.step === "service"
                    ? "flex flex-col min-h-0 overflow-hidden"
                    : "overflow-y-auto"
                }`}
              >
                {flow.step !== "service" &&
                  flow.step !== "success" &&
                  flow.step !== "branch" &&
                  (flow.serviceIds.length > 0 || flow.selectedDate || flow.selectedSlot) && (
                    <div className="md:hidden bg-cut-black/[0.04] px-4 py-2.5 border-b border-cut-gold/10 flex-shrink-0">
                      <div className="flex items-center gap-2 text-xs">
                        {selectedServices.length > 0 && (
                          <SelectedServicesBilingual services={selectedServices} compact />
                        )}
                        {flow.selectedDate && (
                          <span className="text-cut-black/70">
                            {format.shortDate(flow.selectedDate)}
                          </span>
                        )}
                        {flow.selectedSlot && (
                          <span className="text-cut-black/70 font-medium">
                            {format.time(flow.selectedSlot.time)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleBack}
                          className="ms-auto text-cut-gold font-medium flex items-center gap-1"
                        >
                          <BackIcon className="w-3 h-3" />
                          {t("actions.edit")}
                        </button>
                      </div>
                    </div>
                  )}
                {renderContent()}
              </div>
            </div>
          </div>

          <div className="md:hidden flex-shrink-0 border-t border-cut-gold/10 bg-cut-black px-4 py-3 safe-area-pb">
            <div className="flex items-center gap-3">
              {isNearestMode ? (
                <div className="w-9 h-9 rounded-full bg-cut-gold/10 flex items-center justify-center border border-cut-gold/30 flex-shrink-0">
                  <Zap className="w-4 h-4 text-cut-gold" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full overflow-hidden border border-cut-gold/30 flex-shrink-0">
                  <BarberPhoto
                    src={barber.image}
                    name={barber.name}
                    imgClassName="w-full h-full object-cover object-top"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-cut-ivory text-sm leading-none">{displayBarberName}</p>
                <p className="text-cut-ivory/50 text-xs mt-0.5">
                  {isNearestMode
                    ? t("header.nearestBarber")
                    : barber.specialty || barber.role || t("header.professionalBarber")}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingModal;
export type { BookingMode };
