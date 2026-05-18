"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarX } from "lucide-react";
import type { AvailableDay } from "@/lib/publicBookingApi";

interface BookingCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  availableDays: AvailableDay[];
  isLoading?: boolean;
  maxDaysAhead?: number;
}

const DAYS_AR = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

// ── Shimmer skeleton for loading state ─────────────────────────────────────────
const CalendarSkeleton = () => (
  <div className="p-6 animate-pulse" dir="rtl">
    <div className="h-6 bg-gray-100 rounded w-32 mb-6" />
    <div className="flex items-center justify-between mb-5">
      <div className="w-9 h-9 rounded-lg bg-gray-100" />
      <div className="h-5 bg-gray-100 rounded w-28" />
      <div className="w-9 h-9 rounded-lg bg-gray-100" />
    </div>
    <div className="grid grid-cols-7 gap-1 mb-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-8 bg-gray-50 rounded" />
      ))}
    </div>
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-full bg-gray-50" />
      ))}
    </div>
  </div>
);

const BookingCalendar = ({
  selectedDate,
  onDateSelect,
  availableDays,
  isLoading = false,
  maxDaysAhead = 60,
}: BookingCalendarProps) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + maxDaysAhead);
    return d;
  }, [today, maxDaysAhead]);

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(today);
    d.setDate(1);
    return d;
  });

  // Build a lookup map: "YYYY-MM-DD" → AvailableDay
  const availableMap = useMemo(() => {
    const map = new Map<string, AvailableDay>();
    for (const day of availableDays) {
      map.set(day.date, day);
    }
    return map;
  }, [availableDays]);

  const hasAnyAvailable = availableDays.some(d => d.available);

  const prevMonth = () =>
    setViewMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });

  const nextMonth = () =>
    setViewMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });

  const isPrevDisabled = () => {
    const thisMonth = new Date(today);
    thisMonth.setDate(1);
    return viewMonth <= thisMonth;
  };

  const isNextDisabled = () => {
    const maxMonth = new Date(maxDate);
    maxMonth.setDate(1);
    return viewMonth >= maxMonth;
  };

  const getCells = () => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysCount; d++) cells.push(new Date(year, month, d));
    return cells;
  };

  const toKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const isSelected = (date: Date) =>
    selectedDate?.toDateString() === date.toDateString();

  const isToday = (date: Date) =>
    date.toDateString() === today.toDateString();

  const isOutOfRange = (date: Date) =>
    date < today || date > maxDate;

  const getDayInfo = (date: Date): { available: boolean; reason?: string | null } => {
    if (isOutOfRange(date)) return { available: false };
    const key = toKey(date);
    const entry = availableMap.get(key);
    if (!entry) return { available: false };
    return { available: entry.available, reason: entry.reason };
  };

  if (isLoading) return <CalendarSkeleton />;

  const cells = getCells();

  return (
    <div className="p-6" dir="rtl">
      <h3 className="text-xl font-heading font-bold text-gray-900 mb-1">اختر التاريخ</h3>
      <p className="text-gray-400 text-sm mb-5">الأيام المتاحة للحجز مميزة بالأخضر</p>

      {/* Empty state */}
      {!isLoading && !hasAnyAvailable && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
            <CalendarX className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium text-sm">لا توجد أيام متاحة حالياً</p>
          <p className="text-gray-400 text-xs">جرب تغيير الخدمة أو الحلاق</p>
        </div>
      )}

      {hasAnyAvailable && (
        <>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            {/* RTL: next month arrow on the left visually = ChevronRight */}
            <button
              onClick={nextMonth}
              disabled={isNextDisabled()}
              className="w-9 h-9 rounded-full border border-gray-200 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 flex items-center justify-center transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="الشهر التالي"
            >
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#D4AF37]" />
            </button>

            <span className="font-heading font-bold text-gray-900 text-base">
              {MONTHS_AR[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>

            <button
              onClick={prevMonth}
              disabled={isPrevDisabled()}
              className="w-9 h-9 rounded-full border border-gray-200 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 flex items-center justify-center transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="الشهر السابق"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-[#D4AF37]" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_AR.map(day => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;

              const { available, reason } = getDayInfo(date);
              const selected = isSelected(date);
              const todayCell = isToday(date);
              const outOfRange = isOutOfRange(date);

              let btnClass =
                "aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all duration-150 relative";

              if (selected) {
                btnClass +=
                  " bg-[#D4AF37] text-black font-bold shadow-lg shadow-[#D4AF37]/30 scale-110 z-10";
              } else if (!available || outOfRange) {
                btnClass += " text-gray-200 cursor-not-allowed";
              } else if (todayCell) {
                btnClass +=
                  " ring-2 ring-emerald-400 text-emerald-600 font-bold hover:bg-emerald-400 hover:text-white";
              } else {
                btnClass +=
                  " bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-500 hover:text-white cursor-pointer";
              }

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => available && !outOfRange && onDateSelect(date)}
                  disabled={!available || outOfRange}
                  title={reason ?? undefined}
                  className={btnClass}
                >
                  {date.getDate()}
                  {available && !outOfRange && !selected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-[#D4AF37]" />
              <span>المحدد</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-emerald-50 ring-2 ring-emerald-400" />
              <span>اليوم</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-300" />
              <span>متاح</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-gray-50" />
              <span>غير متاح</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BookingCalendar;
