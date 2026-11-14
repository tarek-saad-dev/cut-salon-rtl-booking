import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 360, height: 640 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];
const paths = ["/", "/prices"];

async function denyExternalBrowserNetwork(page: Page) {
  await page.route("**/*", async route => {
    const u = new URL(route.request().url());
    if (u.protocol === "data:" || u.protocol === "blob:" ||
        (u.hostname === "127.0.0.1" && u.port === "3105")) {
      await route.continue();
    } else {
      // No CUT Salon production API, booking, Google Fonts or other
      // third-party service may be contacted during this isolated smoke.
      await route.abort("blockedbyclient");
    }
  });
}

for (const viewport of viewports) {
  for (const path of paths) {
    test("isolated font fallback " + path + " at " + viewport.width, async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await denyExternalBrowserNetwork(page);
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("body")).toBeVisible();
      await expect(page).toHaveTitle(/CUT|Salon/i);
      await page.evaluate(() => document.fonts.ready);
      const widths = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
        bodyText: document.body.innerText.trim().length,
        fonts: document.fonts.status,
        uiFallback: getComputedStyle(document.documentElement).getPropertyValue("--font-alexandria"),
      }));
      expect(widths.scroll - widths.client, "no horizontal overflow").toBeLessThanOrEqual(3);
      expect(widths.bodyText, "page must not render blank").toBeGreaterThan(25);
      expect(widths.fonts).toBe("loaded");
      expect(widths.uiFallback).toContain("Alexandria");

      await info.attach(
        "isolated-" + path.replaceAll("/", "root") + "-" + viewport.width + ".png",
        { body: await page.screenshot({ fullPage: true }), contentType: "image/png" },
      );
    });
  }
}
