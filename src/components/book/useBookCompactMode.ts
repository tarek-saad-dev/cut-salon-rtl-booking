"use client";

import { useEffect } from "react";

const COMPACT_CLASS = "book-compact-mode";

/** Hide promo bar and reserve zero campaign offset while in mobile booking flow. */
export function useBookCompactMode(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const root = document.documentElement;
    const prevHeight = root.style.getPropertyValue("--cut-campaign-bar-height");
    root.classList.add(COMPACT_CLASS);
    root.style.setProperty("--cut-campaign-bar-height", "0px");

    return () => {
      root.classList.remove(COMPACT_CLASS);
      if (prevHeight) {
        root.style.setProperty("--cut-campaign-bar-height", prevHeight);
      } else {
        root.style.removeProperty("--cut-campaign-bar-height");
      }
    };
  }, [active]);
}
