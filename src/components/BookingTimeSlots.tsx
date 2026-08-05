"use client";

import { Clock, CalendarX, Zap, MoonStar } from "lucide-react";
import type { AvailableSlot } from "@/lib/booking-api";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";

interface BookingTimeSlotsProps {
  selectedTime?: string;
  selectedSlot?: AvailableSlot;
  onTimeSelect: (slot: AvailableSlot) => void;
  onNextDay?: () => void;
  onSwitchToNearest?: () => void;
  slots: AvailableSlot[];
  isLoading?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDayOffset(slot: AvailableSlot): number {
  return slot.dayOffset ?? 0;
}

function parseHour(time: string): number {
  return parseInt(time.split(":")[0], 10);
}

function slotKey(slot: AvailableSlot): string {
  return `${getDayOffset(slot)}-${slot.time}`;
}

function isSlotSelected(
  slot: AvailableSlot,
  selectedTime?: string,
  selectedSlot?: AvailableSlot,
): boolean {
  if (!selectedTime) return false;
  if (selectedTime !== slot.time) return false;
  const selectedOffset = selectedSlot ? getDayOffset(selectedSlot) : 0;
  return getDayOffset(slot) === selectedOffset;
}

interface HourGroup {
  hour: number;
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

function organizePeriods(
  hourGroups: HourGroup[],
  titles: { morning: string; afternoon: string; evening: string },
): TimePeriod[] {
  const morning: HourGroup[] = [];
  const afternoon: HourGroup[] = [];
  const evening: HourGroup[] = [];

  for (const g of hourGroups) {
    if (g.hour >= 5 && g.hour < 12) morning.push(g);
    else if (g.hour >= 12 && g.hour < 17) afternoon.push(g);
    else evening.push(g);
  }

  const periods: TimePeriod[] = [];
  if (morning.length > 0) periods.push({ key: "morning", title: titles.morning, groups: morning });
  if (afternoon.length > 0)
    periods.push({ key: "afternoon", title: titles.afternoon, groups: afternoon });
  if (evening.length > 0) periods.push({ key: "evening", title: titles.evening, groups: evening });
  return periods;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const SlotsSkeleton = ({ dir }: { dir: "rtl" | "ltr" }) => (
  <div className="p-6 space-y-5 animate-pulse" dir={dir}>
    <div>
      <div className="h-6 bg-[#171717] rounded w-28 mb-2" />
      <div className="h-4 bg-[#111111] rounded w-52" />
    </div>
    <div className="h-[72px] rounded-2xl bg-[#111111] border border-[rgba(212,175,55,0.18)]" />
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-3">
        <div className="h-4 bg-[#171717] rounded w-24" />
        <div className="rounded-2xl bg-[#111111] border border-[rgba(212,175,55,0.08)] p-4">
          <div className="h-5 bg-[#171717] rounded w-14 mb-3" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-9 w-[4.5rem] bg-[#171717] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Slot Pill ───────────────────────────────────────────────────────────────

const SlotPill = ({
  slot,
  selected,
  onSelect,
  formatTime,
}: {
  slot: AvailableSlot;
  selected: boolean;
  onSelect: () => void;
  formatTime: (time: string) => string;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`
      relative py-2.5 px-4 rounded-xl text-sm font-medium tabular-nums
      transition-all duration-150 cursor-pointer
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]
      ${
        selected
          ? "bg-gradient-to-b from-cut-gold to-cut-gold/80 text-cut-black font-bold shadow-[0_6px_20px_rgba(212,175,55,0.22)] scale-[1.03]"
          : "bg-[#171717] border border-[rgba(212,175,55,0.1)] text-[#f7f7f2] hover:border-[rgba(212,175,55,0.35)] hover:text-cut-gold hover:shadow-[0_0_12px_rgba(212,175,55,0.06)]"
      }
    `}
  >
    <span className="relative">{slot.label ?? formatTime(slot.time)}</span>
  </button>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const BookingTimeSlots = ({
  selectedTime,
  selectedSlot: selectedSlotProp,
  onTimeSelect,
  onNextDay,
  onSwitchToNearest,
  slots,
  isLoading = false,
}: BookingTimeSlotsProps) => {
  const { t, dir, format } = useBookingTranslations();

  if (isLoading) return <SlotsSkeleton dir={dir} />;

  const availableSlots = slots.filter((s) => s.available);
  const visibleSlots = availableSlots;
  const overnightSlots = visibleSlots.filter((s) => getDayOffset(s) === 1);

  if (process.env.NODE_ENV === "development" && slots.length > 0) {
    const d0 = slots.filter((s) => getDayOffset(s) === 0);
    const d1 = slots.filter((s) => getDayOffset(s) === 1);
    console.log("[time slots] raw slots:", slots.length);
    console.log("[time slots] dayOffset=0:", d0.length);
    console.log("[time slots] dayOffset=1:", d1.length);
  }

  if (visibleSlots.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-14 gap-4 text-center px-6"
        dir={dir}
      >
        <div className="w-16 h-16 rounded-full bg-[#111111] border border-[rgba(212,175,55,0.18)] flex items-center justify-center">
          <CalendarX className="w-7 h-7 text-[#71717a]" />
        </div>
        <div>
          <p className="text-[var(--booking-error)] font-heading font-bold text-sm mb-2">
            {t("time.empty")}
          </p>
          {onSwitchToNearest && (
            <p className="text-[#a1a1aa] text-[13px] leading-relaxed max-w-[240px] mx-auto">
              {t("time.emptyNearestHint")}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full max-w-[260px]">
          {onSwitchToNearest && (
            <button
              type="button"
              onClick={onSwitchToNearest}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cut-gold text-black text-sm font-heading font-bold hover:bg-cut-gold/80 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            >
              <Zap className="w-4 h-4" />
              {t("actions.switchToNearestBarber")}
            </button>
          )}
          {onNextDay && (
            <button
              type="button"
              onClick={onNextDay}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[rgba(212,175,55,0.18)] bg-[#111111] text-cut-gold text-sm font-heading font-bold hover:bg-[#171717] hover:border-[rgba(212,175,55,0.4)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            >
              <span>{t("actions.showNextDaySlots")}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const todaySlots = visibleSlots.filter((s) => getDayOffset(s) === 0);
  const nearest = todaySlots[0] ?? overnightSlots[0];

  const hourGroups = groupSlotsByHour(todaySlots);
  const periods = organizePeriods(hourGroups, {
    morning: t("time.periodMorning"),
    afternoon: t("time.periodAfternoon"),
    evening: t("time.periodEvening"),
  });

  const formatTime = (time: string) => format.time(time);

  return (
    <div className="p-5 md:p-6 space-y-5" dir={dir}>
      <div>
        <h3 className="text-xl font-heading font-bold text-[#f7f7f2] mb-0.5">{t("time.title")}</h3>
        <p className="text-[#a1a1aa] text-sm">{t("time.subtitle")}</p>
      </div>

      {nearest && (
        <button
          type="button"
          onClick={() => onTimeSelect(nearest)}
          className={`
            w-full relative overflow-hidden rounded-2xl p-4 transition-all duration-200 text-start cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]
            ${
              isSlotSelected(nearest, selectedTime, selectedSlotProp)
                ? "bg-[#171717] border-2 border-cut-gold shadow-[0_0_24px_rgba(212,175,55,0.12)]"
                : "bg-[#111111] border border-[rgba(212,175,55,0.18)] hover:border-[rgba(212,175,55,0.4)] hover:shadow-[0_0_16px_rgba(212,175,55,0.06)]"
            }
          `}
        >
          <div className="absolute top-0 start-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isSlotSelected(nearest, selectedTime, selectedSlotProp)
                    ? "bg-cut-gold"
                    : "bg-cut-gold/10"
                }`}
              >
                <Zap
                  className={`w-5 h-5 ${
                    isSlotSelected(nearest, selectedTime, selectedSlotProp)
                      ? "text-cut-black"
                      : "text-cut-gold"
                  }`}
                />
              </div>
              <div>
                <p className="text-[13px] text-cut-gold font-heading font-bold mb-0.5">
                  {t("time.nearestFeatured")}
                </p>
                <p className="text-[#71717a] text-[13px]">{t("time.nearestFeaturedHint")}</p>
              </div>
            </div>
            <div className="text-end">
              <div
                className={`font-heading font-black text-xl tabular-nums transition-colors ${
                  isSlotSelected(nearest, selectedTime, selectedSlotProp)
                    ? "text-cut-gold"
                    : "text-[#f7f7f2]"
                }`}
              >
                {nearest.label ?? formatTime(nearest.time)}
              </div>
              {getDayOffset(nearest) === 1 && (
                <p className="text-[13px] text-cut-gold/60 mt-0.5">{t("overnight.afterMidnight")}</p>
              )}
            </div>
          </div>
        </button>
      )}

      {periods.map((period) => (
        <div key={period.key} className="space-y-3">
          <div className="flex items-center gap-2.5 pt-1">
            <Clock className="w-3.5 h-3.5 text-cut-gold/50" />
            <span className="text-sm font-heading font-bold text-[#a1a1aa]">{period.title}</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[rgba(212,175,55,0.1)] to-transparent" />
          </div>

          {period.groups.map((group) => {
            const hourTime = `${String(group.hour).padStart(2, "0")}:00`;
            return (
              <div
                key={group.hour}
                className="rounded-2xl bg-[#111111] border border-[rgba(212,175,55,0.08)] p-4 md:p-5 transition-all duration-200 hover:border-[rgba(212,175,55,0.18)]"
              >
                <div className="flex items-center gap-2.5 mb-3.5">
                  <span className="font-heading font-black text-xl md:text-2xl text-[#f7f7f2] leading-none tabular-nums">
                    {formatTime(hourTime)}
                  </span>
                  <span className="text-[#71717a] text-[13px] ms-auto bg-[#171717] px-2 py-0.5 rounded-md">
                    {format.number(group.slots.length)}{" "}
                    {group.slots.length === 1 ? t("time.slotCountOne") : t("time.slotCountMany")}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {group.slots.map((slot) => (
                    <SlotPill
                      key={slotKey(slot)}
                      slot={slot}
                      selected={isSlotSelected(slot, selectedTime, selectedSlotProp)}
                      onSelect={() => onTimeSelect(slot)}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {overnightSlots.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 pt-1">
            <MoonStar className="w-3.5 h-3.5 text-cut-gold/50" />
            <span className="text-sm font-heading font-bold text-[#a1a1aa]">
              {t("overnight.afterMidnight")}
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[rgba(212,175,55,0.1)] to-transparent" />
          </div>
          <p className="text-[13px] text-[#71717a]">{t("overnight.explanation")}</p>
          <div className="flex flex-wrap gap-2.5">
            {overnightSlots.map((slot) => (
              <button
                key={slotKey(slot)}
                type="button"
                onClick={() => onTimeSelect(slot)}
                className={`
                  relative py-2.5 px-4 rounded-xl text-sm font-medium tabular-nums
                  transition-all duration-150 cursor-pointer
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]
                  ${
                    isSlotSelected(slot, selectedTime, selectedSlotProp)
                      ? "bg-gradient-to-b from-cut-gold to-cut-gold/80 text-cut-black font-bold shadow-[0_6px_20px_rgba(212,175,55,0.22)]"
                      : "bg-[#171717] border border-[rgba(212,175,55,0.1)] text-[#f7f7f2] hover:border-[rgba(212,175,55,0.35)] hover:text-cut-gold"
                  }
                `}
              >
                <span>{formatTime(slot.time)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {onNextDay && (
        <div className="pt-2 space-y-3">
          <div className="h-px bg-gradient-to-l from-transparent via-[rgba(212,175,55,0.12)] to-transparent" />
          <div className="text-center space-y-3 py-2">
            <p className="text-[#71717a] text-[13px]">{t("time.nextDayHint")}</p>
            <button
              type="button"
              onClick={onNextDay}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl border border-[rgba(212,175,55,0.18)] bg-[#111111] text-cut-gold font-heading font-bold text-sm hover:bg-[#171717] hover:border-[rgba(212,175,55,0.4)] hover:shadow-[0_4px_16px_rgba(212,175,55,0.08)] active:scale-[0.97] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            >
              <span>{t("actions.showNextDaySlots")}</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-5 pt-3 border-t border-[rgba(212,175,55,0.08)] text-[13px] text-[#71717a]">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-b from-cut-gold to-cut-gold/80" />
          <span>{t("time.legendSelected")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-[#171717] border border-[rgba(212,175,55,0.1)]" />
          <span>{t("time.legendAvailable")}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingTimeSlots;
