"use client";

import { Scissors, Clock, Banknote, Tag } from "lucide-react";
import type { BookingService } from "@/lib/publicBookingApi";

interface BookingServiceSelectProps {
  services: BookingService[];
  selectedIds: number[];
  onSelect: (id: number) => void;
  isLoading?: boolean;
}

const SkeletonCard = () => (
  <div className="rounded-xl border border-gray-100 p-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="text-right space-y-2">
        <div className="h-4 bg-gray-100 rounded w-16" />
        <div className="h-3 bg-gray-100 rounded w-12" />
      </div>
    </div>
  </div>
);

const BookingServiceSelect = ({
  services,
  selectedIds,
  onSelect,
  isLoading = false,
}: BookingServiceSelectProps) => {
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

  const bookable = services.filter(s => s.isBookableOnline);

  if (bookable.length === 0) {
    return (
      <div className="p-6 text-center" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <Scissors className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-500 text-sm">لا توجد خدمات متاحة للحجز الآن</p>
      </div>
    );
  }

  // Group by category
  const grouped = bookable.reduce<Record<string, BookingService[]>>((acc, s) => {
    const cat = s.categoryName ?? "خدمات أخرى";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="p-6" dir="rtl">
      <h3 className="text-xl font-heading font-bold text-gray-900 mb-1">اختر الخدمة</h3>
      <p className="text-gray-400 text-sm mb-6">اختر خدمة واحدة للمتابعة</p>

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, catServices]) => (
          <div key={category}>
            {Object.keys(grouped).length > 1 && (
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {category}
                </span>
              </div>
            )}

            <div className="space-y-2">
              {catServices.map(service => {
                const isSelected = selectedIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => onSelect(service.id)}
                    className={`
                      w-full rounded-xl border p-4 text-right transition-all duration-150
                      ${isSelected
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-sm shadow-[#D4AF37]/10"
                        : "border-gray-150 bg-white hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/3"
                      }
                    `}
                  >
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

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold text-sm leading-tight transition-colors ${
                            isSelected ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {service.name}
                        </p>
                        {service.categoryName && Object.keys(grouped).length === 1 && (
                          <p className="text-gray-400 text-xs mt-0.5">{service.categoryName}</p>
                        )}
                      </div>

                      {/* Price + Duration */}
                      <div className="text-left flex-shrink-0 space-y-0.5">
                        <div className="flex items-center gap-1 justify-end">
                          <Banknote className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span className={`text-sm font-bold ${isSelected ? "text-[#D4AF37]" : "text-gray-700"}`}>
                            {service.price} جنيه
                          </span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {service.durationMinutes} دقيقة
                          </span>
                        </div>
                      </div>

                      {/* Selected indicator */}
                      <div
                        className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                          ${isSelected
                            ? "border-[#D4AF37] bg-[#D4AF37]"
                            : "border-gray-200"
                          }
                        `}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingServiceSelect;
