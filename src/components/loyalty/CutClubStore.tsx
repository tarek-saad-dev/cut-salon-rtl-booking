"use client";

import { useState } from "react";
import { StoreCategories, type StoreCategory } from "./StoreCategories";
import { StoreItemCard } from "./StoreItemCard";
import { PurchaseDrawer, PurchaseSuccessToast } from "./PurchaseDrawer";
import { AnimatePresence } from "framer-motion";
import type { StoreItem } from "./storeApi";
import { purchaseStoreItem } from "./storeApi";
import { Store } from "lucide-react";

export function CutClubStore({
  items,
  currentBalance,
  clientId,
  onPurchased,
}: {
  items: StoreItem[];
  currentBalance: number;
  clientId: string | number;
  onPurchased: (itemId: number, voucherCode?: string, newBalance?: number) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<StoreCategory>("all");
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [purchasedItemName, setPurchasedItemName] = useState("");

  const filteredItems = items.filter((item) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "popular") return item.isFeatured;
    if (activeCategory === "services") return item.itemType === "FREE_SERVICE";
    if (activeCategory === "discounts") return item.itemType === "DISCOUNT_AMOUNT" || item.itemType === "DISCOUNT_PERCENT";
    if (activeCategory === "vip") return item.itemType === "VIP_UPGRADE";
    if (activeCategory === "exclusive") return item.itemType === "MYSTERY_BOX" || item.itemType === "DOUBLE_POINTS" || item.itemType === "BONUS_POINTS";
    return true;
  });

  const handlePurchase = async () => {
    if (!selectedItem) return;

    setLoading(true);
    setError(null);

    try {
      const result = await purchaseStoreItem(clientId, selectedItem.id);
      setPurchasedItemName(selectedItem.nameAr);
      setSelectedItem(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      onPurchased(selectedItem.id, result.voucherCode, result.newBalance);
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
        {filteredItems.map((item) => (
          <StoreItemCard
            key={item.id}
            item={item}
            currentBalance={currentBalance}
            onPurchase={() => setSelectedItem(item)}
            featured={item.isFeatured}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <PurchaseDrawer
            item={selectedItem}
            currentBalance={currentBalance}
            onConfirm={handlePurchase}
            onCancel={() => {
              setSelectedItem(null);
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
