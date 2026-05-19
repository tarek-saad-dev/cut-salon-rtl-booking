"use client";

import { useState, useMemo } from "react";
import { Scissors, Clock, Banknote, Check, Sparkles } from "lucide-react";
import type { BookingService } from "@/lib/publicBookingApi";

interface BookingServiceSelectProps {
  services: BookingService[];
  selectedIds: number[];
  onSelect: (id: number) => void;
  isLoading?: boolean;
}

/* ─── Allowed categories & tab mapping ────────────────────────────────────── */

const TAB_ORDER = ["حلاقة", "تنظيف", "خدمات الشعر"];

const BADGES = ["عرض أونلاين", "خصم خاص", "الأكثر طلبًا"];

function getTabKey(categoryName: string | null): string | null {
  if (!categoryName) return null;
  const cat = categoryName.trim().toLowerCase();
  if (cat === "حلاقة") return "حلاقة";
  if (cat === "skincare") return "تنظيف";
  if (
    cat.includes("خدمات") &&
    (cat.includes("اضاف") || cat.includes("إضاف") || cat.includes("اضافية") || cat.includes("إضافية")) &&
    cat.includes("شعر")
  ) {
    return "خدمات الشعر";
  }
  return null;
}

function isAllowedCategory(categoryName: string | null): boolean {
  return getTabKey(categoryName) !== null;
}

/* ─── Skeletons ───────────────────────────────────────────────────────────── */

const SkeletonCard = () => (
  <div className="rounded-xl border border-gray-100 p-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  </div>
);

/* ─── Component ─────────────────────────────────────────────────────────── */

const BookingServiceSelect = ({
  services,
  selectedIds,
  onSelect,
  isLoading = false,
}: BookingServiceSelectProps) => {
  const [activeTab, setActiveTab] = useState<string>(TAB_ORDER[0]);

  /* Filter: allowed categories, price > 0, not deleted */
  const filtered = useMemo(() => {
    return services.filter(s => {
      if (!s.isBookableOnline) return false;
      if (!isAllowedCategory(s.categoryName)) return false;
      if (s.price <= 0) return false;
      if ((s as unknown as Record<string, unknown>).isDeleted === true) return false;
      return true;
    });
  }, [services]);

  /* Group by tab */
  const grouped = useMemo(() => {
    const map: Record<string, BookingService[]> = {};
    TAB_ORDER.forEach(t => (map[t] = []));
    filtered.forEach(s => {
      const key = getTabKey(s.categoryName);
      if (key && map[key]) map[key].push(s);
    });
    return map;
  }, [filtered]);

  /* Active tab services */
  const tabServices = grouped[activeTab] ?? [];

  /* Loading state */
  if (isLoading) {
    return (
      <div className="p-6" dir="rtl">
        <h3 className="text-xl font-heading font-bold text-gray-900 mb-6">اختر الخدمة</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  /* No services at all */
  if (filtered.length === 0) {
    return (
      <div className="p-6 text-center" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <Scissors className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-500 text-sm">لا توجد خدمات متاحة للحجز الآن</p>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <h3 className="text-xl font-heading font-bold text-gray-900 mb-1">اختر الخدمة</h3>
      <p className="text-gray-400 text-sm mb-5">اختر خدمة واحدة للمتابعة</p>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {TAB_ORDER.map(tab => {
          const count = grouped[tab]?.length ?? 0;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              disabled={count === 0}
              className={`
                flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                ${isActive
                  ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20"
                  : count === 0
                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              {tab}
              {count > 0 && !isActive && (
                <span className="mr-1.5 inline-block w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] leading-5 text-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Service Cards ── */}
      {tabServices.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-400 text-sm">لا توجد خدمات متاحة في هذا القسم</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tabServices.map((service, idx) => {
            const isSelected = selectedIds.includes(service.id);
            const badge = BADGES[idx % BADGES.length];
            return (
              <button
                key={service.id}
                onClick={() => onSelect(service.id)}
                className={`
                  w-full rounded-xl border p-4 text-right transition-all duration-150 relative
                  ${isSelected
                    ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-sm shadow-[#D4AF37]/10"
                    : "border-gray-150 bg-white hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/3"
                  }
                `}
              >
                {/* Badge */}
                <div className="flex items-center gap-1 mb-2">
                  <span
                    className={`
                      inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold
                      ${idx % 3 === 0
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : idx % 3 === 1
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }
                    `}
                  >
                    <Sparkles className="w-3 h-3" />
                    {badge}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className={`
                      w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                      ${isSelected ? "bg-[#D4AF37]" : "bg-gray-50"}
                    `}
                  >
                    <Scissors
                      className={`w-4 h-4 transition-colors ${isSelected ? "text-black" : "text-gray-400"}`}
                    />
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-bold text-sm leading-tight transition-colors ${isSelected ? "text-gray-900" : "text-gray-800"
                        }`}
                    >
                      {service.name}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1.5">
                      <span className="flex items-center gap-1">
                        <Banknote className="w-3 h-3 text-[#D4AF37]" />
                        {service.price} جنيه
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {service.durationMinutes} دقيقة
                      </span>
                    </p>
                  </div>

                  {/* Selected check */}
                  <div
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${isSelected
                        ? "border-[#D4AF37] bg-[#D4AF37]"
                        : "border-gray-200"
                      }
                    `}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingServiceSelect;
