"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CampaignConfig } from "@/config/campaigns";
import { trackCampaignEvent } from "@/lib/campaignAnalytics";

interface CampaignAnnouncementProps {
  config: CampaignConfig;
  onDiscover: () => void;
}

export default function CampaignAnnouncement({ config, onDiscover }: CampaignAnnouncementProps) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    document.documentElement.style.setProperty("--cut-campaign-bar-height", "28px");
    return () => {
      document.documentElement.style.setProperty("--cut-campaign-bar-height", "0px");
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % 2);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const handleDiscover = () => {
    trackCampaignEvent("camp_caesar_explore_click", { source: "announcement_bar" });
    onDiscover();
  };

  return (
    <div
      className="fixed top-0 inset-x-0 z-[60] h-7 flex items-center justify-center gap-3 px-3
        bg-cut-wine-black/95 border-b border-cut-bronze/20 backdrop-blur-sm
        text-[10px] sm:text-[11px] tracking-wide text-cut-ivory/85"
      dir="ltr"
      role="region"
      aria-label="Camp Caesar grand opening announcement"
    >
      <div className="relative flex-1 min-w-0 h-full flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={lineIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.45 }}
            className="truncate text-center font-display font-semibold tracking-[0.12em] text-cut-warm-beige/90"
          >
            {config.announcementLines[lineIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={handleDiscover}
        className="flex-shrink-0 text-cut-bronze hover:text-cut-warm-beige transition-colors font-semibold whitespace-nowrap"
      >
        Discover →
      </button>
    </div>
  );
}
