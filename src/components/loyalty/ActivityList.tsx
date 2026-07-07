"use client";

import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import type { LoyaltyActivity } from "./loyaltyData";
import { formatActivityDate } from "./loyaltyData";

export function ActivityList({ activity }: { activity: LoyaltyActivity[] }) {
  return (
    <div dir="rtl">
      <div className="mb-4">
        <p className="text-[11px] font-bold tracking-widest text-cut-gold uppercase mb-1">
          السجل
        </p>
        <h2 className="text-xl font-black text-cut-ivory">آخر حركة على نقاطك</h2>
      </div>

      {activity.length === 0 ? (
        <div className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0d0d0d] px-5 py-8 text-center">
          <Clock className="h-6 w-6 text-cut-ivory/20 mx-auto mb-2" />
          <p className="text-cut-ivory/30 text-sm">لا توجد حركات نقاط حتى الآن</p>
          <p className="text-cut-ivory/20 text-xs mt-1">ستظهر هنا بعد أول زيارة</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0d0d0d] overflow-hidden">
          {activity.map((item, i) => {
            const isEarn = item.type === "earn";
            const displayDate = formatActivityDate(item.date);
            const pointsAbs = Math.abs(item.points);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02] ${i < activity.length - 1 ? "border-b border-white/[0.05]" : ""
                  }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${isEarn
                    ? "bg-cut-bronze/10 border border-emerald-500/15"
                    : "bg-red-500/10 border border-red-500/15"
                    }`}
                >
                  {isEarn ? (
                    <TrendingUp className="h-3.5 w-3.5 text-cut-bronze" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-cut-ivory text-sm font-bold truncate">{item.label}</p>
                  <p className="text-cut-ivory/30 text-[11px]">{displayDate}</p>
                </div>

                {/* Points */}
                <p
                  className={`text-sm font-black tabular-nums flex-shrink-0 ${isEarn ? "text-cut-bronze" : "text-red-400"
                    }`}
                >
                  {isEarn ? "+" : "-"}
                  {pointsAbs.toLocaleString()} نقطة
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
