"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  ArrowLeft,
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
import BookingInfoPanel from "./BookingInfoPanel";
import BookingCalendar from "./BookingCalendar";
import BookingTimeSlots from "./BookingTimeSlots";
import BookingServiceSelect from "./BookingServiceSelect";
import BranchPicker from "./BranchPicker";
import CrossBranchSlotsPanel from "@/components/CrossBranchSlotsPanel";
import BarberPhoto from "./BarberPhoto";
import { useBranch } from "@/context/BranchContext";
import { getCoreServiceIdSet } from "@/lib/bookingServiceGroups";
import { useBookingFlow, type BookingUiStep } from "@/hooks/useBookingFlow";
import { saveClient } from "@/lib/clientStorage";
import { getBranchAccent } from "@/lib/branchTheme";
import { formatBookingTimeAr } from "@/lib/booking-management/display";
import {
  resolveBarberDisplayName,
  serviceNameAr,
  serviceNameEn,
  type PublicBranch,
  type BookingMode,
  type BookingEntryMode,
  type BookingService,
} from "@/lib/booking-api";

type ClientLookupStatus = "idle" | "loading" | "found" | "new";

function SelectedServicesBilingual({
  services,
  compact = false,
  dark = false,
}: {
  services: BookingService[];
  compact?: boolean;
  dark?: boolean;
}) {
  if (services.length === 0) return null;
  return (
    <div className={compact ? "space-y-0.5" : "space-y-1.5"}>
      {services.map((s) => {
        const ar = serviceNameAr(s);
        const en = serviceNameEn(s);
        const showEn = Boolean(en && en !== ar);
        return (
          <div key={s.id} className="min-w-0">
            <p
              className={`font-heading font-bold leading-tight ${
                dark ? "text-cut-ivory" : "text-cut-black"
              } ${compact ? "text-xs" : "text-sm"}`}
              lang="ar"
              dir="rtl"
            >
              {ar}
            </p>
            {showEn ? (
              <p
                className={`font-editorial leading-snug tracking-wide ${
                  dark ? "text-[#D4AF37]/80" : "text-[#D4AF37]"
                } ${compact ? "text-[10px]" : "text-xs"}`}
                lang="en"
                dir="ltr"
              >
                {en}
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
}

const steps = [
  { id: "branch", label: "الفرع", number: 1 },
  { id: "mode", label: "الطريقة", number: 2 },
  { id: "service", label: "الخدمة", number: 3 },
  { id: "date", label: "الموعد", number: 4 },
  { id: "time", label: "الوقت", number: 5 },
  { id: "details", label: "بياناتك", number: 6 },
  { id: "review", label: "مراجعة", number: 7 },
];

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
}: BookingModalProps) => {
  const {
    branches,
    isLoadingBranches,
    branchesError,
    selectedBranch,
    hasConfirmedBranch,
    selectBranch,
    refetchBranches,
  } = useBranch();
  const branchCode = selectedBranch?.branchCode;

  const isBarberFirst = entryMode === "barber_first";
  const hasBarberEmpId =
    barber.id != null && Number.isFinite(barber.id) && barber.id > 0;
  const effectiveInitialMode = isBarberFirst ? "specific" : initialMode;

  const flow = useBookingFlow({
    open: open && (!isBarberFirst || hasBarberEmpId),
    branchCode,
    initialMode: effectiveInitialMode,
    initialBarber: hasBarberEmpId ? barber : isBarberFirst ? null : barber,
    bookingNote,
    skipModeStep: Boolean(effectiveInitialMode) || isBarberFirst,
    entryMode,
  });

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<ClientLookupStatus>("idle");
  const [lookedUpName, setLookedUpName] = useState<string | null>(null);

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

  const allowedBranches = isBarberFirst
    ? branches.filter((b) =>
        flow.barberBranches.some(
          (bb) => bb.branchCode.toUpperCase() === b.branchCode.toUpperCase(),
        ),
      )
    : branches;

  // If saved branch is not valid for this barber, force branch step.
  useEffect(() => {
    if (!open || !isBarberFirst) return;
    if (flow.barberProfileLoading) return;
    if (
      selectedBranch &&
      flow.barberBranches.length > 0 &&
      !flow.barberBranches.some(
        (bb) => bb.branchCode.toUpperCase() === selectedBranch.branchCode.toUpperCase(),
      )
    ) {
      flow.setStep("branch");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isBarberFirst, selectedBranch?.branchCode, flow.barberBranches, flow.barberProfileLoading]);

  // Auto-confirm single barber branch
  useEffect(() => {
    if (!open || !isBarberFirst) return;
    if (flow.barberProfileLoading) return;
    if (allowedBranches.length === 1 && !hasConfirmedBranch) {
      selectBranch(allowedBranches[0]);
      flow.setStep("service");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isBarberFirst, allowedBranches, hasConfirmedBranch, flow.barberProfileLoading]);

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

  // Enter after branch when opened with initialMode / barber-first
  useEffect(() => {
    if (!open) return;
    if (hasConfirmedBranch && branchCode && flow.step === "branch") {
      if (isBarberFirst && allowedBranches.length > 0) {
        const ok = allowedBranches.some(
          (b) => b.branchCode.toUpperCase() === branchCode.toUpperCase(),
        );
        if (!ok) return;
      }
      flow.setStep(effectiveInitialMode || isBarberFirst ? "service" : "mode");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasConfirmedBranch, branchCode, isBarberFirst, allowedBranches.length, effectiveInitialMode]);

  const handleClose = () => {
    if (flow.mutationUi.kind === "creating" || flow.mutationUi.kind === "unknown") {
      const ok = window.confirm(
        "جاري تأكيد الحجز أو النتيجة غير مؤكدة. هل تريد الإغلاق؟ قد يكون الحجز تم بالفعل.",
      );
      if (!ok) return;
    }
    onOpenChange(false);
    setTimeout(() => {
      flow.resetAll();
      setCopied(false);
      setLookupStatus("idle");
      setLookedUpName(null);
    }, 300);
  };

  const handleBranchSelect = (branch: PublicBranch) => {
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
    if (flow.step === "mode") flow.setStep("branch");
    else if (flow.step === "service") {
      flow.setStep(effectiveInitialMode || isBarberFirst ? "branch" : "mode");
    } else if (flow.step === "slots") flow.setStep("service");
    else if (flow.step === "date") flow.setStep("service");
    else if (flow.step === "time") flow.setStep("date");
    else if (flow.step === "details") flow.setStep("time");
    else if (flow.step === "review") flow.setStep("details");
  };

  const selectedServices = flow.services.filter((s) => flow.serviceIds.includes(s.id));
  const isNearestMode = flow.mode === "nearest";
  const displayBarberName = isNearestMode
    ? flow.selectedSlot?.barberName ?? "أقرب حلاق متاح"
    : flow.barber?.name ?? barber.name;
  const displayBranchName = flow.bookingBranchName ?? selectedBranch?.branchName;
  const displayBranchCode = flow.bookingBranchCode ?? selectedBranch?.branchCode;
  const branchAccent = getBranchAccent(displayBranchCode, displayBranchName);

  const allowSpecific = flow.config?.settings.allowSpecificBarber !== false;
  const allowNearest = flow.config?.settings.allowNearestBarber !== false;
  const envBookingEnabled = process.env.NEXT_PUBLIC_BOOKING_ENABLED !== "false";
  const isBookingEnabled =
    flow.config?.salon?.bookingEnabled !== false && envBookingEnabled;

  const formatDateAr = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const resolveConfirmationDate = (raw: string, fallback?: Date) => {
    let dateObj: Date | undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parsed = new Date(`${raw}T12:00:00`);
      if (!Number.isNaN(parsed.getTime())) dateObj = parsed;
    } else if (fallback) {
      dateObj = fallback;
    }
    if (!dateObj) {
      return {
        weekday: "",
        dateLine: raw || formatDateAr(fallback) || "—",
        full: raw || formatDateAr(fallback) || "—",
      };
    }
    const weekday = new Intl.DateTimeFormat("ar-EG", { weekday: "long" }).format(dateObj);
    const dateLine = new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dateObj);
    return {
      weekday,
      dateLine,
      full: `${weekday}، ${dateLine}`,
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
          dir="rtl"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          {flow.mutationUi.kind === "planning"
            ? "جاري تجهيز خطة الحجز..."
            : "جاري تأكيد حجزك..."}
        </div>
      );
    }
    if (flow.mutationUi.kind === "rate_limited") {
      return (
        <div
          className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center"
          aria-live="polite"
          dir="rtl"
        >
          {flow.mutationUi.message}
          {flow.rateLimitRemainingSeconds > 0 && (
            <p className="mt-1 font-bold tabular-nums">
              أعد المحاولة بعد {flow.rateLimitRemainingSeconds} ثانية
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
          dir="rtl"
        >
          <p className="font-bold">تعذر التأكد من نتيجة الطلب</p>
          <p>قد يكون الحجز تم بالفعل. لا تُنشئ طلباً جديداً برقم مختلف.</p>
          <button
            type="button"
            onClick={() => flow.safeRetryCreate()}
            className="px-4 py-2 rounded-lg bg-cut-gold text-black text-xs font-bold"
          >
            إعادة المحاولة الآمنة
          </button>
        </div>
      );
    }
    return (
      <div
        className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center"
        aria-live="assertive"
        dir="rtl"
      >
        {flow.mutationUi.message}
      </div>
    );
  };

  const renderContent = () => {
    if (isBarberFirst && !hasBarberEmpId) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 p-6 text-center" dir="rtl">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-cut-black/85 font-medium">
            تعذر بدء الحجز: معرف الحلاق غير متاح
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-cut-gold/15 text-sm text-cut-black/70 hover:bg-cut-black/[0.04] transition-colors"
          >
            إغلاق
          </button>
        </div>
      );
    }

    if (flow.step === "branch") {
      return (
        <div className="p-5 md:p-6" dir="rtl">
          <div className="mb-5">
            <h3 className="text-lg font-heading font-bold text-cut-black mb-1">
              {isBarberFirst ? `فرع ${barber.name}` : "في أي فرع تحب تحجز؟"}
            </h3>
            <p className="text-cut-black/50 text-xs">
              {isBarberFirst
                ? "اختار فرعاً يعمل به هذا الحلاق"
                : "اختار الفرع الأقرب ليك"}
            </p>
          </div>
          {(flow.barberProfileError || branchesError) && (
            <div
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center space-y-3"
              role="alert"
            >
              <p>{flow.barberProfileError || branchesError}</p>
              <button
                type="button"
                onClick={() => {
                  if (flow.barberProfileError) flow.retryBarberProfile();
                  if (branchesError) refetchBranches();
                }}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 text-xs font-bold hover:bg-red-50 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          )}
          {!flow.barberProfileLoading && (
            <BranchPicker
              branches={allowedBranches}
              selectedBranchCode={selectedBranch?.branchCode}
              isLoading={isLoadingBranches || (isBarberFirst && flow.barberProfileLoading)}
              error={
                !flow.barberProfileError &&
                !branchesError &&
                isBarberFirst &&
                allowedBranches.length === 0
                  ? "لا توجد فروع عامة متاحة لهذا الحلاق"
                  : null
              }
              variant="light"
              onSelect={handleBranchSelect}
            />
          )}
          {hasConfirmedBranch &&
            selectedBranch &&
            allowedBranches.some((b) => b.branchCode === selectedBranch.branchCode) && (
              <button
                type="button"
                onClick={() => handleBranchSelect(selectedBranch)}
                className={`w-full mt-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#D4AF37]/20 ${
                  getBranchAccent(selectedBranch.branchCode, selectedBranch.branchName).key === "camp"
                    ? "bg-[#E8A317] text-black hover:bg-[#D4920F]"
                    : "bg-[#D4AF37] text-black hover:bg-[#C4A030]"
                }`}
              >
                <Check className="w-4 h-4" />
                تأكيد فرع {selectedBranch.shortName || selectedBranch.branchName} ومتابعة
              </button>
            )}
        </div>
      );
    }

    if (flow.catalogLoading && flow.services.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4" dir="rtl" aria-live="polite">
          <Loader2 className="w-8 h-8 animate-spin text-cut-gold" />
          <p className="text-cut-black/50 text-sm">جاري تحميل بيانات الحجز...</p>
        </div>
      );
    }

    if (flow.catalogError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 p-6 text-center" dir="rtl">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <WifiOff className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-cut-black/85 font-medium">{flow.catalogError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg border border-cut-gold/15 text-sm text-cut-black/70 hover:bg-cut-black/[0.04] transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    if (!isBookingEnabled) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 p-6 text-center" dir="rtl">
          <AlertCircle className="w-7 h-7 text-amber-400" />
          <p className="text-cut-black/85 font-semibold text-base">الحجز معطل اليوم</p>
          <p className="text-cut-black/50 text-sm">يرجى التواصل مع الصالون مباشرة للحجز</p>
        </div>
      );
    }

    switch (flow.step) {
      case "mode":
        return (
          <div className="p-5 md:p-6" dir="rtl">
            <div className="mb-5">
              <h3 className="text-lg font-heading font-bold text-cut-black mb-1">تحب تحجز إزاي؟</h3>
              <p className="text-cut-black/50 text-xs">اختار الطريقة اللي تناسبك</p>
            </div>
            <div className="space-y-3">
              {allowNearest && (
                <button
                  type="button"
                  onClick={() => flow.selectMode("nearest")}
                  className="w-full rounded-2xl border border-cut-gold/20 bg-gradient-to-l from-cut-gold/[0.06] to-transparent p-5 text-right transition-all duration-200 group cursor-pointer hover:border-cut-gold/50"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cut-gold/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-cut-gold" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-heading font-bold text-base text-cut-black mb-1">
                        أقرب حلاق متاح
                      </h4>
                      <p className="text-cut-black/60 text-xs leading-relaxed">
                        النظام يختارلك أقرب ميعاد حسب المتاح. لا نحدد حلاقاً من المتصفح.
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
                  className="w-full rounded-2xl border border-cut-gold/15 bg-cut-ivory p-5 text-right transition-all duration-200 group cursor-pointer hover:border-cut-gold/40"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cut-black/[0.04] flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-6 h-6 text-cut-black/50 group-hover:text-cut-gold" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-heading font-bold text-base text-cut-black mb-1">
                        اختيار الحلاق
                      </h4>
                      <p className="text-cut-black/60 text-xs leading-relaxed">
                        لو عندك حلاق مفضل، اختاره واحجز معاه.
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
        );

      case "service": {
        // Specific without barber id: pick from public barbers list
        const needsBarberPick =
          flow.mode === "specific" && flow.barber?.id == null && flow.barbers.length > 0;
        return (
          <div dir="rtl" className="flex flex-col min-h-0 flex-1">
            {needsBarberPick && (
              <div className="px-5 pt-4 space-y-2">
                <p className="text-sm font-bold text-cut-black">اختار الحلاق</p>
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
            <div className="px-6 pb-4 flex-shrink-0">
              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2.5 rounded-xl border border-cut-gold/15 text-cut-black/60 font-medium hover:bg-cut-black/[0.04] transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع
              </button>
            </div>
          </div>
        );
      }

      case "slots":
        return (
          <div dir="rtl">
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
            <div className="px-5 md:px-6 pb-6">
              <button
                type="button"
                onClick={handleBack}
                className="w-full py-3 rounded-xl border border-cut-gold/15 text-cut-black/70 font-medium flex items-center justify-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع للخدمات
              </button>
            </div>
          </div>
        );

      case "date":
        return (
          <div dir="rtl">
            {renderMutationBanner()}
            {flow.daysLoading && flow.days.length === 0 && (
              <p className="px-6 pt-4 text-sm text-cut-black/60" aria-live="polite">
                جاري البحث عن الأيام المتاحة... قد يستغرق ذلك عدة ثوانٍ
              </p>
            )}
            {flow.daysError && !flow.daysLoading && (
              <p className="px-6 pt-4 text-sm text-red-600" aria-live="assertive">
                {flow.daysError}
              </p>
            )}
            {!flow.daysLoading && !flow.daysError && flow.days.length > 0 &&
              flow.days.every((d) => !d.available) && (
                <p className="px-6 pt-4 text-sm text-cut-black/60">
                  لا توجد أيام متاحة حاليًا لهذه الاختيارات
                </p>
              )}
            <BookingCalendar
              selectedDate={flow.selectedDate}
              onDateSelect={flow.selectDate}
              availableDays={flow.days}
              isLoading={flow.daysLoading && flow.days.length === 0}
              maxDaysAhead={flow.config?.settings?.maxBookingDaysAhead ?? 60}
            />
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={handleBack}
                className="w-full py-3 rounded-xl border border-cut-gold/15 text-cut-black/70 font-medium flex items-center justify-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع للخدمات
              </button>
            </div>
          </div>
        );

      case "time": {
        const locBranch = flow.dayLocation?.branch;
        const bannerCode = locBranch?.branchCode ?? displayBranchCode;
        const bannerName = locBranch?.branchName ?? displayBranchName;
        const bannerAccent = getBranchAccent(bannerCode, bannerName);
        const dateLabel = formatDateAr(flow.selectedDate);
        const showBranchBanner =
          flow.mode === "specific" && Boolean(flow.barber?.id);
        // Never block slots on location — show known branch immediately, refine in background.
        const slotsBusy = flow.slotsLoading && flow.slots.length === 0;

        return (
          <div dir="rtl" className="bg-[#0a0a0a] min-h-full">
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
                      مكان الصنايعي في اليوم ده
                      {dateLabel ? ` · ${dateLabel}` : ""}
                    </p>
                    {flow.dayLocation && !flow.dayLocation.isWorking ? (
                      <p className="text-sm font-bold text-amber-300">
                        {displayBarberName} مش شغال في اليوم ده
                      </p>
                    ) : bannerName ? (
                      <>
                        <p className="text-base md:text-lg font-heading font-black leading-snug text-white">
                          {displayBarberName} موجود في فرع{" "}
                          <span
                            className="underline decoration-2 underline-offset-2"
                            style={{ color: bannerAccent.swatch }}
                          >
                            {bannerAccent.labelAr}
                          </span>
                        </p>
                        <p className="text-sm font-semibold text-[#D4AF37] mt-1 flex items-center gap-2 flex-wrap">
                          <span>{bannerName}</span>
                          {flow.dayLocationLoading && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/45">
                              <Loader2 className="w-3 h-3 animate-spin text-[#D4AF37]" />
                              جاري التأكيد…
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
                        تعذر تأكيد الفرع لهذا اليوم — كمّل اختيار الوقت على الفرع المحدد
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-white/70 flex items-center gap-2">
                        {flow.dayLocationLoading && (
                          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                        )}
                        جاري التأكد من فرع {displayBarberName}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {flow.slotsError && (
              <p className="px-6 pt-4 text-sm text-red-400" aria-live="assertive">
                {flow.slotsError}
              </p>
            )}
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
                flow.mode === "specific"
                  ? () => {
                      flow.selectMode("nearest");
                      flow.setStep("date");
                    }
                  : undefined
              }
              slots={flow.slots}
              isLoading={slotsBusy}
            />
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={handleBack}
                className="w-full py-3 rounded-xl border border-white/15 bg-black text-white/80 font-medium flex items-center justify-center gap-2 text-sm hover:bg-white/5 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع للتاريخ
              </button>
            </div>
          </div>
        );
      }

      case "details":
        return (
          <div className="p-6" dir="rtl">
            <h3 className="text-xl font-heading font-bold text-cut-black mb-4">بياناتك</h3>
            {renderMutationBanner()}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-cut-black/70 mb-1" htmlFor="bk-phone">
                  رقم الهاتف
                </label>
                <div className="relative">
                  <input
                    id="bk-phone"
                    type="tel"
                    value={flow.customerPhone}
                    onChange={(e) => flow.setCustomerPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="cut-input pl-10"
                    dir="ltr"
                    autoComplete="tel"
                  />
                  {lookupStatus === "loading" && (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cut-gold animate-spin" />
                  )}
                  {lookupStatus === "found" && (
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                  )}
                </div>
              </div>

              {lookupStatus === "found" && lookedUpName && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-emerald-800 text-sm font-medium">
                    مرحباً، {lookedUpName}
                  </span>
                </div>
              )}
              {lookupStatus === "new" && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cut-gold/10 border border-cut-gold/25">
                  <AlertCircle className="w-4 h-4 text-cut-gold flex-shrink-0" />
                  <span className="text-cut-black/80 text-sm">عميل جديد — أول مرة؟ اكتب اسمك</span>
                </div>
              )}

              {/* Name: auto-filled when found; editable otherwise once phone is long enough */}
              {(lookupStatus === "found" ||
                lookupStatus === "new" ||
                flow.customerPhone.replace(/\D/g, "").length >= 8) && (
                <div>
                  <label className="block text-xs font-medium text-cut-black/70 mb-1" htmlFor="bk-name">
                    الاسم
                  </label>
                  <input
                    id="bk-name"
                    type="text"
                    value={flow.customerName}
                    onChange={(e) => flow.setCustomerName(e.target.value)}
                    placeholder="اكتب اسمك"
                    readOnly={lookupStatus === "found"}
                    className={
                      lookupStatus === "found"
                        ? "cut-input bg-emerald-50/60 border-emerald-200 cursor-default"
                        : "cut-input"
                    }
                    dir="rtl"
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-cut-black/70 mb-1" htmlFor="bk-notes">
                  ملاحظات (اختياري)
                </label>
                <input
                  id="bk-notes"
                  type="text"
                  value={flow.notes}
                  onChange={(e) => flow.setNotes(e.target.value)}
                  className="cut-input"
                  dir="rtl"
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
                  <span className="text-cut-black/50 text-xs">الفرع</span>
                </div>
              )}
              <div className="flex justify-between gap-3 items-start">
                <SelectedServicesBilingual services={selectedServices} />
                <span className="text-cut-black/50 text-xs flex-shrink-0">الخدمات</span>
              </div>
              {flow.selectedDate && (
                <div className="flex justify-between">
                  <span>{formatDateAr(flow.selectedDate)}</span>
                  <span className="text-cut-black/50 text-xs">التاريخ</span>
                </div>
              )}
              {flow.selectedSlot && (
                <div className="flex justify-between">
                  <span>
                    {flow.selectedSlot.label ?? flow.selectedSlot.time}
                    {flow.selectedSlot.dayOffset === 1
                      ? " — تابع لليوم التشغيلي المختار"
                      : ""}
                  </span>
                  <span className="text-cut-black/50 text-xs">الوقت</span>
                </div>
              )}
              <p className="text-[11px] text-cut-black/45 pt-1">
                السعر والمدة النهائية تظهر بعد تجهيز خطة الحجز من النظام.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 rounded-xl border border-cut-gold/15 text-cut-black/70 font-medium flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع
              </button>
              <button
                type="button"
                disabled={!canPlan}
                onClick={() => void flow.requestPlan()}
                className="flex-[2] py-3 rounded-xl bg-cut-gold text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                متابعة للمراجعة
              </button>
            </div>
          </div>
        );

      case "review": {
        const p = flow.plan;
        return (
          <div className="p-6" dir="rtl">
            <h3 className="text-xl font-heading font-bold text-cut-black mb-1">راجع حجزك</h3>
            <p className="text-cut-black/50 text-xs mb-4">
              السعر والمدة من النظام — لم يتم تأكيد الحجز بعد
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
                <span className="text-cut-black/50 text-xs">الفرع</span>
              </div>
              <div className="flex justify-between">
                <span>
                  {isNearestMode
                    ? resolveBarberDisplayName(
                        {
                          nameAr: p?.plan?.[0]?.empName,
                          nameEn: p?.plan?.[0]?.empNameEn,
                        },
                        "ar",
                      ) || "يُحدد عند التأكيد"
                    : displayBarberName ||
                      resolveBarberDisplayName(
                        {
                          nameAr: p?.plan?.[0]?.empName,
                          nameEn: p?.plan?.[0]?.empNameEn,
                        },
                        "ar",
                      )}
                </span>
                <span className="text-cut-black/50 text-xs">الحلاق</span>
              </div>
              {(p?.plan ?? []).map((item) => (
                <div key={`${item.serviceId}-${item.startTime}`} className="flex justify-between text-xs">
                  <span>
                    {item.serviceName} · {item.startTime}
                  </span>
                  <span>
                    {item.price} ج · {item.durationMinutes} د
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-cut-gold/15">
                <span className="font-bold text-cut-gold">{p?.totalPrice ?? "—"} جنيه</span>
                <span className="text-cut-black/50 text-xs">الإجمالي النهائي</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{p?.totalDurationMinutes ?? "—"} دقيقة</span>
                <span className="text-cut-black/50 text-xs">المدة النهائية</span>
              </div>
              <div className="flex justify-between">
                <span>{flow.customerName.trim()}</span>
                <span className="text-cut-black/50 text-xs">الاسم</span>
              </div>
              <div className="flex justify-between" dir="ltr">
                <span>{flow.customerPhone.trim()}</span>
                <span className="text-cut-black/50 text-xs" dir="rtl">
                  الهاتف
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 rounded-xl border border-cut-gold/15 text-cut-black/70 font-medium"
              >
                تعديل الاختيارات
              </button>
              <button
                type="button"
                disabled={
                  flow.mutationUi.kind === "creating" ||
                  (flow.mutationUi.kind === "rate_limited" &&
                    flow.rateLimitRemainingSeconds > 0)
                }
                onClick={() => void flow.confirmCreate()}
                className="flex-[2] py-3 rounded-xl bg-cut-gold text-black font-bold disabled:opacity-50"
              >
                {flow.mutationUi.kind === "creating" ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري تأكيد حجزك...
                  </span>
                ) : (
                  "تأكيد الحجز"
                )}
              </button>
            </div>
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
          (isNearestMode ? "أقرب حلاق متاح" : displayBarberName) ||
          "";
        const confirmedDateRaw = (booking?.date || "").trim();
        const confirmedDateParts = resolveConfirmationDate(
          confirmedDateRaw,
          flow.selectedDate,
        );
        const confirmedTimeRaw =
          (booking?.time || "").trim() || flow.selectedSlot?.time || "";
        const confirmedTime = confirmedTimeRaw
          ? formatBookingTimeAr(confirmedTimeRaw)
          : "—";
        const confirmedServices = (
          booking?.services?.map((s) => String(s || "").trim()).filter(Boolean) ??
          []
        ).length
          ? booking!.services!.map((s) => String(s || "").trim()).filter(Boolean)
          : selectedServices.map((s) => s.nameAr || s.nameEn || s.name).filter(Boolean);
        const confirmedTotal =
          booking?.totalPrice ??
          flow.catalogPrice ??
          (selectedServices.reduce((sum, s) => sum + (s.price || 0), 0) || null);

        return (
          <div className="p-5 md:p-6" dir="rtl">
            {/* Success banner */}
            <div className="rounded-2xl bg-[#0a0a0a] text-cut-ivory px-5 py-5 mb-4 text-center border border-[#D4AF37]/30 shadow-[0_0_24px_rgba(212,175,55,0.12)]">
              <div className="w-14 h-14 rounded-full bg-[#D4AF37] flex items-center justify-center mx-auto mb-3 shadow-[0_0_24px_rgba(212,175,55,0.45)]">
                <Check className="w-7 h-7 text-black" strokeWidth={3} />
              </div>
              <h3 className="text-xl md:text-2xl font-heading font-black text-[#D4AF37] mb-1">
                تم تأكيد حجزك بنجاح
              </h3>
              <p className="text-white/65 text-xs md:text-sm">
                احتفظ بالتفاصيل التالية لموعدك
              </p>
              {booking?.bookingCode && (
                <div className="mt-4 inline-flex flex-col sm:flex-row items-center gap-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-3 py-2">
                  <span className="text-white/55 text-[11px]">كود الحجز</span>
                  <span className="font-mono font-bold text-[#D4AF37] tracking-wide text-sm">
                    {booking.bookingCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyCode(booking.bookingCode)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#D4AF37] text-black text-[11px] font-bold hover:bg-[#C4A030]"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? "تم النسخ" : "نسخ"}
                  </button>
                </div>
              )}
            </div>

            {/* Key confirmation details — classic black + yellow */}
            <div
              className="rounded-2xl bg-[#0a0a0a] border border-[#D4AF37]/20 overflow-hidden mb-4"
              role="status"
              aria-live="polite"
              aria-label="تفاصيل تأكيد الحجز"
            >
              <div className="px-4 py-2.5 border-b border-[#D4AF37]/15 bg-[#D4AF37]/[0.06]">
                <p className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase text-center">
                  ملخص الموعد
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
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-white/45 text-[11px] mb-1">الفرع</p>
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
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-white/45 text-[11px] mb-1">الصنايعي</p>
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
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-white/45 text-[11px] mb-1">اليوم والتاريخ</p>
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
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-white/45 text-[11px] mb-1">الساعة</p>
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
                    <span className="font-semibold text-cut-black text-right">
                      {confirmedServices.join(" + ")}
                    </span>
                    <span className="text-cut-black/45 text-xs shrink-0">الخدمات</span>
                  </div>
                )}
                {confirmedTotal != null && (
                  <div className="flex justify-between gap-3 items-center border-t border-cut-black/5 pt-2">
                    <span className="text-cut-gold font-black text-base">
                      {confirmedTotal} جنيه
                    </span>
                    <span className="text-cut-black/45 text-xs shrink-0">الإجمالي</span>
                  </div>
                )}
              </div>
            )}

            {booking?.message && (
              <p className="text-cut-black/60 text-xs mb-4 text-center">{booking.message}</p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfettiTrigger((p) => p + 1);
                  setTimeout(handleClose, 400);
                }}
                className="w-full py-3.5 rounded-xl bg-[#D4AF37] text-black font-bold text-base hover:bg-[#C4A030] shadow-md shadow-[#D4AF37]/25"
              >
                تم، شكراً
              </button>
            </div>
          </div>
        );
      }
    }
  };

  const activeStepId = stepForHeader(flow.step);
  const headerSteps =
    effectiveInitialMode || isBarberFirst
      ? steps.filter((s) => s.id !== "mode")
      : steps;

  return (
    <>
      <ConfettiBurst trigger={confettiTrigger} particleCount={55} />
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-4xl w-[95vw] max-h-[92vh] p-0 bg-white border border-[#D4AF37]/25 overflow-hidden gap-0 rounded-2xl shadow-2xl"
          dir="rtl"
        >
          <VisuallyHidden>
            <DialogTitle>
              {isNearestMode ? "احجز أقرب ميعاد" : `احجز مع ${barber.name}`}
            </DialogTitle>
          </VisuallyHidden>
          <DialogDescription className="sr-only">
            واجهة حجز موعد في Cut Salon: اختيار الفرع والخدمة والحلاق واليوم والساعة ثم المراجعة والتأكيد.
          </DialogDescription>

          <BookingStepHeader
            steps={headerSteps}
            currentStep={activeStepId}
            barberName={displayBarberName}
            onClose={handleClose}
          />

          <div
            className="flex flex-col md:flex-row overflow-hidden"
            style={{ maxHeight: "calc(92vh - 130px)" }}
          >
            <div className="hidden md:block w-72 flex-shrink-0 border-r border-cut-gold/15 overflow-y-auto">
              <BookingInfoPanel
                barber={barber}
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
                className={`flex-1 bg-cut-ivory ${
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
                      <div className="flex items-center gap-2 text-xs" dir="rtl">
                        {selectedServices.length > 0 && (
                          <SelectedServicesBilingual services={selectedServices} compact />
                        )}
                        {flow.selectedDate && (
                          <span className="text-cut-black/70">
                            {flow.selectedDate.toLocaleDateString("ar-EG", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        {flow.selectedSlot && (
                          <span className="text-cut-black/70 font-medium">
                            {flow.selectedSlot.time}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleBack}
                          className="mr-auto text-cut-gold font-medium flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          تعديل
                        </button>
                      </div>
                    </div>
                  )}
                {renderContent()}
              </div>
            </div>
          </div>

          <div className="md:hidden flex-shrink-0 border-t border-cut-gold/10 bg-cut-black px-4 py-3 safe-area-pb">
            <div className="flex items-center gap-3" dir="rtl">
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
                  {isNearestMode ? "أقرب حلاق متاح" : barber.specialty || barber.role || "حلاق محترف"}
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
