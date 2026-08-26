"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format as formatDateFns } from "date-fns";
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
  MapPin,
} from "lucide-react";
import ConfettiBurst from "./ConfettiBurst";
import BookingStepHeader from "./BookingStepHeader";
import { BookingNavFooter } from "./BookingNavFooter";
import BookingInfoPanel from "./BookingInfoPanel";
import BookingCalendar from "./BookingCalendar";
import BookingTimeSlots from "./BookingTimeSlots";
import BookingMultiBranchTimeSlots from "./BookingMultiBranchTimeSlots";
import BookingAvailabilityScopeStep from "./BookingAvailabilityScope";
import BookingAvailabilityScopeLoading from "./BookingAvailabilityScopeLoading";
import BookingServiceSelect from "./BookingServiceSelect";
import BookingReviewStep from "./BookingReviewStep";
import BookingSuccessStep from "./BookingSuccessStep";
import BranchPicker from "./BranchPicker";
import CrossBranchSlotsPanel from "@/components/CrossBranchSlotsPanel";
import BarberPhoto from "./BarberPhoto";
import { BookDelayedWaitingOverlay } from "@/components/book/BookDelayedWaitingOverlay";
import { useBranch } from "@/context/BranchContext";
import { getCoreServiceIdSet } from "@/lib/bookingServiceGroups";
import { useBookingFlow, type BookingUiStep } from "@/hooks/useBookingFlow";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import { saveClient } from "@/lib/clientStorage";
import { lookupClientByMobile } from "@/lib/clientWebsiteApi";
import { getBranchAccent } from "@/lib/branchTheme";
import { saveBookFlowConfirmation } from "@/lib/book-flow-confirmation";
import { clearBookFlowDraft } from "@/lib/book-flow-draft";
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
  bookingPerfMark,
  type PublicBranch,
  type BookingMode,
  type BookingEntryMode,
  type BookingService,
  type PublicBookingErrorCode,
  type BookingStepId,
  type BarberAvailabilityScope,
  type BarberAvailableSlot,
  type BarberProfileSeed,
} from "@/lib/booking-api";
import { BookingPricePromoProvider } from "@/context/BookingPricePromoContext";
import BookingPromoPrice from "@/components/booking/BookingPromoPrice";
import { formatStaleSlotNotice } from "@/lib/bookingV2/recoverStaleSlot";

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
}: {
  services: BookingService[];
  compact?: boolean;
  /** @deprecated Sidebar is white in Phase 1D; kept for call-site compat. */
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
              className={`font-heading font-bold leading-tight text-[var(--booking-text)] ${
                compact ? "text-xs" : "text-sm"
              }`}
              lang={primaryLang}
              dir={primaryLang === "ar" ? "rtl" : "ltr"}
            >
              {primary}
            </p>
            {secondary ? (
              <p
                className="font-editorial leading-snug tracking-wide text-[var(--booking-text-secondary)] text-[13px]"
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
  /** Optional discovery seed — language-neutral branch codes. */
  publicBranches?: { branchCode: string; branchName: string }[];
  serviceIds?: number[];
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
  /** Lightweight profile seed from discovery / prefetch. */
  profileSeed?: BarberProfileSeed | null;
  /** Prefill from /book/phone lookup. */
  initialCustomerPhone?: string;
  initialCustomerName?: string;
  /** Prefill date + slot from /book/time; jumps to details. */
  initialAppointment?: {
    date: string;
    time: string;
    empId?: number | null;
    dayOffset?: number | null;
    branchCode?: string | null;
    branchName?: string | null;
    barberName?: string | null;
  };
  /** Redirect to /book/confirmed after successful create. */
  fromBookFlow?: boolean;
  /**
   * dialog = overlay modal (homepage / campaigns).
   * page = full-viewport in-route flow (e.g. /book/with/[empId]).
   */
  presentation?: "dialog" | "page";
}

function stepForHeader(step: BookingUiStep): string {
  if (step === "success") return "review";
  return step;
}

function isReviewOrSuccess(step: BookingUiStep): boolean {
  return step === "review" || step === "success";
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
  profileSeed = null,
  initialCustomerPhone,
  initialCustomerName,
  initialAppointment,
  fromBookFlow = false,
  presentation = "dialog",
}: BookingModalProps) => {
  const isPagePresentation = presentation === "page";
  const { lang, dir, t, format } = useBookingTranslations();
  const router = useRouter();
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
    profileSeed:
      profileSeed ??
      (hasBarberEmpId && barber.publicBranches
        ? {
            empId: barber.id!,
            displayName: barber.name,
            image: barber.image,
            publicBranches: barber.publicBranches,
            serviceIds: barber.serviceIds,
          }
        : null),
  });

  useEffect(() => {
    if (open) {
      bookingPerfMark("modal_mounted", {
        empId: hasBarberEmpId ? barber.id : undefined,
      });
    }
  }, [open, hasBarberEmpId, barber.id]);

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
      allowedBranches.length > 1 ||
      (flow.barberProfileLoading &&
        (profileSeed?.publicBranches?.length ?? barber.publicBranches?.length ?? 0) > 1));

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

  // Notify campaign layer when modal blocks the page.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("cut:blocking-overlay", { detail: { open } }),
    );
  }, [open]);
// test
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
        const data = await lookupClientByMobile(digits, {
          signal: controller.signal,
        });
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

  // Celebrate once when create lands on success (standalone modal path).
  useEffect(() => {
    if (!open || flow.step !== "success") return;
    if (fromBookFlow) return;
    setConfettiTrigger((p) => p + 1);
  }, [open, flow.step, fromBookFlow]);

  // Book-flow path: persist confirmation and open dedicated success page.
  useEffect(() => {
    if (!open || !fromBookFlow || flow.step !== "success" || !flow.created) return;

    const booking = flow.created;
    const date =
      (booking.date || "").trim() ||
      (flow.selectedDate ? formatDateFns(flow.selectedDate, "yyyy-MM-dd") : "");
    const time = (booking.time || "").trim() || flow.selectedSlot?.time || "";
    const branchName =
      (booking.branchName || "").trim() ||
      (flow.bookingBranchName || "").trim() ||
      (selectedBranch?.shortName || selectedBranch?.branchName || "").trim() ||
      "";

    if (!date || !time || !branchName) return;

    saveBookFlowConfirmation({
      customerName: (flow.customerName || "").trim(),
      date,
      time,
      branchName,
      branchCode: booking.branchCode || flow.bookingBranchCode || selectedBranch?.branchCode || null,
      barberName:
        (booking.barberName || "").trim() ||
        (flow.selectedSlot?.barberName || "").trim() ||
        null,
      bookingCode: booking.bookingCode || null,
    });
    clearBookFlowDraft();

    const timer = window.setTimeout(() => {
      onOpenChange(false);
      router.push("/book/confirmed");
    }, 280);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fromBookFlow, flow.step, flow.created]);

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
  // When initialAppointment is set (book-flow time step), skip date/time UI.
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
    if (!matched.length) return;

    flow.selectServices(matched);

    const appt = initialAppointment;
    if (appt?.date && appt?.time) {
      const [y, m, d] = appt.date.split("-").map(Number);
      const date = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
      flow.selectDate(date);
      flow.selectSlot({
        time: appt.time,
        available: true,
        empId: appt.empId ?? null,
        dayOffset: appt.dayOffset ?? 0,
        branchCode: appt.branchCode ?? null,
        branchName: appt.branchName ?? null,
        barberName: appt.barberName ?? null,
        date: appt.date,
      });
    } else {
      flow.setStep("date");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialServiceIds, initialServiceMatches, initialAppointment, flow.services]);

  // Prefill customer from book-flow phone step.
  useEffect(() => {
    if (!open) return;
    const phone = (initialCustomerPhone ?? "").replace(/\D/g, "");
    if (phone.length >= 8 && !flow.customerPhone) {
      flow.setCustomerPhone(phone);
    }
    const name = (initialCustomerName ?? "").trim();
    if (name && !flow.customerName.trim()) {
      flow.setCustomerName(name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialCustomerPhone, initialCustomerName]);

  // Enter after branch when draft is valid and still on branch step (single / non-multi).
  useEffect(() => {
    if (!open) return;
    if (!effectiveBranch.branchCode || flow.step !== "branch") return;
    if (isBarberFirst && branchResolution.resolution === "none") return;
    if (multiBranchBarber) return;
    flow.setStep(effectiveInitialMode || isBarberFirst ? "date" : "mode");
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
    flow.setStep(effectiveInitialMode || isBarberFirst ? "date" : "mode");
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
    if (flow.mutationUi.kind === "idle") {
      if (!flow.staleSlotNotice) return null;
      return (
        <div
          className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm text-center"
          role="status"
        >
          {formatStaleSlotNotice(lang, flow.staleSlotNotice)}
        </div>
      );
    }
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
      const profileBusy =
        flow.barberProfileStatus === "loading" ||
        flow.barberProfileStatus === "slow_loading";
      const profileError = flow.barberProfileStatus === "request_error";
      const waitingForMulti =
        profileBusy &&
        allowedBranches.length <= 1 &&
        (profileSeed?.publicBranches?.length ?? barber.publicBranches?.length ?? 0) <= 1;

      if (profileError && allowedBranches.length === 0) {
        return (
          <BookingAvailabilityScopeLoading
            barberName={barber.name}
            error
            onRetry={() => flow.retryBarberProfile()}
            onChooseAnotherBarber={handleClose}
          />
        );
      }

      if (waitingForMulti) {
        return (
          <BookingAvailabilityScopeLoading
            barberName={barber.name}
            slow={flow.barberProfileStatus === "slow_loading"}
            showRetry={flow.barberProfileShowRetry}
            onRetry={() => flow.retryBarberProfile()}
            onBack={visibleStepIds[0] === "appointment_scope" ? undefined : handleBack}
          />
        );
      }

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
            <p className="text-cut-black/50 text-xs" aria-live="polite">
              {flow.barberProfileStatus === "slow_loading"
                ? t("branch.loadingSlow", { name: barber.name })
                : flow.barberProfileStatus === "loading"
                  ? t("branch.loadingShort")
                  : isBarberFirst
                    ? t("branch.subtitleBarberFirst")
                    : t("branch.subtitle")}
            </p>
            {flow.barberProfileStaleWarning ? (
              <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                {t("branch.staleWarning")}
              </p>
            ) : null}
          </div>
          {(flow.barberProfileError || branchesError) &&
            flow.barberProfileStatus === "request_error" &&
            allowedBranches.length === 0 && (
            <div
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center space-y-3"
              role="alert"
            >
              <p className="font-bold">{t("branch.loadFailedTitle", { name: barber.name })}</p>
              <p>{t("branch.loadFailedBody")}</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => flow.retryBarberProfile()}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 text-xs font-bold hover:bg-red-50 transition-colors"
                >
                  {t("actions.retry")}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 text-xs font-bold hover:bg-red-50 transition-colors"
                >
                  {t("branch.chooseAnotherBarber")}
                </button>
              </div>
            </div>
          )}
          {(flow.barberProfileError || branchesError) &&
            !(flow.barberProfileStatus === "request_error" && allowedBranches.length === 0) && (
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
          <BranchPicker
            branches={allowedBranches}
            selectedBranchCode={selectedCode ?? undefined}
            isLoading={
              isLoadingBranches ||
              (isBarberFirst &&
                (flow.barberProfileStatus === "loading" ||
                  flow.barberProfileStatus === "slow_loading") &&
                allowedBranches.length === 0)
            }
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
          {(flow.barberProfileStatus === "loading" ||
            flow.barberProfileStatus === "slow_loading") &&
            flow.barberProfileShowRetry && (
              <button
                type="button"
                onClick={() => flow.retryBarberProfile()}
                className="mt-3 w-full py-3 rounded-xl border border-[var(--booking-border)] text-sm font-bold"
              >
                {t("actions.retry")}
              </button>
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
              categories={flow.serviceCategories}
              mostPopular={flow.serviceMostPopular}
              selectedIds={flow.serviceIds}
              onCoreSelect={handleCoreServiceSelect}
              onToggleService={handleToggleService}
              isLoading={flow.catalogLoading}
              isError={Boolean(flow.catalogError) && flow.services.length === 0}
              totalPrice={flow.catalogPrice}
              totalDuration={flow.catalogDuration}
              selectedCount={selectedServices.length}
              onContinue={() => {
                if (flow.mode === "specific" && flow.barber?.id == null) return;
                if (isBarberFirst && flow.selectedDate) {
                  // Date already chosen — load times for the selected services.
                  flow.setStep("time");
                  return;
                }
                flow.goToSlotsStep();
              }}
            />
            <BookingNavFooter
              onBack={visibleStepIds[0] === "service" ? undefined : handleBack}
            />
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
            <BookingNavFooter
              onBack={visibleStepIds[0] === "date" ? undefined : handleBack}
              backLabel={
                visibleStepIds.indexOf("service") >= 0 &&
                visibleStepIds.indexOf("date") > visibleStepIds.indexOf("service")
                  ? t("actions.backToServices")
                  : undefined
              }
            />
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
          <div className="bg-[var(--booking-bg)] min-h-full" data-booking-surface="time">
            {renderMutationBanner()}
            {showBranchBanner && (
              <div
                className="mx-5 md:mx-6 mt-4 mb-1 rounded-2xl border border-[var(--booking-border)] bg-[var(--booking-bg)] px-4 py-3.5"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-[var(--booking-border-subtle)]"
                    style={{ backgroundColor: bannerAccent.swatch + "22" }}
                  >
                    <MapPin className={`w-5 h-5 ${bannerAccent.icon}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold tracking-wide text-[var(--booking-text-secondary)] mb-0.5">
                      {t("time.barberLocationLabel")}
                      {dateLabel ? ` · ${dateLabel}` : ""}
                    </p>
                    {flow.dayLocation && !flow.dayLocation.isWorking ? (
                      <p className="text-sm font-bold text-amber-800">
                        {t("time.barberNotWorking", { name: displayBarberName })}
                      </p>
                    ) : bannerName ? (
                      <>
                        <p className="text-base md:text-lg font-heading font-bold leading-snug text-[var(--booking-text)]">
                          {t("time.barberAtBranch", {
                            name: displayBarberName,
                            branch: branchAccentLabel(bannerAccent.key),
                          })}
                        </p>
                        <p className="text-sm font-semibold text-[var(--booking-text)] mt-1 flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-sm ${bannerAccent.chip} ${bannerAccent.chipText}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${bannerAccent.dot}`} aria-hidden />
                            {bannerName}
                          </span>
                          {flow.dayLocationLoading && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--booking-text-muted)]">
                              <Loader2 className="w-3 h-3 animate-spin text-[var(--booking-accent)]" />
                              {t("time.confirming")}
                            </span>
                          )}
                        </p>
                        {locBranch?.address && (
                          <p className="text-xs text-[var(--booking-text-secondary)] mt-0.5 leading-relaxed">
                            {locBranch.address}
                          </p>
                        )}
                      </>
                    ) : flow.dayLocationError ? (
                      <p className="text-sm font-medium text-[var(--booking-text-secondary)]">
                        {t("time.locationError")}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-[var(--booking-text-secondary)] flex items-center gap-2">
                        {flow.dayLocationLoading && (
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--booking-accent)]" />
                        )}
                        {t("time.checkingBranch", { name: displayBarberName })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {flow.slotsError && (
              <p className="px-6 pt-4 text-sm text-red-600" aria-live="assertive">
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
            <BookingNavFooter
              onBack={handleBack}
              backLabel={
                isBarberFirst ? t("actions.backToServices") : t("actions.backToDate")
              }
            />
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
        const serviceLines =
          (p?.plan ?? []).length > 0
            ? (p!.plan ?? []).map((item) => ({
                name: item.serviceName,
                durationLabel: format.duration(item.durationMinutes),
              }))
            : selectedServices.map((s) => ({
                name:
                  lang === "en"
                    ? s.nameEn || s.nameAr || s.name
                    : s.nameAr || s.nameEn || s.name,
                durationLabel: s.durationMinutes
                  ? format.duration(s.durationMinutes)
                  : undefined,
              }));
        const barberLabel = isNearestMode
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
            );
        const appointmentDate = flow.selectedDate
          ? format.date(flow.selectedDate)
          : "—";
        const appointmentTime = flow.selectedSlot?.time
          ? format.time(flow.selectedSlot.time)
          : p?.plan?.[0]?.startTime
            ? format.time(p.plan[0].startTime)
            : "—";

        return (
          <BookingReviewStep
            branchName={p?.branchName ?? displayBranchName}
            branchBadge={
              <span
                className={`inline-flex items-center gap-1.5 text-sm font-bold px-2 py-0.5 rounded-md border ${branchAccent.chip} ${branchAccent.chipText}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${branchAccent.dot}`} aria-hidden />
                {p?.branchName ?? displayBranchName}
              </span>
            }
            barberName={barberLabel || "—"}
            serviceLines={serviceLines.length ? serviceLines : [{ name: "—" }]}
            appointmentDateLabel={appointmentDate}
            appointmentTimeLabel={appointmentTime}
            customerName={flow.customerName.trim()}
            customerPhone={flow.customerPhone.trim()}
            totalDurationLabel={
              p?.totalDurationMinutes != null
                ? format.duration(p.totalDurationMinutes)
                : "—"
            }
            totalPriceLabel={
              p?.totalPrice != null ? (
                <BookingPromoPrice amount={p.totalPrice} formatPrice={format.price} />
              ) : (
                "—"
              )
            }
            mutationBanner={renderMutationBanner()}
            onEditBranch={() => flow.setStep(isBarberFirst ? "branch" : "branch")}
            onEditBarber={
              isNearestMode || isBarberFirst
                ? undefined
                : () => flow.setStep("mode")
            }
            onEditService={() => flow.setStep("service")}
            onEditAppointment={() => flow.setStep("date")}
            onEditCustomer={() => flow.setStep("details")}
            onBack={handleBack}
            onConfirm={() => void flow.confirmCreate()}
            confirmDisabled={
              flow.mutationUi.kind === "creating" ||
              (flow.mutationUi.kind === "rate_limited" &&
                flow.rateLimitRemainingSeconds > 0)
            }
            confirmLoading={flow.mutationUi.kind === "creating"}
          />
        );
      }

      case "success": {
        if (fromBookFlow) {
          return (
            <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-sm text-[var(--booking-text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--booking-success)]" />
              {lang === "ar" ? "جاري تأكيد حجزك…" : "Confirming your booking…"}
            </div>
          );
        }
        const booking = flow.created;
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
        const dateLine = confirmedDateParts.weekday
          ? `${confirmedDateParts.weekday}${confirmedDateParts.dateLine ? ` · ${confirmedDateParts.dateLine}` : ""}`
          : confirmedDateParts.full;

        return (
          <BookingSuccessStep
            bookingCode={booking?.bookingCode}
            dateLine={dateLine}
            timeLabel={confirmedTime}
            branchName={confirmedBranch || "—"}
            branchBadge={
              <span
                className={`inline-flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 rounded-lg border ${confirmedBranchAccent.chip} ${confirmedBranchAccent.chipText}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${confirmedBranchAccent.dot}`}
                  aria-hidden
                />
                {confirmedBranch || "—"}
              </span>
            }
            barberName={confirmedBarber || "—"}
            message={booking?.message}
            copied={copied}
            onCopyCode={(code) => void copyCode(code)}
            onDone={() => {
              setConfettiTrigger((p) => p + 1);
              setTimeout(handleClose, 400);
            }}
          />
        );
      }
    }
  };

  const activeStepId = stepForHeader(flow.step);
  const headerSteps = steps;

  // Full-screen blur freeze is only for plan/create mutations.
  // Data loads (barber profile, catalog, slots, lookup) already have step-level UI;
  // overlaying them blocked the modal (retry/close) after choosing a barber.
  const mutationBusy =
    flow.mutationUi.kind === "planning" || flow.mutationUi.kind === "creating";
  const waitingBusy = mutationBusy;
  const waitingDelayMs = 280;
  const waitingTone = "confirm" as const;
  const waitingLabel =
    flow.mutationUi.kind === "planning"
      ? t("loading.planning")
      : t("loading.creating");

  const bookingTitle = isNearestMode
    ? t("header.bookNearest")
    : t("header.bookWith", { name: barber.name });

  const flowPanel = (
    <BookingPricePromoProvider
      branchCode={
        flow.effectiveBranchCode ??
        displayBranchCode ??
        explicitEntryBranchCode ??
        null
      }
    >
      <div
        className={`relative flex min-h-0 w-full flex-col overflow-hidden ${
          isPagePresentation ? "min-h-[100svh] max-h-[100svh]" : "max-h-[92vh]"
        }`}
      >
        <BookDelayedWaitingOverlay
          busy={waitingBusy}
          delayMs={waitingDelayMs}
          lang={lang}
          tone={waitingTone}
          label={waitingLabel}
          variant="absolute"
        />

        <VisuallyHidden>
          {isPagePresentation ? (
            <h1>{bookingTitle}</h1>
          ) : (
            <DialogTitle>{bookingTitle}</DialogTitle>
          )}
        </VisuallyHidden>
        {isPagePresentation ? (
          <p className="sr-only">{t("header.dialogDescription")}</p>
        ) : (
          <DialogDescription className="sr-only">
            {t("header.dialogDescription")}
          </DialogDescription>
        )}

        <BookingStepHeader
          steps={headerSteps}
          currentStep={activeStepId}
          barberName={displayBarberName}
          onClose={handleClose}
          nearest={isNearestMode}
          allCompleted={flow.step === "success"}
        />

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          <aside
            className={`hidden md:block w-72 flex-shrink-0 border-e border-[var(--booking-border-subtle)] bg-[var(--booking-bg)] ${
              isReviewOrSuccess(flow.step) ? "overflow-hidden" : "overflow-y-auto"
            }`}
            data-testid="booking-desktop-sidebar"
          >
            <BookingInfoPanel
              barber={{ ...barber, name: sidebarBarberName }}
              selectedDate={flow.selectedDate}
              selectedTime={flow.selectedSlot?.time}
              service={
                selectedServices.length > 0 ? (
                  <SelectedServicesBilingual services={selectedServices} />
                ) : undefined
              }
              servicePrice={
                flow.plan?.totalPrice ?? (flow.catalogPrice || undefined)
              }
              serviceDuration={
                flow.plan?.totalDurationMinutes ??
                (flow.catalogDuration || undefined)
              }
              mode={flow.mode}
              branchName={displayBranchName}
              branchCode={displayBranchCode}
              density={isReviewOrSuccess(flow.step) ? "identity" : "compact"}
            />
          </aside>

          <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[var(--booking-bg)]">
            <div
              className={`flex-1 bg-[var(--booking-bg)] min-h-0 ${
                flow.step === "service"
                  ? "flex flex-col overflow-hidden"
                  : "overflow-y-auto"
              }`}
            >
              {flow.step !== "service" &&
                flow.step !== "success" &&
                flow.step !== "review" &&
                flow.step !== "branch" &&
                (flow.serviceIds.length > 0 ||
                  flow.selectedDate ||
                  flow.selectedSlot) && (
                  <div className="md:hidden bg-[var(--booking-surface)] px-4 py-2.5 border-b border-[var(--booking-border-subtle)] flex-shrink-0">
                    <div className="flex items-center gap-2 text-xs">
                      {selectedServices.length > 0 && (
                        <SelectedServicesBilingual
                          services={selectedServices}
                          compact
                        />
                      )}
                      {flow.selectedDate && (
                        <span className="text-[var(--booking-text-secondary)]">
                          {format.shortDate(flow.selectedDate)}
                        </span>
                      )}
                      {flow.selectedSlot && (
                        <span className="text-[var(--booking-text)] font-medium">
                          {format.time(flow.selectedSlot.time)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleBack}
                        className="ms-auto text-[var(--booking-text)] font-medium flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] rounded"
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

        <div className="md:hidden flex-shrink-0 border-t border-[var(--booking-border-subtle)] bg-[var(--booking-bg)] px-4 py-3 safe-area-pb">
          <div className="flex items-center gap-3">
            {isNearestMode ? (
              <div className="w-9 h-9 rounded-full bg-[var(--booking-accent-soft)] flex items-center justify-center border border-[var(--booking-border)] flex-shrink-0">
                <Zap className="w-4 h-4 text-[var(--booking-accent)]" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[var(--booking-border)] flex-shrink-0">
                <BarberPhoto
                  src={barber.image}
                  name={barber.name}
                  imgClassName="w-full h-full object-cover object-top"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--booking-text)] text-sm leading-none">
                {displayBarberName}
              </p>
              <p className="text-[var(--booking-text-secondary)] text-xs mt-0.5">
                {isNearestMode
                  ? t("header.nearestBarber")
                  : barber.specialty ||
                    barber.role ||
                    t("header.professionalBarber")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </BookingPricePromoProvider>
  );

  if (isPagePresentation) {
    if (!open) return null;
    return (
      <>
        <ConfettiBurst trigger={confettiTrigger} particleCount={55} />
        <main
          className="min-h-[100svh] w-full bg-[var(--booking-bg)] booking-modal-shell"
          dir={dir}
          lang={lang}
          data-testid="booking-page-shell"
        >
          {flowPanel}
        </main>
      </>
    );
  }

  return (
    <>
      <ConfettiBurst trigger={confettiTrigger} particleCount={55} />
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) handleClose();
        }}
      >
        <DialogContent
          hideDefaultClose
          className="max-w-4xl w-[95vw] max-h-[92vh] p-0 bg-[var(--booking-bg)] border border-[var(--booking-border)] overflow-hidden gap-0 rounded-2xl shadow-2xl booking-modal-shell"
          dir={dir}
          lang={lang}
        >
          {flowPanel}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingModal;
export type { BookingMode };
