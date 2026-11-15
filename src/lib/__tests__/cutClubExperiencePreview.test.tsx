import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import CutClubExperiencePreview from "@/components/club/experience/CutClubExperiencePreview";
import { canRenderCutClubPreview } from "@/lib/club/experience/previewGate";
import {
  CLUB_NAVIGATION, DEMO_MEMBERS, MEMBERSHIP_PROGRAMS,
  DEMO_REWARDS, CLUB_GROWTH_MODULES,
} from "@/lib/club/experience/previewModel";

describe("CUT CLUB 2.0 synthetic experience rehearsal", () => {
  it("can only run in explicit development, never production or default-off", () => {
    expect(canRenderCutClubPreview({ NODE_ENV: "production", CUT_CLUB_PREVIEW_ENABLED: "true" })).toBe(false);
    expect(canRenderCutClubPreview({ NODE_ENV: "development" })).toBe(false);
    expect(canRenderCutClubPreview({ NODE_ENV: "test", CUT_CLUB_PREVIEW_ENABLED: "true" })).toBe(false);
    expect(canRenderCutClubPreview({ NODE_ENV: "development", CUT_CLUB_PREVIEW_ENABLED: "true" })).toBe(true);
  });

  it("defines all required product areas and expandable membership segments", () => {
    expect(CLUB_NAVIGATION.map(item => item.id)).toEqual([
      "home", "wallet", "rewards", "memberships", "challenges", "referrals", "profile",
    ]);
    expect(MEMBERSHIP_PROGRAMS.map(item => item.id)).toEqual([
      "standard", "education", "medical", "corporate",
    ]);
    expect(CLUB_GROWTH_MODULES.some(item => item.id === "experiences")).toBe(true);
    expect(DEMO_REWARDS.some(item => item.icon === "box")).toBe(true);
    expect(DEMO_MEMBERS.new.coins).toBe(0);
    expect(DEMO_MEMBERS.new.vouchers).toEqual([]);
    expect(DEMO_MEMBERS.vip.coins).toBeGreaterThan(DEMO_MEMBERS.regular.coins);
  });

  it("switches between screens and synthetic personas without sending financial requests", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      render(<CutClubExperiencePreview />);
      const root = screen.getByTestId("club-experience-preview");
      expect(within(root).getByText("كل زيارة ليها حكاية")).toBeTruthy();
      expect(within(root).getByText("DEMO / بيانات افتراضية")).toBeTruthy();
      expect(within(root).getAllByText(/1250|١٬٢٥٠|١٢٥٠/).length).toBeGreaterThan(0);

      fireEvent.change(within(root).getByLabelText("اختر حالة العميل التجريبية"), { target: { value: "new" } });
      expect(within(root).getAllByText("عميل جديد · تجربة").length).toBeGreaterThan(0);
      expect(within(root).getByText("مفيش حجز تجريبي")).toBeTruthy();

      const walletButtons = within(root).getAllByRole("button", { name: /المحفظة|محفظتي/ });
      fireEvent.click(walletButtons[0]);
      expect(within(root).getByText("محفظتك، بوضوح")).toBeTruthy();
      expect(within(root).getByText(/مفيش قسائم في الحساب التجريبي/)).toBeTruthy();

      fireEvent.click(within(root).getAllByRole("button", { name: /المكافآت/ })[0]);
      expect(within(root).getByText("مكافآت على مقاس زيارتك")).toBeTruthy();
      expect(within(root).getAllByRole("button", { name: /تفاصيل التجربة/ }).length).toBe(DEMO_REWARDS.length);
      fireEvent.click(within(root).getAllByRole("button", { name: /تفاصيل التجربة/ })[0]);
      expect(within(root).getByRole("button", { name: /الاستبدال غير متاح/ })).toHaveProperty("disabled", true);

      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("shows no executable payment/OTP or account mutation controls", () => {
    render(<CutClubExperiencePreview />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("form")).toBeNull();
    expect(screen.getAllByRole("link", { name: /احجز زيارتك|احجز زيارة/ }).some(link => link.getAttribute("href") === "/book")).toBe(true);
    const disabled = screen.getAllByRole("button").filter(b => (b as HTMLButtonElement).disabled);
    expect(disabled.length).toBeGreaterThanOrEqual(0); // no active financial action exists
  });
});
