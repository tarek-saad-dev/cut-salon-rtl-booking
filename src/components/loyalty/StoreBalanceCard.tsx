"use client";

import { motion } from "framer-motion";
import { Coins, TrendingUp } from "lucide-react";

export function StoreBalanceCard({ balance }: { balance: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl mb-8"
      dir="rtl"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #1A2820 0%, #0f0f0f 40%, #1a1510 70%, #0f0f0f 100%)",
        }}
      />

      <div
        className="absolute -top-24 -right-24 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "#A48879" }}
      />
      <div
        className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-10 blur-3xl"
        style={{ background: "#A48879" }}
      />

      <div className="absolute inset-0 overflow-hidden opacity-[0.03]">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full"
            style={{
              top: `${15 + i * 20}%`,
              background: `linear-gradient(90deg, transparent, cut-gold, transparent)`,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 rounded-3xl"
        style={{ border: "1px solid rgba(212, 175, 55, 0.2)" }}
      />

      <div className="relative z-10 p-8 md:p-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cut-gold/10 border border-cut-gold/20">
                <Coins className="h-5 w-5 text-cut-gold" />
              </div>
              <span className="text-cut-gold text-xs font-bold tracking-widest uppercase">
                WALLET
              </span>
            </div>
            <p className="text-cut-ivory/50 text-sm font-medium">رصيدك الحالي</p>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cut-bronze/10 border border-cut-bronze/25">
            <TrendingUp className="h-3 w-3 text-cut-bronze" />
            <span className="text-cut-bronze text-xs font-bold">نشط</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-3">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-7xl font-black text-cut-gold tabular-nums leading-none"
            >
              {balance.toLocaleString("ar-EG")}
            </motion.span>
            <span className="text-2xl font-bold text-cut-gold/60 mb-2">CC</span>
          </div>
          <p className="text-cut-ivory/30 text-xs mt-2 tracking-wide">CUT Coins</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <div className="flex-1">
            <p className="text-cut-ivory/60 text-xs leading-relaxed">
              يمكنك استخدام العملات لشراء خدمات ومزايا حصرية
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
