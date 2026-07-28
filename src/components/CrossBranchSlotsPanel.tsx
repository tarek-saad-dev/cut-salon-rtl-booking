"use client";

import { CalendarX, Loader2, MapPin, MoonStar, RefreshCw } from "lucide-react";
import type { CrossBranchSlot, PublicBarberBranch } from "@/lib/booking-api";
import { crossBranchSlotKey } from "@/lib/booking-api";

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

function formatDateLabel(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
}

function formatTimeLabel(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  if (!Number.isFinite(h)) return time;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h >= 12 ? "م" : "ص";
  return `${h12}:${mStr ?? "00"} ${ampm}`;
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

  return (
    <div className="p-5 md:p-6" dir="rtl">
      <div className="mb-4">
        <h3 className="text-lg font-heading font-bold text-cut-black mb-1">
          مواعيد الحلاق
        </h3>
        <p className="text-cut-black/50 text-xs">
          كل المواعيد المتاحة عبر الفروع — اختار الموعد والفرع معاً
        </p>
      </div>

      {showTabs && (
        <div
          className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-1 px-1"
          role="tablist"
          aria-label="تصفية المواعيد حسب الفرع"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === ALL_BRANCHES_TAB}
            onClick={() => onTabChange(ALL_BRANCHES_TAB)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              activeTab === ALL_BRANCHES_TAB
                ? "bg-cut-gold text-black border-cut-gold"
                : "bg-white text-cut-black/70 border-cut-gold/20 hover:border-cut-gold/40"
            }`}
          >
            جميع المواعيد
          </button>
          {branches.map((b) => {
            const selected = activeTab.toUpperCase() === b.branchCode.toUpperCase();
            return (
              <button
                key={b.branchCode}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onTabChange(b.branchCode)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  selected
                    ? "bg-cut-gold text-black border-cut-gold"
                    : "bg-white text-cut-black/70 border-cut-gold/20 hover:border-cut-gold/40"
                }`}
              >
                {b.branchName || b.branchCode}
              </button>
            );
          })}
        </div>
      )}

      {isLoading && (
        <div aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-2 text-cut-black/50 text-sm mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري تحميل المواعيد عبر الفروع...
          </div>
          <SlotSkeleton />
        </div>
      )}

      {!isLoading && error && (
        <div
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center space-y-3"
          role="alert"
        >
          <p>{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 text-xs font-bold hover:bg-red-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة المحاولة
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
          <p className="text-cut-black/85 font-medium">لا توجد مواعيد متاحة حالياً</p>
          <p className="text-cut-black/50 text-xs">جرب تغيير الخدمة أو العودة لاحقاً</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cut-gold/20 text-xs font-bold text-cut-black/70 hover:bg-cut-black/[0.03]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تحديث المواعيد
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && dateGroups.length > 0 && (
        <div className="space-y-5" role="list">
          {dateGroups.map(([date, daySlots]) => (
            <section key={date} aria-label={formatDateLabel(date)}>
              <h4 className="text-sm font-bold text-cut-black mb-2">
                {formatDateLabel(date)}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {daySlots.map((slot) => {
                  const key = crossBranchSlotKey(slot);
                  const selected = selectedKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="listitem"
                      onClick={() => onSelect(slot)}
                      className={`text-right rounded-xl border p-3 transition-all ${
                        selected
                          ? "border-cut-gold bg-cut-gold/15 shadow-sm"
                          : "border-cut-gold/15 bg-white hover:border-cut-gold/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-cut-black tabular-nums">
                          {formatTimeLabel(slot.time)}
                        </span>
                        {slot.dayOffset === 1 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                            <MoonStar className="w-3 h-3" />
                            ليلي
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-cut-black/65">
                        <MapPin className="w-3.5 h-3.5 text-cut-gold flex-shrink-0" />
                        <span className="font-medium truncate">
                          {slot.branchName || slot.branchCode}
                        </span>
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
