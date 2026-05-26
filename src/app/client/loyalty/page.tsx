"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Scissors } from "lucide-react";
import { MembershipCard } from "@/components/loyalty/MembershipCard";
import { ProgressToReward } from "@/components/loyalty/ProgressToReward";
import { QuickStats } from "@/components/loyalty/QuickStats";
import { RewardsGrid } from "@/components/loyalty/RewardsGrid";
import { PersonalOffer } from "@/components/loyalty/PersonalOffer";
import { MembershipLevels } from "@/components/loyalty/MembershipLevels";
import { ReferralCard } from "@/components/loyalty/ReferralCard";
import { ActivityList } from "@/components/loyalty/ActivityList";
import { mockLoyalty, LEVEL_CONFIG } from "@/components/loyalty/loyaltyData";

// ─── Toggle this to test empty state ────────────────────────────────────────
const IS_NEW_CLIENT = false;
// In real integration: const IS_NEW_CLIENT = loyalty.points === 0 && loyalty.stats.visits === 0;

const data = mockLoyalty;

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center" dir="rtl">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] mx-auto">
          <Scissors className="h-9 w-9 text-[#D4AF37]" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#D4AF37] flex items-center justify-center">
          <span className="text-[9px] font-black text-[#050505]">0</span>
        </div>
      </div>
      <p className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase mb-3">
        CUT CLUB
      </p>
      <h2 className="text-2xl font-black text-white mb-2">أهلًا بيك في CUT CLUB</h2>
      <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-8">
        أول زيارة ليك هتبدأ تجمع نقاطك وتفتح مكافآت حصرية
      </p>
      <Link
        href="/#barbers"
        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#e7c766] to-[#b88916] px-8 py-3.5 text-sm font-black text-[#050505] shadow-[0_10px_32px_rgba(212,175,55,0.25)] transition-all hover:brightness-110 hover:shadow-[0_14px_40px_rgba(212,175,55,0.35)] active:scale-[0.97]"
      >
        <Calendar className="h-4 w-4" />
        احجز أول زيارة
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoyaltyPage() {
  const cfg = LEVEL_CONFIG[data.level];
  const remainingToNext =
    LEVEL_CONFIG["Black VIP"].minPoints - data.points > 0
      ? LEVEL_CONFIG["Black VIP"].minPoints - data.points
      : undefined;

  const handleBook = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/#barbers";
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white" dir="rtl">
      {/* ── Ambient background ───────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-[0.07] blur-[120px]"
          style={{ background: cfg.color }} />
        <div className="absolute top-1/3 -left-40 h-[400px] w-[400px] rounded-full opacity-[0.04] blur-[100px]"
          style={{ background: cfg.color }} />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-6">

        {/* ── Back nav ──────────────────────────────────────────────────── */}
        <div className="mb-6">
          <Link
            href="/client"
            className="inline-flex items-center gap-1.5 text-white/30 text-xs font-medium hover:text-white/60 transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            حسابي
          </Link>
        </div>

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <div
            className="inline-block rounded-full border px-3 py-1 text-[10px] font-bold tracking-widest uppercase mb-3"
            style={{ borderColor: cfg.border, color: cfg.color, background: cfg.bg }}
          >
            Loyalty Program
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-wider mb-2">
            CUT{" "}
            <span style={{ color: cfg.color }}>CLUB</span>
          </h1>
          <div
            className="mx-auto mb-3 h-px w-24"
            style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }}
          />
          <p className="text-white/40 text-sm">
            كل زيارة ليك بتقربك من مكافآت وتجربة أرقى
          </p>
        </div>

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {IS_NEW_CLIENT ? (
          <EmptyState />
        ) : (
          <div className="space-y-5">

            {/* 1 — Membership card */}
            <MembershipCard data={data} />

            {/* 2 — Progress to next reward */}
            <ProgressToReward nextReward={data.nextReward} onBook={handleBook} />

            {/* 3 — Quick stats */}
            <QuickStats stats={data.stats} level={data.level} />

            {/* 4 — Rewards */}
            <div className="pt-2">
              <RewardsGrid rewards={data.rewards} />
            </div>

            {/* 5 — Personal offer */}
            <PersonalOffer onBook={handleBook} />

            {/* 6 — Membership levels */}
            <div className="pt-2">
              <MembershipLevels
                currentLevel={data.level}
                remainingToNext={remainingToNext}
              />
            </div>

            {/* 7 — Referral */}
            <ReferralCard code={data.referralCode} />

            {/* 8 — Activity */}
            <div className="pt-2">
              <ActivityList activity={data.activity} />
            </div>

            {/* 9 — Bottom CTA */}
            <div className="pt-4 pb-2 text-center">
              <button
                onClick={handleBook}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#e7c766] to-[#b88916] px-10 py-3.5 text-sm font-black text-[#050505] shadow-[0_10px_32px_rgba(212,175,55,0.22)] transition-all hover:brightness-110 hover:shadow-[0_14px_40px_rgba(212,175,55,0.35)] active:scale-[0.97]"
              >
                <Calendar className="h-4 w-4" />
                احجز زيارتك القادمة
              </button>
              <p className="text-white/25 text-[11px] mt-3">
                كل زيارة = نقاط أكتر = مكافآت أفضل
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
