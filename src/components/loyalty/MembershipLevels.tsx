"use client";

import { Check } from "lucide-react";
import type { MemberLevel } from "./loyaltyData";
import { LEVEL_CONFIG } from "./loyaltyData";

const LEVELS: MemberLevel[] = ["Bronze", "Silver", "Gold", "Black VIP"];

const LEVEL_LABELS: Record<MemberLevel, string> = {
  Bronze: "برونز",
  Silver: "فضي",
  Gold: "ذهبي",
  "Black VIP": "Black VIP",
};

const LEVEL_DESCS: Record<MemberLevel, string> = {
  Bronze: "بداية الرحلة",
  Silver: "عميل متميز",
  Gold: "عضو ذهبي",
  "Black VIP": "مستوى حصري",
};

export function MembershipLevels({
  currentLevel,
  remainingToNext,
}: {
  currentLevel: MemberLevel;
  remainingToNext?: number;
}) {
  const currentIndex = LEVELS.indexOf(currentLevel);

  return (
    <div dir="rtl">
      <div className="mb-5">
        <p className="text-[11px] font-bold tracking-widest text-cut-gold uppercase mb-1">
          رحلتك معنا
        </p>
        <h2 className="text-xl font-black text-cut-ivory">مستوى عضويتك</h2>
        {remainingToNext !== undefined && currentIndex < LEVELS.length - 1 && (
          <p className="text-cut-ivory/40 text-sm mt-1">
            باقي{" "}
            <span className="text-cut-gold font-bold">{remainingToNext} نقطة</span>
            {" "}للوصول إلى {LEVEL_LABELS[LEVELS[currentIndex + 1]]}
          </p>
        )}
      </div>

      {/* Desktop horizontal / Mobile vertical */}
      <div className="hidden md:flex items-stretch gap-0">
        {LEVELS.map((level, i) => {
          const cfg = LEVEL_CONFIG[level];
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;
          const isLast = i === LEVELS.length - 1;

          return (
            <div key={level} className="flex flex-1 items-stretch">
              {/* Card */}
              <div
                className={`relative flex-1 rounded-2xl p-4 transition-all ${
                  isCurrent
                    ? "border-2"
                    : "border"
                }`}
                style={{
                  borderColor: isCurrent ? cfg.color : isPast ? `${cfg.color}40` : "rgba(255,255,255,0.06)",
                  background: isCurrent
                    ? `linear-gradient(135deg, ${cfg.bg}, #050505)`
                    : isPast
                    ? "#0d0d0d"
                    : "#050505",
                  opacity: isFuture ? 0.65 : 1,
                }}
              >
                {/* Current badge */}
                {isCurrent && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-black tracking-widest whitespace-nowrap"
                    style={{
                      background: cfg.color,
                      color: "#050505",
                    }}
                  >
                    أنت هنا
                  </div>
                )}
                {isPast && (
                  <div className="absolute top-2 left-2">
                    <div
                      className="flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ background: cfg.color }}
                    >
                      <Check className="h-2.5 w-2.5 text-cut-black" />
                    </div>
                  </div>
                )}

                <p
                  className="text-xs font-black tracking-wider mb-0.5"
                  style={{ color: isFuture ? "rgba(255,255,255,0.2)" : cfg.color }}
                >
                  {LEVEL_LABELS[level]}
                </p>
                <p className="text-[10px]" style={{ color: isFuture ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)" }}>
                  {LEVEL_DESCS[level]}
                </p>
                <p
                  className="text-[10px] font-bold mt-2 tabular-nums"
                  style={{ color: isFuture ? "rgba(255,255,255,0.15)" : cfg.color }}
                >
                  {LEVEL_CONFIG[level].minPoints}+ نقطة
                </p>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="flex items-center px-1">
                  <div
                    className="h-px w-4 flex-shrink-0"
                    style={{
                      background: isPast ? LEVEL_CONFIG[level].color : "rgba(255,255,255,0.08)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile vertical */}
      <div className="flex flex-col gap-2 md:hidden">
        {LEVELS.map((level, i) => {
          const cfg = LEVEL_CONFIG[level];
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div
              key={level}
              className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all"
              style={{
                borderColor: isCurrent ? cfg.color : isPast ? `${cfg.color}30` : "rgba(255,255,255,0.06)",
                background: isCurrent ? cfg.bg : "#050505",
                opacity: isFuture ? 0.5 : 1,
              }}
            >
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: isCurrent ? cfg.color : isPast ? `${cfg.color}20` : "rgba(255,255,255,0.04)",
                }}
              >
                {isPast ? (
                  <Check className="h-4 w-4" style={{ color: isCurrent ? "#050505" : cfg.color }} />
                ) : (
                  <span className="text-[11px] font-black" style={{ color: isCurrent ? "#050505" : cfg.color }}>
                    {i + 1}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p
                  className="text-sm font-black"
                  style={{ color: isFuture ? "rgba(255,255,255,0.2)" : isCurrent ? cfg.color : "rgba(255,255,255,0.7)" }}
                >
                  {LEVEL_LABELS[level]}
                </p>
                <p className="text-[11px] text-cut-ivory/30">{LEVEL_DESCS[level]}</p>
              </div>
              {isCurrent && (
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-black"
                  style={{ background: cfg.color, color: "#050505" }}
                >
                  الآن
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
