"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, Sparkles } from "lucide-react";

export function WalletCard({ 
  balance,
  lastVisitPoints = 0 
}: { 
  balance: number;
  lastVisitPoints?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
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
        className="absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "#A48879" }}
      />
      <div
        className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-10 blur-3xl"
        style={{ background: "#A48879" }}
      />

      <div className="absolute inset-0 overflow-hidden opacity-[0.03]">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full"
            style={{
              top: `${12 + i * 18}%`,
              background: `linear-gradient(90deg, transparent, cut-gold, transparent)`,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 rounded-3xl"
        style={{ border: "1px solid rgba(212, 175, 55, 0.25)" }}
      />

      <div className="relative z-10 p-8 md:p-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cut-gold/12 border border-cut-gold/25">
                <Wallet className="h-6 w-6 text-cut-gold" />
              </div>
              <div>
                <h3 className="text-cut-ivory text-xl font-black">CUT Coins Wallet</h3>
                <p className="text-cut-ivory/40 text-xs">محفظتك الرقمية</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cut-bronze/10 border border-cut-bronze/25">
            <TrendingUp className="h-3.5 w-3.5 text-cut-bronze" />
            <span className="text-cut-bronze text-xs font-bold">نشط</span>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-cut-ivory/50 text-sm font-medium mb-3">رصيدك الحالي</p>
          <div className="flex items-baseline gap-3 mb-2">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-6xl md:text-7xl font-black text-cut-gold tabular-nums leading-none"
            >
              {balance.toLocaleString("ar-EG")}
            </motion.span>
            <span className="text-3xl font-bold text-cut-gold/60 mb-2">CC</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-cut-ivory/30 text-xs tracking-wide">CUT Coins</p>
            {lastVisitPoints > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cut-bronze/10 border border-cut-bronze/25">
                <Sparkles className="h-3 w-3 text-cut-bronze" />
                <span className="text-cut-bronze text-xs font-bold">
                  +{lastVisitPoints} من آخر زيارة
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cut-gold/10 border border-cut-gold/20 flex-shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4 text-cut-gold" />
          </div>
          <div className="flex-1">
            <p className="text-cut-ivory/70 text-sm leading-relaxed">
              يمكنك استخدام العملات لشراء خدمات ومزايا حصرية من CUT CLUB STORE
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
