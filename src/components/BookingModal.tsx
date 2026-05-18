"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ArrowLeft, Check, Loader2, AlertCircle, WifiOff } from "lucide-react";
import BookingStepHeader from "./BookingStepHeader";
import BookingInfoPanel from "./BookingInfoPanel";
import BookingCalendar from "./BookingCalendar";
import BookingTimeSlots from "./BookingTimeSlots";
import BookingServiceSelect from "./BookingServiceSelect";
import {
  getBookingConfig,
  getBookingServices,
  type BookingConfigResponse,
  type BookingService,
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
}

type BookingStep = "service" | "date" | "time" | "confirm" | "success";
type BookingMode = "specific" | "nearest";

const steps = [
  { id: "service", label: "الخدمة", number: 1 },
  { id: "date", label: "الموعد", number: 2 },
  { id: "time", label: "الوقت", number: 3 },
  { id: "confirm", label: "تأكيد", number: 4 },
];

const BookingModal = ({ open, onOpenChange, barber }: BookingModalProps) => {
  // ── API state ──────────────────────────────────────────────────────────────
  const [config, setConfig] = useState<BookingConfigResponse | null>(null);
  const [services, setServices] = useState<BookingService[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Booking state ──────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<BookingStep>("service");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [selectedMode, setSelectedMode] = useState<BookingMode>("specific");
  const [selectedEmpId] = useState<number | undefined>(barber.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setCurrentStep("service");
      setSelectedServiceIds([]);
      setSelectedDate(undefined);
      setSelectedTime(undefined);
      setSelectedMode("specific");
      setApiError(null);
    }, 300);
  };

  const selectedService = services.find(s => selectedServiceIds.includes(s.id));

  const handleServiceSelect = (id: number) => {
    setSelectedServiceIds([id]);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep("confirm");
  };

  const handleBack = () => {
    if (currentStep === "date") {
      setCurrentStep("service");
      setSelectedDate(undefined);
    } else if (currentStep === "time") {
      setCurrentStep("date");
      setSelectedTime(undefined);
    } else if (currentStep === "confirm") {
      setCurrentStep("time");
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setCurrentStep("success");
  };

  const formatDateAr = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("ar-EG", {
      weekday: "long", month: "long", day: "numeric",
    }).format(date);
  };

  const allowNearest = config?.settings?.allowNearestBarber ?? false;

  // ── Step active id for header ──────────────────────────────────────────────
  const activeStepId = currentStep === "success" ? "confirm" : currentStep;

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
      case "service":
        return (
          <div dir="rtl">
            {/* Nearest barber option */}
            {allowNearest && (
              <div className="px-6 pt-6 pb-0">
                <div className="flex rounded-xl border border-gray-150 overflow-hidden mb-4">
                  <button
                    onClick={() => setSelectedMode("specific")}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${selectedMode === "specific"
                      ? "bg-[#D4AF37] text-black"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                  >
                    مع {barber.name}
                  </button>
                  <button
                    onClick={() => setSelectedMode("nearest")}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${selectedMode === "nearest"
                      ? "bg-[#D4AF37] text-black"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                  >
                    أقرب حلاق متاح
                  </button>
                </div>
              </div>
            )}

            <BookingServiceSelect
              services={services}
              selectedIds={selectedServiceIds}
              onSelect={handleServiceSelect}
              isLoading={isLoadingServices}
            />

            {/* Continue button */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setCurrentStep("date")}
                disabled={selectedServiceIds.length === 0}
                className="w-full py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#C4A030] transition-colors shadow-md shadow-[#D4AF37]/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                متابعة
              </button>
            </div>
          </div>
        );

      case "date":
        return (
          <div dir="rtl">
            <BookingCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
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
            <BookingTimeSlots selectedTime={selectedTime} onTimeSelect={handleTimeSelect} />
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

      case "confirm":
        return (
          <div className="p-6" dir="rtl">
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-6">تأكيد الحجز</h3>

            <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100 space-y-4">
              {/* Barber */}
              <div className="flex items-center gap-4">
                <img
                  src={barber.image}
                  alt={barber.name}
                  className="w-12 h-12 rounded-full object-cover object-top border-2 border-[#D4AF37]/30"
                />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    {selectedMode === "nearest" ? "أقرب حلاق متاح" : barber.name}
                  </h4>
                  <p className="text-gray-400 text-xs">{barber.specialty || barber.role || "حلاق محترف"}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 space-y-2.5">
                {selectedService && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800 text-sm">{selectedService.name}</span>
                    <span className="text-gray-400 text-xs">الخدمة</span>
                  </div>
                )}
                {selectedDate && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800 text-sm">{formatDateAr(selectedDate)}</span>
                    <span className="text-gray-400 text-xs">التاريخ</span>
                  </div>
                )}
                {selectedTime && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800 text-sm">{selectedTime}</span>
                    <span className="text-gray-400 text-xs">الوقت</span>
                  </div>
                )}
                {selectedService && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#D4AF37] text-sm">
                      {selectedService.price} جنيه
                    </span>
                    <span className="text-gray-400 text-xs">السعر</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 text-sm">
                    {selectedService?.durationMinutes ?? 30} دقيقة
                  </span>
                  <span className="text-gray-400 text-xs">المدة</span>
                </div>
              </div>
            </div>

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
                disabled={isSubmitting}
                className="flex-[2] py-3 px-4 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#C4A030] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-[#D4AF37]/20"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />جاري التأكيد...</>
                ) : "تأكيد الحجز"}
              </button>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="p-6 text-center" dir="rtl">
            <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">تم تأكيد الحجز!</h3>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              تم حجز موعدك مع <strong className="text-gray-800">
                {selectedMode === "nearest" ? "أقرب حلاق متاح" : barber.name}
              </strong> بنجاح.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-right border border-gray-100 space-y-2">
              {selectedService && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 text-sm">{selectedService.name}</span>
                  <span className="text-gray-400 text-xs">الخدمة</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800 text-sm">{formatDateAr(selectedDate)}</span>
                <span className="text-gray-400 text-xs">التاريخ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800 text-sm">{selectedTime}</span>
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
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[92vh] p-0 bg-white border-0 overflow-hidden gap-0 rounded-2xl shadow-2xl"
        dir="rtl"
      >
        <VisuallyHidden>
          <DialogTitle>احجز مع {barber.name}</DialogTitle>
        </VisuallyHidden>
        <DialogDescription className="sr-only">
          واجهة حجز موعد في Cut Salon لاختيار الخدمة والحلاق واليوم والساعة.
        </DialogDescription>

        {/* Dark Header */}
        <BookingStepHeader
          steps={steps}
          currentStep={activeStepId}
          barberName={selectedMode === "nearest" ? "أقرب حلاق متاح" : barber.name}
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
              service={selectedService?.name}
              serviceDuration={selectedService?.durationMinutes}
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
            <img
              src={barber.image}
              alt={barber.name}
              className="w-9 h-9 rounded-full object-cover object-top border border-[#D4AF37]/30 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm leading-none">
                {selectedMode === "nearest" ? "أقرب حلاق متاح" : barber.name}
              </p>
              <p className="text-white/50 text-xs mt-0.5">{barber.specialty || barber.role || "حلاق محترف"}</p>
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
