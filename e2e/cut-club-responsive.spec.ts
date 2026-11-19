import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

async function noOverflow(page: Page) {
  const delta = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(delta, "CUT CLUB must fit the viewport without horizontal scroll").toBeLessThanOrEqual(2);
}

for (const viewport of viewports) {
  test("wallet-first CUT CLUB at " + viewport.width + "x" + viewport.height, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/cut-club", { waitUntil: "domcontentloaded" });
    const main = page.locator("#cut-club-content");
    await expect(main.locator("h1")).toHaveCount(1);
    await expect(main.locator("h1")).toContainText("محفظتك");
    await expect(page.getByTestId("cut-club-experience")).toBeVisible();
    await expect(main.getByText("سجل حركة النقاط")).toBeVisible();
    await expect(main.getByText("قسائمي ومكافآتي")).toBeVisible();
    await expect(main.locator("input")).toHaveCount(0);
    await expect(page.locator('[data-global-mobile-nav]')).toHaveCount(0);
    await noOverflow(page);

    const useMobile = viewport.width < 768;
    const nav = page.getByRole("navigation", { name: useMobile ? "CUT CLUB الموبايل" : "أقسام CUT CLUB" });
    await expect(nav).toBeVisible();
    const otherNav = page.getByRole("navigation", { name: useMobile ? "أقسام CUT CLUB" : "CUT CLUB الموبايل" });
    await expect(otherNav).toBeHidden();

    await nav.getByRole("button", { name: "المكافآت" }).click();
    await expect(main.locator("h1")).toContainText("المكافآت");
    await nav.getByRole("button", { name: useMobile ? "محفظتي" : "محفظتي" }).click();
    await expect(main.locator("h1")).toContainText("محفظتك");
    if (useMobile) {
      await nav.getByRole("button", { name: "حسابي" }).click();
      await expect(main.locator("h1")).toContainText("مساحتك");
      await nav.getByRole("button", { name: "محفظتي" }).click();
    } else {
      await nav.getByRole("button", { name: "العضويات" }).click();
      await expect(main.getByText("المدارس والجامعات")).toBeVisible();
      await nav.getByRole("button", { name: "الإحالات" }).click();
      await expect(main.locator("h1")).toContainText("شارك تجربة CUT");
    }
    await noOverflow(page);
  });
}

test("private /club does not expose a wallet for phone or clientId query", async ({ page }) => {
  await page.goto("/club?clientId=12345&phone=01000000000", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#cut-club-content h1")).toContainText("محفظتك");
  await expect(page.getByText("البيانات الخاصة لا تظهر للزائر")).toBeVisible();
  await expect(page.getByText("سجل حركة النقاط")).toBeVisible();
  await expect(page.locator("main input")).toHaveCount(0);
  const html = await page.content();
  expect(html).not.toContain("CUT-12345");
  expect(html).not.toContain("DEMO");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("legacy /client/loyalty bookmark safely enters the new wallet interface", async ({ page }) => {
  await page.goto("/client/loyalty?clientId=123456", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/cut-club$/);
  await expect(page.locator("#cut-club-content h1")).toContainText("محفظتك");
});

test("all member deep links are private, navigable and reloadable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/club/wallet", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#cut-club-content h1")).toContainText("محفظتك");
  const nav = page.getByRole("navigation", { name: "أقسام CUT CLUB" });
  await nav.getByRole("button", { name: "المكافآت" }).click();
  await expect(page).toHaveURL(/\/club\/rewards$/);
  await expect(page.locator("#cut-club-content h1")).toContainText("المكافآت");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#cut-club-content h1")).toContainText("المكافآت");
  await nav.getByRole("button", { name: "الرئيسية" }).click();
  await expect(page).toHaveURL(/\/club\/home$/);
  await expect(page.locator("#cut-club-content h1")).toContainText("كل زيارة");
  await page.goto("/club/invalid-area");
  await expect(page.getByText(/404|not found/i)).toBeVisible();
});
