"use client";

import { CalendarX, Loader2, MapPin, MoonStar, RefreshCw } from "lucide-react";
import type { CrossBranchSlot, PublicBarberBranch } from "@/lib/booking-api";
import { crossBranchSlotKey } from "@/lib/booking-api";
import { getBranchAccent } from "@/lib/branchTheme";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";

export const ALL_BRANCHES_TAB = "all" as const;
export type CrossBranchTabId = typeof ALL_BRANCHES_TAB | string;

interface CrossBranchSlotsPanelProps {
  branches: PublicBarberBranch[];
  slots: CrossBranchSlot[];
  activeTab: CrossBranchTabId;
  onTabChange: (tab: CrossBranchTabId) => void;
  selectedKey?: string | null;
  onSelect: (slot: CrossBranchSlot) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function SlotSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-28 rounded bg-cut-black/10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="h-16 rounded-xl bg-cut-black/[0.06]" />
            <div className="h-16 rounded-xl bg-cut-black/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CrossBranchSlotsPanel({
  branches,
  slots,
  activeTab,
  onTabChange,
  selectedKey,
  onSelect,
  isLoading,
  error,
  onRetry,
}: CrossBranchSlotsPanelProps) {
  const { t, dir, format } = useBookingTranslations();

  const showTabs = branches.length > 1;
  const visibleSlots =
    activeTab === ALL_BRANCHES_TAB
      ? slots
      : slots.filter((s) => s.branchCode.toUpperCase() === activeTab.toUpperCase());

  const byDate = new Map<string, CrossBranchSlot[]>();
  for (const slot of visibleSlots) {
    const list = byDate.get(slot.date) ?? [];
    list.push(slot);
    byDate.set(slot.date, list);
  }
  const dateGroups = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));

  const dateLabel = (ymd: string) => {
    const d = new Date(`${ymd}T12:00:00`);
    if (Number.isNaN(d.getTime())) return ymd;
    return format.shortDate(d);
  };

  return (
    <div className="p-5 md:p-6" dir={dir}>
      <div className="mb-4">
        <h3 className="text-lg font-heading font-bold text-[var(--booking-text)] mb-1">
          {t("time.crossTitle")}
        </h3>
        <p className="text-[var(--booking-text-secondary)] text-[13px]">{t("time.crossSubtitle")}</p>
      </div>

      {showTabs && (
        <div className="mb-3 space-y-2">
          <div
            className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
            role="tablist"
            aria-label={t("time.crossFilterAria")}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === ALL_BRANCHES_TAB}
              onClick={() => onTabChange(ALL_BRANCHES_TAB)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] ${
                activeTab === ALL_BRANCHES_TAB
                  ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                  : "bg-white text-cut-black/70 border-[#D4AF37]/25 hover:border-[#D4AF37]/50"
              }`}
            >
              {t("time.crossAllSlots")}
            </button>
            {branches.map((b) => {
              const accent = getBranchAccent(b.branchCode, b.branchName);
              const selected = activeTab.toUpperCase() === b.branchCode.toUpperCase();
              return (
                <button
                  key={b.branchCode}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onTabChange(b.branchCode)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] ${
                    selected ? accent.tabSelected : accent.tabIdle
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      selected ? "bg-white/90" : accent.dot
                    }`}
                    aria-hidden
                  />
                  {b.branchName || b.branchCode}
                </button>
              );
            })}
          </div>
          <div
            className="flex flex-wrap gap-3 px-1 text-[13px] text-[var(--booking-text-secondary)]"
            aria-hidden
          >
            {branches.map((b) => {
              const accent = getBranchAccent(b.branchCode, b.branchName);
              return (
                <span key={`legend-${b.branchCode}`} className="inline-flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${accent.dot}`} />
                  {b.branchName || accent.labelAr}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {isLoading && (
        <div aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-2 text-[var(--booking-text-secondary)] text-sm mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("loading.crossBranchSlots")}
          </div>
          <SlotSkeleton />
        </div>
      )}

      {!isLoading && error && (
        <div
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-[var(--booking-error)] text-sm text-center space-y-3"
          role="alert"
        >
          <p>{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-[var(--booking-error)] text-[13px] font-bold hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t("actions.retry")}
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && visibleSlots.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-12 gap-3 text-center"
          aria-live="polite"
        >
          <div className="w-14 h-14 rounded-full bg-cut-black/[0.04] flex items-center justify-center">
            <CalendarX className="w-7 h-7 text-cut-black/35" />
          </div>
          <p className="text-[var(--booking-text)] font-medium">{t("empty.crossSlots")}</p>
          <p className="text-[var(--booking-text-secondary)] text-[13px]">
            {t("empty.crossSlotsHint")}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cut-gold/20 text-[13px] font-bold text-cut-black/70 hover:bg-cut-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t("actions.refreshSlots")}
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && dateGroups.length > 0 && (
        <div className="space-y-5" role="list">
          {dateGroups.map(([date, daySlots]) => (
            <section key={date} aria-label={dateLabel(date)}>
              <h4 className="text-sm font-bold text-[var(--booking-text)] mb-2">
                {dateLabel(date)}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {daySlots.map((slot) => {
                  const key = crossBranchSlotKey(slot);
                  const selected = selectedKey === key;
                  const accent = getBranchAccent(slot.branchCode, slot.branchName);
                  return (
                    <button
                      key={key}
                      type="button"
                      role="listitem"
                      onClick={() => onSelect(slot)}
                      className={`relative text-start rounded-xl border p-3 transition-all overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] ${
                        selected ? accent.slotSelected : accent.slotIdle
                      }`}
                    >
                      <span
                        className={`absolute inset-y-0 end-0 w-1 ${accent.dot}`}
                        aria-hidden
                      />
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-[var(--booking-text)] tabular-nums">
                          {format.time(slot.time)}
                        </span>
                        {slot.dayOffset === 1 && (
                          <span className="inline-flex items-center gap-1 text-[13px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            <MoonStar className="w-3 h-3" />
                            {t("time.overnightBadge")}
                          </span>
                        )}
                      </div>
                      <div
                        className={`inline-flex items-center gap-1.5 text-[13px] font-bold px-2 py-0.5 rounded-md border ${accent.chip} ${accent.chipText}`}
                      >
                        <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${accent.icon}`} />
                        <span className="truncate">{slot.branchName || slot.branchCode}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
