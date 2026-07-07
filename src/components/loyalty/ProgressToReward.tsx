"use client";

import { useEffect, useRef, useState } from "react";
import { Gift, Calendar } from "lucide-react";
import type { NextReward } from "./loyaltyData";

export function ProgressToReward({
  nextReward,
  onBook,
}: {
  nextReward: NextReward;
  onBook?: () => void;
}) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-[rgba(164,136,121,0.18)] bg-[#111111] p-5 md:p-6"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-cut-gold/10 border border-cut-gold/20">
          <Gift className="h-4 w-4 text-cut-gold" />
        </div>
        <div>
          <p className="text-cut-ivory text-sm font-bold leading-tight">
            باقي{" "}
            <span className="text-cut-gold">{nextReward.remainingPoints} نقطة</span>
            {" "}وتفتح {nextReward.name}
          </p>
          <p className="text-cut-ivory/40 text-[11px] mt-0.5">
            {nextReward.requiredPoints} نقطة مطلوبة
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-cut-ivory/40 text-[11px]">التقدم نحو المكافأة</span>
          <span className="text-cut-gold text-[11px] font-bold">{nextReward.progress}%</span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-cut-surface-elevated">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: animated ? `${nextReward.progress}%` : "0%",
              background: "linear-gradient(90deg, #9f7a18, cut-gold, cut-gold)",
              boxShadow: "0 0 12px rgba(164,136,121,0.4)",
            }}
          />
        </div>
      </div>

      {/* Helper text + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-cut-ivory/40 text-xs leading-relaxed">
          احجز زيارتك القادمة واجمع نقاط أكتر
        </p>
        <button
          onClick={onBook}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl border border-cut-gold/30 bg-cut-gold/[0.08] px-4 py-2 text-xs font-bold text-cut-gold transition-all hover:bg-cut-gold/15 hover:border-cut-gold/50 hover:shadow-[0_0_16px_rgba(164,136,121,0.12)] active:scale-[0.97]"
        >
          <Calendar className="h-3.5 w-3.5" />
          احجز زيارتك القادمة
        </button>
      </div>
    </div>
  );
}
