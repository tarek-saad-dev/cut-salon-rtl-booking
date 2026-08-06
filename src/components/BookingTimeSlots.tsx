"use client";

import { Check, Clock, CalendarX, Zap, MoonStar } from "lucide-react";
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

const SlotsSkeleton = ({ dir }: { dir: "rtl" | "ltr" }) => (
  <div className="p-6 space-y-5 animate-pulse" dir={dir} aria-busy="true">
    <div>
      <div className="h-6 bg-[var(--booking-surface)] rounded w-28 mb-2" />
      <div className="h-4 bg-[var(--booking-surface)] rounded w-52" />
    </div>
    <div className="h-[72px] rounded-2xl bg-[var(--booking-bg)] border border-[var(--booking-accent)]" />
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-3">
        <div className="h-4 bg-[var(--booking-surface)] rounded w-24" />
        <div className="rounded-2xl bg-[var(--booking-bg)] border border-[var(--booking-border-subtle)] p-4">
          <div className="h-5 bg-[var(--booking-surface)] rounded w-14 mb-3" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-9 w-[4.5rem] bg-[var(--booking-surface)] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

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
    aria-pressed={selected}
    className={`
      relative inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-medium tabular-nums
      transition-all duration-150 cursor-pointer
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]
      ${selected ? "booking-slot-selected font-bold" : "booking-slot-default"}
    `}
  >
    <span className="relative">{slot.label ?? formatTime(slot.time)}</span>
    {selected ? <Check className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={3} aria-hidden /> : null}
  </button>
);

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

  if (visibleSlots.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-14 gap-4 text-center px-6 bg-[var(--booking-bg)]"
        dir={dir}
        data-booking-surface="time"
      >
        <div className="w-16 h-16 rounded-full bg-[var(--booking-surface)] border border-[var(--booking-border)] flex items-center justify-center">
          <CalendarX className="w-7 h-7 text-[var(--booking-text-muted)]" />
        </div>
        <div>
          <p className="text-[var(--booking-error)] font-heading font-bold text-sm mb-2">
            {t("time.empty")}
          </p>
          {onSwitchToNearest && (
            <p className="text-[var(--booking-text-secondary)] text-[13px] leading-relaxed max-w-[240px] mx-auto">
              {t("time.emptyNearestHint")}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full max-w-[260px]">
          {onSwitchToNearest && (
            <button
              type="button"
              onClick={onSwitchToNearest}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--booking-accent)] text-white text-sm font-heading font-bold hover:opacity-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            >
              <Zap className="w-4 h-4" />
              {t("actions.switchToNearestBarber")}
            </button>
          )}
          {onNextDay && (
            <button
              type="button"
              onClick={onNextDay}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--booking-border)] bg-[var(--booking-bg)] text-[var(--booking-text)] text-sm font-heading font-bold hover:bg-[var(--booking-surface-hover)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
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
  const nearestSelected = nearest
    ? isSlotSelected(nearest, selectedTime, selectedSlotProp)
    : false;

  return (
    <div className="p-5 md:p-6 space-y-5 bg-[var(--booking-bg)]" dir={dir} data-booking-surface="time">
      <div>
        <h3 className="text-xl font-heading font-bold text-[var(--booking-text)] mb-0.5">
          {t("time.title")}
        </h3>
        <p className="text-[var(--booking-text-secondary)] text-sm">{t("time.subtitle")}</p>
      </div>

      {nearest && (
        <button
          type="button"
          onClick={() => onTimeSelect(nearest)}
          aria-pressed={nearestSelected}
          className={`
            w-full relative overflow-hidden rounded-2xl p-4 transition-all duration-200 text-start cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]
            bg-[var(--booking-bg)]
            ${
              nearestSelected
                ? "border-2 border-[var(--booking-slot-selected-outline)] bg-[var(--booking-accent-soft)]"
                : "border-2 border-[var(--booking-accent)] hover:bg-[var(--booking-accent-soft)]/50"
            }
          `}
        >
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--booking-accent)]/40 bg-[var(--booking-accent-soft)]">
                <Zap className="w-5 h-5 text-[var(--booking-accent)]" />
              </div>
              <div>
                <p className="text-[13px] text-[var(--booking-text)] font-heading font-bold mb-0.5">
                  {t("time.nearestFeatured")}
                </p>
                <p className="text-[var(--booking-text-secondary)] text-[13px]">
                  {t("time.nearestFeaturedHint")}
                </p>
              </div>
            </div>
            <div className="text-end">
              <div className="font-heading font-black text-xl tabular-nums text-[var(--booking-text)]">
                {nearest.label ?? formatTime(nearest.time)}
              </div>
              {getDayOffset(nearest) === 1 && (
                <p className="text-[13px] text-[var(--booking-text-muted)] mt-0.5">
                  {t("overnight.afterMidnight")}
                </p>
              )}
              {nearestSelected ? (
                <span className="inline-flex items-center gap-1 mt-1 text-[12px] font-bold text-[var(--booking-text)]">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
                </span>
              ) : null}
            </div>
          </div>
        </button>
      )}

      {periods.map((period) => (
        <div key={period.key} className="space-y-3">
          <div className="flex items-center gap-2.5 pt-1">
            <Clock className="w-3.5 h-3.5 text-[var(--booking-text-muted)]" />
            <span className="text-sm font-heading font-bold text-[var(--booking-text-secondary)]">
              {period.title}
            </span>
            <div className="flex-1 h-px bg-[var(--booking-border-subtle)]" />
          </div>

          {period.groups.map((group) => {
            const hourTime = `${String(group.hour).padStart(2, "0")}:00`;
            return (
              <div
                key={group.hour}
                className="rounded-2xl bg-[var(--booking-bg)] border border-[var(--booking-border-subtle)] p-4 md:p-5"
              >
                <div className="flex items-center gap-2.5 mb-3.5">
                  <span className="font-heading font-black text-xl md:text-2xl text-[var(--booking-text)] leading-none tabular-nums">
                    {formatTime(hourTime)}
                  </span>
                  <span className="text-[var(--booking-text-muted)] text-[13px] ms-auto bg-[var(--booking-surface)] px-2 py-0.5 rounded-md border border-[var(--booking-border-subtle)]">
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
        <div className="space-y-3 bg-[var(--booking-bg)]">
          <div className="flex items-center gap-2.5 pt-1">
            <MoonStar className="w-3.5 h-3.5 text-[var(--booking-text-muted)]" />
            <span className="text-sm font-heading font-bold text-[var(--booking-text-secondary)]">
              {t("overnight.afterMidnight")}
            </span>
            <div className="flex-1 h-px bg-[var(--booking-border-subtle)]" />
          </div>
          <p className="text-[13px] text-[var(--booking-text-secondary)]">
            {t("overnight.explanation")}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {overnightSlots.map((slot) => (
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
      )}

      {onNextDay && (
        <div className="pt-2 space-y-3">
          <div className="h-px bg-[var(--booking-border-subtle)]" />
          <div className="text-center space-y-3 py-2">
            <p className="text-[var(--booking-text-muted)] text-[13px]">{t("time.nextDayHint")}</p>
            <button
              type="button"
              onClick={onNextDay}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl border border-[var(--booking-border)] bg-[var(--booking-bg)] text-[var(--booking-text)] font-heading font-bold text-sm hover:bg-[var(--booking-surface-hover)] active:scale-[0.97] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            >
              <span>{t("actions.showNextDaySlots")}</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-5 pt-3 border-t border-[var(--booking-border-subtle)] text-[13px] text-[var(--booking-text-muted)]">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md booking-slot-selected" />
          <span>{t("time.legendSelected")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md booking-slot-default" />
          <span>{t("time.legendAvailable")}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingTimeSlots;
