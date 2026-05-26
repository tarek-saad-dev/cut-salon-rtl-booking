"use client";

import { Gift, Scissors, Sparkles, Star, Crown, Lock } from "lucide-react";
import type { LoyaltyReward } from "./loyaltyData";

const iconMap: Record<LoyaltyReward["icon"], React.ReactNode> = {
  scissors: <Scissors className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />,
  gift: <Gift className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  crown: <Crown className="h-5 w-5" />,
};

function RewardCard({ reward }: { reward: LoyaltyReward }) {
  const isAvailable = reward.status === "available";
  const isLocked = reward.status === "locked";

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-5 transition-all duration-200 ${
        isAvailable
          ? "border-[rgba(212,175,55,0.3)] bg-[#111111] hover:border-[rgba(212,175,55,0.5)] hover:shadow-[0_0_24px_rgba(212,175,55,0.07)] hover:bg-[#131313]"
          : "border-[rgba(255,255,255,0.06)] bg-[#0d0d0d] opacity-70"
      }`}
      dir="rtl"
    >
      {/* Available glow pip */}
      {isAvailable && (
        <div className="absolute top-3 left-3 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
      )}

      {/* Icon */}
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
          isAvailable
            ? "bg-[#D4AF37]/12 text-[#D4AF37] border border-[#D4AF37]/20"
            : "bg-white/[0.04] text-white/25 border border-white/[0.07]"
        }`}
      >
        {isLocked ? <Lock className="h-4 w-4" /> : iconMap[reward.icon]}
      </div>

      {/* Title */}
      <p
        className={`text-sm font-bold mb-0.5 ${
          isAvailable ? "text-white" : "text-white/40"
        }`}
      >
        {reward.titleAr}
      </p>
      <p className={`text-[11px] mb-3 ${isAvailable ? "text-white/40" : "text-white/20"}`}>
        {reward.title}
      </p>

      {/* Points */}
      <p
        className={`text-base font-black tabular-nums mb-3 mt-auto ${
          isAvailable ? "text-[#D4AF37]" : "text-white/25"
        }`}
      >
        {reward.points.toLocaleString()}
        <span className="text-[11px] font-medium mr-1">نقطة</span>
      </p>

      {/* Progress bar (locked) */}
      {isLocked && reward.remainingPoints !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-white/30 text-[10px]">
              باقي {reward.remainingPoints} نقطة
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-[#D4AF37]/30"
              style={{
                width: `${Math.round(
                  ((reward.points - reward.remainingPoints) / reward.points) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      {isAvailable ? (
        <button className="w-full rounded-xl bg-gradient-to-b from-[#e7c766] to-[#b88916] py-2 text-xs font-black text-[#050505] transition-all hover:brightness-110 active:scale-[0.97]">
          استخدم الآن
        </button>
      ) : (
        <div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-2 text-center text-xs font-bold text-white/25">
          قريبًا
        </div>
      )}
    </div>
  );
}

export function RewardsGrid({ rewards }: { rewards: LoyaltyReward[] }) {
  return (
    <div dir="rtl">
      <div className="mb-5">
        <p className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase mb-1">
          CUT CLUB
        </p>
        <h2 className="text-xl font-black text-white">مكافآتك المتاحة</h2>
        <p className="text-white/40 text-sm mt-1">
          استخدم نقاطك وافتح مزايا أكتر مع كل زيارة
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rewards.map((r) => (
          <RewardCard key={r.id} reward={r} />
        ))}
      </div>
    </div>
  );
}
