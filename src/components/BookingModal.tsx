"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ArrowLeft, Check, Loader2, AlertCircle, WifiOff, Zap, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";
import { getSavedClient, saveClient, clearClient } from "@/lib/clientStorage";
import CustomerUpcomingBookings from "./CustomerUpcomingBookings";
import ConfettiBurst from "./ConfettiBurst";
import BookingStepHeader from "./BookingStepHeader";
import BookingInfoPanel from "./BookingInfoPanel";
import BookingCalendar from "./BookingCalendar";
import BookingTimeSlots from "./BookingTimeSlots";
import BookingServiceSelect from "./BookingServiceSelect";
import {
  getBookingConfig,
  getBookingServices,
  getAvailableDays,
  getAvailableSlots,
  createBookingPlan,
  BookingConflictError,
  BookingPlanError,
  type BookingConfigResponse,
  type BookingService,
  type AvailableDay,
  type AvailableSlot,
  type BookingPlanResponse,
  type BookingPlanItem,
} from "@/lib/publicBookingApi";

export interface BarberBookingInfo {
  id?: number;
  name: string;
  image: string;
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
}

type BookingStep = "mode" | "service" | "date" | "time" | "confirm" | "success";
export type BookingMode = "specific" | "nearest";

const steps = [
  { id: "mode", label: "الطريقة", number: 1 },
  { id: "service", label: "الخدمة", number: 2 },
  { id: "date", label: "الموعد", number: 3 },
  { id: "time", label: "الوقت", number: 4 },
  { id: "confirm", label: "تأكيد", number: 5 },
];

// ─── Phone helpers ───────────────────────────────────────────────────────────

function normalizePhoneForLookup(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  return hasPlus ? `+${digits}` : digits;
}

function isPhoneReadyForLookup(input: string): boolean {
  const trimmed = input.trim();
  // No letters allowed
  if (/[a-zA-Z]/.test(trimmed)) return false;
  // + only allowed at start
  if (trimmed.indexOf("+") > 0) return false;
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

// ─────────────────────────────────────────────────────────────────────────────

const BookingModal = ({ open, onOpenChange, barber, initialMode }: BookingModalProps) => {
  // ── API state ──────────────────────────────────────────────────────────────
  const [config, setConfig] = useState<BookingConfigResponse | null>(null);
  const [services, setServices] = useState<BookingService[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Available days state ───────────────────────────────────────────────────
  const [availableDays, setAvailableDays] = useState<AvailableDay[]>([]);
  const [isLoadingDays, setIsLoadingDays] = useState(false);

  // ── Available slots state ──────────────────────────────────────────────────
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // ── Booking state ──────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<BookingStep>(initialMode ? "service" : "mode");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | undefined>();
  const [selectedMode, setSelectedMode] = useState<BookingMode>(initialMode ?? "specific");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedPlan, setConfirmedPlan] = useState<BookingPlanResponse | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // ── Client lookup state ────────────────────────────────────────────────────
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "new" | "returning">("idle");
  const [lookedUpName, setLookedUpName] = useState<string | null>(null);
  const [savedClient, setSavedClient] = useState<{ name: string; phone: string } | null>(null);
  const lastLookedUpPhoneRef = useRef<string | null>(null);
  const lookupAbortRef = useRef<AbortController | null>(null);

  // ── Load saved client when confirm step opens ───────────────────────────────
  useEffect(() => {
    if (currentStep === "confirm") {
      const stored = getSavedClient();
      if (stored) setSavedClient(stored);
    }
  }, [currentStep]);

  // ── Client phone lookup (debounced, validated, cached, international) ──────
  useEffect(() => {
    if (lookupStatus === "returning") return;

    if (!isPhoneReadyForLookup(customerPhone)) {
      setLookupStatus("idle");
      setLookedUpName(null);
      return;
    }

    const normalized = normalizePhoneForLookup(customerPhone);

    // Skip if same normalized phone already looked up
    if (lastLookedUpPhoneRef.current === normalized) return;

    const timer = setTimeout(async () => {
      // Cancel any in-flight request
      lookupAbortRef.current?.abort();
      const controller = new AbortController();
      lookupAbortRef.current = controller;

      lastLookedUpPhoneRef.current = normalized;
      setLookupStatus("loading");
      try {
        const res = await fetch(
          `/api/client/lookup?mobile=${encodeURIComponent(normalized)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (data.ok && data.found) {
          setLookedUpName(data.client.name);
          if (!customerName.trim()) setCustomerName(data.client.name);
          setLookupStatus("found");
          saveClient({ name: data.client.name, phone: normalized });
        } else {
          setLookedUpName(null);
          setLookupStatus("new");
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (process.env.NODE_ENV === "development") {
          console.warn("[lookup] error:", err);
        }
        setLookupStatus("idle");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [customerPhone]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch config + services when modal opens ───────────────────────────────
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchData = async () => {
      setIsLoadingConfig(true);
      setIsLoadingServices(true);
      setApiError(null);

      try {
        const [cfgRes, svcRes] = await Promise.all([
          getBookingConfig(),
          getBookingServices(),
        ]);
        if (cancelled) return;
        setConfig(cfgRes);
        setServices(svcRes.services);
      } catch {
        if (!cancelled) setApiError("تعذر تحميل بيانات الحجز، حاول مرة أخرى");
      } finally {
        if (!cancelled) {
          setIsLoadingConfig(false);
          setIsLoadingServices(false);
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [open]);

  // ── Fetch available days ───────────────────────────────────────────────────
  useEffect(() => {
    if (currentStep !== "date" || selectedServiceIds.length === 0) return;
    let cancelled = false;
    setIsLoadingDays(true);
    setAvailableDays([]);
    const daysParams = {
      serviceIds: selectedServiceIds,
      mode: selectedMode,
      empId: selectedMode === "specific" ? barber.id : undefined,
    };
    if (process.env.NODE_ENV === "development") {
      console.log("[frontend available-days request]", daysParams);
    }
    getAvailableDays(daysParams)
      .then(res => {
        if (cancelled) return;
        if (process.env.NODE_ENV === "development") {
          console.log("[frontend available-days response]", res);
          const day24 = res.days.find(d => d.date === "2026-05-24");
          console.log("[frontend day 2026-05-24]", day24 ?? "NOT FOUND in response");
          const availCount = res.days.filter(d => d.available).length;
          console.log("[frontend available-days] total days:", res.days.length, "available:", availCount);
        }
        setAvailableDays(res.days);
      })
      .catch((err) => {
        if (!cancelled) {
          if (process.env.NODE_ENV === "development") {
            console.error("[frontend available-days] fetch FAILED — setAvailableDays([])", err);
          }
          setAvailableDays([]);
        }
      })
      .finally(() => { if (!cancelled) setIsLoadingDays(false); });
    return () => { cancelled = true; };
  }, [currentStep, selectedServiceIds, selectedMode, barber.id]);

  // ── Fetch available slots ──────────────────────────────────────────────────
  useEffect(() => {
    if (currentStep !== "time" || !selectedDate || selectedServiceIds.length === 0) return;
    let cancelled = false;
    setIsLoadingSlots(true);
    setAvailableSlots([]);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const params = {
      date: dateStr,
      serviceIds: selectedServiceIds,
      mode: selectedMode,
      empId: selectedMode === "specific" ? barber.id : undefined,
    };

    if (process.env.NODE_ENV === "development") {
      console.group("[booking slots] Fetching slots");
      console.log("[booking slots] config:", config ? { slotIntervalMinutes: config.settings.slotIntervalMinutes, minNoticeMinutes: config.settings.minNoticeMinutes, maxBookingDaysAhead: config.settings.maxBookingDaysAhead } : "not loaded");
      console.log("[booking slots] selected barber:", { id: barber.id, name: barber.name });
      console.log("[booking slots] selected services:", selectedServiceIds, selectedServices.map(s => ({ name: s.name, duration: s.durationMinutes })));
      console.log("[booking slots] total duration:", totalDuration, "minutes");
      console.log("[booking slots] request params:", params);
      console.log("[frontend available-slots request]", {
        date: params.date,
        mode: params.mode,
        empId: params.empId,
        serviceIds: params.serviceIds,
      });
    }

    getAvailableSlots(params)
      .then(res => {
        if (cancelled) return;

        if (process.env.NODE_ENV === "development") {
          const allSlots = res.slots;
          const availOnly = allSlots.filter(s => s.available);
          const unavailOnly = allSlots.filter(s => !s.available);
          console.log("[booking slots] API response:", { ok: res.ok, date: res.date, mode: res.mode, empId: res.empId });
          console.log("[booking slots] total slots from API:", allSlots.length);
          console.log("[booking slots] available:", availOnly.length, "unavailable:", unavailOnly.length);
          console.log("[booking slots] first slot:", allSlots[0]);
          console.log("[booking slots] last slot:", allSlots[allSlots.length - 1]);
          console.log("[booking slots] first available:", availOnly[0]);
          console.log("[booking slots] last available:", availOnly[availOnly.length - 1]);

          // Detect interval between consecutive slots
          if (allSlots.length >= 2) {
            const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
            const intervals = new Set<number>();
            for (let i = 1; i < Math.min(allSlots.length, 10); i++) {
              intervals.add(toMin(allSlots[i].time) - toMin(allSlots[i - 1].time));
            }
            console.log("[booking slots] detected interval(s) between slots:", [...intervals].map(m => m + " min"));
            console.log("[booking slots] slot interval source: BACKEND (slots come pre-generated from API, frontend does NOT generate them)");
          }

          // Log sample of unavailable reasons
          if (unavailOnly.length > 0) {
            console.log("[booking slots] unavailable slot reasons (first 5):", unavailOnly.slice(0, 5).map(s => ({ time: s.time, reason: s.reason })));
          }
          console.groupEnd();
        }

        if (process.env.NODE_ENV === "development") {
          const availSlots = res.slots.filter(s => s.available);
          console.log("[frontend available-slots response]", {
            ok: res.ok,
            date: res.date,
            mode: res.mode,
            empId: res.empId,
            totalSlots: res.slots.length,
            availableSlots: availSlots.length,
            sampleAvailable: availSlots.slice(0, 3).map(s => ({ time: s.time, empId: s.empId, barberName: s.barberName })),
          });
          if (availSlots.length === 0) {
            console.warn("[frontend available-slots] ⚠️ NO available slots returned — backend returned empty/all-unavailable. Check backend for this date+empId.");
          }
        }
        if (process.env.NODE_ENV === "development" && selectedMode === "nearest") {
          const sample = res.slots.filter(s => s.available).slice(0, 5);
          console.log("[nearest frontend] available slots sample:", sample.map(s => ({ time: s.time, empId: s.empId, barberName: s.barberName, available: s.available, dayOffset: s.dayOffset })));
        }

        setAvailableSlots(res.slots);
      })
      .catch(() => { if (!cancelled) setAvailableSlots([]); })
      .finally(() => { if (!cancelled) setIsLoadingSlots(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedDate, selectedServiceIds, selectedMode, barber.id]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setCurrentStep(initialMode ? "service" : "mode");
      setSelectedServiceIds([]);
      setSelectedDate(undefined);
      setSelectedTime(undefined);
      setSelectedSlot(undefined);
      setSelectedMode(initialMode ?? "specific");
      setAvailableDays([]);
      setAvailableSlots([]);
      setApiError(null);
      setSubmitError(null);
      setConfirmedPlan(null);
      setCustomerName("");
      setCustomerPhone("");
      setLookupStatus("idle");
      setLookedUpName(null);
      setSavedClient(null);
    }, 300);
  };

  const selectedService = services.find(s => selectedServiceIds.includes(s.id));
  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  const handleServiceSelect = (id: number) => {
    // Main service selection: keep add-on IDs that are not the new main
    const mainNames = ["Hair Cut", "Haircut", "Detailed Cut", "Detail Cut", "DetailedCut", "Haircut & Beard", "Hair & Beard", "Hair cut & Beard", "Hair cut + Beard", "Hair and Beard", "Beard", "Beard Styling & Fade", "Beard Styling", "Zero Beard Shave", "Basic Cut", "Advanced Cut", "Fade Cut"];
    const mainIds = services.filter(s => {
      const norm = s.name.trim().toLowerCase().replace(/[\s_-]+/g, " ").replace(/[&+]/g, " and ").replace(/\s+/g, " ").trim();
      return mainNames.some(mn => {
        const nmn = mn.toLowerCase().replace(/[\s_-]+/g, " ").replace(/[&+]/g, " and ").replace(/\s+/g, " ").trim();
        return norm === nmn || norm.includes(nmn) || nmn.includes(norm);
      });
    }).map(s => s.id);
    // Remove any existing main, keep addons
    const addonIds = selectedServiceIds.filter(sid => !mainIds.includes(sid));
    setSelectedServiceIds([id, ...addonIds]);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setSelectedSlot(undefined);
    setAvailableDays([]);
    setAvailableSlots([]);
  };

  const handleToggleAddon = (id: number) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(sid => sid !== id);
      } else {
        return [...prev, id];
      }
    });
    // Reset date/time since duration changed
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setSelectedSlot(undefined);
    setAvailableDays([]);
    setAvailableSlots([]);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(undefined);
    setSelectedSlot(undefined);
    setAvailableSlots([]);
    setCurrentStep("time");
  };

  const handleNextDay = () => {
    const current = selectedDate ?? new Date();
    const next = new Date(current);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
    setSelectedTime(undefined);
    setSelectedSlot(undefined);
    setAvailableSlots([]);
    // currentStep stays "time" — useEffect will re-fetch slots for the new date
  };

  const handleTimeSelect = (slot: AvailableSlot) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[time slots] selected slot:", slot);
    }
    setSelectedTime(slot.time);
    setSelectedSlot(slot);
    setSubmitError(null);
    setCurrentStep("confirm");
  };

  const handleBack = () => {
    if (currentStep === "service") {
      if (!initialMode) {
        setCurrentStep("mode");
      }
    } else if (currentStep === "date") {
      setCurrentStep("service");
      setSelectedDate(undefined);
    } else if (currentStep === "time") {
      setCurrentStep("date");
      setSelectedTime(undefined);
      setSelectedSlot(undefined);
    } else if (currentStep === "confirm") {
      setCurrentStep("time");
      setSelectedTime(undefined);
      setSelectedSlot(undefined);
    }
  };

  const handleModeSelect = (mode: BookingMode) => {
    setSelectedMode(mode);
    setCurrentStep("service");
  };

  const getActualBookingDate = (date: Date, slot?: AvailableSlot): Date => {
    if (slot?.dayOffset === 1) {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      return next;
    }
    return date;
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    if (!selectedDate || !selectedTime || selectedServiceIds.length === 0) return;

    // Determine empId based on mode:
    // - nearest: use selectedSlot.empId (backend assigns barber per slot)
    // - specific: use barber.id (user chose barber explicitly)
    const empIdToUse =
      selectedMode === "nearest"
        ? selectedSlot?.empId ?? undefined
        : (selectedSlot?.empId ?? barber.id);

    const actualDate = getActualBookingDate(selectedDate, selectedSlot);
    const dateStr = format(actualDate, "yyyy-MM-dd");
    const dayOffset = selectedSlot?.dayOffset ?? 0;

    if (process.env.NODE_ENV === "development") {
      console.log("[nearest frontend] selected mode:", selectedMode);
      console.log("[nearest frontend] selected slot:", selectedSlot);
      console.log("[nearest frontend] selectedSlot empId:", selectedSlot?.empId);
      console.log("[nearest frontend] selectedSlot barberName:", selectedSlot?.barberName);
      console.log("[nearest frontend] selectedSlot available:", selectedSlot?.available);
      console.log("[booking submit] dayOffset:", dayOffset);
      console.log("[booking submit] actualBookingDate:", dateStr);
      console.log("[booking submit] serviceIds:", selectedServiceIds);
      console.log("[booking submit] empIdToUse:", empIdToUse);
      if (selectedMode === "nearest" && !selectedSlot?.empId) {
        console.warn("[nearest frontend] ⚠️ nearest slot missing empId! Full slot:", selectedSlot);
      }
    }

    const resolvedName = customerName.trim() || (savedClient?.name ?? "");
    const resolvedPhone = customerPhone.trim() || (savedClient?.phone ?? "");
    const payload = {
      customer: { name: resolvedName, phone: resolvedPhone },
      serviceIds: selectedServiceIds,
      date: dateStr,
      time: selectedTime,
      dayOffset,
      mode: selectedMode,
      empId: empIdToUse,
      notes: "",
    };

    if (process.env.NODE_ENV === "development") {
      console.log("[booking submit]", {
        submitSource: "final_confirm",
        payloadToPlan: {
          date: dateStr,
          time: selectedTime,
          dayOffset,
          mode: selectedMode,
          empId: empIdToUse,
          serviceIds: selectedServiceIds,
          customer: { name: customerName.trim(), phone: customerPhone.trim() },
        },
      });
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await createBookingPlan(payload);

      if (process.env.NODE_ENV === "development") {
        console.log("[booking submit] plan response:", res);
      }

      const cleanPhone = resolvedPhone.replace(/\D/g, "");
      saveClient({ name: resolvedName, phone: cleanPhone });
      if (typeof window !== "undefined") {
        localStorage.setItem("cut_customer_phone", cleanPhone);
      }
      setConfirmedPlan(res);
      setCurrentStep("success");
      setConfettiTrigger(prev => prev + 1);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[nearest frontend] booking plan error:", err);
        console.log("[nearest frontend] error type:", err instanceof BookingConflictError ? "BookingConflictError" : err instanceof BookingPlanError ? "BookingPlanError" : "Unknown");
        if (err instanceof BookingConflictError || err instanceof BookingPlanError) {
          console.log("[nearest frontend] server message:", (err as { serverMessage?: string }).serverMessage);
        }
      }
      if (err instanceof BookingConflictError) {
        setAvailableSlots([]);
        setCurrentStep("time");
        setSelectedTime(undefined);
        setSelectedSlot(undefined);
        setSubmitError(
          (err as BookingConflictError).serverMessage ??
          "المعاد لم يعد متاحًا، من فضلك اختر ميعادًا آخر."
        );
      } else if (err instanceof BookingPlanError) {
        setSubmitError(
          (err as BookingPlanError).serverMessage ??
          "تعذر تأكيد الحجز، يرجى اختيار ميعاد آخر أو تعديل الخدمات."
        );
      } else {
        setSubmitError("حدث خطأ أثناء الحجز، يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateAr = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("ar-EG", {
      weekday: "long", month: "long", day: "numeric",
    }).format(date);
  };

  const maxDaysAhead = config?.settings?.maxBookingDaysAhead ?? 60;

  // ── Step active id for header ──────────────────────────────────────────────
  const activeStepId = currentStep === "success" ? "confirm" : currentStep;
  const isNearestMode = selectedMode === "nearest";
  const displayBarberName = isNearestMode ? (selectedSlot?.barberName ?? "أقرب حلاق متاح") : barber.name;

  // ── Inner render ───────────────────────────────────────────────────────────
  const renderContent = () => {
    // Global loading
    if (isLoadingConfig || isLoadingServices) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4" dir="rtl">
          <Loader2 className="w-8 h-8 animate-spin text-cut-gold" />
          <p className="text-cut-black/50 text-sm">جاري تحميل بيانات الحجز...</p>
        </div>
      );
    }

    // API error
    if (apiError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 p-6 text-center" dir="rtl">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <WifiOff className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-cut-black/85 font-medium">{apiError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg border border-cut-gold/15 text-sm text-cut-black/70 hover:bg-cut-black/[0.04] transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    // Booking disabled - check API config or environment variable override
    const envBookingEnabled = process.env.NEXT_PUBLIC_BOOKING_ENABLED !== "false";
    const isBookingEnabled = config?.salon?.bookingEnabled !== false && envBookingEnabled;

    if (!isBookingEnabled) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 p-6 text-center" dir="rtl">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-amber-400" />
          </div>
          <p className="text-cut-black/85 font-semibold text-base">الحجز معطل اليوم</p>
          <p className="text-cut-black/50 text-sm">يرجى التواصل مع الصالون مباشرة للحجز</p>
        </div>
      );
    }

    switch (currentStep) {
      case "mode":
        return (
          <div className="p-5 md:p-6" dir="rtl">
            <div className="mb-5">
              <h3 className="text-lg font-heading font-bold text-cut-black mb-1">تحب تحجز إزاي؟</h3>
              <p className="text-cut-black/50 text-xs">اختار الطريقة اللي تناسبك</p>
            </div>

            <div className="space-y-3">
              {/* Nearest barber card */}
              <button
                onClick={() => handleModeSelect("nearest")}
                className="w-full rounded-2xl border border-cut-gold/20 bg-gradient-to-l from-cut-gold/[0.06] to-transparent p-5 text-right transition-all duration-200 group cursor-pointer hover:border-cut-gold/50 hover:shadow-[0_0_24px_rgba(164,136,121,0.12)]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-cut-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-cut-gold/20 transition-colors">
                    <Zap className="w-6 h-6 text-cut-gold" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-heading font-bold text-base text-cut-black">أقرب حلاق متاح</h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cut-gold/10 text-cut-gold border border-cut-gold/15">أسرع</span>
                    </div>
                    <p className="text-cut-black/60 text-xs leading-relaxed">النظام يختارلك أقرب ميعاد حسب المتاح.</p>
                    <p className="text-cut-black/50 text-[11px] mt-2 bg-cut-black/[0.04] rounded-lg px-3 py-1.5 border border-cut-gold/10">مناسب لو مش فارق معاك مين الحلاق وعاوز أقرب وقت.</p>
                  </div>
                </div>
              </button>

              {/* Specific barber card */}
              <button
                onClick={() => handleModeSelect("specific")}
                className="w-full rounded-2xl border border-cut-gold/15 bg-cut-ivory p-5 text-right transition-all duration-200 group cursor-pointer hover:border-cut-gold/40 hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-cut-black/[0.04] flex items-center justify-center flex-shrink-0 group-hover:bg-cut-gold/10 transition-colors">
                    <UserCheck className="w-6 h-6 text-cut-black/50 group-hover:text-cut-gold transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-heading font-bold text-base text-cut-black mb-1">اختار الحلاق بنفسك</h4>
                    <p className="text-cut-black/60 text-xs leading-relaxed">لو عندك حلاق مفضل، اختاره واحجز معاه.</p>
                    {barber.name && (
                      <div className="flex items-center gap-2 mt-2">
                        <img src={barber.image} alt={barber.name} className="w-6 h-6 rounded-full object-cover object-top border border-cut-gold/20" />
                        <span className="text-cut-black/70 text-xs font-medium">{barber.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      case "service":
        return (
          <div dir="rtl">
            <BookingServiceSelect
              services={services}
              selectedIds={selectedServiceIds}
              onSelect={handleServiceSelect}
              onToggleAddon={handleToggleAddon}
              isLoading={isLoadingServices}
            />

            {/* Continue button */}
            <div className="px-6 pb-6">
              {selectedServiceIds.length > 0 && (
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-cut-black/60 text-xs">
                    {selectedServices.length} خدمة · {totalDuration} دقيقة
                  </span>
                  <span className="text-cut-gold font-bold text-sm">{totalPrice} جنيه</span>
                </div>
              )}
              <button
                onClick={() => setCurrentStep("date")}
                disabled={selectedServiceIds.length === 0}
                className="w-full py-3 rounded-xl bg-cut-gold text-black font-bold hover:bg-cut-gold/80 transition-colors shadow-md shadow-cut-gold/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                متابعة
              </button>
              {!initialMode && (
                <button
                  onClick={handleBack}
                  className="w-full mt-2 py-2.5 rounded-xl border border-cut-gold/15 text-cut-black/60 font-medium hover:bg-cut-black/[0.04] transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  رجوع لاختيار الطريقة
                </button>
              )}
            </div>
          </div>
        );

      case "date":
        return (
          <div dir="rtl">
            <BookingCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              availableDays={availableDays}
              isLoading={isLoadingDays}
              maxDaysAhead={maxDaysAhead}
            />
            <div className="px-6 pb-6">
              <button
                onClick={handleBack}
                className="w-full py-3 rounded-xl border border-cut-gold/15 text-cut-black/70 font-medium hover:bg-cut-black/[0.04] transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع للخدمات
              </button>
            </div>
          </div>
        );

      case "time":
        return (
          <div dir="rtl">
            {submitError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
                {submitError}
              </div>
            )}
            <BookingTimeSlots
              selectedTime={selectedTime}
              selectedSlot={selectedSlot}
              onTimeSelect={handleTimeSelect}
              onNextDay={handleNextDay}
              onSwitchToNearest={selectedMode === "specific" ? () => {
                setSelectedMode("nearest");
                setSelectedDate(undefined);
                setSelectedTime(undefined);
                setSelectedSlot(undefined);
                setAvailableSlots([]);
                setAvailableDays([]);
                setCurrentStep("date");
              } : undefined}
              slots={availableSlots}
              isLoading={isLoadingSlots}
            />
            <div className="px-6 pb-6">
              <button
                onClick={handleBack}
                className="w-full py-3 rounded-xl border border-cut-gold/15 text-cut-black/70 font-medium hover:bg-cut-black/[0.04] transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع للتاريخ
              </button>
            </div>
          </div>
        );

      case "confirm": {
        const confirmBarberName = isNearestMode ? (selectedSlot?.barberName ?? "أقرب حلاق متاح") : (selectedSlot?.barberName ?? barber.name);
        const slotDuration = selectedSlot?.durationMinutes ?? selectedService?.durationMinutes;
        const slotLabel = selectedSlot?.label ?? selectedTime;
        const canSubmit =
          (customerName.trim().length >= 2 && customerPhone.trim().length >= 8) ||
          (savedClient != null && lookupStatus === "idle");
        return (
          <div className="p-6" dir="rtl">
            <h3 className="text-xl font-heading font-bold text-cut-black mb-4">تأكيد الحجز</h3>

            {/* Returning client card */}
            {savedClient && lookupStatus === "idle" && (
              <div className="mb-4 rounded-xl bg-cut-burgundy-dark border border-cut-bronze/25 overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-cut-ivory/65 text-[11px] mb-0.5">آخر مرة حجزت كـ:</p>
                    <p className="text-cut-ivory font-bold text-sm">{savedClient.name}</p>
                    <p className="text-cut-ivory/65 text-xs" dir="ltr">{savedClient.phone}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCustomerName(savedClient.name);
                      setCustomerPhone(savedClient.phone);
                      setLookedUpName(savedClient.name);
                      setLookupStatus("returning");
                      setSavedClient(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cut-gold text-cut-black text-xs font-bold hover:bg-cut-gold/80 transition-colors flex-shrink-0"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    نعم، أنا
                  </button>
                </div>
              </div>
            )}

            {/* Customer fields */}
            <div className="space-y-3 mb-5">
              {/* "Book for someone else" toggle — only shown when saved client is active */}
              {savedClient && lookupStatus === "idle" && (
                <button
                  onClick={() => { clearClient(); setSavedClient(null); }}
                  className="flex items-center gap-1.5 text-cut-black/55 hover:text-cut-black text-xs transition-colors w-full text-right"
                >
                  <UserX className="w-3.5 h-3.5 flex-shrink-0" />
                  حجز لشخص آخر؟
                </button>
              )}

              {/* Welcome message after confirming returning client */}
              {lookupStatus === "returning" && lookedUpName && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cut-bronze/10 border border-cut-bronze/25">
                  <UserCheck className="w-4 h-4 text-cut-bronze flex-shrink-0" />
                  <span className="text-cut-warm-beige text-sm font-medium">مرحباً، {lookedUpName} 👋</span>
                </div>
              )}

              {/* Phone field — hidden while saved-client prompt or returning */}
              {!(savedClient && lookupStatus === "idle") && lookupStatus !== "returning" && (
                <div>
                  <label className="block text-xs font-medium text-cut-black/70 mb-1">رقم الهاتف</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="cut-input pr-10"
                      dir="ltr"
                    />
                    {lookupStatus === "loading" && (
                      <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cut-gold animate-spin" />
                    )}
                    {lookupStatus === "found" && (
                      <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cut-bronze" />
                    )}
                  </div>
                </div>
              )}

              {/* Lookup result */}
              {lookupStatus === "found" && lookedUpName && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cut-bronze/10 border border-cut-bronze/25">
                  <UserCheck className="w-4 h-4 text-cut-bronze flex-shrink-0" />
                  <span className="text-cut-warm-beige text-sm font-medium">{lookedUpName}</span>
                </div>
              )}
              {lookupStatus === "new" && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cut-gold/10 border border-cut-gold/20">
                  <AlertCircle className="w-4 h-4 text-cut-gold flex-shrink-0" />
                  <span className="text-cut-gold text-sm">عميل جديد — أول مرة؟ 👋</span>
                </div>
              )}

              {/* Name field — only for new clients who need to enter their name */}
              {lookupStatus === "new" && (
                <div>
                  <label className="block text-xs font-medium text-cut-black/70 mb-1">الاسم</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="اكتب اسمك"
                    className="cut-input"
                    dir="rtl"
                  />
                </div>
              )}
            </div>

            <div className="bg-cut-black/[0.04] rounded-xl p-5 mb-4 border border-cut-gold/15 space-y-4">
              {/* Barber */}
              <div className="flex items-center gap-4">
                {isNearestMode ? (
                  <div className="w-12 h-12 rounded-full bg-cut-gold/10 flex items-center justify-center border-2 border-cut-gold/30">
                    <Zap className="w-5 h-5 text-cut-gold" />
                  </div>
                ) : (
                  <img
                    src={barber.image}
                    alt={confirmBarberName}
                    className="w-12 h-12 rounded-full object-cover object-top border-2 border-cut-gold/30"
                  />
                )}
                <div>
                  <h4 className="font-bold text-cut-black text-sm">{confirmBarberName}</h4>
                  <p className="text-cut-black/50 text-xs">{isNearestMode ? "أقرب حلاق متاح" : (barber.specialty || barber.role || "حلاق محترف")}</p>
                </div>
              </div>

              {/* Booking mode */}
              <div className="flex justify-between items-center pt-2">
                <span className="font-medium text-cut-black/90 text-sm">
                  {isNearestMode ? "أقرب حلاق متاح" : "اختيار حلاق"}
                </span>
                <span className="text-cut-black/50 text-xs">طريقة الحجز</span>
              </div>

              <div className="pt-3 border-t border-cut-gold/15 space-y-2.5">
                {selectedServices.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-cut-black/90 text-sm">{selectedServices[0].name}</span>
                      <span className="text-cut-black/50 text-xs">الخدمة</span>
                    </div>
                    {selectedServices.length > 1 && (
                      <div className="mt-1 space-y-1">
                        {selectedServices.slice(1).map(s => (
                          <div key={s.id} className="flex justify-between items-center">
                            <span className="text-cut-black/70 text-xs">+ {s.name}</span>
                            <span className="text-cut-black/50 text-[10px]">إضافة</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {selectedDate && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-cut-black/90 text-sm">{formatDateAr(selectedDate)}</span>
                    <span className="text-cut-black/50 text-xs">التاريخ</span>
                  </div>
                )}
                {slotLabel && (
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-cut-black/90 text-sm">{slotLabel}</span>
                      <span className="text-cut-black/50 text-xs">الوقت</span>
                    </div>
                    {selectedSlot?.dayOffset === 1 && (
                      <p className="text-[11px] text-cut-gold mt-1">بعد منتصف الليل — يُسجل بتاريخ اليوم التالي</p>
                    )}
                  </div>
                )}
                {selectedServices.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-cut-gold text-sm">
                      {totalPrice} جنيه
                    </span>
                    <span className="text-cut-black/50 text-xs">الإجمالي</span>
                  </div>
                )}
                {totalDuration > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-cut-black/90 text-sm">{slotDuration ?? totalDuration} دقيقة</span>
                    <span className="text-cut-black/50 text-xs">المدة</span>
                  </div>
                )}
              </div>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center" dir="rtl">
                {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 px-4 rounded-xl border border-cut-gold/15 text-cut-black/70 font-medium hover:bg-cut-black/[0.04] transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting || !canSubmit}
                className="flex-[2] py-3 px-4 rounded-xl bg-cut-gold text-black font-bold hover:bg-cut-gold/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cut-gold/20"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />جاري تسجيل الخدمات...</>
                ) : "تأكيد الحجز"}
              </button>
            </div>
          </div>
        );
      }

      case "success": {
        const plan = confirmedPlan?.plan ?? [];
        const primaryEmpName = plan[0]?.empName ?? selectedSlot?.barberName ?? barber.name;
        const selectedEmpId = selectedSlot?.empId ?? barber.id;

        const formatPlanTime = (t: string) => {
          const [hStr, mStr] = t.split(":");
          const h = parseInt(hStr, 10);
          const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
          const ampm = h >= 12 ? "م" : "ص";
          return `${h12}:${mStr} ${ampm}`;
        };

        return (
          <div className="p-6 text-center" dir="rtl">
            <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-5">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-cut-black mb-2">تم تأكيد الحجز!</h3>
            <p className="text-cut-black/60 mb-1 text-sm leading-relaxed">
              تم حجز موعدك مع <strong className="text-cut-black/90">{primaryEmpName}</strong> بنجاح.
            </p>
            {customerName.trim() && (
              <p className="text-cut-black/50 text-xs mb-2">باسم: {customerName.trim()}</p>
            )}

            {/* Booking codes */}
            {confirmedPlan?.bookingCodes && confirmedPlan.bookingCodes.length > 0 && (
              <div className="mb-5">
                {confirmedPlan.bookingCodes.length === 1 ? (
                  <p className="text-cut-gold font-bold text-sm">
                    كود الحجز: {confirmedPlan.bookingCodes[0]}
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-cut-black/60 text-xs">أرقام الحجز:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {confirmedPlan.bookingCodes.map(code => (
                        <span key={code} className="inline-block bg-cut-gold/10 text-cut-gold font-bold text-sm px-3 py-1 rounded-lg border border-cut-gold/20">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Plan Timeline */}
            {plan.length > 0 && (
              <div className="bg-cut-black/[0.04] rounded-xl p-4 mb-4 text-right border border-cut-gold/10">
                <p className="text-cut-black/50 text-[10px] font-bold uppercase tracking-widest mb-3">تفاصيل الموعد</p>
                <div className="space-y-0">
                  {plan.map((item: BookingPlanItem, idx: number) => {
                    const isRerouted = selectedEmpId != null && item.empId !== selectedEmpId;
                    const isLast = idx === plan.length - 1;
                    return (
                      <div key={item.bookingId} className="flex gap-3">
                        {/* Timeline dot + line */}
                        <div className="flex flex-col items-center pt-0.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-cut-gold border-2 border-cut-gold/30 flex-shrink-0" />
                          {!isLast && <div className="w-px flex-1 bg-gray-200 my-0.5" />}
                        </div>
                        {/* Content */}
                        <div className={`flex-1 ${!isLast ? "pb-4" : "pb-1"}`}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-bold text-cut-black text-sm">{item.serviceName}</span>
                            <span className="text-cut-gold font-bold text-xs tabular-nums">{formatPlanTime(item.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-cut-black/60">
                            <span>{item.empName}</span>
                            <span className="text-cut-black/35">·</span>
                            <span>{item.durationMinutes} دقيقة</span>
                            {item.price > 0 && (
                              <>
                                <span className="text-cut-black/35">·</span>
                                <span>{item.price} جنيه</span>
                              </>
                            )}
                          </div>
                          {isRerouted && (
                            <p className="text-[11px] text-amber-600 bg-amber-50 rounded-md px-2 py-0.5 mt-1 inline-block border border-amber-100">
                              تم توجيه هذه الخدمة للمتخصص المتاح
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="bg-cut-black/[0.04] rounded-xl p-4 mb-5 text-right border border-cut-gold/10 space-y-2">
              {confirmedPlan?.totalDurationMinutes != null && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-cut-black/90 text-sm">{confirmedPlan.totalDurationMinutes} دقيقة</span>
                  <span className="text-cut-black/50 text-xs">إجمالي المدة</span>
                </div>
              )}
              {confirmedPlan?.totalPrice != null && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-cut-gold text-sm">{confirmedPlan.totalPrice} جنيه</span>
                  <span className="text-cut-black/50 text-xs">الإجمالي</span>
                </div>
              )}
              {plan[0]?.date && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-cut-black/90 text-sm">
                    {formatDateAr(new Date(plan[0].date + "T00:00:00"))}
                  </span>
                  <span className="text-cut-black/50 text-xs">التاريخ</span>
                </div>
              )}
            </div>

            {confirmedPlan?.message && (
              <p className="text-cut-black/60 text-xs mb-4">{confirmedPlan.message}</p>
            )}

            <button
              onClick={() => {
                setConfettiTrigger(prev => prev + 1);
                setTimeout(handleClose, 600);
              }}
              className="w-full py-3 px-4 rounded-xl bg-cut-gold text-black font-bold hover:bg-cut-gold/80 transition-colors shadow-md shadow-cut-gold/20"
            >
              رائع، شكراً!
            </button>
          </div>
        );
      }
    }
  };

  return (
    <>
      <ConfettiBurst trigger={confettiTrigger} particleCount={55} />
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-4xl w-[95vw] max-h-[92vh] p-0 bg-cut-ivory border border-cut-gold/20 overflow-hidden gap-0 rounded-2xl shadow-2xl"
          dir="rtl"
        >
          <VisuallyHidden>
            <DialogTitle>{isNearestMode ? "احجز أقرب ميعاد" : `احجز مع ${barber.name}`}</DialogTitle>
          </VisuallyHidden>
          <DialogDescription className="sr-only">
            واجهة حجز موعد في Cut Salon لاختيار الخدمة والحلاق واليوم والساعة.
          </DialogDescription>

          {/* Dark Header */}
          <BookingStepHeader
            steps={initialMode ? steps.filter(s => s.id !== "mode") : steps}
            currentStep={activeStepId}
            barberName={displayBarberName}
            onClose={handleClose}
          />

          {/* Main Content */}
          <div className="flex flex-col md:flex-row overflow-hidden" style={{ maxHeight: "calc(92vh - 130px)" }}>

            {/* Info Panel — desktop only */}
            <div className="hidden md:block w-72 flex-shrink-0 border-r border-cut-gold/15 overflow-y-auto">
              <BookingInfoPanel
                barber={barber}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                service={selectedServices.map(s => s.name).join(" + ") || undefined}
                servicePrice={totalPrice || undefined}
                serviceDuration={totalDuration || undefined}
                mode={selectedMode}
              />
            </div>

            {/* Selection area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Mobile mini-bar */}
              {currentStep !== "service" && currentStep !== "success" && (selectedServiceIds.length > 0 || selectedDate || selectedTime) && (
                <div className="md:hidden bg-cut-black/[0.04] px-4 py-2.5 border-b border-cut-gold/10 flex-shrink-0">
                  <div className="flex items-center gap-2 text-xs" dir="rtl">
                    {selectedService && <span className="text-cut-black/70 font-medium">{selectedService.name}</span>}
                    {selectedService && selectedDate && <span className="text-cut-black/35">|</span>}
                    {selectedDate && (
                      <span className="text-cut-black/70">
                        {selectedDate.toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                      </span>
                    )}
                    {selectedDate && selectedTime && <span className="text-cut-black/35">|</span>}
                    {selectedTime && <span className="text-cut-black/70 font-medium">{selectedTime}</span>}
                    <button
                      onClick={handleBack}
                      className="mr-auto text-cut-gold font-medium flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      تعديل
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto bg-cut-ivory">
                {(currentStep === "mode" || currentStep === "service") && (
                  <CustomerUpcomingBookings />
                )}
                {renderContent()}
              </div>
            </div>
          </div>

          {/* Mobile bottom barber bar */}
          <div className="md:hidden flex-shrink-0 border-t border-cut-gold/10 bg-cut-black px-4 py-3">
            <div className="flex items-center gap-3" dir="rtl">
              {isNearestMode ? (
                <div className="w-9 h-9 rounded-full bg-cut-gold/10 flex items-center justify-center border border-cut-gold/30 flex-shrink-0">
                  <Zap className="w-4 h-4 text-cut-gold" />
                </div>
              ) : (
                <img
                  src={barber.image}
                  alt={barber.name}
                  className="w-9 h-9 rounded-full object-cover object-top border border-cut-gold/30 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-cut-ivory text-sm leading-none">{displayBarberName}</p>
                <p className="text-cut-ivory/50 text-xs mt-0.5">{isNearestMode ? "أقرب حلاق متاح" : (barber.specialty || barber.role || "حلاق محترف")}</p>
              </div>
              {selectedDate && selectedTime && currentStep === "time" && (
                <button
                  onClick={() => setCurrentStep("confirm")}
                  className="px-4 py-2 rounded-lg bg-cut-gold text-black text-sm font-bold flex-shrink-0"
                >
                  متابعة
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BookingModal;
