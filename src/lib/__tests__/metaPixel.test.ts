import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { META_PIXEL_ID } from "@/config/metaPixel";
import { META_PIXEL_SCRIPT_SRC, loadMetaPixel, trackMetaEvent } from "../metaPixel";

function resetPixel() {
  delete window.fbq;
  delete window._fbq;
  delete window.__cutMetaPixelInitialized;
  document.querySelectorAll(`script[src="${META_PIXEL_SCRIPT_SRC}"]`).forEach((s) => s.remove());
}

describe("metaPixel", () => {
  beforeEach(resetPixel);
  afterEach(resetPixel);

  it("installs the fbq stub, injects fbevents.js once and inits the pixel once", () => {
    loadMetaPixel();
    loadMetaPixel();

    expect(document.querySelectorAll(`script[src="${META_PIXEL_SCRIPT_SRC}"]`)).toHaveLength(1);
    expect(window.fbq?.version).toBe("2.0");
    const inits = window.fbq!.queue.filter(([command]) => command === "init");
    expect(inits).toEqual([["init", META_PIXEL_ID]]);
  });

  it("queues a PageView on every call", () => {
    loadMetaPixel();
    trackMetaEvent("PageView");
    loadMetaPixel();
    trackMetaEvent("PageView");

    expect(window.fbq!.queue.filter(([, event]) => event === "PageView")).toEqual([
      ["track", "PageView"],
      ["track", "PageView"],
    ]);
  });

  it("passes event parameters through", () => {
    loadMetaPixel();
    trackMetaEvent("InitiateCheckout", { value: 333, currency: "EGP" });
    expect(window.fbq!.queue.at(-1)).toEqual(["track", "InitiateCheckout", { value: 333, currency: "EGP" }]);
  });

  it("does nothing when the pixel hasn't been loaded", () => {
    expect(() => trackMetaEvent("PageView")).not.toThrow();
    expect(window.fbq).toBeUndefined();
  });
});
