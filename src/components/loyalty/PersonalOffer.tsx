"use client";

import { Zap, Calendar } from "lucide-react";
import type { ApiPersonalOffer } from "./clientLoyaltyApi";

// Default fallback offer shown when API returns no offer
const DEFAULT_OFFER = {
  title: "احجز Haircut & Beard الأسبوع ده",
  description: "وخد Double Points 🔥",
  expiry: "العرض سارى حتى نهاية الأسبوع.",
};

export function PersonalOffer({
  offer,
  onBook,
}: {
  offer?: ApiPersonalOffer | null;
  onBook?: () => void;
}) {
  // If type is NONE or null, don't render
  if (offer !== undefined && (offer === null || offer.type === "NONE")) return null;

  const title = offer?.title ?? DEFAULT_OFFER.title;
  const description = offer?.description ?? DEFAULT_OFFER.description;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      dir="rtl"
      style={{
        background:
          "linear-gradient(135deg, #0f100a 0%, #141208 50%, #0a0c0a 100%)",
        border: "1px solid rgba(212,175,55,0.22)",
      }}
    >
      {/* Ambient glow */}
      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-[#D4AF37]/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/25">
            <Zap className="h-3 w-3 text-[#D4AF37]" />
          </div>
          <p className="text-[#D4AF37] text-[11px] font-bold tracking-widest uppercase">
            عرض مخصوص ليك
          </p>
        </div>

        {/* Offer text */}
        <h3 className="text-white text-base font-black leading-snug mb-1">{title}</h3>
        <p className="text-[#D4AF37] text-sm font-bold mb-1">{description}</p>
        {offer?.expiresAt && (
          <p className="text-white/40 text-xs leading-relaxed mb-4">
            العرض سارى حتى {new Date(offer.expiresAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}.
          </p>
        )}
        {!offer?.expiresAt && (
          <p className="text-white/40 text-xs leading-relaxed mb-4">
            العرض سارى حتى نهاية الأسبوع. لا تفوّت الفرصة.
          </p>
        )}

        {/* CTA */}
        <button
          onClick={onBook}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7c766] to-[#b88916] px-5 py-2.5 text-sm font-black text-[#050505] transition-all hover:brightness-110 hover:shadow-[0_6px_20px_rgba(212,175,55,0.25)] active:scale-[0.97]"
        >
          <Calendar className="h-3.5 w-3.5" />
          احجز العرض
        </button>
      </div>
    </div>
  );
}
