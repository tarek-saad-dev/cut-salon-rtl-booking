"use client";

import { CalendarCheck, Award, Sparkles, Scissors } from "lucide-react";
import type { LoyaltyStats, MemberLevel } from "./loyaltyData";

export function QuickStats({
  stats,
  level,
}: {
  stats: LoyaltyStats;
  level: MemberLevel;
}) {
  const items = [
    {
      icon: <CalendarCheck className="h-4 w-4 text-[#D4AF37]" />,
      label: "عدد الزيارات",
      value: stats.visits,
      suffix: "زيارة",
    },
    {
      icon: <Award className="h-4 w-4 text-[#D4AF37]" />,
      label: "المستوى الحالي",
      value: level,
      suffix: "",
    },
    {
      icon: <Sparkles className="h-4 w-4 text-[#D4AF37]" />,
      label: "المكافآت المستخدمة",
      value: stats.rewardsUsed,
      suffix: "مكافأة",
    },
    {
      icon: <Scissors className="h-4 w-4 text-[#D4AF37]" />,
      label: "الحلاق المفضل",
      value: stats.favoriteBarber,
      suffix: "",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" dir="rtl">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[rgba(212,175,55,0.1)] bg-[#111111] px-4 py-4 transition-all hover:border-[rgba(212,175,55,0.22)] hover:bg-[#131313]"
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4AF37]/8">
              {item.icon}
            </div>
          </div>
          <p className="text-white font-black text-lg leading-tight tabular-nums">
            {item.value}
            {item.suffix && (
              <span className="text-white/40 text-xs font-medium mr-1">{item.suffix}</span>
            )}
          </p>
          <p className="text-white/40 text-[11px] mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
