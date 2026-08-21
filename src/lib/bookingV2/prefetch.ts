"use client";

import { prefetchBootstrap } from "./api";

let idleScheduled = false;
let viewportObserver: IntersectionObserver | null = null;
const boundElements = new WeakSet<Element>();

function runPrefetch(): void {
  void prefetchBootstrap().catch(() => {
    // Prefetch is best-effort; never surface as unhandledRejection.
  });
}

/**
 * Prefetch bootstrap as early as possible:
 * - requestIdleCallback / timeout
 * - Book Now viewport intersection
 * - hover / focus / touch on Book Now controls
 */
export function scheduleBootstrapPrefetch(): void {
  if (typeof window === "undefined") return;
  if (idleScheduled) return;
  idleScheduled = true;

  const ric = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }
  ).requestIdleCallback;

  if (typeof ric === "function") {
    ric(() => runPrefetch(), { timeout: 2500 });
  } else {
    window.setTimeout(runPrefetch, 1200);
  }
}

export function bindBookNowPrefetch(el: Element | null): void {
  if (!el || typeof window === "undefined") return;
  if (boundElements.has(el)) return;
  boundElements.add(el);

  const onIntent = () => runPrefetch();
  el.addEventListener("pointerenter", onIntent, { passive: true });
  el.addEventListener("focus", onIntent, { passive: true, capture: true });
  el.addEventListener("touchstart", onIntent, { passive: true });

  if (!viewportObserver) {
    viewportObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            runPrefetch();
          }
        }
      },
      { rootMargin: "120px", threshold: 0.05 },
    );
  }
  viewportObserver.observe(el);
}

/** React helper: attach prefetch intent handlers to a Book Now control. */
export function bookNowPrefetchProps() {
  return {
    onMouseEnter: runPrefetch,
    onFocus: runPrefetch,
    onTouchStart: runPrefetch,
  } as const;
}

export function installGlobalBookingPrefetch(): () => void {
  if (typeof window === "undefined") return () => {};
  scheduleBootstrapPrefetch();

  // Warm the /book route bundle (Next client navigation).
  try {
    const w = window as Window & {
      next?: { router?: { prefetch?: (href: string) => void } };
    };
    // Soft hint: prefetch link tag if present
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = "/book";
    link.as = "document";
    if (![...document.querySelectorAll('link[rel="prefetch"]')].some((l) => (l as HTMLLinkElement).href.endsWith("/book"))) {
      document.head.appendChild(link);
    }
    void w;
  } catch {
    /* ignore */
  }

  const scan = () => {
    const nodes = document.querySelectorAll(
      '[data-booking-prefetch="true"], [data-book-now="true"], a[href="/book"], a[href^="/book?"], button[aria-label="احجز الآن"]',
    );
    nodes.forEach((node) => bindBookNowPrefetch(node));
  };

  scan();
  const mo = new MutationObserver(() => scan());
  mo.observe(document.documentElement, { childList: true, subtree: true });

  return () => {
    mo.disconnect();
    viewportObserver?.disconnect();
    viewportObserver = null;
  };
}
