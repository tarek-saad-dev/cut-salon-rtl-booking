"use client";

import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBranch } from "@/context/BranchContext";
import BranchPicker from "./BranchPicker";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Header widget — shows the currently selected branch, or an "اختر الفرع"
 * prompt if none has been confirmed yet. Opens a popover to pick/change it.
 * Changing branch here updates the shared BranchContext, which the booking
 * flow (and any branch-scoped lists) react to.
 */
export default function BranchBadge({ className = "" }: { className?: string }) {
  const { branches, isLoadingBranches, branchesError, selectedBranch, hasConfirmedBranch, selectBranch } = useBranch();
  const { lang, dir } = useLanguage();
  const [open, setOpen] = useState(false);

  const label = hasConfirmedBranch && selectedBranch
    ? (selectedBranch.shortName || selectedBranch.branchName)
    : lang === "ar" ? "اختر الفرع" : "Choose branch";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={lang === "ar" ? "اختيار الفرع" : "Choose branch"}
          className={`flex h-11 items-center gap-1.5 px-3 rounded-xl border text-xs font-bold transition-all duration-300 ${
            hasConfirmedBranch
              ? "border-cut-gold/25 bg-cut-gold/[0.06] text-cut-ivory/85 hover:border-cut-gold/50 hover:bg-cut-gold/10"
              : "border-cut-gold/40 bg-cut-gold/10 text-cut-gold hover:bg-cut-gold/20 animate-pulse"
          } ${className}`}
        >
          <MapPin className="w-3.5 h-3.5 text-cut-gold flex-shrink-0" />
          <span className="max-w-[110px] truncate">{label}</span>
          <ChevronDown className="w-3 h-3 opacity-60 flex-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 rounded-2xl border-cut-gold/20 bg-cut-black p-4 shadow-2xl"
        dir={dir}
      >
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-cut-ivory/40">{lang === "ar" ? "اختر فرعك" : "Choose your branch"}</p>
        <BranchPicker
          branches={branches}
          selectedBranchCode={selectedBranch?.branchCode}
          isLoading={isLoadingBranches}
          error={branchesError}
          variant="dark"
          onSelect={(branch) => {
            selectBranch(branch);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
