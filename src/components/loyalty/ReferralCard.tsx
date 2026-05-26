"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, Users } from "lucide-react";

export function ReferralCard({
  code,
  shareUrl,
  rewardPoints,
}: {
  code: string;
  shareUrl?: string;
  rewardPoints?: number;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silent
    }
  };

  const waMessage = shareUrl
    ? `جرب Cut Salon من خلال دعوتي واستخدم الكود ${code} 💈\n${shareUrl}`
    : `انضم معايا في CUT CLUB واستخدم كودي ${code} عند أول حجز 💈`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[rgba(212,175,55,0.18)] bg-[#111111] p-5 md:p-6"
      dir="rtl"
    >
      {/* Ambient */}
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#D4AF37]/[0.05] blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
            <Users className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-white text-sm font-black">شارك Cut مع أصحابك</h3>
            <p className="text-white/40 text-[11px] mt-0.5">
              ادعُ صديقك وخد {rewardPoints ?? 100} نقطة لما يعمل أول حجز
            </p>
          </div>
        </div>

        {/* Code pill */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="flex-1 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] px-4 py-3"
            dir="ltr"
          >
            <p className="text-[11px] text-white/30 mb-0.5">Referral Code</p>
            <p className="text-[#D4AF37] text-base font-black tracking-widest">{code}</p>
          </div>
          <button
            onClick={handleCopy}
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border transition-all ${copied
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] text-[#D4AF37] hover:bg-[#D4AF37]/12 hover:border-[#D4AF37]/35"
              }`}
            title="نسخ الكود"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] py-2.5 text-xs font-bold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/12 hover:border-[#D4AF37]/35 active:scale-[0.97]"
          >
            {copied ? "✓ تم النسخ" : "نسخ الكود"}
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#25D366]/25 bg-[#25D366]/[0.07] py-2.5 text-xs font-bold text-[#25D366] transition-all hover:bg-[#25D366]/12 hover:border-[#25D366]/40 active:scale-[0.97]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            مشاركة واتساب
          </a>
        </div>
      </div>
    </div>
  );
}
