import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuthorizedClubOverview,
  MemberIdentityCard,
  MemberUpcomingVisit,
  MemberWalletOverview,
} from "./MemberOverview";
import {
  formatCoins,
  formatEGPCredit,
  validProgress,
  type MemberOverviewView,
} from "./memberViewModels";

const member: MemberOverviewView = {
  member: {
    displayName: "عميل تجريبي",
    cutId: "CUT-TEST-001",
    tierName: "Gold",
    coins: 125,
    nextTierProgress: { completed: 2, target: 3, label: "تقدم العضوية" },
  },
  wallet: {
    coins: 125,
    promoCredit: { amountMinor: 12050, currency: "EGP", expiryLabel: "تاريخ تجريبي" },
    vouchers: [
      { id: "test-voucher-1", title: "قسيمة اختبار", statusLabel: "صالحة", expiryLabel: "تاريخ تجريبي" },
    ],
  },
  upcomingVisit: {
    state: "booked",
    branchName: "جليم",
    serviceName: "Haircut",
    dateLabel: "موعد تجريبي",
    barberName: "حلاق تجريبي",
  },
};

afterEach(() => vi.restoreAllMocks());

describe("CUT CLUB authorized-only presentational view models", () => {
  it("distinguishes an unavailable balance from a trusted literal zero", () => {
    expect(formatCoins(null)).toBeNull();
    expect(formatCoins(undefined)).toBeNull();
    expect(formatCoins(-1)).toBeNull();
    expect(formatCoins(0.5)).toBeNull();
    expect(formatCoins(Number.MAX_SAFE_INTEGER + 1)).toBeNull();
    expect(formatCoins(0)).not.toBeNull();
    expect(formatCoins(125)).not.toBeNull();
    expect(formatEGPCredit(null)).toBeNull();
    expect(formatEGPCredit({ amountMinor: -1, currency: "EGP", expiryLabel: null })).toBeNull();
    expect(formatEGPCredit({ amountMinor: 12050, currency: "EGP", expiryLabel: null })).toContain("120");
  });

  it("renders a safe unavailable card without name, points or a synthetic member id", () => {
    render(<MemberIdentityCard member={null} />);
    expect(screen.getByText("البيانات غير متاحة حاليًا")).toBeInTheDocument();
    expect(screen.queryByText("Gold")).not.toBeInTheDocument();
    expect(screen.queryByText("CUT-TEST-001")).not.toBeInTheDocument();
    expect(screen.queryByText("CC")).not.toBeInTheDocument();
  });

  it("renders explicit 0 Coins without silently converting it to unavailable", () => {
    render(<MemberIdentityCard member={{ ...member.member, coins: 0, tierName: null }} />);
    expect(screen.getByText(/CC/)).toBeInTheDocument();
    expect(screen.getByText("CUT-TEST-001")).toBeInTheDocument();
    expect(screen.queryByText("Gold")).not.toBeInTheDocument();
    expect(screen.queryByText("البيانات غير متاحة حاليًا")).not.toBeInTheDocument();
  });

  it("shows distinct units for Coins and EGP credit and never an aggregate balance", () => {
    render(<MemberWalletOverview wallet={member.wallet} />);
    expect(screen.getByText("CUT Coins")).toBeInTheDocument();
    expect(screen.getByText("رصيد ترويجي")).toBeInTheDocument();
    expect(screen.getByText("قسيمة اختبار")).toBeInTheDocument();
    expect(screen.getByText("صالحة")).toBeInTheDocument();
    expect(screen.queryByText("إجمالي الرصيد")).not.toBeInTheDocument();
    expect(screen.getByText(/EGP|ج\.م/)).toBeInTheDocument();
  });

  it("does not confuse unloaded vouchers with a verified empty inventory", () => {
    const { rerender } = render(
      <MemberWalletOverview wallet={{ coins: null, promoCredit: null, vouchers: null }} />
    );
    expect(screen.getAllByText("البيانات غير متاحة حاليًا")).toHaveLength(3);
    rerender(<MemberWalletOverview wallet={{ coins: null, promoCredit: null, vouchers: [] }} />);
    expect(screen.getByText("لا توجد قسائم مسجلة حاليًا.")).toBeInTheDocument();
    expect(screen.getAllByText("البيانات غير متاحة حاليًا")).toHaveLength(2);
  });

  it("distinguishes an unavailable booking from an authorized account with no booking", () => {
    const { rerender } = render(<MemberUpcomingVisit visit={{ state: "unavailable" }} />);
    expect(screen.getByText("البيانات غير متاحة حاليًا")).toBeInTheDocument();
    rerender(<MemberUpcomingVisit visit={{ state: "empty" }} />);
    expect(screen.getByText("مافيش حجز قادم مسجل على حسابك.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "الحجز العام" })).toHaveAttribute("href", "/book");
  });

  it("accepts only valid authoritative progress shape for a progress bar", () => {
    expect(validProgress(null)).toBe(false);
    expect(validProgress({ completed: -1, target: 3, label: "اختبار" })).toBe(false);
    expect(validProgress({ completed: 4, target: 3, label: "اختبار" })).toBe(false);
    expect(validProgress({ completed: 2, target: 0, label: "اختبار" })).toBe(false);
    expect(validProgress({ completed: 2, target: 3, label: "اختبار" })).toBe(true);
  });

  it("renders mobile/desktop-friendly authorized composition with zero API calls", () => {
    const request = vi.spyOn(globalThis, "fetch");
    const html = renderToStaticMarkup(<AuthorizedClubOverview data={member} />);
    expect(html).toContain("md:grid-cols-2");
    expect(html).toContain("CUT-TEST-001");
    expect(html).toContain("قسيمة اختبار");
    expect(html).toContain("موعد تجريبي");
    expect(html).not.toContain("localStorage");
    expect(html).not.toContain("clientId");
    expect(request).not.toHaveBeenCalled();
  });

  it("escapes untrusted displayed labels instead of injecting markup", () => {
    const html = renderToStaticMarkup(
      <MemberIdentityCard member={{ ...member.member, displayName: "<script>alert(1)</script>" }} />
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});
