"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { LoyaltyActivity } from "./loyaltyData";

export function ActivityList({ activity }: { activity: LoyaltyActivity[] }) {
  if (activity.length === 0) return null;

  return (
    <div dir="rtl">
      <div className="mb-4">
        <p className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase mb-1">
          السجل
        </p>
        <h2 className="text-xl font-black text-white">آخر حركة على نقاطك</h2>
      </div>

      <div className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0d0d0d] overflow-hidden">
        {activity.map((item, i) => {
          const isEarn = item.type === "earn";
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02] ${
                i < activity.length - 1 ? "border-b border-white/[0.05]" : ""
              }`}
            >
              {/* Icon */}
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                  isEarn
                    ? "bg-emerald-500/10 border border-emerald-500/15"
                    : "bg-red-500/10 border border-red-500/15"
                }`}
              >
                {isEarn ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{item.label}</p>
                <p className="text-white/30 text-[11px]">{item.date}</p>
              </div>

              {/* Points */}
              <p
                className={`text-sm font-black tabular-nums flex-shrink-0 ${
                  isEarn ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isEarn ? "+" : ""}
                {item.points.toLocaleString()} نقطة
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
