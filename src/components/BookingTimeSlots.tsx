"use client";

import { Clock } from "lucide-react";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingTimeSlotsProps {
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  timeSlots?: TimeSlot[];
}

const defaultTimeSlots: TimeSlot[] = [
  { time: "09:00 ص", available: true },
  { time: "09:30 ص", available: true },
  { time: "10:00 ص", available: false },
  { time: "10:30 ص", available: true },
  { time: "11:00 ص", available: true },
  { time: "11:30 ص", available: true },
  { time: "12:00 م", available: false },
  { time: "12:30 م", available: true },
  { time: "01:00 م", available: true },
  { time: "01:30 م", available: true },
  { time: "02:00 م", available: false },
  { time: "02:30 م", available: true },
  { time: "03:00 م", available: true },
  { time: "03:30 م", available: true },
  { time: "04:00 م", available: true },
  { time: "04:30 م", available: false },
  { time: "05:00 م", available: true },
  { time: "05:30 م", available: true },
  { time: "06:00 م", available: true },
  { time: "06:30 م", available: false },
  { time: "07:00 م", available: true },
  { time: "07:30 م", available: true },
  { time: "08:00 م", available: true },
  { time: "08:30 م", available: false },
  { time: "09:00 م", available: true },
];

const BookingTimeSlots = ({
  selectedTime,
  onTimeSelect,
  timeSlots = defaultTimeSlots,
}: BookingTimeSlotsProps) => {
  const morningSlots = timeSlots.filter(s => s.time.includes("ص"));
  const afternoonSlots = timeSlots.filter(s => s.time.includes("م") && parseInt(s.time) < 5);
  const eveningSlots = timeSlots.filter(s => s.time.includes("م") && parseInt(s.time) >= 5);

  const SlotGroup = ({ title, slots }: { title: string; slots: TimeSlot[] }) => {
    if (slots.length === 0) return null;
    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2" dir="rtl">
          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
          {title}
        </h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map(slot => (
            <button
              key={slot.time}
              onClick={() => slot.available && onTimeSelect(slot.time)}
              disabled={!slot.available}
              className={`
                py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150
                ${selectedTime === slot.time
                  ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/30 scale-[1.03]"
                  : slot.available
                    ? "bg-white border border-gray-200 text-gray-700 hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/5"
                    : "bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100 line-through"
                }
              `}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6" dir="rtl">
      <h3 className="text-xl font-heading font-bold text-gray-900 mb-6">
        اختر الوقت
      </h3>

      <SlotGroup title="صباحاً" slots={morningSlots} />
      <SlotGroup title="ظهراً" slots={afternoonSlots} />
      <SlotGroup title="مساءً" slots={eveningSlots} />

      {/* Legend */}
      <div className="flex items-center gap-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-[#D4AF37]" />
          <span>محدد</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-white border border-gray-200" />
          <span>متاح</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gray-50 border border-gray-100" />
          <span>محجوز</span>
        </div>
      </div>
    </div>
  );
};

export default BookingTimeSlots;
