"use client";

import { Scissors } from "lucide-react";
import type { ClientLoyalty } from "./loyaltyData";
import { LEVEL_CONFIG } from "./loyaltyData";

export function MembershipCard({ data }: { data: ClientLoyalty }) {
  const cfg = LEVEL_CONFIG[data.level];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl" dir="ltr">
      {/* Base dark graphite gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #111111 0%, #050505 40%, #181510 70%, #050505 100%)",
        }}
      />

      {/* Gold edge glow top-right */}
      <div
        className="absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: cfg.color }}
      />
      {/* Subtle bottom-left glow */}
      <div
        className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full opacity-15 blur-3xl"
        style={{ background: cfg.color }}
      />

      {/* Decorative barber pole lines */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.04]">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full"
            style={{
              top: `${12 + i * 18}%`,
              background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
            }}
          />
        ))}
      </div>

      {/* Gold border */}
      <div
        className="absolute inset-0 rounded-3xl"
        style={{ border: `1px solid ${cfg.border}` }}
      />

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8">
        {/* Top row */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: `${cfg.bg}`, border: `1px solid ${cfg.border}` }}
            >
              <Scissors className="h-4 w-4" style={{ color: cfg.color }} />
            </div>
            <div>
              <span
                className="block text-[10px] tracking-[0.3em] font-bold uppercase"
                style={{ color: cfg.color }}
              >
                CUT
              </span>
              <span className="block text-[10px] tracking-[0.25em] text-cut-ivory/40 uppercase -mt-0.5">
                SALON
              </span>
            </div>
          </div>

          {/* Level badge */}
          <div
            className="rounded-full px-3 py-1 text-[11px] font-black tracking-widest uppercase"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              color: cfg.color,
            }}
          >
            {data.level}
          </div>
        </div>

        {/* Points — the hero number */}
        <div className="mb-6">
          <p className="text-cut-ivory/40 text-xs font-medium mb-1 tracking-wide" dir="rtl">
            رصيدك الحالي
          </p>
          <div className="flex items-end gap-2">
            <span
              className="text-5xl md:text-6xl font-black tabular-nums leading-none"
              style={{ color: cfg.color }}
            >
              {data.points.toLocaleString("ar-EG")}
            </span>
            <span className="text-cut-ivory/50 text-sm font-medium mb-2" dir="rtl">
              نقطة
            </span>
            {data.lastVisitPoints > 0 && (
              <span className="mb-2 text-cut-bronze text-xs font-bold bg-cut-warm-beige/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                +{data.lastVisitPoints} من آخر زيارة
              </span>
            )}
          </div>
        </div>

        {/* Bottom row — name + member id */}
        <div className="flex items-end justify-between">
          <div dir="rtl">
            <p className="text-cut-ivory text-base font-black tracking-wide">{data.clientName}</p>
            <p className="text-cut-ivory/35 text-[11px] mt-0.5">
              عضو منذ {data.memberSince}
            </p>
          </div>
          <div className="text-right">
            <p className="text-cut-ivory/25 text-[9px] tracking-widest uppercase mb-0.5">Member ID</p>
            <p
              className="text-sm font-black tracking-widest"
              style={{ color: cfg.color }}
            >
              {data.memberId}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
