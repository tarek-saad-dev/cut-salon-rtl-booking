"use client";

import { Zap, Calendar } from "lucide-react";
import type { ApiPersonalOffer } from "./clientLoyaltyApi";
import { resolvePersonalOffer } from "./personalOfferConfig";

export function PersonalOffer({
  offer,
  onBook,
}: {
  offer?: ApiPersonalOffer | null;
  onBook?: (serviceNames: string[]) => void;
}) {
  const resolved = resolvePersonalOffer(offer);
  if (!resolved) return null;

  const handleBook = () => {
    onBook?.(resolved.serviceNames);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      dir="rtl"
      style={{
        background:
          "linear-gradient(135deg, #0f100a 0%, #141208 50%, #0a0c0a 100%)",
        border: "1px solid rgba(164,136,121,0.22)",
      }}
    >
      {/* Ambient glow */}
      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-cut-gold/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cut-gold/15 border border-cut-gold/25">
            <Zap className="h-3 w-3 text-cut-gold" />
          </div>
          <p className="text-cut-gold text-[11px] font-bold tracking-widest uppercase">
            {resolved.eyebrow}
          </p>
        </div>

        {/* Offer text */}
        <h3 className="text-cut-ivory text-base font-black leading-snug mb-1">
          {resolved.title}
        </h3>
        <p className="text-cut-gold text-sm font-bold mb-1">
          {resolved.description}
        </p>
        {resolved.expiryText && (
          <p className="text-cut-ivory/40 text-xs leading-relaxed mb-4">
            {resolved.expiryText}
          </p>
        )}

        {/* CTA — serviceNames passed for future dynamic booking pre-selection */}
        <button
          onClick={handleBook}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-cut-gold to-cut-gold/80 px-5 py-2.5 text-sm font-black text-cut-black transition-all hover:brightness-110 hover:shadow-[0_6px_20px_rgba(164,136,121,0.25)] active:scale-[0.97]"
        >
          <Calendar className="h-3.5 w-3.5" />
          {resolved.ctaLabel}
        </button>
      </div>
    </div>
  );
}
