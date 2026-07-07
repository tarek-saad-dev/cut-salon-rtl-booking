"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Scissors, DollarSign, Crown, Sparkles } from "lucide-react";

export type StoreCategory = "all" | "popular" | "services" | "discounts" | "vip" | "exclusive";

const categories = [
  { id: "all" as const, label: "الكل", icon: null },
  { id: "popular" as const, label: "الأكثر طلباً", icon: Flame },
  { id: "services" as const, label: "خدمات", icon: Scissors },
  { id: "discounts" as const, label: "خصومات", icon: DollarSign },
  { id: "vip" as const, label: "VIP", icon: Crown },
  { id: "exclusive" as const, label: "حصري", icon: Sparkles },
];

export function StoreCategories({
  activeCategory,
  onCategoryChange,
}: {
  activeCategory: StoreCategory;
  onCategoryChange: (category: StoreCategory) => void;
}) {
  return (
    <div className="mb-8 overflow-x-auto scrollbar-hide" dir="rtl">
      <div className="flex gap-2 pb-2 min-w-max">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          
          return (
            <motion.button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                isActive
                  ? "bg-gradient-to-b from-cut-gold to-cut-gold/80 text-cut-black shadow-[0_4px_16px_rgba(164,136,121,0.3)]"
                  : "bg-white/[0.04] text-cut-ivory/60 border border-white/[0.08] hover:bg-white/[0.07] hover:text-cut-ivory/80"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{cat.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: "linear-gradient(to bottom, cut-gold, cut-gold/80)",
                    zIndex: -1,
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
