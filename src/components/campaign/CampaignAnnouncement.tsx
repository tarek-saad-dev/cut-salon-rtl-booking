"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CampaignConfig } from "@/config/campaigns";
import { CAMPAIGN_ANNOUNCEMENT_BAR_HEIGHT_PX } from "@/config/campaigns";
import { trackCampaignEvent } from "@/lib/campaignAnalytics";
import {
  INTRO_LINES,
  type IntroPhase,
} from "@/hooks/useCampaignPageLoadCelebration";

interface CampaignAnnouncementProps {
  config: CampaignConfig;
  onDiscover: () => void;
  introPhase?: IntroPhase;
  introActive?: boolean;
}

export default function CampaignAnnouncement({
  config,
  onDiscover,
  introPhase = "done",
  introActive = false,
}: CampaignAnnouncementProps) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--cut-campaign-bar-height",
      `${CAMPAIGN_ANNOUNCEMENT_BAR_HEIGHT_PX}px`,
    );
    return () => {
      document.documentElement.style.setProperty("--cut-campaign-bar-height", "0px");
    };
  }, []);

  useEffect(() => {
    if (introActive) return;
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % 2);
    }, 5000);
    return () => window.clearInterval(id);
  }, [introActive]);

  const handleDiscover = () => {
    if (introActive) return;
    trackCampaignEvent("camp_caesar_explore_click", { source: "announcement_bar" });
    onDiscover();
  };

  const introLine = introPhase !== "done" ? INTRO_LINES[introPhase] : null;
  const showDiscoverHint = !introActive;

  return (
    <button
      type="button"
      onClick={handleDiscover}
      disabled={introActive}
      className={`fixed top-0 inset-x-0 z-[60] h-7 flex items-center justify-center gap-3 px-3
        bg-cut-wine-black/95 border-b border-cut-bronze/20 backdrop-blur-sm
        text-[10px] sm:text-[11px] tracking-wide text-cut-ivory/85
        ${introActive ? "campaign-announcement--intro relative cursor-default" : "cursor-pointer hover:bg-cut-wine-black"}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cut-bronze/60`}
      dir="ltr"
      aria-label="Camp Caesar grand opening — tap to discover"
      aria-disabled={introActive || undefined}
    >
      <div className="relative flex-1 min-w-0 h-full flex items-center justify-center overflow-hidden pointer-events-none">
        <AnimatePresence mode="wait">
          {introLine ? (
            <motion.p
              key={`intro-${introPhase}`}
              initial={{ opacity: 0, y: 5, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(1px)" }}
              transition={{ duration: 0.42, ease: "easeOut" }}
              className="truncate text-center font-display font-semibold tracking-[0.1em] sm:tracking-[0.12em] text-cut-warm-beige/95"
            >
              {introLine}
            </motion.p>
          ) : (
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
          )}
        </AnimatePresence>
      </div>
      {showDiscoverHint ? (
        <span className="flex-shrink-0 text-cut-bronze font-semibold whitespace-nowrap pointer-events-none">
          Discover →
        </span>
      ) : null}
    </button>
  );
}
