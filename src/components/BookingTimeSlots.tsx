"use client";

import { Clock, CalendarX } from "lucide-react";
import type { AvailableSlot } from "@/lib/publicBookingApi";

interface BookingTimeSlotsProps {
  selectedTime?: string;
  onTimeSelect: (slot: AvailableSlot) => void;
  slots: AvailableSlot[];
  isLoading?: boolean;
}

// Parse "HH:MM" → hour integer (0-23)
function parseHour(time: string): number {
  return parseInt(time.split(":")[0], 10);
}

// Skeleton shimmer
const SlotsSkeleton = () => (
  <div className="p-6 animate-pulse" dir="rtl">
    <div className="h-6 bg-gray-100 rounded w-32 mb-6" />
    <div className="h-4 bg-gray-50 rounded w-20 mb-3" />
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-50 rounded-lg" />
      ))}
    </div>
    <div className="h-4 bg-gray-50 rounded w-20 mb-3" />
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-50 rounded-lg" />
      ))}
    </div>
  </div>
);

const BookingTimeSlots = ({
  selectedTime,
  onTimeSelect,
  slots,
  isLoading = false,
}: BookingTimeSlotsProps) => {
  if (isLoading) return <SlotsSkeleton />;

  const availableSlots = slots.filter(s => s.available);

  if (availableSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3 text-center p-6" dir="rtl">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
          <CalendarX className="w-7 h-7 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium text-sm">لا توجد أوقات متاحة لهذا اليوم</p>
        <p className="text-gray-400 text-xs">جرب اختيار يوم آخر</p>
      </div>
    );
  }

  // Group only available slots by time of day
  const morningSlots = availableSlots.filter(s => {
    const h = parseHour(s.time);
    return h >= 5 && h < 12;
  });
  const afternoonSlots = availableSlots.filter(s => {
    const h = parseHour(s.time);
    return h >= 12 && h < 17;
  });
  const eveningSlots = availableSlots.filter(s => {
    const h = parseHour(s.time);
    return h >= 17 || h < 5; // overnight: 17:00-04:59
  });

  const SlotGroup = ({ title, groupSlots }: { title: string; groupSlots: AvailableSlot[] }) => {
    if (groupSlots.length === 0) return null;
    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2" dir="rtl">
          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
          {title}
        </h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {groupSlots.map(slot => {
            const isSelected = selectedTime === slot.time;
            return (
              <button
                key={slot.time}
                onClick={() => onTimeSelect(slot)}
                className={`
                  py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150
                  ${isSelected
                    ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/30 scale-[1.03]"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/5"
                  }
                `}
              >
                {slot.label ?? slot.time}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6" dir="rtl">
      <h3 className="text-xl font-heading font-bold text-gray-900 mb-1">اختر الوقت</h3>
      <p className="text-gray-400 text-sm mb-5">الأوقات المتاحة فقط</p>

      <SlotGroup title="صباحاً" groupSlots={morningSlots} />
      <SlotGroup title="ظهراً وعصراً" groupSlots={afternoonSlots} />
      <SlotGroup title="مساءً وليلاً" groupSlots={eveningSlots} />

      <div className="flex items-center gap-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-[#D4AF37]" />
          <span>محدد</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-white border border-gray-200" />
          <span>متاح</span>
        </div>
      </div>
    </div>
  );
};

export default BookingTimeSlots;
