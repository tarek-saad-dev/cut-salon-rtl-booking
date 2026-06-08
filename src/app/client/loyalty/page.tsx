"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calendar, Scissors, AlertTriangle, RefreshCw } from "lucide-react";
import { getSavedClient } from "@/lib/clientStorage";

import { CompactMembershipCard } from "@/components/loyalty/CompactMembershipCard";
import { WalletCard } from "@/components/loyalty/WalletCard";
import { ProgressToReward } from "@/components/loyalty/ProgressToReward";
import { CutClubStore } from "@/components/loyalty/CutClubStore";
import { MyInventory } from "@/components/loyalty/MyInventory";
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
import { fetchStore, fetchClientInventory, type StoreItem, type InventoryItem as ApiInventoryItem } from "@/components/loyalty/storeApi";

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

  // Format memberSince date to readable Arabic format
  let memberSinceFormatted = "2026";
  if (api.membership.memberSince) {
    try {
      const date = new Date(api.membership.memberSince);
      if (!isNaN(date.getTime())) {
        memberSinceFormatted = date.toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      }
    } catch {
      memberSinceFormatted = "2026";
    }
  }

  return {
    clientId,
    clientName: api.client.name,
    memberId: api.membership.memberId || `CUT-${api.client.id}`,
    level,
    points: api.membership.pointsBalance,
    lastVisitPoints: api.membership.lastVisitPoints ?? 0,
    memberSince: memberSinceFormatted,
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
  const isAuthError = message.includes("تسجيل الدخول") || message.includes("لم يتم العثور");

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" dir="rtl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] mb-4">
        <AlertTriangle className="h-6 w-6 text-amber-500/70" />
      </div>
      <h3 className="text-white text-base font-black mb-1">
        {isAuthError ? "يرجى تسجيل الدخول أولاً" : "تعذر تحميل بيانات CUT CLUB"}
      </h3>
      <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-6">
        {isAuthError
          ? "للوصول إلى حسابك في CUT CLUB، يرجى تسجيل الدخول أولاً"
          : (message || "حاول تحديث الصفحة أو الرجوع لاحقًا")
        }
      </p>
      {isAuthError ? (
        <Link
          href="/client?redirect=/client/loyalty"
          className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] px-5 py-2.5 text-sm font-bold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/15 hover:border-[#D4AF37]/50 active:scale-[0.97]"
        >
          تسجيل الدخول
        </Link>
      ) : (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] px-5 py-2.5 text-sm font-bold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/15 hover:border-[#D4AF37]/50 active:scale-[0.97]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          إعادة المحاولة
        </button>
      )}
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

  const [data, setData] = useState<(ClientLoyalty & { clientId: string | number }) | null>(null);
  const [apiResponse, setApiResponse] = useState<ClientLoyaltyDashboardResponse | null>(null);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<ApiInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const savedClient = getSavedClient();
    const clientIdFromUrl = searchParams.get("clientId");

    let clientId: string | number;

    if (clientIdFromUrl) {
      clientId = clientIdFromUrl;
    } else if (savedClient?.id) {
      clientId = savedClient.id;
    } else if (savedClient?.phone) {
      clientId = savedClient.phone;
    } else {
      setError("يرجى تسجيل الدخول أولاً");
      setLoading(false);
      return;
    }

    const apiBase = (process.env.NEXT_PUBLIC_BOOKING_API_BASE_URL ?? "").replace(/\/$/, "");
    try {
      const res = await fetch(
        `${apiBase}/api/public/client/loyalty/me?clientId=${encodeURIComponent(clientId)}`,
        { cache: "no-store" }
      );
      const json: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("يرجى تسجيل الدخول أولاً");
        }
        if (res.status === 404) {
          throw new Error("لم يتم العثور على حسابك في CUT CLUB. يرجى تسجيل الدخول أولاً");
        }
        const msg =
          json !== null && typeof json === "object"
            ? ((json as Record<string, unknown>).error as string | undefined) ??
            ((json as Record<string, unknown>).message as string | undefined) ??
            "فشل تحميل البيانات"
            : "فشل تحميل البيانات";
        throw new Error(msg);
      }

      if (
        json === null ||
        typeof json !== "object" ||
        (json as Record<string, unknown>).ok === false
      ) {
        const msg =
          json !== null && typeof json === "object"
            ? ((json as Record<string, unknown>).error as string | undefined) ??
            ((json as Record<string, unknown>).message as string | undefined) ??
            "لم يتم العثور على بيانات حسابك. يرجى تسجيل الدخول أولاً"
            : "لم يتم العثور على بيانات حسابك. يرجى تسجيل الدخول أولاً";
        throw new Error(msg);
      }

      const typed = json as ClientLoyaltyDashboardResponse;
      setApiResponse(typed);
      setData(mapApiToComponentData(typed, clientId));

      // Fetch store items and inventory in parallel with dashboard
      try {
        const [storeData, inventoryData] = await Promise.all([
          fetchStore(clientId),
          fetchClientInventory(clientId),
        ]);
        setStoreItems(storeData.items ?? []);
        setInventoryItems(inventoryData.items ?? []);
      } catch (storeErr) {
        console.warn("[loyalty page] Store/Inventory fetch failed:", storeErr);
        setStoreItems([]);
        setInventoryItems([]);
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى");
      }
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleBook = () => {
    window.location.href = "/#barbers";
  };

  function mapInventoryItems(apiItems: ApiInventoryItem[]) {
    return apiItems.map((item) => ({
      id: String(item.id),
      name: item.nameAr,
      nameEn: item.nameEn,
      purchasedAt: item.purchasedAt,
      status: (
        item.status === "ACTIVE"
          ? "ready"
          : item.status === "USED"
            ? "used"
            : "expired"
      ) as "ready" | "used" | "expired",
      redeemCode: item.voucherCode,
    }));
  }

  const handlePurchased = (_itemId: number, _voucherCode?: string, newBalance?: number) => {
    // Optimistically update balance if provided, then refetch for full consistency
    if (newBalance !== undefined && data) {
      setData((prev) => prev ? { ...prev, points: newBalance } : prev);
    }
    // Refetch to get updated store items and dashboard
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

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-24">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <PageHeader accentColor={cfg.color} border={cfg.border} bg={cfg.bg} />

        {/* ── Welcome message ─────────────────────────────────────────── */}
        {!loading && !error && data && (
          <div className="mb-6 text-center" dir="rtl">
            <h2 className="text-white text-xl md:text-2xl font-bold">
              أهلاً عميلنا المميز، <span style={{ color: cfg.color }}>{data.clientName}</span>
            </h2>
          </div>
        )}

        {/* ── States ──────────────────────────────────────────────────── */}
        {loading && <LoadingSkeleton />}

        {!loading && error && (
          <ErrorState message={error} onRetry={fetchDashboard} />
        )}

        {!loading && !error && data && (
          <div className="space-y-6">

            {/* 1 — Compact Membership Card with Stats */}
            <CompactMembershipCard data={data} stats={data.stats} />

            {/* 2 — Wallet Card */}
            <WalletCard balance={data.points} lastVisitPoints={data.lastVisitPoints} />

            {/* 3 — Progress to next reward */}
            {data.nextReward.requiredPoints > 0 ? (
              <ProgressToReward
                nextReward={data.nextReward}
                onBook={handleBook}
              />
            ) : (
              <div
                className="rounded-2xl border px-5 py-4 text-center"
                style={{ borderColor: cfg.border, background: cfg.bg }}
                dir="rtl"
              >
                <p className="text-[#D4AF37] text-sm font-bold mb-1">كل المكافآت الأساسية متاحة لك الآن 🎉</p>
                <p className="text-white/40 text-xs">استعرض مكافآتك واستخدمها في زيارتك القادمة</p>
              </div>
            )}

            {/* 4 — CUT CLUB STORE */}
            <div className="pt-6">
              <CutClubStore
                items={storeItems}
                currentBalance={data.points}
                clientId={data.clientId}
                onPurchased={handlePurchased}
              />
            </div>

            {/* 5 — My Inventory */}
            <MyInventory items={mapInventoryItems(inventoryItems)} />

            {/* 6 — Personal offer */}
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
          <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-24">
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
