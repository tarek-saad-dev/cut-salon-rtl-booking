"use client";

import { motion } from "framer-motion";
import { Package, Gift, Sparkles, CheckCircle2, Clock } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  nameEn: string;
  purchasedAt: string;
  status: "ready" | "used" | "expired";
  redeemCode?: string;
}

export function MyInventory({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-12" dir="rtl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
            <Package className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              🎒 مشترياتي
            </h2>
            <p className="text-white/50 text-sm mt-0.5">
              العناصر التي قمت بشرائها من المتجر
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.08]">
              <Package className="h-8 w-8 text-white/20" />
            </div>
          </div>
          <p className="text-white/40 text-sm mb-2">لم تقم بشراء أي عناصر بعد</p>
          <p className="text-white/25 text-xs">
            ابدأ بالتسوق من CUT CLUB STORE
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
          <Package className="h-5 w-5 text-[#D4AF37]" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            🎒 مشترياتي
          </h2>
          <p className="text-white/50 text-sm mt-0.5">
            العناصر التي قمت بشرائها من المتجر
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`relative rounded-2xl border p-5 ${
              item.status === "ready"
                ? "border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-emerald-900/10"
                : item.status === "used"
                ? "border-white/[0.08] bg-white/[0.02] opacity-60"
                : "border-red-500/20 bg-red-950/10 opacity-50"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    item.status === "ready"
                      ? "bg-emerald-500/15 border border-emerald-500/25"
                      : "bg-white/[0.05] border border-white/[0.08]"
                  }`}
                >
                  {item.status === "ready" ? (
                    <Gift className="h-5 w-5 text-emerald-400" />
                  ) : item.status === "used" ? (
                    <CheckCircle2 className="h-5 w-5 text-white/30" />
                  ) : (
                    <Clock className="h-5 w-5 text-red-400/60" />
                  )}
                </div>
                <div>
                  <h3 className="text-white text-base font-bold mb-1">{item.name}</h3>
                  <p className="text-white/40 text-xs">{item.nameEn}</p>
                </div>
              </div>

              {item.status === "ready" && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px] font-bold">جاهز</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-white/30 text-xs mb-1">تم الشراء منذ {item.purchasedAt}</p>
              {item.redeemCode && (
                <div className="mt-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-white/40 text-[10px] mb-1">كود الاستخدام</p>
                  <p className="text-[#D4AF37] text-sm font-black tracking-widest">
                    {item.redeemCode}
                  </p>
                </div>
              )}
            </div>

            {item.status === "ready" && (
              <button className="w-full rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 py-2.5 text-sm font-black text-white transition-all hover:brightness-110 active:scale-[0.97] shadow-[0_4px_12px_rgba(52,211,153,0.25)]">
                استخدام الآن
              </button>
            )}

            {item.status === "used" && (
              <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-center">
                <span className="text-xs font-bold text-white/30">تم الاستخدام</span>
              </div>
            )}

            {item.status === "expired" && (
              <div className="w-full rounded-xl border border-red-500/20 bg-red-500/[0.05] py-2.5 text-center">
                <span className="text-xs font-bold text-red-400/60">منتهي الصلاحية</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
