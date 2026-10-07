import { META_PIXEL_ID } from "@/config/metaPixel";

export const META_PIXEL_SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";

type FbqArgs = [command: string, ...args: unknown[]];

export type Fbq = ((...args: FbqArgs) => void) & {
  callMethod?: (...args: FbqArgs) => void;
  queue: FbqArgs[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
    __cutMetaPixelInitialized?: boolean;
  }
}

/** Same bootstrap as Meta's official snippet: a queueing stub plus the async fbevents.js loader. */
function installFbq(win: Window, doc: Document): Fbq {
  if (win.fbq) return win.fbq;
  const fbq = function (...args: FbqArgs) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  if (!win._fbq) win._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  win.fbq = fbq;

  const script = doc.createElement("script");
  script.async = true;
  script.src = META_PIXEL_SCRIPT_SRC;
  const first = doc.getElementsByTagName("script")[0];
  if (first?.parentNode) first.parentNode.insertBefore(script, first);
  else doc.head.appendChild(script);
  return fbq;
}

/** Loads the pixel and runs `init` once per page session. No-op on the server. */
export function loadMetaPixel(): void {
  if (typeof window === "undefined") return;
  const fbq = installFbq(window, document);
  if (window.__cutMetaPixelInitialized) return;
  fbq("init", META_PIXEL_ID);
  window.__cutMetaPixelInitialized = true;
}

export function trackMetaEvent(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  if (params) window.fbq("track", event, params);
  else window.fbq("track", event);
}
