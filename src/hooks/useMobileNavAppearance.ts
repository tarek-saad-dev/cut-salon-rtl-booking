"use client";

import { useEffect, useState } from "react";

const MOBILE_NAV_HEIGHT_PX = 52;

/** Tracks scroll + hero overlay for GlobalMobileNav styling. */
export function useMobileNavAppearance() {
  const [scrolled, setScrolled] = useState(false);
  const [hasHeroOverlay, setHasHeroOverlay] = useState(false);

  useEffect(() => {
    const readHero = () => {
      setHasHeroOverlay(Boolean(document.querySelector("[data-mobile-nav-overlay]")));
    };

    const onScroll = () => {
      setScrolled(window.scrollY > 28);
    };

    readHero();
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", readHero);

    const observer = new MutationObserver(readHero);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", readHero);
      observer.disconnect();
    };
  }, []);

  const overlayTransparent = hasHeroOverlay && !scrolled;

  return {
    scrolled,
    hasHeroOverlay,
    overlayTransparent,
    navHeightPx: MOBILE_NAV_HEIGHT_PX,
  };
}

export { MOBILE_NAV_HEIGHT_PX };
