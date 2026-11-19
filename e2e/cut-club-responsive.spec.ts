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
  expect(delta).toBeLessThanOrEqual(2);
}
for (const v of viewports) {
  test("CUT CLUB OTP login " + v.width + "x" + v.height, async ({ page }) => {
    await page.setViewportSize(v);
    await page.goto("/club", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /مكافآتك/ })).toBeVisible();
    await expect(page.getByLabel("رقم الموبايل")).toBeVisible();
    await expect(page.getByRole("button", { name: "استمرار عبر واتساب" })).toBeVisible();
    await expect(page.locator("#cut-club-content")).toHaveCount(0);
    await expect(page.locator('[data-global-mobile-nav]')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await noOverflow(page);
  });
}
test("OTP UI permits six-digit paste, signup purpose and number editing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/club/auth/start", async route => {
    const body = route.request().postDataJSON();
    expect(body.phone).toBe("01557994946");
    expect(body.purpose).toBe("CUT_CLUB_SIGNUP");
    await route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ ok: true, resendAfterSec: 60 }) });
  });
  await page.goto("/club");
  await page.getByRole("button", { name: "حساب جديد" }).click();
  await page.getByLabel("رقم الموبايل").fill("01557994946");
  await page.getByRole("button", { name: "استمرار عبر واتساب" }).click();
  const input = page.getByLabel("كود التحقق المكوّن من 6 أرقام");
  await expect(input).toBeAttached();
  await input.fill("123456");
  await expect(input).toHaveValue("123456");
  await expect(page.getByRole("button", { name: "تأكيد ودخول" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "إرسال كود جديد" })).toBeDisabled();
  await page.getByRole("button", { name: /تعديل رقم الموبايل/ }).click();
  await expect(page.getByLabel("رقم الموبايل")).toHaveValue("01557994946");
  await noOverflow(page);
});
test("untrusted clientId and old bookmark never expose a wallet", async ({ page }) => {
  await page.goto("/club?clientId=12345&phone=01000000000", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("رقم الموبايل")).toBeVisible();
  expect(await page.content()).not.toContain("CUT-12345");
  await page.goto("/client/loyalty?clientId=123456", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/cut-club$/);
  await expect(page.getByLabel("رقم الموبايل")).toBeVisible();
});
test("private club deep links require login and noindex", async ({ page }) => {
  for (const area of ["wallet", "rewards", "memberships", "challenges", "referrals", "profile"]) {
    await page.goto("/club/" + area, { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("رقم الموبايل")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
  await page.goto("/club/invalid-area");
  await expect(page.getByText(/404|not found/i)).toBeVisible();
});
