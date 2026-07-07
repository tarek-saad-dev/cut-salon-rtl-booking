"use client";

import { Scissors, TrendingUp, Award, Users } from "lucide-react";
import type { ClientLoyalty, LoyaltyStats } from "./loyaltyData";
import { LEVEL_CONFIG } from "./loyaltyData";

const TIER_COLORS = {
  Bronze: {
    gradient: "linear-gradient(135deg, #CD7F32 0%, #8B4513 40%, #A0522D 70%, #6B4423 100%)",
    glow: "#CD7F32",
    border: "rgba(205, 127, 50, 0.3)",
    bg: "rgba(205, 127, 50, 0.08)",
  },
  Silver: {
    gradient: "linear-gradient(135deg, #C0C0C0 0%, #808080 40%, #A8A8A8 70%, #696969 100%)",
    glow: "#C0C0C0",
    border: "rgba(192, 192, 192, 0.3)",
    bg: "rgba(192, 192, 192, 0.08)",
  },
  Gold: {
    gradient: "linear-gradient(135deg, #A48879 0%, #170406 45%, #050505 100%)",
    glow: "#A48879",
    border: "rgba(164, 136, 121, 0.35)",
    bg: "rgba(164, 136, 121, 0.1)",
  },
  Platinum: {
    gradient: "linear-gradient(135deg, #E5E4E2 0%, #BCC6CC 40%, #D3D3D3 70%, #A8A9AD 100%)",
    glow: "#E5E4E2",
    border: "rgba(229, 228, 226, 0.3)",
    bg: "rgba(229, 228, 226, 0.08)",
  },
  "Black VIP": {
    gradient: "linear-gradient(135deg, #2F050C 0%, #050505 50%, #170406 100%)",
    glow: "#D2B7A3",
    border: "rgba(164, 136, 121, 0.35)",
    bg: "rgba(5, 5, 5, 0.6)",
  },
};

export function CompactMembershipCard({ 
  data, 
  stats 
}: { 
  data: ClientLoyalty;
  stats: LoyaltyStats;
}) {
  const tierColor = TIER_COLORS[data.level] || TIER_COLORS.Silver;
  const cfg = LEVEL_CONFIG[data.level];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl mb-6" dir="ltr">
      <div
        className="absolute inset-0"
        style={{ background: tierColor.gradient }}
      />

      <div
        className="absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-25 blur-3xl"
        style={{ background: tierColor.glow }}
      />
      <div
        className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full opacity-15 blur-2xl"
        style={{ background: tierColor.glow }}
      />

      <div className="absolute inset-0 overflow-hidden opacity-[0.05]">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full"
            style={{
              top: `${15 + i * 22}%`,
              background: `linear-gradient(90deg, transparent, ${tierColor.glow}, transparent)`,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 rounded-2xl"
        style={{ border: `1px solid ${tierColor.border}` }}
      />

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: tierColor.bg, border: `1px solid ${tierColor.border}` }}
            >
              <Scissors className="h-4 w-4" style={{ color: data.level === "Black VIP" ? "#A48879" : tierColor.glow }} />
            </div>
            <div>
              <span
                className="block text-[9px] tracking-[0.3em] font-bold uppercase"
                style={{ color: data.level === "Black VIP" ? "#A48879" : tierColor.glow }}
              >
                CUT CLUB
              </span>
              <span className="block text-[8px] tracking-[0.2em] text-cut-ivory/30 uppercase -mt-0.5">
                MEMBER
              </span>
            </div>
          </div>

          <div
            className="rounded-full px-3 py-1 text-[10px] font-black tracking-wider uppercase"
            style={{
              background: tierColor.bg,
              border: `1px solid ${tierColor.border}`,
              color: data.level === "Black VIP" ? "#A48879" : tierColor.glow,
            }}
          >
            {data.level}
          </div>
        </div>

        <div className="mb-5" dir="rtl">
          <p className="text-cut-ivory text-lg font-black tracking-wide mb-1">{data.clientName}</p>
          <p className="text-cut-ivory/40 text-xs font-mono tracking-wider">{data.memberId}</p>
          <p className="text-cut-ivory/30 text-[10px] mt-1">
            عضو منذ {data.memberSince}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/10" dir="rtl">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-cut-ivory/40" />
              <p className="text-cut-ivory text-lg font-black tabular-nums">{stats.visits}</p>
            </div>
            <p className="text-cut-ivory/40 text-[10px]">عدد الزيارات</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="h-3 w-3 text-cut-ivory/40" />
              <p className="text-cut-ivory text-lg font-black tabular-nums">{stats.rewardsUsed}</p>
            </div>
            <p className="text-cut-ivory/40 text-[10px]">المكافآت المستخدمة</p>
          </div>

          <div className="text-center col-span-2 md:col-span-2">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-3 w-3 text-cut-ivory/40" />
              <p className="text-cut-ivory text-sm font-bold truncate max-w-[120px]">
                {stats.favoriteBarber}
              </p>
            </div>
            <p className="text-cut-ivory/40 text-[10px]">الحلاق المفضل</p>
          </div>
        </div>
      </div>
    </div>
  );
}
