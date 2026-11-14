"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { StoreCategories, type StoreCategory } from "./StoreCategories";
import { StoreItemCard } from "./StoreItemCard";
import type { StoreItem } from "./storeApi";

/**
 * Legacy CUT CLUB store is CATALOG-ONLY while verified customer purchase APIs
 * are unavailable. This component deliberately never opens a purchase drawer,
 * calls a purchase endpoint, changes Coins or shows a success notification.
 *
 * NOTE: this is UI safety, NOT authentication. Existing personal GET APIs
 * remain blocked on Casher security #243.
 */
export function CutClubStore({
  items,
  currentBalance,
}: {
  items: StoreItem[];
  currentBalance: number;
  /** Kept for callers during migration; never used as a purchase authority. */
  clientId: string | number;
  /** No mutation callback is invoked while purchasing is unavailable. */
  onPurchased: (itemId: number, voucherCode?: string, newBalance?: number) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<StoreCategory>("all");
  const filteredItems = items.filter((item) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "popular") return item.isFeatured;
    if (activeCategory === "services") return item.itemType === "FREE_SERVICE";
    if (activeCategory === "discounts") return item.itemType === "DISCOUNT_AMOUNT" || item.itemType === "DISCOUNT_PERCENT";
    if (activeCategory === "vip") return item.itemType === "VIP_UPGRADE";
    if (activeCategory === "exclusive") return ["MYSTERY_BOX", "DOUBLE_POINTS", "BONUS_POINTS"].includes(item.itemType);
    return true;
  });

  return (
    <section dir="rtl" aria-label="CUT CLUB Store">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cut-gold/20 bg-cut-gold/10">
          <Store className="h-5 w-5 text-cut-gold" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-black text-cut-ivory">CUT CLUB STORE</h2>
          <p className="mt-1 text-sm text-cut-ivory/60">تصفح مكافآت CUT CLUB وأسعارها بالنقاط</p>
        </div>
      </div>

      <div
        role="status"
        className="mb-6 rounded-xl border border-cut-bronze/35 bg-cut-bronze/10 px-5 py-4 text-sm text-cut-ivory"
      >
        <p className="font-black">الشراء واستبدال النقاط غير متاحين مؤقتًا</p>
        <p className="mt-1 text-cut-ivory/70">
          بنجهز تسجيل دخول آمن لحماية رصيد CUT Coins والمكافآت.
          تقدر تتصفح العروض دلوقتي، لكن مش هيتخصم أي رصيد من حسابك هنا.
        </p>
      </div>

      <StoreCategories activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-sm text-cut-ivory/60">لا توجد مكافآت للعرض حاليًا.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {filteredItems.map(item => (
            <StoreItemCard
              key={item.itemId}
              item={item}
              currentBalance={currentBalance}
              onPurchase={() => undefined}
              purchaseDisabled
              featured={item.isFeatured}
            />
          ))}
        </div>
      )}
    </section>
  );
}
