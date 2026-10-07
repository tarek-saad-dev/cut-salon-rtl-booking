"use client";

import { useEffect } from "react";
import { META_PIXEL_ID } from "@/config/metaPixel";
import { loadMetaPixel, trackMetaEvent } from "@/lib/metaPixel";

/** Loads the Meta Pixel and counts a PageView each time the hosting page mounts (including client-side navigation). */
export function MetaPixelPageView() {
  useEffect(() => {
    loadMetaPixel();
    trackMetaEvent("PageView");
  }, []);

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        alt=""
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
}
