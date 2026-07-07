"use client";

import { Clock, Scissors, MapPin, Star, CalendarDays, Banknote, Zap } from "lucide-react";

interface BarberInfo {
  name: string;
  image: string;
  role?: string;
  specialty?: string;
  experience?: string;
  rating?: number;
  reviewCount?: string;
  location?: string;
}

interface BookingInfoPanelProps {
  barber: BarberInfo;
  selectedDate?: Date;
  selectedTime?: string;
  service?: string;
  servicePrice?: number;
  serviceDuration?: number;
  mode?: "specific" | "nearest";
}

const BookingInfoPanel = ({ barber, selectedDate, selectedTime, service, servicePrice, serviceDuration, mode = "specific" }: BookingInfoPanelProps) => {
  const formatDate = (date?: Date) => {
    if (!date) return null;
    return new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const displayName = mode === "nearest" ? "أقرب حلاق متاح" : barber.name;
  const duration = serviceDuration ?? 30;

  return (
    <div className="bg-cut-black text-cut-ivory p-6 h-full flex flex-col" dir="rtl">
      {/* Barber Profile */}
      <div className="flex items-start gap-4 mb-6">
        {mode === "nearest" ? (
          <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-cut-gold/30 bg-cut-gold/10 flex-shrink-0 shadow-[0_0_20px_rgba(164,136,121,0.1)]">
            <Zap className="w-7 h-7 text-cut-gold" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cut-gold/30 flex-shrink-0 shadow-[0_0_20px_rgba(164,136,121,0.1)]">
            <img
              src={barber.image}
              alt={barber.name}
              className="w-full h-full object-cover object-top"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-xl text-cut-ivory mb-1">
            {displayName}
          </h3>
          <div className="flex items-center gap-2 text-cut-ivory/60 text-sm mb-1">
            {mode === "nearest" ? (
              <><Zap className="w-3.5 h-3.5 text-cut-gold" /><span>أقرب حلاق متاح</span></>
            ) : (
              <><Scissors className="w-3.5 h-3.5 text-cut-gold" /><span>{barber.specialty || barber.role || "حلاق محترف"}</span></>
            )}
          </div>
          {mode !== "nearest" && barber.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-cut-gold text-cut-gold" />
              <span className="text-cut-gold font-bold text-sm">{barber.rating}</span>
              {barber.reviewCount && (
                <span className="text-cut-ivory/40 text-xs">{barber.reviewCount}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/8 mb-5" />

      {/* Booking Details */}
      <div className="flex-1">
        <p className="text-cut-ivory/40 text-xs font-bold uppercase tracking-widest mb-4">
          تفاصيل الموعد
        </p>

        <div className="space-y-4">
          {/* Booking mode */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cut-gold/10 flex items-center justify-center flex-shrink-0">
              {mode === "nearest" ? <Zap className="w-4 h-4 text-cut-gold" /> : <Scissors className="w-4 h-4 text-cut-gold" />}
            </div>
            <div>
              <p className="text-cut-ivory/40 text-xs mb-0.5">طريقة الحجز</p>
              <p className="text-cut-ivory font-medium text-sm">{mode === "nearest" ? "أقرب حلاق متاح" : "اختيار حلاق"}</p>
            </div>
          </div>

          {/* Service */}
          {service && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cut-gold/10 flex items-center justify-center flex-shrink-0">
                <Scissors className="w-4 h-4 text-cut-gold" />
              </div>
              <div>
                <p className="text-cut-ivory/40 text-xs mb-0.5">الخدمة</p>
                <p className="text-cut-ivory font-medium text-sm">{service}</p>
              </div>
            </div>
          )}

          {/* Date */}
          {selectedDate ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cut-gold/10 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-4 h-4 text-cut-gold" />
              </div>
              <div>
                <p className="text-cut-ivory/40 text-xs mb-0.5">التاريخ</p>
                <p className="text-cut-ivory font-medium text-sm leading-relaxed">
                  {formatDate(selectedDate)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 opacity-35">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-4 h-4 text-cut-ivory/50" />
              </div>
              <div>
                <p className="text-cut-ivory/40 text-xs mb-0.5">التاريخ</p>
                <p className="text-cut-ivory/40 text-sm">لم يُحدد بعد</p>
              </div>
            </div>
          )}

          {/* Time */}
          {selectedTime ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cut-gold/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-cut-gold" />
              </div>
              <div>
                <p className="text-cut-ivory/40 text-xs mb-0.5">الوقت</p>
                <p className="text-cut-ivory font-medium text-sm">{selectedTime}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 opacity-35">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-cut-ivory/50" />
              </div>
              <div>
                <p className="text-cut-ivory/40 text-xs mb-0.5">الوقت</p>
                <p className="text-cut-ivory/40 text-sm">لم يُحدد بعد</p>
              </div>
            </div>
          )}

          {/* Duration - always shown */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cut-gold/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-cut-gold" />
            </div>
            <div>
              <p className="text-cut-ivory/40 text-xs mb-0.5">المدة</p>
              <p className="text-cut-ivory font-medium text-sm">{duration} دقيقة</p>
            </div>
          </div>

          {/* Price */}
          {servicePrice != null && servicePrice > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cut-gold/10 flex items-center justify-center flex-shrink-0">
                <Banknote className="w-4 h-4 text-cut-gold" />
              </div>
              <div>
                <p className="text-cut-ivory/40 text-xs mb-0.5">السعر</p>
                <p className="text-cut-gold font-bold text-sm">{servicePrice} جنيه</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      {barber.location && (
        <>
          <div className="h-px bg-white/8 my-5" />
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cut-gold/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-cut-gold" />
            </div>
            <div>
              <p className="text-cut-ivory/40 text-xs mb-0.5">الموقع</p>
              <p className="text-cut-ivory font-medium text-sm">{barber.location}</p>
            </div>
          </div>
        </>
      )}

      {/* Brand Footer */}
      <div className="mt-6 pt-4 border-t border-white/8">
        <div className="flex items-center gap-2">
          <img src="/cutsalon.png" alt="Cut Salon" className="w-5 h-5 rounded object-cover opacity-60" />
          <span className="text-cut-ivory/30 text-xs">Cut Salon · الإسكندرية</span>
        </div>
      </div>
    </div>
  );
};

export default BookingInfoPanel;
