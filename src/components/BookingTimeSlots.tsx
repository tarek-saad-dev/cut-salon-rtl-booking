"use client";

import { Clock, CalendarX, Zap, ArrowLeft } from "lucide-react";
import type { AvailableSlot } from "@/lib/publicBookingApi";

interface BookingTimeSlotsProps {
  selectedTime?: string;
  onTimeSelect: (slot: AvailableSlot) => void;
  onNextDay?: () => void;
  slots: AvailableSlot[];
  isLoading?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseHour(time: string): number {
  return parseInt(time.split(":")[0], 10);
}

function formatHourLabel(hour24: number): string {
  if (hour24 === 0 || hour24 === 12) return "12";
  return String(hour24 > 12 ? hour24 - 12 : hour24);
}

function periodSuffix(hour24: number): string {
  if (hour24 >= 5 && hour24 < 12) return "صباحًا";
  if (hour24 >= 12 && hour24 < 17) return "مساءً";
  if (hour24 >= 17 && hour24 < 21) return "مساءً";
  return "ليلاً";
}

function formatSlotDisplay(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h >= 12 ? "م" : "ص";
  return `${h12}:${m} ${ampm}`;
}

interface HourGroup {
  hour: number;
  label: string;
  slots: AvailableSlot[];
}

function groupSlotsByHour(slots: AvailableSlot[]): HourGroup[] {
  const map = new Map<number, AvailableSlot[]>();
  for (const s of slots) {
    const h = parseHour(s.time);
    if (!map.has(h)) map.set(h, []);
    map.get(h)!.push(s);
  }
  const groups: HourGroup[] = [];
  for (const [hour, hourSlots] of map) {
    groups.push({
      hour,
      label: `${formatHourLabel(hour)} ${periodSuffix(hour)}`,
      slots: hourSlots.sort((a, b) => a.time.localeCompare(b.time)),
    });
  }
  return groups.sort((a, b) => {
    const aKey = a.hour < 5 ? a.hour + 24 : a.hour;
    const bKey = b.hour < 5 ? b.hour + 24 : b.hour;
    return aKey - bKey;
  });
}

type PeriodKey = "morning" | "afternoon" | "evening";

interface TimePeriod {
  key: PeriodKey;
  title: string;
  groups: HourGroup[];
}

function organizePeriods(hourGroups: HourGroup[]): TimePeriod[] {
  const morning: HourGroup[] = [];
  const afternoon: HourGroup[] = [];
  const evening: HourGroup[] = [];

  for (const g of hourGroups) {
    if (g.hour >= 5 && g.hour < 12) morning.push(g);
    else if (g.hour >= 12 && g.hour < 17) afternoon.push(g);
    else evening.push(g);
  }

  const periods: TimePeriod[] = [];
  if (morning.length > 0) periods.push({ key: "morning", title: "صباحًا", groups: morning });
  if (afternoon.length > 0) periods.push({ key: "afternoon", title: "ظهرًا وعصرًا", groups: afternoon });
  if (evening.length > 0) periods.push({ key: "evening", title: "مساءً وليلاً", groups: evening });
  return periods;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const SlotsSkeleton = () => (
  <div className="p-6 space-y-5 animate-pulse" dir="rtl">
    <div>
      <div className="h-6 bg-[#171717] rounded w-28 mb-2" />
      <div className="h-4 bg-[#111111] rounded w-52" />
    </div>
    <div className="h-[72px] rounded-2xl bg-[#111111] border border-[rgba(212,175,55,0.18)]" />
    {[1, 2, 3].map(i => (
      <div key={i} className="space-y-3">
        <div className="h-4 bg-[#171717] rounded w-24" />
        <div className="rounded-2xl bg-[#111111] border border-[rgba(212,175,55,0.08)] p-4">
          <div className="h-5 bg-[#171717] rounded w-14 mb-3" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="h-9 w-[4.5rem] bg-[#171717] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const BookingTimeSlots = ({
  selectedTime,
  onTimeSelect,
  onNextDay,
  slots,
  isLoading = false,
}: BookingTimeSlotsProps) => {
  if (isLoading) return <SlotsSkeleton />;

  const availableSlots = slots.filter(s => s.available);

  if (availableSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-6" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-[#111111] border border-[rgba(212,175,55,0.18)] flex items-center justify-center">
          <CalendarX className="w-7 h-7 text-[#71717a]" />
        </div>
        <div>
          <p className="text-[#f7f7f2] font-heading font-bold text-sm mb-1">لا توجد أوقات متاحة لهذا اليوم</p>
          <p className="text-[#71717a] text-xs">جرب اختيار يوم آخر</p>
        </div>
        {onNextDay && (
          <button
            onClick={onNextDay}
            className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[rgba(212,175,55,0.18)] bg-[#111111] text-[#d4af37] text-sm font-heading font-bold hover:bg-[#171717] hover:border-[rgba(212,175,55,0.4)] transition-all duration-200"
          >
            <span>عرض مواعيد اليوم التالي</span>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>
    );
  }

  // Nearest available
  const nearest = availableSlots[0];

  // Group and organize
  const hourGroups = groupSlotsByHour(availableSlots);
  const periods = organizePeriods(hourGroups);

  return (
    <div className="p-5 md:p-6 space-y-5" dir="rtl">
      {/* ── Header ── */}
      <div>
        <h3 className="text-xl font-heading font-bold text-[#f7f7f2] mb-0.5">اختر الوقت</h3>
        <p className="text-[#a1a1aa] text-sm">اختر الوقت الأنسب لك — المواعيد المتاحة فقط</p>
      </div>

      {/* ── Nearest Available Featured Card ── */}
      <button
        onClick={() => onTimeSelect(nearest)}
        className={`
          w-full relative overflow-hidden rounded-2xl p-4 transition-all duration-200 text-right cursor-pointer
          ${selectedTime === nearest.time
            ? "bg-[#171717] border-2 border-[#d4af37] shadow-[0_0_24px_rgba(212,175,55,0.12)]"
            : "bg-[#111111] border border-[rgba(212,175,55,0.18)] hover:border-[rgba(212,175,55,0.4)] hover:shadow-[0_0_16px_rgba(212,175,55,0.06)]"
          }
        `}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedTime === nearest.time ? "bg-[#d4af37]" : "bg-[#d4af37]/10"}`}>
              <Zap className={`w-5 h-5 ${selectedTime === nearest.time ? "text-[#050505]" : "text-[#d4af37]"}`} />
            </div>
            <div>
              <p className="text-xs text-[#d4af37] font-heading font-bold mb-0.5">أقرب ميعاد متاح</p>
              <p className="text-[#71717a] text-[11px]">أسرع وقت يمكنك الحجز فيه</p>
            </div>
          </div>
          <div className={`font-heading font-black text-xl tabular-nums transition-colors ${selectedTime === nearest.time ? "text-[#d4af37]" : "text-[#f7f7f2]"}`}>
            {formatSlotDisplay(nearest.time)}
          </div>
        </div>
      </button>

      {/* ── Time Periods ── */}
      {periods.map(period => (
        <div key={period.key} className="space-y-3">
          {/* Period header */}
          <div className="flex items-center gap-2.5 pt-1">
            <Clock className="w-3.5 h-3.5 text-[#d4af37]/50" />
            <span className="text-sm font-heading font-bold text-[#a1a1aa]">{period.title}</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[rgba(212,175,55,0.1)] to-transparent" />
          </div>

          {/* Hour groups */}
          {period.groups.map(group => (
            <div
              key={group.hour}
              className="rounded-2xl bg-[#111111] border border-[rgba(212,175,55,0.08)] p-4 md:p-5 transition-all duration-200 hover:border-[rgba(212,175,55,0.18)]"
            >
              {/* Hour label */}
              <div className="flex items-center gap-2.5 mb-3.5">
                <span className="font-heading font-black text-2xl text-[#f7f7f2] leading-none">
                  {formatHourLabel(group.hour)}
                </span>
                <span className="text-[#a1a1aa] text-sm font-medium">{periodSuffix(group.hour)}</span>
                <span className="text-[#71717a] text-[11px] mr-auto bg-[#171717] px-2 py-0.5 rounded-md">
                  {group.slots.length} {group.slots.length === 1 ? "ميعاد" : "مواعيد"}
                </span>
              </div>

              {/* Quarter-hour pills */}
              <div className="flex flex-wrap gap-2.5">
                {group.slots.map(slot => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      onClick={() => onTimeSelect(slot)}
                      className={`
                        relative py-2.5 px-4 rounded-xl text-sm font-medium tabular-nums
                        transition-all duration-150 cursor-pointer
                        ${isSelected
                          ? "bg-gradient-to-b from-[#e7c766] to-[#b88916] text-[#050505] font-bold shadow-[0_6px_20px_rgba(212,175,55,0.22)] scale-[1.03]"
                          : "bg-[#171717] border border-[rgba(212,175,55,0.1)] text-[#f7f7f2] hover:border-[rgba(212,175,55,0.35)] hover:text-[#e7c766] hover:shadow-[0_0_12px_rgba(212,175,55,0.06)]"
                        }
                      `}
                    >
                      <span className="relative">{formatSlotDisplay(slot.time)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* ── Next Day CTA ── */}
      {onNextDay && (
        <div className="pt-4 space-y-3">
          <div className="h-px bg-gradient-to-l from-transparent via-[rgba(212,175,55,0.12)] to-transparent" />
          <div className="text-center space-y-3 py-2">
            <p className="text-[#71717a] text-xs">
              لو لم تجد الوقت المناسب اليوم، يمكنك متابعة الحجز في اليوم التالي
            </p>
            <button
              onClick={onNextDay}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl border border-[rgba(212,175,55,0.18)] bg-[#111111] text-[#d4af37] font-heading font-bold text-sm hover:bg-[#171717] hover:border-[rgba(212,175,55,0.4)] hover:shadow-[0_4px_16px_rgba(212,175,55,0.08)] active:scale-[0.97] transition-all duration-200"
            >
              <span>عرض مواعيد اليوم التالي</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex items-center gap-5 pt-3 border-t border-[rgba(212,175,55,0.08)] text-[11px] text-[#71717a]">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-b from-[#e7c766] to-[#b88916]" />
          <span>محدد</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-[#171717] border border-[rgba(212,175,55,0.1)]" />
          <span>متاح</span>
        </div>
      </div>
    </div>
  );
};

export default BookingTimeSlots;
