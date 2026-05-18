"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookingCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
}

const DAYS_AR = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const BookingCalendar = ({ selectedDate, onDateSelect }: BookingCalendarProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const prevMonth = () => {
    setViewMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const nextMonth = () => {
    setViewMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const isPrevDisabled = () => {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    return viewMonth <= thisMonth;
  };

  const getDaysInMonth = () => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysCount; d++) cells.push(new Date(year, month, d));
    return cells;
  };

  const isDisabled = (date: Date) => date < today || date.getDay() === 5;

  const isSelected = (date: Date) =>
    selectedDate?.toDateString() === date.toDateString();

  const isToday = (date: Date) => date.toDateString() === today.toDateString();

  const cells = getDaysInMonth();

  return (
    <div className="p-6" dir="rtl">
      <h3 className="text-xl font-heading font-bold text-gray-900 mb-6">
        اختر التاريخ
      </h3>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-lg border border-gray-200 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 flex items-center justify-center transition-all group"
        >
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#D4AF37]" />
        </button>

        <span className="font-heading font-bold text-gray-900 text-base">
          {MONTHS_AR[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </span>

        <button
          onClick={prevMonth}
          disabled={isPrevDisabled()}
          className="w-9 h-9 rounded-lg border border-gray-200 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 flex items-center justify-center transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-[#D4AF37]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_AR.map(day => (
          <div key={day} className="text-center text-xs font-bold text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} />;

          const disabled = isDisabled(date);
          const selected = isSelected(date);
          const todayDate = isToday(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => !disabled && onDateSelect(date)}
              disabled={disabled}
              className={`
                aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-150
                ${selected
                  ? "bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/30 scale-105"
                  : disabled
                    ? "text-gray-300 cursor-not-allowed"
                    : todayDate
                      ? "border-2 border-[#D4AF37]/60 text-[#D4AF37] font-bold hover:bg-[#D4AF37] hover:text-black"
                      : "text-gray-700 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
                }
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-[#D4AF37]" />
          <span>محدد</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded border-2 border-[#D4AF37]/60" />
          <span>اليوم</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-gray-100" />
          <span>غير متاح</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        * الجمعة غير متاحة للحجز
      </p>
    </div>
  );
};

export default BookingCalendar;
