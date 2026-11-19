import { expect, test, type Page } from "@playwright/test";

const sizes = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1279, height: 800 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, "CUT CLUB landing should not overflow horizontally").toBeLessThanOrEqual(2);
}

function hasIntersection(a: {x:number;y:number;width:number;height:number}, b: {x:number;y:number;width:number;height:number}) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
}

for (const viewport of sizes) {
  test("CUT CLUB at " + viewport.width + "x" + viewport.height, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/cut-club", { waitUntil: "domcontentloaded" });
    const main = page.locator("main");
    await expect(main.locator("h1")).toHaveCount(1);
    await expect(main.locator('a[href="/book"]').first()).toBeVisible();
    await expect(main.locator('a[href="/prices"]').first()).toBeVisible();
    await expect(main.locator('form')).toHaveCount(0);
    await assertNoHorizontalOverflow(page);

    if (viewport.width < 1280) {
      const trigger = page.locator(
        '[data-global-mobile-nav] button[aria-controls="global-mobile-navigation"]'
      );
      await expect(trigger).toBeVisible();
      await trigger.click();
      const dialog = page.locator("#global-mobile-navigation");
      await expect(dialog).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");

      const clubLink = dialog.locator('a[href="/cut-club"]');
      await clubLink.scrollIntoViewIfNeeded();
      await expect(clubLink).toBeInViewport();

      // Critically verify the LAST account item is scrollable into view in a
      // short menu, not clipped by the bottom-sheet overflow boundary.
      const lastAccountLink = dialog.locator('a[href="/client"]');
      await lastAccountLink.scrollIntoViewIfNeeded();
      await expect(lastAccountLink).toBeInViewport();

      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toHaveAttribute("aria-expanded", "false");

      // Switching languages must preserve the mobile public Club entry.
      const english = page.locator('[data-global-mobile-nav] button', { hasText: /^EN$/ });
      await english.click();
      await trigger.click();
      await expect(dialog.getByRole("link", { name: "About CUT CLUB" })).toBeVisible();
      await page.keyboard.press("Escape");
    } else {
      const header = page.locator("header.cut-nav-glass");
      await expect(header).toBeVisible();
      const links = header.locator('nav[aria-label] a[role="menuitem"]');
      await expect(links).toHaveCount(8);

      // Check BOTH language widths at the exact first desktop breakpoint,
      // including overlap with account/booking actions and the brand logo.
      for (const language of ["ar", "en"] as const) {
        if (language === "en") {
          await header.locator('button[aria-label="Switch to English"]').click();
          await expect(header.getByRole("menuitem", { name: "About CUT CLUB" })).toBeVisible();
        }
        const actions = header.locator(
          language === "ar"
            ? 'div[aria-label="إجراءات الحساب والحجز"]'
            : 'div[aria-label="Booking and account actions"]'
        );
        await expect(actions).toBeVisible();
        const actionBox = await actions.boundingBox();
        const logoBox = await header.locator('a[href="/"]').first().boundingBox();
        expect(actionBox).not.toBeNull();
        expect(logoBox).not.toBeNull();
        for (const link of await links.all()) {
          await expect(link).toBeInViewport();
          const linkBox = await link.boundingBox();
          expect(linkBox).not.toBeNull();
          if (linkBox && actionBox && logoBox) {
            expect(hasIntersection(linkBox, actionBox), language + " links must not overlap actions").toBe(false);
            expect(hasIntersection(linkBox, logoBox), language + " links must not overlap logo").toBe(false);
          }
        }
      }
    }
    await assertNoHorizontalOverflow(page);
  });
}
