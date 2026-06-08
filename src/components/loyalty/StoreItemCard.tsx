"use client";

import { motion } from "framer-motion";
import { Gift, Scissors, Sparkles, Star, Crown, Lock, Flame, Tag } from "lucide-react";
import type { StoreItem } from "./storeApi";

const typeToIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  DISCOUNT_AMOUNT: Tag,
  DISCOUNT_PERCENT: Tag,
  FREE_SERVICE: Scissors,
  DOUBLE_POINTS: Sparkles,
  BONUS_POINTS: Sparkles,
  VIP_UPGRADE: Crown,
  MYSTERY_BOX: Gift,
};

export function StoreItemCard({
  item,
  currentBalance,
  onPurchase,
  featured = false,
}: {
  item: StoreItem;
  currentBalance: number;
  onPurchase: () => void;
  featured?: boolean;
}) {
  const status = item.status;
  const canAfford = status?.canAfford ?? currentBalance >= item.priceCoins;
  const isTierLocked = status?.tierLocked ?? false;
  const isOutOfStock = status?.stockStatus === "OUT_OF_STOCK";
  const canPurchase = canAfford && !isTierLocked && !isOutOfStock;
  const isLocked = !canAfford && !isTierLocked;
  const shortage = item.priceCoins - currentBalance;

  const Icon = typeToIcon[item.itemType] || Gift;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={canPurchase ? { y: -4, scale: 1.02 } : {}}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col rounded-2xl border p-5 transition-all ${
        canPurchase
          ? "border-[#D4AF37]/30 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] hover:border-[#D4AF37]/50 hover:shadow-[0_8px_32px_rgba(212,175,55,0.15)] cursor-pointer"
          : isTierLocked
          ? "border-white/[0.06] bg-[#0d0d0d] opacity-60"
          : "border-white/[0.08] bg-[#111111]"
      }`}
      dir="rtl"
    >
      {featured && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
            <Flame className="h-3 w-3 text-white" />
            <span className="text-white text-[10px] font-black">الأكثر طلباً</span>
          </div>
        </div>
      )}

      {canPurchase && (
        <div className="absolute top-3 left-3 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
      )}

      <div className="mb-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl mb-3 ${
            canPurchase
              ? "bg-[#D4AF37]/12 border border-[#D4AF37]/25"
              : isTierLocked
              ? "bg-white/[0.03] border border-white/[0.05]"
              : "bg-white/[0.05] border border-white/[0.08]"
          }`}
        >
          {isTierLocked ? (
            <Lock className="h-6 w-6 text-white/20" />
          ) : (
            <Icon
              className={`h-6 w-6 ${
                canPurchase ? "text-[#D4AF37]" : "text-white/30"
              }`}
            />
          )}
        </div>

        <h3
          className={`text-base font-bold mb-1 leading-tight ${
            canPurchase ? "text-white" : "text-white/40"
          }`}
        >
          {item.nameAr}
        </h3>
        <p
          className={`text-xs leading-relaxed ${
            canPurchase ? "text-white/50" : "text-white/25"
          }`}
        >
          {item.nameEn}
        </p>
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline gap-2 mb-4">
          <span
            className={`text-2xl font-black tabular-nums ${
              canPurchase ? "text-[#D4AF37]" : "text-white/30"
            }`}
          >
            {item.priceCoins.toLocaleString("ar-EG")}
          </span>
          <span
            className={`text-xs font-bold ${
              canPurchase ? "text-[#D4AF37]/60" : "text-white/20"
            }`}
          >
            CC
          </span>
        </div>

        {isLocked && !canAfford && shortage > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-[10px] font-medium">
                باقي {shortage.toLocaleString("ar-EG")} CC
              </span>
              <span className="text-white/30 text-[10px] font-medium">
                {Math.round(((item.priceCoins - shortage) / item.priceCoins) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, ((item.priceCoins - shortage) / item.priceCoins) * 100)}%`,
                }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full rounded-full bg-gradient-to-r from-[#D4AF37]/40 to-[#D4AF37]/60"
              />
            </div>
          </div>
        )}

        {canPurchase ? (
          <button
            onClick={onPurchase}
            className="w-full rounded-xl bg-gradient-to-b from-[#e7c766] to-[#b88916] py-2.5 text-sm font-black text-[#050505] transition-all hover:brightness-110 active:scale-[0.97] shadow-[0_4px_12px_rgba(212,175,55,0.25)]"
          >
            شراء الآن
          </button>
        ) : isTierLocked ? (
          <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-white/20" />
              <span className="text-xs font-bold text-white/25">
                {isTierLocked ? "مستوى أعلى مطلوب" : "افتح المستوى أولاً"}
              </span>
            </div>
          </div>
        ) : !canAfford ? (
          <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/[0.05] py-2.5 text-center">
            <span className="text-xs font-bold text-amber-400/80">
              باقي {shortage.toLocaleString("ar-EG")} CC
            </span>
          </div>
        ) : (
          <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-center text-xs font-bold text-white/25">
            قريباً
          </div>
        )}
      </div>
    </motion.div>
  );
}
