"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CampaignFloatingPillProps {
  visible: boolean;
  onOpen: () => void;
  introActive?: boolean;
}

export default function CampaignFloatingPill({
  visible,
  onOpen,
  introActive = false,
}: CampaignFloatingPillProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [introSettled, setIntroSettled] = useState(!introActive);

  useEffect(() => {
    if (!introActive) {
      setIntroSettled(true);
      return;
    }
    setIntroSettled(false);
    const timer = window.setTimeout(() => setIntroSettled(true), 1550);
    return () => window.clearTimeout(timer);
  }, [introActive]);

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showPill = visible || introActive;
  if (!showPill) return null;

  const showIntroLabel = introActive && !introSettled;

  return (
    <motion.button
      type="button"
      initial={introActive ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      onClick={onOpen}
      aria-label="Camp Caesar new location — 50% off first visit"
      dir="ltr"
      className={`fixed z-[58] left-4 flex items-center gap-2 rounded-full
        border border-cut-bronze/30 bg-cut-espresso/95 backdrop-blur-md
        text-cut-ivory shadow-[0_4px_24px_rgba(0,0,0,0.45)]
        hover:border-cut-bronze/50 hover:bg-cut-wine-black/95 transition-all active:scale-[0.97]
        ${introActive ? "campaign-floating-pill--intro" : ""}
        ${showIntroLabel
          ? "bottom-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] px-4 py-2.5"
          : collapsed
            ? "bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] px-3 py-2"
            : "bottom-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] px-3.5 py-2.5"
        }`}
      style={{ maxWidth: "calc(100vw - 2rem)" }}
    >
      {showIntroLabel ? (
        <span className="text-[10px] sm:text-xs font-display font-bold tracking-[0.14em] text-cut-warm-beige whitespace-nowrap">
          ✦ NEW · CAMP CAESAR
        </span>
      ) : collapsed ? (
        <>
          <span className="text-[9px] font-display font-bold tracking-wider text-cut-bronze">✦ NEW</span>
          <span className="text-xs font-display font-bold tracking-[0.12em] text-cut-warm-beige truncate">
            CAMP CAESAR
          </span>
        </>
      ) : (
        <>
          <span className="text-[9px] font-display font-bold tracking-wider text-cut-bronze">✦ NEW</span>
          <span className="text-xs font-display font-bold tracking-wide text-cut-ivory truncate">
            Camp Caesar
          </span>
          <span className="text-[10px] text-cut-bronze font-semibold whitespace-nowrap">
            50% First Visit →
          </span>
        </>
      )}
    </motion.button>
  );
}
