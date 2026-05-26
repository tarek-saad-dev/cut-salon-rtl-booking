"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Calendar, Scissors, AlertTriangle, RefreshCw } from "lucide-react";

import { MembershipCard } from "@/components/loyalty/MembershipCard";
import { ProgressToReward } from "@/components/loyalty/ProgressToReward";
import { QuickStats } from "@/components/loyalty/QuickStats";
import { RewardsGrid } from "@/components/loyalty/RewardsGrid";
import { PersonalOffer } from "@/components/loyalty/PersonalOffer";
import { MembershipLevels } from "@/components/loyalty/MembershipLevels";
import { ReferralCard } from "@/components/loyalty/ReferralCard";
import { ActivityList } from "@/components/loyalty/ActivityList";

import {
  LEVEL_CONFIG,
  tierCodeToMemberLevel,
  type ClientLoyalty,
  type LoyaltyReward,
  type LoyaltyActivity,
  type LoyaltyStats,
  type NextReward,
  type MemberLevel,
} from "@/components/loyalty/loyaltyData";

import type { ClientLoyaltyDashboardResponse } from "@/components/loyalty/clientLoyaltyApi";

// ─── TODO: Replace hardcoded clientId fallback with authenticated session / OTP token ───

// ─── Map API response → component types ────────────────────────────────────

function mapApiToComponentData(
  api: ClientLoyaltyDashboardResponse,
  clientId: string | number
): ClientLoyalty & { clientId: string | number } {
  const level: MemberLevel = tierCodeToMemberLevel(api.membership.tierCode);

  const rewards: LoyaltyReward[] = api.rewards.map((r) => ({
    id: String(r.id),
    title: r.title,
    titleAr: r.titleAr,
    points: r.requiredPoints,
    status: (r.status as LoyaltyReward["status"]),
    remainingPoints: r.remainingPoints,
    icon: (["scissors", "sparkles", "gift", "star", "crown"].includes(r.icon ?? "")
      ? r.icon
      : "gift") as LoyaltyReward["icon"],
  }));

  const activity: LoyaltyActivity[] = api.recentActivity.map((a) => ({
    id: String(a.id),
    type: a.type === "redeem" || a.type === "expire" ? "redeem" : "earn",
    label: a.label,
    points: a.points,
    date: a.date,
  }));

  const stats: LoyaltyStats = {
    visits: api.stats.visits,
    rewardsUsed: api.stats.rewardsUsed,
    favoriteBarber: api.stats.favoriteBarber ?? "لم يحدد بعد",
  };

  const nextReward: NextReward | null = api.nextReward
    ? {
      name: api.nextReward.name,
      requiredPoints: api.nextReward.requiredPoints,
      remainingPoints: api.nextReward.remainingPoints,
      progress: api.nextReward.progress,
    }
    : null;

  return {
    clientId,
    clientName: api.client.name,
    memberId: api.membership.memberId || `CUT-${api.client.id}`,
    level,
    points: api.membership.pointsBalance,
    lastVisitPoints: api.membership.lastVisitPoints ?? 0,
    memberSince: api.membership.memberSince ?? "2026",
    nextReward: nextReward ?? {
      name: "—",
      requiredPoints: 0,
      remainingPoints: 0,
      progress: 100,
    },
    stats,
    referralCode: api.referral?.code ?? "",
    rewards,
    activity,
  };
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Membership card skeleton */}
      <div className="h-44 w-full rounded-3xl bg-[#111111] border border-white/[0.06]" />
      {/* Progress skeleton */}
      <div className="h-28 w-full rounded-2xl bg-[#111111] border border-white/[0.06]" />
      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-[#111111] border border-white/[0.06]" />
        ))}
      </div>
      {/* Rewards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-[#111111] border border-white/[0.06]" />
        ))}
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" dir="rtl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] mb-4">
        <AlertTriangle className="h-6 w-6 text-amber-500/70" />
      </div>
      <h3 className="text-white text-base font-black mb-1">تعذر تحميل بيانات CUT CLUB</h3>
      <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-6">
        {message || "حاول تحديث الصفحة أو الرجوع لاحقًا"}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] px-5 py-2.5 text-sm font-bold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/15 hover:border-[#D4AF37]/50 active:scale-[0.97]"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        إعادة المحاولة
      </button>
    </div>
  );
}

// ─── Page Header (always visible) ─────────────────────────────────────────────
function PageHeader({ accentColor, border, bg }: { accentColor: string; border: string; bg: string }) {
  return (
    <div className="mb-8 text-center">
      <div
        className="inline-block rounded-full border px-3 py-1 text-[10px] font-bold tracking-widest uppercase mb-3"
        style={{ borderColor: border, color: accentColor, background: bg }}
      >
        Loyalty Program
      </div>
      <h1 className="text-4xl md:text-5xl font-black tracking-wider mb-2">
        CUT <span style={{ color: accentColor }}>CLUB</span>
      </h1>
      <div
        className="mx-auto mb-3 h-px w-24"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
      />
      <p className="text-white/40 text-sm">كل زيارة ليك بتقربك من مكافآت وتجربة أرقى</p>
    </div>
  );
}

// ─── Page Inner (uses useSearchParams — must be inside Suspense) ─────────────
function LoyaltyPageInner() {
  const searchParams = useSearchParams();

  // TODO: Replace with authenticated session / OTP token — hardcoded fallback for development only
  const clientId = searchParams.get("clientId") ?? "1";

  const [data, setData] = useState<(ClientLoyalty & { clientId: string | number }) | null>(null);
  const [apiResponse, setApiResponse] = useState<ClientLoyaltyDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    const apiBase = (process.env.NEXT_PUBLIC_BOOKING_API_BASE_URL ?? "").replace(/\/$/, "");
    try {
      const res = await fetch(
        `${apiBase}/api/public/client/loyalty/me?clientId=${encodeURIComponent(clientId)}`,
        { cache: "no-store" }
      );
      const json: unknown = await res.json().catch(() => null);
      if (
        !res.ok ||
        json === null ||
        typeof json !== "object" ||
        (json as Record<string, unknown>).ok === false
      ) {
        const msg =
          json !== null && typeof json === "object"
            ? ((json as Record<string, unknown>).error as string | undefined) ?? "فشل تحميل البيانات"
            : "فشل تحميل البيانات";
        throw new Error(msg);
      }
      const typed = json as ClientLoyaltyDashboardResponse;
      setApiResponse(typed);
      setData(mapApiToComponentData(typed, clientId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleBook = () => {
    window.location.href = "/#barbers";
  };

  const handleRedeemed = (_rewardId: string, _redeemCode?: string, newBalance?: number) => {
    // Optimistically update balance if provided, then refetch for full consistency
    if (newBalance !== undefined && data) {
      setData((prev) => prev ? { ...prev, points: newBalance } : prev);
    }
    // Refetch to get updated rewards/activity/progress
    fetchDashboard();
  };

  // Determine accent color from level (default Gold before data loads)
  const level: MemberLevel = data ? data.level : "Gold";
  const cfg = LEVEL_CONFIG[level];

  // Derived values
  const isNewClient = data
    ? data.points === 0 && data.stats.visits === 0 && data.activity.length === 0
    : false;

  const remainingToBlackVip =
    data && LEVEL_CONFIG["Black VIP"].minPoints - data.points > 0
      ? LEVEL_CONFIG["Black VIP"].minPoints - data.points
      : undefined;

  // Map levels from API if available
  const currentLevelFromApi = data?.level ?? "Bronze";

  return (
    <div className="min-h-screen bg-[#050505] text-white" dir="rtl">
      {/* ── Ambient background ──────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-[0.07] blur-[120px] transition-all duration-1000"
          style={{ background: cfg.color }}
        />
        <div
          className="absolute top-1/3 -left-40 h-[400px] w-[400px] rounded-full opacity-[0.04] blur-[100px] transition-all duration-1000"
          style={{ background: cfg.color }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-6">

        {/* ── Back nav ────────────────────────────────────────────────── */}
        <div className="mb-6">
          <Link
            href="/client"
            className="inline-flex items-center gap-1.5 text-white/30 text-xs font-medium hover:text-white/60 transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            حسابي
          </Link>
        </div>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <PageHeader accentColor={cfg.color} border={cfg.border} bg={cfg.bg} />

        {/* ── States ──────────────────────────────────────────────────── */}
        {loading && <LoadingSkeleton />}

        {!loading && error && (
          <ErrorState message={error} onRetry={fetchDashboard} />
        )}

        {!loading && !error && data && (
          <div className="space-y-5">

            {/* 1 — Membership card */}
            <MembershipCard data={data} />

            {/* 2 — Progress to next reward */}
            {data.nextReward.requiredPoints > 0 ? (
              <ProgressToReward nextReward={data.nextReward} onBook={handleBook} />
            ) : (
              <div
                className="rounded-2xl border border-[rgba(212,175,55,0.18)] bg-[#111111] p-5 text-center"
                dir="rtl"
              >
                <p className="text-[#D4AF37] text-sm font-bold mb-1">كل المكافآت الأساسية متاحة لك الآن 🎉</p>
                <p className="text-white/40 text-xs">استعرض مكافآتك واستخدمها في زيارتك القادمة</p>
              </div>
            )}

            {/* 3 — Quick stats */}
            <QuickStats stats={data.stats} level={data.level} />

            {/* 4 — Rewards */}
            <div className="pt-2">
              <RewardsGrid
                rewards={data.rewards}
                clientId={clientId}
                onRedeemed={handleRedeemed}
              />
            </div>

            {/* 5 — Personal offer */}
            <PersonalOffer
              offer={apiResponse?.personalOffer ?? undefined}
              onBook={handleBook}
            />

            {/* 6 — Membership levels */}
            <div className="pt-2">
              <MembershipLevels
                currentLevel={currentLevelFromApi}
                remainingToNext={remainingToBlackVip}
              />
            </div>

            {/* 7 — Referral */}
            {apiResponse?.referral && (
              <ReferralCard
                code={apiResponse.referral.code}
                shareUrl={apiResponse.referral.shareUrl}
                rewardPoints={apiResponse.referral.rewardPoints}
              />
            )}
            {!apiResponse?.referral && data.referralCode && (
              <ReferralCard code={data.referralCode} />
            )}

            {/* 8 — Activity */}
            <div className="pt-2">
              <ActivityList activity={data.activity} />
            </div>

            {/* 9 — New client CTA */}
            {isNewClient && (
              <div className="rounded-2xl border border-[rgba(212,175,55,0.15)] bg-[#0d0d0d] p-6 text-center">
                <div className="relative mb-4 mx-auto w-fit">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] mx-auto">
                    <Scissors className="h-7 w-7 text-[#D4AF37]" />
                  </div>
                </div>
                <h3 className="text-white text-base font-black mb-1">أهلًا بيك في CUT CLUB</h3>
                <p className="text-white/40 text-sm mb-5">أول زيارة ليك هتبدأ تجمع نقاطك وتفتح مكافآت حصرية</p>
                <button
                  onClick={handleBook}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#e7c766] to-[#b88916] px-8 py-3 text-sm font-black text-[#050505] shadow-[0_10px_32px_rgba(212,175,55,0.25)] transition-all hover:brightness-110 active:scale-[0.97]"
                >
                  <Calendar className="h-4 w-4" />
                  احجز أول زيارة
                </button>
              </div>
            )}

            {/* 10 — Bottom CTA (returning clients) */}
            {!isNewClient && (
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
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ─── Default export — Suspense boundary required for useSearchParams ──────────
export default function LoyaltyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] text-white" dir="rtl">
          <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-6">
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 text-white/30 text-xs font-medium">
                <ArrowRight className="h-3.5 w-3.5" />
                حسابي
              </span>
            </div>
            <PageHeader
              accentColor={LEVEL_CONFIG["Gold"].color}
              border={LEVEL_CONFIG["Gold"].border}
              bg={LEVEL_CONFIG["Gold"].bg}
            />
            <LoadingSkeleton />
          </div>
        </div>
      }
    >
      <LoyaltyPageInner />
    </Suspense>
  );
}
