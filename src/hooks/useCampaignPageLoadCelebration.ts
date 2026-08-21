"use client";

import { useEffect, useState } from "react";
import { playCampaignCelebrationSound } from "@/lib/campaignCelebrationSound";

export type CelebrationVariant = "particles" | "sweep" | "fragments";

export type IntroPhase = 0 | 1 | 2 | "done";

const VARIANTS: CelebrationVariant[] = ["particles", "sweep", "fragments"];

const INTRO_LINES = [
  "✦ A NEW CUT HAS ARRIVED",
  "CAMP CAESAR · NOW OPEN",
  "50% OFF YOUR FIRST VISIT · DISCOVER →",
] as const;

export { INTRO_LINES };

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/**
 * Runs on every full page load / refresh (root layout mount).
 * Safe under React Strict Mode — no sticky ref that blocks the second effect pass.
 */
export function useCampaignPageLoadCelebration() {
  const [loadKey] = useState(
    () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const [active, setActive] = useState(false);
  const [variant, setVariant] = useState<CelebrationVariant>("particles");
  const [introPhase, setIntroPhase] = useState<IntroPhase>("done");
  const [loadCelebrationComplete, setLoadCelebrationComplete] = useState(false);

  const introActive = introPhase !== "done";

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const schedule = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };

    if (prefersReducedMotion()) {
      schedule(() => {
        if (!cancelled) setLoadCelebrationComplete(true);
      }, 0);
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    const picked = VARIANTS[Math.floor(Math.random() * VARIANTS.length)]!;
    setVariant(picked);
    setActive(false);
    setIntroPhase("done");
    setLoadCelebrationComplete(false);

    const startDelay = 200 + Math.random() * 200;

    schedule(() => {
      if (cancelled) return;
      setActive(true);
      setIntroPhase(0);
      playCampaignCelebrationSound();

      schedule(() => {
        if (!cancelled) setIntroPhase(1);
      }, 480);

      schedule(() => {
        if (!cancelled) setIntroPhase(2);
      }, 960);

      schedule(() => {
        if (cancelled) return;
        setActive(false);
        setIntroPhase("done");
        setLoadCelebrationComplete(true);
      }, 2200);
    }, startDelay);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [loadKey]);

  return {
    active,
    variant,
    introPhase,
    introActive,
    loadCelebrationComplete,
    loadKey,
  };
}
