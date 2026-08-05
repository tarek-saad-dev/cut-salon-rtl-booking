"use client";

import { CalendarX, Loader2, MoonStar, Zap } from "lucide-react";
import {
  barberSlotKey,
  localizeBranchName,
  type BarberAvailableSlot,
  type PublicBranch,
} from "@/lib/booking-api";
import { getBranchVisual, branchVisualStyle } from "@/lib/booking/branch-visuals";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";

export type MultiBranchFilter = "all" | string;

interface BookingMultiBranchTimeSlotsProps {
  slots: BarberAvailableSlot[];
  selectedSlot?: BarberAvailableSlot | null;
  onSelect: (slot: BarberAvailableSlot) => void;
  isLoading?: boolean;
  branchFilter: MultiBranchFilter;
  onBranchFilterChange: (filter: MultiBranchFilter) => void;
  allowedBranches: PublicBranch[];
  partialWarning?: boolean;
}

function isOvernight(slot: BarberAvailableSlot): boolean {
  return slot.dayOffset === 1;
}

function isSameSlot(
  a: BarberAvailableSlot | null | undefined,
  b: BarberAvailableSlot,
): boolean {
  if (!a) return false;
  return barberSlotKey(a) === barberSlotKey(b);
}

function filterLabel(
  code: string,
  t: (key: string, params?: Record<string, string | number>) => string,
  lang: "ar" | "en",
  branch?: PublicBranch,
): string {
  const upper = code.toUpperCase();
  if (upper === "GLEEM") return t("time.filterGleem");
  if (upper === "CAMP_CAESAR") return t("time.filterCamp");
  if (branch) {
    const localized = localizeBranchName(branch, lang);
    if (localized) return localized;
  }
  return code;
}

export default function BookingMultiBranchTimeSlots({
  slots,
  selectedSlot,
  onSelect,
  isLoading = false,
  branchFilter,
  onBranchFilterChange,
  allowedBranches,
  partialWarning = false,
}: BookingMultiBranchTimeSlotsProps) {
  const { t, dir, lang, format } = useBookingTranslations();

  const visibleSlots =
    branchFilter === "all"
      ? slots
      : slots.filter(
          (s) => (s.branchCode || "").toUpperCase() === branchFilter.toUpperCase(),
        );

  const earliest = slots[0] ?? null;
  const earliestKey = earliest ? barberSlotKey(earliest) : null;

  if (isLoading) {
    return (
      <div className="p-5 md:p-6 space-y-4 animate-pulse" dir={dir} aria-busy="true">
        <div className="h-6 bg-[var(--booking-surface)] rounded w-36" />
        <div className="h-4 bg-[var(--booking-surface)] rounded w-52" />
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-[var(--booking-surface)]" />
          ))}
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-[var(--booking-surface)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-4" dir={dir}>
      <div>
        <h3 className="text-xl font-heading font-bold text-[var(--booking-text)] mb-0.5">
          {t("time.title")}
        </h3>
        <p className="text-[var(--booking-text-secondary)] text-sm">{t("time.subtitle")}</p>
      </div>

      {partialWarning && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
          role="status"
        >
          {t("errors.partialBarberAvailability")}
        </div>
      )}

      {allowedBranches.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
          role="tablist"
          aria-label={t("time.crossFilterAria")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={branchFilter === "all"}
            onClick={() => onBranchFilterChange("all")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] ${
              branchFilter === "all"
                ? "bg-cut-black text-white border-cut-black"
                : "bg-white text-cut-black/70 border-[var(--booking-border)] hover:border-cut-black/40"
            }`}
          >
            {t("time.filterAll")}
          </button>
          {allowedBranches.map((b) => {
            const selected = branchFilter.toUpperCase() === b.branchCode.toUpperCase();
            const visual = getBranchVisual(b.branchCode);
            return (
              <button
                key={b.branchCode}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onBranchFilterChange(b.branchCode)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] ${
                  selected
                    ? "text-white border-transparent"
                    : "bg-white text-cut-black/70 border-[var(--booking-border)] hover:border-cut-black/40"
                }`}
                style={
                  selected
                    ? { backgroundColor: visual.accent, borderColor: visual.accent }
                    : undefined
                }
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selected ? "#fff" : visual.accent }}
                  aria-hidden
                />
                {filterLabel(b.branchCode, t, lang, b)}
              </button>
            );
          })}
        </div>
      )}

      {visibleSlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--booking-surface)] flex items-center justify-center">
            <CalendarX className="w-7 h-7 text-[var(--booking-text-secondary)]" />
          </div>
          <p className="text-[var(--booking-text-secondary)] font-medium text-sm">
            {slots.length === 0
              ? t("empty.noAppointmentsAcrossBranches")
              : t("time.empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2" role="listbox" aria-label={t("time.title")}>
          {visibleSlots.map((slot) => {
            const key = barberSlotKey(slot);
            const selected = isSameSlot(selectedSlot, slot);
            const isEarliest = earliestKey === key;
            const visual = getBranchVisual(slot.branchCode);
            const branchFromPool = allowedBranches.find(
              (b) => b.branchCode.toUpperCase() === (slot.branchCode || "").toUpperCase(),
            );
            // Prefer i18n / public-branch labels so EN never falls back to Arabic branchName alone.
            const branchLabel =
              filterLabel(slot.branchCode, t, lang, branchFromPool) ||
              localizeBranchName(
                {
                  branchName: slot.branchName ?? branchFromPool?.branchName,
                  branchNameAr: slot.branchNameAr,
                  branchNameEn: slot.branchNameEn,
                  shortName: branchFromPool?.shortName,
                },
                lang,
              ) ||
              slot.branchCode;

            return (
              <li key={key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onSelect(slot)}
                  className={`w-full rounded-2xl border p-3.5 text-start transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] ${
                    selected
                      ? "border-cut-black ring-2 ring-cut-black bg-white shadow-md"
                      : "border-[var(--booking-border)] bg-white hover:border-cut-black/35"
                  }`}
                  style={branchVisualStyle(slot.branchCode)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-lg tabular-nums text-cut-black">
                          {slot.label ?? format.time(slot.time)}
                        </span>
                        {isOvernight(slot) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--booking-text-secondary)]">
                            <MoonStar className="w-3 h-3" aria-hidden />
                            {t("overnight.afterMidnight")}
                          </span>
                        )}
                        {isEarliest && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cut-black text-white text-[10px] font-bold px-2 py-0.5">
                            <Zap className="w-3 h-3" aria-hidden />
                            {t("time.earliestAvailable")}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-[12px] font-bold text-cut-black"
                        style={{ backgroundColor: "var(--branch-soft-bg)" }}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: visual.accent }}
                          aria-hidden
                        />
                        {branchLabel}
                      </div>
                    </div>
                    {selected ? (
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cut-black text-white text-xs font-bold">
                        ✓
                      </span>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-[var(--booking-text-secondary)]" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("loading.crossBranchSlots")}
        </div>
      )}
    </div>
  );
}
