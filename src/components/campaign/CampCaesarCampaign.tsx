"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { getActiveCampaign } from "@/config/campaigns";
import { markCampaignDismissed } from "@/lib/campaignStorage";
import { trackCampaignEvent } from "@/lib/campaignAnalytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCampaignPageLoadCelebration } from "@/hooks/useCampaignPageLoadCelebration";
import CampaignAnnouncement from "./CampaignAnnouncement";
import CampCaesarOpeningSheet from "./CampCaesarOpeningSheet";
import CampCaesarExperience from "./CampCaesarExperience";
import CampaignFloatingPill from "./CampaignFloatingPill";
import CampaignPageLoadCelebration from "./CampaignPageLoadCelebration";

const HISTORY_EXPERIENCE = "cut-camp-caesar-experience";
const HISTORY_OPENING = "cut-camp-caesar-opening";

import { dispatchCampCaesarBook } from "@/lib/campaignEvents";

export default function CampCaesarCampaign() {
  const config = getActiveCampaign();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const isBookRoute = pathname?.startsWith("/book") ?? false;
  const {
    active: celebrationActive,
    variant,
    introPhase,
    introActive,
    loadKey,
  } = useCampaignPageLoadCelebration();

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

  // Opening sheet is manual-only (announcement bar / floating pill) — no auto popup on page load
  useEffect(() => {
    if (!config || autoShowAttempted.current) return;
    autoShowAttempted.current = true;
    setShowPill(true);
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

  const openCampBooking = useCallback(
    (source: string) => {
      if (!config) return;
      trackCampaignEvent("camp_caesar_booking_click", { source });
      markCampaignDismissed(config.campaignId);
      setExperienceOpen(false);
      setOpeningOpen(false);
      setShowPill(false);
      // Clear campaign history markers without history.back() racing router.push
      if (
        typeof window !== "undefined" &&
        (window.history.state?.[HISTORY_OPENING] || window.history.state?.[HISTORY_EXPERIENCE])
      ) {
        window.history.replaceState({}, "");
      }

      const targetHref = `/book?mode=nearest&branch=${encodeURIComponent(config.branchCode)}`;

      if (typeof window !== "undefined" && window.location.pathname.startsWith("/book")) {
        dispatchCampCaesarBook(config.branchCode);
        const current = `${window.location.pathname}${window.location.search}`;
        if (current !== targetHref) {
          router.replace(targetHref);
        } else {
          router.refresh();
        }
        return;
      }

      router.push(targetHref);
    },
    [config, router],
  );

  const handleBookCampCaesar = useCallback(() => {
    openCampBooking("experience");
  }, [openCampBooking]);

  const handleOpeningBook = useCallback(() => {
    openCampBooking("opening_sheet");
  }, [openCampBooking]);

  const handleCampaignDiscover = useCallback(
    (source: string) => {
      manualOpenRef.current = true;
      if (isBookRoute) {
        openCampBooking(`${source}_on_book`);
        return;
      }
      openExperience(source);
    },
    [isBookRoute, openCampBooking, openExperience],
  );

  const handleManualOpen = useCallback(() => {
    handleCampaignDiscover("floating_pill");
  }, [handleCampaignDiscover]);

  if (!config) return null;

  return (
    <>
      <CampaignPageLoadCelebration
        key={loadKey}
        active={celebrationActive}
        variant={variant}
        loadKey={loadKey}
      />

      <CampaignAnnouncement
        config={config}
        onDiscover={() => handleCampaignDiscover("announcement_bar")}
        introPhase={introPhase}
        introActive={introActive}
      />

      <AnimatePresence>
        {openingOpen && (
          <CampCaesarOpeningSheet
            key="opening"
            config={config}
            open={openingOpen}
            isMobile={isMobile}
            onExplore={() => openExperience("opening_sheet")}
            onBook={handleOpeningBook}
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
        visible={(showPill || isBookRoute) && !openingOpen && !experienceOpen}
        introActive={introActive}
        onOpen={handleManualOpen}
      />
    </>
  );
}
