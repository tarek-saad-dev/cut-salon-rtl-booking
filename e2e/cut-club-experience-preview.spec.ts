import { test, expect, type Page } from "@playwright/test";

const viewports = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

async function navTo(page: Page, area: "wallet" | "rewards" | "memberships" | "challenges" | "referrals") {
  const button = area === "wallet" ? "المحفظة" :
    area === "rewards" ? "المكافآت" :
    area === "memberships" ? "العضويات" :
    area === "challenges" ? "التحديات" : "الإحالات";
  const selector = page.getByRole("navigation", { name: "تنقل الأقسام على الموبايل" });
  if (await selector.isVisible()) {
    await selector.getByRole("button", { name: button, exact: true }).click();
  } else {
    await page.getByRole("navigation", { name: "أقسام CUT CLUB" })
      .getByRole("button", { name: new RegExp("^" + button) }).click();
  }
}

for (const size of viewports) {
  test("CUT CLUB internal UX at " + size.width + "x" + size.height, async ({ page }) => {
    await page.setViewportSize(size);
    const privateRequests: string[] = [];
    // Never touch real member or financial endpoints during this preview.
    page.on("request", request => {
      const u = request.url();
      if (u.includes("/api/public/client/") || u.includes("/api/client/update") ||
          u.includes("/api/client/lookup") || u.includes("/api/cut-club/")) {
        privateRequests.push(u);
      }
    });
    await page.goto("/dev/cut-club-preview", { waitUntil: "domcontentloaded" });
    const root = page.getByTestId("club-experience-preview");
    await expect(root).toBeVisible();
    await expect(root.getByText("DEMO / بيانات افتراضية")).toBeVisible();
    await expect(root.getByRole("heading", { name: "كل زيارة ليها حكاية" })).toBeVisible();

    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(noOverflow).toBeLessThanOrEqual(2);

    await navTo(page, "wallet");
    await expect(root.getByRole("heading", { name: "محفظتك، بوضوح" })).toBeVisible();
    await navTo(page, "rewards");
    await expect(root.getByRole("heading", { name: "مكافآت على مقاس زيارتك" })).toBeVisible();
    await root.getByRole("button", { name: /تفاصيل التجربة/ }).first().click();
    await expect(root.getByRole("button", { name: /الاستبدال غير متاح/ })).toBeDisabled();

    await navTo(page, "memberships");
    await expect(root.getByRole("heading", { name: "العضوية بداية علاقة" })).toBeVisible();
    await expect(root.getByRole("heading", { name: "طلاب المدارس والجامعات" })).toBeVisible();
    await expect(root.getByRole("heading", { name: "الأطباء والعاملون بالصحة" })).toBeVisible();

    await navTo(page, "challenges");
    await expect(root.getByRole("heading", { name: "رحلتك تستمر" })).toBeVisible();
    await navTo(page, "referrals");
    await expect(root.getByRole("heading", { name: "CUT أحلى مع أصحابك" })).toBeVisible();
    await expect(root.getByRole("button", { name: /المشاركة الفعلية غير مفعّلة/ })).toBeDisabled();

    await root.getByLabel("اختر حالة العميل التجريبية").selectOption("new");
    await navTo(page, "wallet");
    await expect(root.getByText("مفيش قسائم في الحساب التجريبي ده")).toBeVisible();
    await expect.poll(() => privateRequests).toEqual([]);

    // Keep trace/screenshot as reproducible UX evidence, no customer data.
    await page.screenshot({ path: "test-results/club-preview-" + size.width + ".png", fullPage: false });
  });
}
