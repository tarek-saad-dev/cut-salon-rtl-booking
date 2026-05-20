"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ArrowLeft, Check, Loader2, AlertCircle, WifiOff, Zap, UserCheck } from "lucide-react";
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
  createBooking,
  BookingConflictError,
  type BookingConfigResponse,
  type BookingService,
  type AvailableDay,
  type AvailableSlot,
  type CreatedBooking,
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
  const [confirmedBooking, setConfirmedBooking] = useState<CreatedBooking | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

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
    getAvailableDays({
      serviceIds: selectedServiceIds,
      mode: selectedMode,
      empId: selectedMode === "specific" ? barber.id : undefined,
    })
      .then(res => { if (!cancelled) setAvailableDays(res.days); })
      .catch(() => { if (!cancelled) setAvailableDays([]); })
      .finally(() => { if (!cancelled) setIsLoadingDays(false); });
    return () => { cancelled = true; };
  }, [currentStep, selectedServiceIds, selectedMode, barber.id]);

  // ── Fetch available slots ──────────────────────────────────────────────────
  useEffect(() => {
    if (currentStep !== "time" || !selectedDate || selectedServiceIds.length === 0) return;
    let cancelled = false;
    setIsLoadingSlots(true);
    setAvailableSlots([]);
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

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
      setConfirmedBooking(null);
      setCustomerName("");
      setCustomerPhone("");
    }, 300);
  };

  const selectedService = services.find(s => selectedServiceIds.includes(s.id));
  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  const handleServiceSelect = (id: number) => {
    // Main service selection: keep add-on IDs that are not the new main
    const mainNames = ["Detailed Cut", "Detail Cut", "DetailedCut", "Haircut & Beard", "Hair & Beard", "Hair cut & Beard", "Hair cut + Beard", "Hair and Beard", "Beard", "Beard Styling & Fade", "Beard Styling", "Zero Beard Shave", "Basic Cut", "Advanced Cut"];
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

  const handleTimeSelect = (slot: AvailableSlot) => {
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

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || selectedServiceIds.length === 0) return;

    // Determine the empId to send — prefer slot.empId if present (covers both modes)
    const empIdToUse = selectedSlot?.empId ?? barber.id;

    if (empIdToUse == null) return;

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await createBooking({
        customer: { name: customerName.trim(), phone: customerPhone.trim() },
        serviceIds: selectedServiceIds,
        date: dateStr,
        time: selectedTime,
        mode: selectedMode,
        empId: empIdToUse,
        notes: "",
      });
      setConfirmedBooking(res.booking);
      setCurrentStep("success");
    } catch (err) {
      if (err instanceof BookingConflictError) {
        // Clear slots + go back to time so useEffect re-fetches fresh slots
        setAvailableSlots([]);
        setCurrentStep("time");
        setSelectedTime(undefined);
        setSelectedSlot(undefined);
        setSubmitError("المعاد لم يعد متاحًا، من فضلك اختر ميعادًا آخر.");
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
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
          <p className="text-gray-400 text-sm">جاري تحميل بيانات الحجز...</p>
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
          <p className="text-gray-700 font-medium">{apiError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    // Booking disabled
    if (config && !config.salon.bookingEnabled) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 p-6 text-center" dir="rtl">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-amber-400" />
          </div>
          <p className="text-gray-700 font-semibold text-base">الحجز الإلكتروني غير متاح حالياً</p>
          <p className="text-gray-400 text-sm">يرجى التواصل مع الصالون مباشرة للحجز</p>
        </div>
      );
    }

    switch (currentStep) {
      case "mode":
        return (
          <div className="p-5 md:p-6" dir="rtl">
            <div className="mb-5">
              <h3 className="text-lg font-heading font-bold text-gray-900 mb-1">تحب تحجز إزاي؟</h3>
              <p className="text-gray-400 text-xs">اختار الطريقة اللي تناسبك</p>
            </div>

            <div className="space-y-3">
              {/* Nearest barber card */}
              <button
                onClick={() => handleModeSelect("nearest")}
                className="w-full rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-l from-[#D4AF37]/[0.06] to-transparent p-5 text-right transition-all duration-200 group cursor-pointer hover:border-[#D4AF37]/50 hover:shadow-[0_0_24px_rgba(212,175,55,0.12)]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37]/20 transition-colors">
                    <Zap className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-heading font-bold text-base text-gray-900">أقرب حلاق متاح</h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/15">أسرع</span>
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed">النظام يختارلك أقرب ميعاد حسب المتاح.</p>
                    <p className="text-gray-400 text-[11px] mt-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">مناسب لو مش فارق معاك مين الحلاق وعاوز أقرب وقت.</p>
                  </div>
                </div>
              </button>

              {/* Specific barber card */}
              <button
                onClick={() => handleModeSelect("specific")}
                className="w-full rounded-2xl border border-gray-150 bg-white p-5 text-right transition-all duration-200 group cursor-pointer hover:border-[#D4AF37]/40 hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37]/10 transition-colors">
                    <UserCheck className="w-6 h-6 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-heading font-bold text-base text-gray-900 mb-1">اختار الحلاق بنفسك</h4>
                    <p className="text-gray-500 text-xs leading-relaxed">لو عندك حلاق مفضل، اختاره واحجز معاه.</p>
                    {barber.name && (
                      <div className="flex items-center gap-2 mt-2">
                        <img src={barber.image} alt={barber.name} className="w-6 h-6 rounded-full object-cover object-top border border-[#D4AF37]/20" />
                        <span className="text-gray-600 text-xs font-medium">{barber.name}</span>
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
                  <span className="text-gray-500 text-xs">
                    {selectedServices.length} خدمة · {totalDuration} دقيقة
                  </span>
                  <span className="text-[#D4AF37] font-bold text-sm">{totalPrice} جنيه</span>
                </div>
              )}
              <button
                onClick={() => setCurrentStep("date")}
                disabled={selectedServiceIds.length === 0}
                className="w-full py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#C4A030] transition-colors shadow-md shadow-[#D4AF37]/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                متابعة
              </button>
              {!initialMode && (
                <button
                  onClick={handleBack}
                  className="w-full mt-2 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
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
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
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
              onTimeSelect={handleTimeSelect}
              slots={availableSlots}
              isLoading={isLoadingSlots}
            />
            <div className="px-6 pb-6">
              <button
                onClick={handleBack}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
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
          customerName.trim().length >= 2 && customerPhone.trim().length >= 8;
        return (
          <div className="p-6" dir="rtl">
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">تأكيد الحجز</h3>

            {/* Customer fields */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">الاسم</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="مثال: تارق سعد"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-colors"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="مثال: 01XXXXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-colors"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 mb-4 border border-gray-100 space-y-4">
              {/* Barber */}
              <div className="flex items-center gap-4">
                {isNearestMode ? (
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border-2 border-[#D4AF37]/30">
                    <Zap className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                ) : (
                  <img
                    src={barber.image}
                    alt={confirmBarberName}
                    className="w-12 h-12 rounded-full object-cover object-top border-2 border-[#D4AF37]/30"
                  />
                )}
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{confirmBarberName}</h4>
                  <p className="text-gray-400 text-xs">{isNearestMode ? "أقرب حلاق متاح" : (barber.specialty || barber.role || "حلاق محترف")}</p>
                </div>
              </div>

              {/* Booking mode */}
              <div className="flex justify-between items-center pt-2">
                <span className="font-medium text-gray-800 text-sm">
                  {isNearestMode ? "أقرب حلاق متاح" : "اختيار حلاق"}
                </span>
                <span className="text-gray-400 text-xs">طريقة الحجز</span>
              </div>

              <div className="pt-3 border-t border-gray-200 space-y-2.5">
                {selectedServices.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800 text-sm">{selectedServices[0].name}</span>
                      <span className="text-gray-400 text-xs">الخدمة</span>
                    </div>
                    {selectedServices.length > 1 && (
                      <div className="mt-1 space-y-1">
                        {selectedServices.slice(1).map(s => (
                          <div key={s.id} className="flex justify-between items-center">
                            <span className="text-gray-600 text-xs">+ {s.name}</span>
                            <span className="text-gray-400 text-[10px]">إضافة</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {selectedDate && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800 text-sm">{formatDateAr(selectedDate)}</span>
                    <span className="text-gray-400 text-xs">التاريخ</span>
                  </div>
                )}
                {slotLabel && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800 text-sm">{slotLabel}</span>
                    <span className="text-gray-400 text-xs">الوقت</span>
                  </div>
                )}
                {selectedServices.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#D4AF37] text-sm">
                      {totalPrice} جنيه
                    </span>
                    <span className="text-gray-400 text-xs">الإجمالي</span>
                  </div>
                )}
                {totalDuration > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800 text-sm">{slotDuration ?? totalDuration} دقيقة</span>
                    <span className="text-gray-400 text-xs">المدة</span>
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
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting || !canSubmit}
                className="flex-[2] py-3 px-4 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#C4A030] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#D4AF37]/20"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />جاري التأكيد...</>
                ) : "تأكيد الحجز"}
              </button>
            </div>
          </div>
        );
      }

      case "success": {
        const displayBarber =
          confirmedBooking?.barberName ??
          selectedSlot?.barberName ??
          barber.name;
        return (
          <div className="p-6 text-center" dir="rtl">
            <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">تم تأكيد الحجز!</h3>
            <p className="text-gray-500 mb-1 text-sm leading-relaxed">
              تم حجز موعدك مع <strong className="text-gray-800">{displayBarber}</strong> بنجاح.
            </p>
            {customerName.trim() && (
              <p className="text-gray-400 text-xs mb-2">باسم: {customerName.trim()}</p>
            )}
            {confirmedBooking?.bookingCode && (
              <p className="text-[#D4AF37] font-bold text-sm mb-6">
                كود الحجز: {confirmedBooking.bookingCode}
              </p>
            )}

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-right border border-gray-100 space-y-2">
              {(confirmedBooking?.services?.[0] ?? selectedService?.name) && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 text-sm">
                    {confirmedBooking?.services?.[0] ?? selectedService?.name}
                  </span>
                  <span className="text-gray-400 text-xs">الخدمة</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800 text-sm">
                  {confirmedBooking?.date ? formatDateAr(new Date(confirmedBooking.date + "T00:00:00")) : formatDateAr(selectedDate)}
                </span>
                <span className="text-gray-400 text-xs">التاريخ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800 text-sm">
                  {confirmedBooking?.time
                    ? (selectedSlot?.label ?? confirmedBooking.time)
                    : (selectedSlot?.label ?? selectedTime)}
                </span>
                <span className="text-gray-400 text-xs">الوقت</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 px-4 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#C4A030] transition-colors shadow-md shadow-[#D4AF37]/20"
            >
              رائع، شكراً!
            </button>
          </div>
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[92vh] p-0 bg-white border-0 overflow-hidden gap-0 rounded-2xl shadow-2xl"
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
          <div className="hidden md:block w-72 flex-shrink-0 border-r border-gray-100 overflow-y-auto">
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
              <div className="md:hidden bg-gray-50 px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2 text-xs" dir="rtl">
                  {selectedService && <span className="text-gray-600 font-medium">{selectedService.name}</span>}
                  {selectedService && selectedDate && <span className="text-gray-300">|</span>}
                  {selectedDate && (
                    <span className="text-gray-600">
                      {selectedDate.toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  {selectedDate && selectedTime && <span className="text-gray-300">|</span>}
                  {selectedTime && <span className="text-gray-600 font-medium">{selectedTime}</span>}
                  <button
                    onClick={handleBack}
                    className="mr-auto text-[#D4AF37] font-medium flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    تعديل
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-white">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Mobile bottom barber bar */}
        <div className="md:hidden flex-shrink-0 border-t border-gray-100 bg-[#0a0a0a] px-4 py-3">
          <div className="flex items-center gap-3" dir="rtl">
            {isNearestMode ? (
              <div className="w-9 h-9 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 flex-shrink-0">
                <Zap className="w-4 h-4 text-[#D4AF37]" />
              </div>
            ) : (
              <img
                src={barber.image}
                alt={barber.name}
                className="w-9 h-9 rounded-full object-cover object-top border border-[#D4AF37]/30 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm leading-none">{displayBarberName}</p>
              <p className="text-white/50 text-xs mt-0.5">{isNearestMode ? "أقرب حلاق متاح" : (barber.specialty || barber.role || "حلاق محترف")}</p>
            </div>
            {selectedDate && selectedTime && currentStep === "time" && (
              <button
                onClick={() => setCurrentStep("confirm")}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-sm font-bold flex-shrink-0"
              >
                متابعة
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
