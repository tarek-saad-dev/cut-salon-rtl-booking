"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { getActiveCampaign } from "@/config/campaigns";
import {
  markCampaignDismissed,
  shouldAutoShowOpeningSheet,
} from "@/lib/campaignStorage";
import { trackCampaignEvent } from "@/lib/campaignAnalytics";
import { useIsMobile } from "@/hooks/use-mobile";
import CampaignAnnouncement from "./CampaignAnnouncement";
import CampCaesarOpeningSheet from "./CampCaesarOpeningSheet";
import CampCaesarExperience from "./CampCaesarExperience";
import CampaignFloatingPill from "./CampaignFloatingPill";

const HISTORY_EXPERIENCE = "cut-camp-caesar-experience";
const HISTORY_OPENING = "cut-camp-caesar-opening";

export default function CampCaesarCampaign() {
  const config = getActiveCampaign();
  const isMobile = useIsMobile();

  const [openingOpen, setOpeningOpen] = useState(false);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [showPill, setShowPill] = useState(false);
  const [blockingCount, setBlockingCount] = useState(0);

  const autoShowAttempted = useRef(false);
  const manualOpenRef = useRef(false);
  const blockingRef = useRef(false);

  const isBlocked = blockingCount > 0;
  blockingRef.current = isBlocked;

  // Listen for booking modal / other blocking overlays
  useEffect(() => {
    const handler = (e: Event) => {
      const { open } = (e as CustomEvent<{ open: boolean }>).detail ?? {};
      setBlockingCount((c) => (open ? c + 1 : Math.max(0, c - 1)));
    };
    window.addEventListener("cut:blocking-overlay", handler);
    return () => window.removeEventListener("cut:blocking-overlay", handler);
  }, []);

  // Auto-show opening sheet after delay
  useEffect(() => {
    if (!config || autoShowAttempted.current) return;
    if (!shouldAutoShowOpeningSheet(config)) {
      setShowPill(true);
      return;
    }

    autoShowAttempted.current = true;
    const [minMs, maxMs] = config.openingDelayMs;
    const delay = minMs + Math.random() * (maxMs - minMs);

    const timer = window.setTimeout(() => {
      if (manualOpenRef.current) return;
      if (blockingRef.current) {
        setShowPill(true);
        return;
      }
      setOpeningOpen(true);
      trackCampaignEvent("camp_caesar_campaign_view", { source: "auto_open" });
      window.history.pushState({ [HISTORY_OPENING]: true }, "");
    }, delay);

    return () => window.clearTimeout(timer);
  }, [config]);

  // Browser back closes campaign layers
  useEffect(() => {
    const onPopState = () => {
      if (experienceOpen) setExperienceOpen(false);
      else if (openingOpen) {
        setOpeningOpen(false);
        setShowPill(true);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [experienceOpen, openingOpen]);

  const dismissOpening = useCallback(() => {
    if (!config) return;
    markCampaignDismissed(config.campaignId);
    trackCampaignEvent("camp_caesar_campaign_dismiss");
    setOpeningOpen(false);
    setShowPill(true);
    if (window.history.state?.[HISTORY_OPENING]) {
      window.history.back();
    }
  }, [config]);

  const openExperience = useCallback(
    (source: string) => {
      manualOpenRef.current = true;
      setOpeningOpen(false);
      setExperienceOpen(true);
      trackCampaignEvent("camp_caesar_explore_click", { source });
      window.history.pushState({ [HISTORY_EXPERIENCE]: true }, "");
    },
    [],
  );

  const closeExperience = useCallback(() => {
    setExperienceOpen(false);
    setShowPill(true);
    if (window.history.state?.[HISTORY_EXPERIENCE]) {
      window.history.back();
    }
  }, []);

  const handleBookCampCaesar = useCallback(() => {
    if (!config) return;
    trackCampaignEvent("camp_caesar_booking_click");
    setExperienceOpen(false);
    setOpeningOpen(false);
    setShowPill(false);
    window.dispatchEvent(
      new CustomEvent("cut:book-branch", {
        detail: { branchCode: config.branchCode, mode: "nearest" as const },
      }),
    );
  }, [config]);

  const handleManualOpen = useCallback(() => {
    manualOpenRef.current = true;
    openExperience("floating_pill");
  }, [openExperience]);

  if (!config) return null;

  return (
    <>
      <CampaignAnnouncement config={config} onDiscover={() => openExperience("announcement_bar")} />

      <AnimatePresence>
        {openingOpen && (
          <CampCaesarOpeningSheet
            key="opening"
            config={config}
            open={openingOpen}
            isMobile={isMobile}
            onExplore={() => openExperience("opening_sheet")}
            onContinue={dismissOpening}
            onClose={dismissOpening}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {experienceOpen && (
          <CampCaesarExperience
            key="experience"
            config={config}
            open={experienceOpen}
            isMobile={isMobile}
            onClose={closeExperience}
            onBook={handleBookCampCaesar}
          />
        )}
      </AnimatePresence>

      <CampaignFloatingPill
        config={config}
        visible={showPill && !openingOpen && !experienceOpen}
        onOpen={handleManualOpen}
      />
    </>
  );
}
