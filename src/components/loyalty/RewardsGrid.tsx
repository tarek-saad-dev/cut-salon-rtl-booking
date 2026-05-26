"use client";

import { useState } from "react";
import { Gift, Scissors, Sparkles, Star, Crown, Lock, Loader2, X } from "lucide-react";
import type { LoyaltyReward } from "./loyaltyData";

// ─── Icon map ────────────────────────────────────────────────────────────────
const iconMap: Record<string, React.ReactNode> = {
  scissors: <Scissors className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />,
  gift: <Gift className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  crown: <Crown className="h-5 w-5" />,
};

// ─── Confirmation Dialog ──────────────────────────────────────────────────────
function RedeemConfirmDialog({
  reward,
  onConfirm,
  onCancel,
  loading,
  error,
}: {
  reward: LoyaltyReward;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!loading ? onCancel : undefined}
      />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-[rgba(212,175,55,0.2)] bg-[#111111] p-6 shadow-2xl">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 left-4 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 mb-4">
          <Gift className="h-5 w-5 text-[#D4AF37]" />
        </div>

        <h3 className="text-white text-base font-black mb-1">استبدال المكافأة؟</h3>
        <p className="text-white/50 text-sm leading-relaxed mb-4">
          سيتم خصم{" "}
          <span className="text-[#D4AF37] font-bold">{reward.points.toLocaleString()} نقطة</span>
          {" "}من رصيدك مقابل «{reward.titleAr}».
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-red-400 text-xs font-medium">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-bold text-white/60 transition-all hover:bg-white/[0.07] disabled:opacity-40"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-gradient-to-b from-[#e7c766] to-[#b88916] py-2.5 text-xs font-black text-[#050505] transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                جاري الاستبدال...
              </span>
            ) : (
              "تأكيد الاستبدال"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Success Toast ────────────────────────────────────────────────────────────
function RedeemSuccessToast({
  redeemCode,
  onClose,
}: {
  redeemCode?: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-full max-w-sm px-4" dir="rtl">
      <div className="rounded-2xl border border-emerald-500/25 bg-[#0d1a12] px-5 py-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-emerald-400 text-sm font-black">تم استبدال المكافأة بنجاح ✓</p>
            {redeemCode && (
              <p className="text-white/50 text-xs mt-1">
                كود المكافأة:{" "}
                <span className="text-[#D4AF37] font-black tracking-widest">{redeemCode}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reward Card ─────────────────────────────────────────────────────────────
function RewardCard({
  reward,
  clientId,
  onRedeemed,
}: {
  reward: LoyaltyReward;
  clientId: string | number;
  onRedeemed: (rewardId: string, redeemCode?: string, newBalance?: number) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAvailable = reward.status === "available";
  const isLocked = reward.status === "locked";
  const isTierLocked = reward.status === "tier_locked";

  const handleRedeem = async () => {
    setLoading(true);
    setError(null);
    const apiBase = (process.env.NEXT_PUBLIC_BOOKING_API_BASE_URL ?? "").replace(/\/$/, "");
    try {
      const res = await fetch(
        `${apiBase}/api/public/client/loyalty/rewards/${encodeURIComponent(reward.id)}/redeem?clientId=${encodeURIComponent(clientId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: true }),
        }
      );
      const data: unknown = await res.json().catch(() => null);
      if (
        !res.ok ||
        (data !== null && typeof data === "object" && (data as Record<string, unknown>).ok === false)
      ) {
        const msg =
          data !== null && typeof data === "object"
            ? ((data as Record<string, unknown>).error as string | undefined) ??
            ((data as Record<string, unknown>).message as string | undefined) ??
            "فشل استبدال المكافأة"
            : "فشل استبدال المكافأة";
        setError(msg);
        return;
      }
      const typed = data as { redeemCode?: string; newBalance?: number };
      setShowConfirm(false);
      onRedeemed(reward.id, typed.redeemCode, typed.newBalance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showConfirm && (
        <RedeemConfirmDialog
          reward={reward}
          onConfirm={handleRedeem}
          onCancel={() => { setShowConfirm(false); setError(null); }}
          loading={loading}
          error={error}
        />
      )}

      <div
        className={`relative flex flex-col rounded-2xl border p-5 transition-all duration-200 ${isAvailable
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
          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${isAvailable
            ? "bg-[#D4AF37]/12 text-[#D4AF37] border border-[#D4AF37]/20"
            : "bg-white/[0.04] text-white/25 border border-white/[0.07]"
            }`}
        >
          {(isLocked || isTierLocked) ? <Lock className="h-4 w-4" /> : (iconMap[reward.icon] ?? <Gift className="h-5 w-5" />)}
        </div>

        <p className={`text-sm font-bold mb-0.5 ${isAvailable ? "text-white" : "text-white/40"}`}>
          {reward.titleAr}
        </p>
        <p className={`text-[11px] mb-3 ${isAvailable ? "text-white/40" : "text-white/20"}`}>
          {reward.title}
        </p>

        <p className={`text-base font-black tabular-nums mb-3 mt-auto ${isAvailable ? "text-[#D4AF37]" : "text-white/25"}`}>
          {reward.points.toLocaleString()}
          <span className="text-[11px] font-medium mr-1">نقطة</span>
        </p>

        {/* Progress bar (locked only) */}
        {isLocked && reward.remainingPoints !== undefined && reward.remainingPoints > 0 && (
          <div className="mb-3">
            <span className="text-white/30 text-[10px]">
              باقي {reward.remainingPoints.toLocaleString()} نقطة
            </span>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-[#D4AF37]/30"
                style={{
                  width: `${Math.min(100, Math.round(
                    ((reward.points - reward.remainingPoints) / reward.points) * 100
                  ))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        {isAvailable ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full rounded-xl bg-gradient-to-b from-[#e7c766] to-[#b88916] py-2 text-xs font-black text-[#050505] transition-all hover:brightness-110 active:scale-[0.97]"
          >
            استخدم الآن
          </button>
        ) : isTierLocked ? (
          <div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-2 text-center text-xs font-bold text-white/25">
            متاح لمستوى أعلى
          </div>
        ) : (
          <div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-2 text-center text-xs font-bold text-white/25">
            قريبًا
          </div>
        )}
      </div>
    </>
  );
}

// ─── Rewards Grid ─────────────────────────────────────────────────────────────
export function RewardsGrid({
  rewards,
  clientId,
  onRedeemed,
}: {
  rewards: LoyaltyReward[];
  clientId: string | number;
  onRedeemed: (rewardId: string, redeemCode?: string, newBalance?: number) => void;
}) {
  const [successCode, setSuccessCode] = useState<string | undefined>(undefined);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRedeemed = (rewardId: string, redeemCode?: string, newBalance?: number) => {
    setSuccessCode(redeemCode);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
    onRedeemed(rewardId, redeemCode, newBalance);
  };

  return (
    <>
      {showSuccess && (
        <RedeemSuccessToast
          redeemCode={successCode}
          onClose={() => setShowSuccess(false)}
        />
      )}

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
            <RewardCard
              key={r.id}
              reward={r}
              clientId={clientId}
              onRedeemed={handleRedeemed}
            />
          ))}
        </div>
      </div>
    </>
  );
}
