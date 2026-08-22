"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import BarberPhoto from "@/components/BarberPhoto";

type CompactBarberRowProps = {
  name: string;
  role: string;
  imageSrc?: string | null;
  onClick: () => void;
  dir: "ltr" | "rtl";
  /** Optional motion delay index for staggered lists */
  delayIndex?: number;
};

/** ~60–64px barber row for compact mobile booking lists. */
export function CompactBarberRow({
  name,
  role,
  imageSrc,
  onClick,
  dir,
}: CompactBarberRowProps) {
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full min-h-[3.75rem] items-center gap-2.5 rounded-xl border border-cut-black/10 bg-cut-ivory/90 px-3 py-2 text-start transition hover:border-cut-burgundy/30 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-burgundy"
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-cut-black/10">
        <BarberPhoto
          src={imageSrc}
          name={name}
          imgClassName="h-full w-full object-cover object-top"
        />
      </div>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold leading-tight text-cut-black">
          {name}
        </span>
        <span className="block truncate text-[11px] leading-tight text-cut-black/50">
          {role}
        </span>
      </span>
      <Chevron className="h-4 w-4 shrink-0 text-cut-black/30" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
