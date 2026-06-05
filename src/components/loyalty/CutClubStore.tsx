"use client";

import { useState } from "react";
import { StoreCategories, type StoreCategory } from "./StoreCategories";
import { StoreItemCard } from "./StoreItemCard";
import { PurchaseDrawer, PurchaseSuccessToast } from "./PurchaseDrawer";
import { AnimatePresence } from "framer-motion";
import type { LoyaltyReward } from "./loyaltyData";
import { Store } from "lucide-react";

export function CutClubStore({
  rewards,
  currentBalance,
  clientId,
  onPurchased,
}: {
  rewards: LoyaltyReward[];
  currentBalance: number;
  clientId: string | number;
  onPurchased: (rewardId: string, redeemCode?: string, newBalance?: number) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<StoreCategory>("all");
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [purchasedItemName, setPurchasedItemName] = useState("");

  const filteredRewards = rewards.filter((reward) => {
    if (activeCategory === "all") return true;
    // Add category filtering logic based on reward properties
    return true;
  });

  const handlePurchase = async () => {
    if (!selectedReward) return;

    setLoading(true);
    setError(null);
    const apiBase = (process.env.NEXT_PUBLIC_BOOKING_API_BASE_URL ?? "").replace(/\/$/, "");

    try {
      const res = await fetch(
        `${apiBase}/api/public/client/loyalty/rewards/${encodeURIComponent(selectedReward.id)}/redeem?clientId=${encodeURIComponent(clientId)}`,
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
            "فشل الشراء"
            : "فشل الشراء";
        setError(msg);
        return;
      }

      const typed = data as { redeemCode?: string; newBalance?: number };
      setPurchasedItemName(selectedReward.titleAr);
      setSelectedReward(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      onPurchased(selectedReward.id, typed.redeemCode, typed.newBalance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
            <Store className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              🏪 CUT CLUB STORE
            </h2>
            <p className="text-white/50 text-sm mt-0.5">
              استخدم CUT Coins الخاصة بك لشراء مزايا وخدمات حصرية
            </p>
          </div>
        </div>
      </div>

      <StoreCategories
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredRewards.map((reward, index) => (
          <StoreItemCard
            key={reward.id}
            reward={reward}
            currentBalance={currentBalance}
            onPurchase={() => setSelectedReward(reward)}
            featured={index === 0 || index === 1}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedReward && (
          <PurchaseDrawer
            reward={selectedReward}
            currentBalance={currentBalance}
            onConfirm={handlePurchase}
            onCancel={() => {
              setSelectedReward(null);
              setError(null);
            }}
            loading={loading}
            error={error}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <PurchaseSuccessToast
            itemName={purchasedItemName}
            onClose={() => setShowSuccess(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
