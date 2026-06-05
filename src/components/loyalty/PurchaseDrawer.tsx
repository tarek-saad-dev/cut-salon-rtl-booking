"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import type { StoreItem } from "./storeApi";

export function PurchaseDrawer({
  item,
  currentBalance,
  onConfirm,
  onCancel,
  loading,
  error,
}: {
  item: StoreItem;
  currentBalance: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const remainingBalance = currentBalance - item.priceCoins;
  const canAfford = currentBalance >= item.priceCoins;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={!loading ? onCancel : undefined}
        />

        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative z-10 w-full max-w-lg mx-4 mb-4 md:mb-0 rounded-3xl overflow-hidden"
        >
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 50%, #1a1510 100%)",
            }}
          />

          <div
            className="absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-15 blur-3xl"
            style={{ background: "#D4AF37" }}
          />

          <div
            className="absolute inset-0 rounded-3xl"
            style={{ border: "1px solid rgba(212, 175, 55, 0.2)" }}
          />

          <div className="relative z-10 p-6 md:p-8">
            <button
              onClick={onCancel}
              disabled={loading}
              className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                  <Coins className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-black">تأكيد الشراء</h3>
                  <p className="text-white/40 text-xs">CUT CLUB STORE</p>
                </div>
              </div>
            </div>

            <div className="mb-6 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-white/50 text-xs mb-2">العنصر المحدد</p>
              <p className="text-white text-base font-bold mb-1">{item.nameAr}</p>
              <p className="text-white/40 text-sm">{item.nameEn}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-white/60 text-sm">رصيدك الحالي</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-white text-lg font-black tabular-nums">
                    {currentBalance.toLocaleString("ar-EG")}
                  </span>
                  <span className="text-white/40 text-xs font-bold">CC</span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-[#D4AF37]/40 rotate-90" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#D4AF37]/[0.08] border border-[#D4AF37]/20">
                <span className="text-[#D4AF37] text-sm font-bold">سعر العنصر</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[#D4AF37] text-lg font-black tabular-nums">
                    {item.priceCoins.toLocaleString("ar-EG")}
                  </span>
                  <span className="text-[#D4AF37]/60 text-xs font-bold">CC</span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-[#D4AF37]/40 rotate-90" />
              </div>

              <div className={`flex items-center justify-between p-4 rounded-xl border ${
                canAfford
                  ? "bg-emerald-500/[0.08] border-emerald-500/20"
                  : "bg-red-500/[0.08] border-red-500/20"
              }`}>
                <span className={`text-sm font-bold ${canAfford ? "text-emerald-400" : "text-red-400"}`}>
                  الرصيد بعد الشراء
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-lg font-black tabular-nums ${
                    canAfford ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {remainingBalance.toLocaleString("ar-EG")}
                  </span>
                  <span className={`text-xs font-bold ${
                    canAfford ? "text-emerald-400/60" : "text-red-400/60"
                  }`}>CC</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {!canAfford && (
              <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <p className="text-amber-400 text-sm font-medium">
                  رصيدك غير كافٍ. تحتاج {(item.priceCoins - currentBalance).toLocaleString("ar-EG")} CC إضافية
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-bold text-white/60 transition-all hover:bg-white/[0.07] hover:text-white disabled:opacity-40"
              >
                إلغاء
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || !canAfford}
                className="flex-1 rounded-xl bg-gradient-to-b from-[#e7c766] to-[#b88916] py-3.5 text-sm font-black text-[#050505] transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(212,175,55,0.25)]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الشراء...
                  </span>
                ) : (
                  "تأكيد الشراء"
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function PurchaseSuccessToast({
  itemName,
  onClose,
}: {
  itemName: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-full max-w-md px-4"
      dir="rtl"
    >
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/90 to-emerald-900/80 backdrop-blur-xl px-6 py-4 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 text-sm font-black mb-1">
                تمت إضافة العنصر إلى مشترياتك ✓
              </p>
              <p className="text-white/60 text-xs">
                {itemName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors mt-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
