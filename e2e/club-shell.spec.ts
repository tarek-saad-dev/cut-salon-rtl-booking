import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

async function noHorizontalOverflow(page: Page) {
  const amount = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(amount, "private Club restricted shell should fit the viewport").toBeLessThanOrEqual(2);
}

for (const viewport of viewports) {
  test("restricted /club " + viewport.width + "x" + viewport.height, async ({ page, request }, info) => {
    await page.setViewportSize(viewport);
    const sensitiveRequests: string[] = [];
    page.on("request", outgoing => {
      if (/\/api\/(public\/client|club\/|pos\/)/.test(outgoing.url())) {
        sensitiveRequests.push(outgoing.url());
      }
    });

    // A user-editable old identifier must never turn into verified identity.
    await page.addInitScript(() => {
      localStorage.setItem("cut_client", JSON.stringify({ clientId: 987654 }));
    });

    await page.goto("/club?clientId=123456", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "مساحة الأعضاء غير متاحة حاليًا" })).toBeVisible();
    await expect(page.locator('header.cut-nav-glass')).toHaveCount(0);
    await expect(page.locator('[data-global-mobile-nav]')).toHaveCount(0);
    await expect(page.locator('nav[aria-label="CUT CLUB"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /Book/ })).toHaveAttribute("href", "/book");
    for (const label of ["Explore", "Wallet", "Me"]) {
      await expect(page.getByRole("button", { name: label })).toBeDisabled();
    }
    await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
    expect(sensitiveRequests).toEqual([]);
    await noHorizontalOverflow(page);

    if (viewport.width < 768) {
      const navBox = await page.locator('nav[aria-label="CUT CLUB"]').boundingBox();
      expect(navBox).not.toBeNull();
      if (navBox) expect(navBox.y + navBox.height).toBeLessThanOrEqual(viewport.height + 2);
    }

    const response = await request.get("/club?clientId=123456");
    expect(response.ok()).toBe(true);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
    expect(response.headers()["cache-control"]).toContain("no-store");

    await info.attach("club-" + viewport.width + ".png", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
}

test("private club is excluded from public sitemap", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const text = await response.text();
  expect(text).not.toMatch(/<loc>[^<]*\/club(?:\/|<)/);
});
