"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, Users, Clock } from "lucide-react";

export function ReferralCard({
  code,
  shareUrl,
  rewardPoints,
  comingSoon = true,
}: {
  code: string;
  shareUrl?: string;
  rewardPoints?: number;
  comingSoon?: boolean;
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

  if (comingSoon) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border border-[rgba(164,136,121,0.18)] bg-[#111111] p-5 md:p-6"
        dir="rtl"
      >
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cut-gold/[0.05] blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-cut-gold/10 border border-cut-gold/20">
              <Users className="h-4 w-4 text-cut-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-cut-ivory text-sm font-black">شارك Cut مع أصحابك</h3>
                <span className="rounded-full border border-cut-gold/25 bg-cut-gold/[0.08] px-2 py-0.5 text-[10px] font-bold text-cut-gold">
                  قريباً
                </span>
              </div>
              <p className="text-cut-ivory/40 text-[11px] mt-0.5">
                سيتم تفعيلها قريباً
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-5 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-cut-gold/15 bg-cut-gold/[0.06]">
              <Clock className="h-4 w-4 text-cut-gold/70" />
            </div>
            <p className="text-cut-ivory/50 text-xs font-medium">
              ادعُ أصحابك واكسب نقاط — الميزة قيد التجهيز
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[rgba(164,136,121,0.18)] bg-[#111111] p-5 md:p-6"
      dir="rtl"
    >
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cut-gold/[0.05] blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-cut-gold/10 border border-cut-gold/20">
            <Users className="h-4 w-4 text-cut-gold" />
          </div>
          <div>
            <h3 className="text-cut-ivory text-sm font-black">شارك Cut مع أصحابك</h3>
            <p className="text-cut-ivory/40 text-[11px] mt-0.5">
              ادعُ صديقك وخد {rewardPoints ?? 100} نقطة لما يعمل أول حجز
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div
            className="flex-1 rounded-xl border border-cut-gold/25 bg-cut-gold/[0.06] px-4 py-3"
            dir="ltr"
          >
            <p className="text-[11px] text-cut-ivory/30 mb-0.5">Referral Code</p>
            <p className="text-cut-gold text-base font-black tracking-widest">{code}</p>
          </div>
          <button
            onClick={handleCopy}
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border transition-all ${copied
              ? "border-emerald-500/40 bg-cut-bronze/10 text-cut-bronze"
              : "border-cut-gold/20 bg-cut-gold/[0.06] text-cut-gold hover:bg-cut-gold/12 hover:border-cut-gold/35"
              }`}
            title="نسخ الكود"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 rounded-xl border border-cut-gold/20 bg-cut-gold/[0.06] py-2.5 text-xs font-bold text-cut-gold transition-all hover:bg-cut-gold/12 hover:border-cut-gold/35 active:scale-[0.97]"
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
