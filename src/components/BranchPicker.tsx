"use client";

import { MapPin, Phone, Check, Loader2, Building2 } from "lucide-react";
import type { PublicBranch } from "@/lib/booking-api";
import { useLanguage } from "@/context/LanguageContext";
import { getBranchAccent } from "@/lib/branchTheme";

interface BranchPickerProps {
  branches: PublicBranch[];
  selectedBranchCode?: string | null;
  onSelect: (branch: PublicBranch) => void;
  isLoading?: boolean;
  error?: string | null;
  /** "light" = sits on a light (cut-ivory) surface, "dark" = sits on a dark (cut-black) surface. */
  variant?: "light" | "dark";
  /** Smaller footprint for header/popover switcher use. */
  compact?: boolean;
}

const SkeletonCard = ({ variant }: { variant: "light" | "dark" }) => (
  <div
    className={`rounded-2xl border p-4 animate-pulse ${
      variant === "light" ? "border-cut-gold/15 bg-cut-black/[0.03]" : "border-white/10 bg-white/[0.03]"
    }`}
  >
    <div className={`h-4 w-2/5 rounded ${variant === "light" ? "bg-cut-black/10" : "bg-white/10"}`} />
    <div className={`h-3 w-3/5 rounded mt-3 ${variant === "light" ? "bg-cut-black/10" : "bg-white/10"}`} />
  </div>
);

const BranchPicker = ({
  branches,
  selectedBranchCode,
  onSelect,
  isLoading,
  error,
  variant = "light",
  compact = false,
}: BranchPickerProps) => {
  const { lang, dir } = useLanguage();
  const isLight = variant === "light";

  if (isLoading) {
    return (
      <div className="space-y-3" dir={dir}>
        <SkeletonCard variant={variant} />
        <SkeletonCard variant={variant} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-xl p-4 text-center text-sm ${
          isLight ? "bg-red-50 border border-red-200 text-red-600" : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}
        dir={dir}
      >
        {error}
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div
        className={`rounded-xl p-4 text-center text-sm ${
          isLight ? "bg-cut-black/[0.04] text-cut-black/60" : "bg-white/[0.04] text-cut-ivory/50"
        }`}
        dir={dir}
      >
        {lang === "ar" ? "لا توجد فروع متاحة حاليًا" : "No branches are currently available."}
      </div>
    );
  }

  return (
    <div className="space-y-3" dir={dir}>
      {branches.map((branch) => {
        const isSelected = branch.branchCode === selectedBranchCode;
        const accent = getBranchAccent(branch.branchCode, branch.branchName);
        return (
          <button
            key={branch.branchCode}
            onClick={() => onSelect(branch)}
            className={`relative w-full rounded-2xl border text-start transition-all duration-200 group cursor-pointer overflow-hidden ${
              compact ? "p-3" : "p-4"
            } ${
              isSelected
                ? isLight
                  ? `${accent.slotSelected}`
                  : `${accent.softBg} ${accent.border}`
                : isLight
                  ? `${accent.slotIdle}`
                  : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]"
            }`}
          >
            <span
              className={`absolute inset-y-0 ${isLight ? "right-0" : "right-0"} w-1.5 ${accent.dot}`}
              aria-hidden
            />
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected
                    ? accent.softBg
                    : isLight
                      ? "bg-cut-black/[0.04] group-hover:bg-cut-black/[0.06]"
                      : "bg-white/[0.06]"
                }`}
              >
                <Building2
                  className={`w-5 h-5 ${
                    isSelected
                      ? accent.icon
                      : isLight
                        ? "text-cut-black/50"
                        : "text-cut-ivory/60"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4
                    className={`font-heading font-bold text-sm ${
                      isLight ? "text-cut-black" : "text-cut-ivory"
                    }`}
                  >
                    {branch.branchName}
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${accent.chip} ${accent.chipText}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} aria-hidden />
                    {accent.key === "camp"
                      ? "كامب شيزار"
                      : accent.key === "gleem"
                        ? "سابا باشا"
                        : accent.labelAr}
                  </span>
                  {isSelected && (
                    <span
                      className={`flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0 ${accent.dot}`}
                    >
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                </div>
                {!compact && branch.address && (
                  <p className={`flex items-start gap-1.5 text-xs mt-1.5 ${isLight ? "text-cut-black/55" : "text-cut-ivory/55"}`}>
                    <MapPin className={`w-3 h-3 mt-0.5 flex-shrink-0 ${accent.icon}`} />
                    <span>{branch.address}</span>
                  </p>
                )}
                {!compact && branch.phone && (
                  <p className={`flex items-center gap-1.5 text-xs mt-1 ${isLight ? "text-cut-black/55" : "text-cut-ivory/55"}`} dir="ltr">
                    <Phone className={`w-3 h-3 flex-shrink-0 ${accent.icon}`} />
                    <span>{branch.phone}</span>
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export const BranchPickerLoadingInline = () => (
  <div className="flex items-center gap-2 text-xs text-cut-ivory/40" dir="rtl">
    <Loader2 className="w-3.5 h-3.5 animate-spin" />
    <span>جاري تحميل الفروع...</span>
  </div>
);

export default BranchPicker;
