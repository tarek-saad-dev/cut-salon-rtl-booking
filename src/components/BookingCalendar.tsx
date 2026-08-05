"use client";

import { useState, useMemo, type CSSProperties } from "react";
import { format as formatDateFns } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarX, Check } from "lucide-react";
import type { AvailableDay, BarberAvailableDay } from "@/lib/booking-api";
import { getBranchVisual, singleBranchDayStyle } from "@/lib/booking/branch-visuals";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";

type CalendarDay = AvailableDay | BarberAvailableDay;

interface BookingCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  availableDays: CalendarDay[];
  isLoading?: boolean;
  maxDaysAhead?: number;
  /** Soft branch fills / dual dots for multi-branch all_branches calendar. */
  showBranchIndicators?: boolean;
  /** Compact text+color legend (Gleem / Camp / both). */
  legend?: boolean;
  /** Soft fill for specific_branch scope. */
  activeBranchCode?: string | null;
}

const CalendarSkeleton = ({ dir }: { dir: "rtl" | "ltr" }) => (
  <div className="p-6 animate-pulse" dir={dir}>
    <div className="h-6 bg-[var(--booking-surface)] rounded w-32 mb-6" />
    <div className="flex items-center justify-between mb-5">
      <div className="w-9 h-9 rounded-lg bg-[var(--booking-surface)]" />
      <div className="h-5 bg-[var(--booking-surface)] rounded w-28" />
      <div className="w-9 h-9 rounded-lg bg-[var(--booking-surface)]" />
    </div>
    <div className="grid grid-cols-7 gap-1 mb-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-8 bg-[var(--booking-surface)] rounded" />
      ))}
    </div>
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-full bg-[var(--booking-surface)]" />
      ))}
    </div>
  </div>
);

function dayBranches(entry: CalendarDay | undefined): { branchCode: string }[] {
  if (!entry || !("branches" in entry) || !Array.isArray(entry.branches)) return [];
  return entry.branches.filter((b) => Boolean(b?.branchCode));
}

const BookingCalendar = ({
  selectedDate,
  onDateSelect,
  availableDays,
  isLoading = false,
  maxDaysAhead = 60,
  showBranchIndicators = false,
  legend = false,
  activeBranchCode = null,
}: BookingCalendarProps) => {
  const { t, dir, format } = useBookingTranslations();
  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;
  const weekdayLabels = format.weekdayShort();

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

  const availableMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const day of availableDays) {
      map.set(day.date, day);
    }
    return map;
  }, [availableDays]);

  const hasAnyAvailable = availableDays.some((d) => d.available);

  const prevMonth = () =>
    setViewMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });

  const nextMonth = () =>
    setViewMonth((prev) => {
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

  const toKey = (date: Date) => formatDateFns(date, "yyyy-MM-dd");

  const isSelected = (date: Date) => selectedDate?.toDateString() === date.toDateString();

  const isToday = (date: Date) => date.toDateString() === today.toDateString();

  const isOutOfRange = (date: Date) => date < today || date > maxDate;

  const getDayInfo = (date: Date): { available: boolean; reason?: string | null; entry?: CalendarDay } => {
    if (isOutOfRange(date)) return { available: false };
    const key = toKey(date);
    const entry = availableMap.get(key);
    if (!entry) return { available: false };
    return { available: entry.available, reason: entry.reason, entry };
  };

  if (process.env.NODE_ENV === "development" && availableDays.length > 0) {
    const todayKey = toKey(today);
    console.log("[calendar] availableMap keys (first 10):", [...availableMap.keys()].slice(0, 10));
    console.log("[calendar] today key:", todayKey, "→ getDayInfo:", getDayInfo(today));
    console.log(
      "[calendar] today < today?",
      today < today,
      "| isOutOfRange(today):",
      isOutOfRange(today),
    );
  }

  if (isLoading) return <CalendarSkeleton dir={dir} />;

  const cells = getCells();
  const useBranchVisuals = showBranchIndicators || Boolean(activeBranchCode);

  return (
    <div className="p-6" dir={dir}>
      <h3 className="text-xl font-heading font-bold text-[var(--booking-text)] mb-1">
        {t("date.title")}
      </h3>
      <p className="text-[var(--booking-text-secondary)] text-sm mb-5">{t("date.subtitle")}</p>

      {!isLoading && !hasAnyAvailable && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--booking-surface)] flex items-center justify-center">
            <CalendarX className="w-7 h-7 text-[var(--booking-text-secondary)]" />
          </div>
          <p className="text-[var(--booking-text-secondary)] font-medium text-sm">{t("date.empty")}</p>
          <p className="text-[var(--booking-text-secondary)] text-[13px]">{t("date.emptyHint")}</p>
        </div>
      )}

      {hasAnyAvailable && (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              disabled={isPrevDisabled()}
              className="w-9 h-9 rounded-full border border-[var(--booking-border)] hover:border-[var(--booking-accent)] hover:bg-[var(--booking-accent)]/5 flex items-center justify-center transition-all group disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
              aria-label={t("date.prevMonth")}
            >
              <PrevIcon className="w-4 h-4 text-[var(--booking-text-secondary)] group-hover:text-[var(--booking-accent)]" />
            </button>

            <span className="font-heading font-bold text-[var(--booking-text)] text-base">
              {format.monthYear(viewMonth)}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              disabled={isNextDisabled()}
              className="w-9 h-9 rounded-full border border-[var(--booking-border)] hover:border-[var(--booking-accent)] hover:bg-[var(--booking-accent)]/5 flex items-center justify-center transition-all group disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
              aria-label={t("date.nextMonth")}
            >
              <NextIcon className="w-4 h-4 text-[var(--booking-text-secondary)] group-hover:text-[var(--booking-accent)]" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {weekdayLabels.map((day) => (
              <div
                key={day}
                className="text-center text-[13px] font-semibold text-[var(--booking-text-secondary)] py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;

              const { available, reason, entry } = getDayInfo(date);
              const selected = isSelected(date);
              const todayCell = isToday(date);
              const outOfRange = isOutOfRange(date);
              const branches = dayBranches(entry);
              const singleCode =
                showBranchIndicators && branches.length === 1
                  ? branches[0].branchCode
                  : activeBranchCode && available
                    ? activeBranchCode
                    : null;
              const bothBranches = showBranchIndicators && branches.length >= 2;

              let btnClass =
                "aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all duration-150 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]";

              let inlineStyle: CSSProperties | undefined;

              if (selected) {
                btnClass +=
                  " ring-2 ring-cut-black text-cut-black font-bold z-10 bg-white shadow-md";
                if (singleCode && useBranchVisuals) {
                  inlineStyle = singleBranchDayStyle(singleCode);
                } else if (bothBranches) {
                  inlineStyle = { backgroundColor: "#f4f4f5" };
                }
              } else if (!available || outOfRange) {
                btnClass += " text-[var(--booking-border)] cursor-not-allowed";
              } else if (useBranchVisuals && singleCode) {
                inlineStyle = singleBranchDayStyle(singleCode);
                btnClass += " font-semibold cursor-pointer hover:opacity-90";
                if (todayCell) btnClass += " ring-1 ring-cut-black/30";
              } else if (bothBranches) {
                btnClass +=
                  " font-semibold cursor-pointer bg-zinc-100 text-cut-black hover:bg-zinc-200";
                if (todayCell) btnClass += " ring-1 ring-cut-black/30";
              } else if (todayCell) {
                btnClass +=
                  " ring-2 ring-[var(--booking-success)] text-[var(--booking-success)] font-bold hover:bg-cut-warm-beige hover:text-cut-ivory";
              } else {
                btnClass +=
                  " bg-emerald-50 text-[var(--booking-success)] font-semibold hover:bg-emerald-500 hover:text-cut-ivory cursor-pointer";
              }

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => available && !outOfRange && onDateSelect(date)}
                  disabled={!available || outOfRange}
                  title={reason ?? undefined}
                  className={btnClass}
                  style={inlineStyle}
                  aria-pressed={selected}
                >
                  {selected ? (
                    <span className="absolute -top-0.5 -end-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cut-black text-white">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                    </span>
                  ) : null}
                  {format.number(date.getDate())}
                  {available && !outOfRange && !selected && bothBranches && (
                    <span className="absolute bottom-0.5 inset-x-0 flex items-center justify-center gap-0.5">
                      {branches.slice(0, 2).map((b) => {
                        const v = getBranchVisual(b.branchCode);
                        return (
                          <span
                            key={b.branchCode}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: v.accent }}
                            title={
                              v.legendKey === "gleem"
                                ? t("scope.legendGleem")
                                : v.legendKey === "camp"
                                  ? t("scope.legendCamp")
                                  : b.branchCode
                            }
                            aria-hidden
                          />
                        );
                      })}
                    </span>
                  )}
                  {available && !outOfRange && !selected && !bothBranches && !useBranchVisuals && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cut-warm-beige" />
                  )}
                  {available && !outOfRange && !selected && singleCode && useBranchVisuals && (
                    <span
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getBranchVisual(singleCode).accent }}
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>

          {legend && useBranchVisuals ? (
            <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-[var(--booking-border)] text-[13px] text-[var(--booking-text-secondary)]">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10"
                  style={{ backgroundColor: getBranchVisual("GLEEM").softBackground }}
                  aria-hidden
                />
                <span>{t("scope.legendGleem")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10"
                  style={{ backgroundColor: getBranchVisual("CAMP_CAESAR").softBackground }}
                  aria-hidden
                />
                <span>{t("scope.legendCamp")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5" aria-hidden>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getBranchVisual("GLEEM").accent }}
                  />
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getBranchVisual("CAMP_CAESAR").accent }}
                  />
                </span>
                <span>{t("scope.legendBoth")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-white ring-2 ring-cut-black flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-cut-black" strokeWidth={3} />
                </div>
                <span>{t("date.legendSelected")}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-[var(--booking-border)] text-[13px] text-[var(--booking-text-secondary)]">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-cut-gold" />
                <span>{t("date.legendSelected")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-50 ring-2 ring-[var(--booking-success)]" />
                <span>{t("date.legendToday")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-300" />
                <span>{t("date.legendAvailable")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-[var(--booking-surface)]" />
                <span>{t("date.legendUnavailable")}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookingCalendar;
