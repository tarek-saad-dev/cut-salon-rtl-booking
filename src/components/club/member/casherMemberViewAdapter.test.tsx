import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthorizedClubOverview } from "./MemberOverview";
import { adaptAuthorizedCasherMemberSnapshot } from "./casherMemberViewAdapter";

function sample() {
  return {
    mode: "verified",
    member: {
      displayName: "عميل تجريبي",
      memberId: "CC-000101",
      tierCode: "SILVER",
      tierNameAr: "فضي",
      visits: 4,
      lastVisit: "2026-11-01T12:00:00.000Z",
      secretPhone: "01000000000",
    },
    wallet: {
      availableCoins: 320.5,
      lifetimeEarnedCoins: 500,
      promotionalCreditAvailable: false,
      activity: [{ id: 100, kind: "EARN_SALE", coinsDelta: 150, at: "2026-11-01T12:00:00.000Z", notes: "UNSAFE_LEDGER_NOTE" }],
      vouchers: [{
        id: 110, label: "قسيمة اختبار", status: "ACTIVE",
        expiresAt: "2026-12-01T00:00:00.000Z",
        VoucherCode: "PRIVATE-VOUCHER-TOKEN",
      }],
    },
    enabledActions: { redeem: false, buy: false, mysteryBox: false },
    customerId: 42,
  };
}

describe("CUT CLUB verified Casher -> Website UI mapping (#64)", () => {
  it("renders real fractional Coins exactly, with private fields removed", () => {
    const view = adaptAuthorizedCasherMemberSnapshot(sample());
    expect(view).not.toBeNull();
    expect(view?.wallet.coins).toBe(320.5);
    expect(view?.member.cutId).toBe("CC-000101");
    expect(view?.wallet.promoCredit).toBeNull();
    expect(view?.upcomingVisit).toEqual({ state: "unavailable" });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const html = renderToStaticMarkup(<AuthorizedClubOverview data={view} />);
      expect(html).toContain("قسيمة اختبار");
      expect(html).toContain("CC-000101");
      expect(html).not.toContain("01000000000");
      expect(html).not.toContain("PRIVATE-VOUCHER-TOKEN");
      expect(html).not.toContain("UNSAFE_LEDGER_NOTE");
      expect(html).not.toContain("clientId");
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally { fetchSpy.mockRestore(); }
  });

  it("does not manufacture an ID for new members with no loyalty ID", () => {
    const x = sample();
    const view = adaptAuthorizedCasherMemberSnapshot({
      ...x, member: { ...x.member, memberId: null },
      wallet: { ...x.wallet, availableCoins: 0, vouchers: [] },
    });
    expect(view?.member.cutId).toBe("");
    expect(view?.wallet.coins).toBe(0);
    expect(view?.wallet.vouchers).toEqual([]);
    const html = renderToStaticMarkup(<AuthorizedClubOverview data={view} />);
    expect(html).not.toContain("PENDING");
    expect(html).not.toContain("CC-000101");
  });

  it("rejects unverified, malformed, overprecise, enabled financial actions and arbitrary vouchers", () => {
    const x = sample();
    for (const invalid of [
      { ...x, mode: "anonymous" },
      { ...x, member: { ...x.member, memberId: "PENDING" } },
      { ...x, wallet: { ...x.wallet, availableCoins: -1 } },
      { ...x, wallet: { ...x.wallet, availableCoins: 0.005 } },
      { ...x, wallet: { ...x.wallet, promotionalCreditAvailable: true } },
      { ...x, wallet: { ...x.wallet, vouchers: [{ ...x.wallet.vouchers[0], status: "SECRET" }] } },
      { ...x, enabledActions: { ...x.enabledActions, buy: true } },
      { ...x, wallet: { ...x.wallet, vouchers: Array(26).fill(x.wallet.vouchers[0]) } },
      { ...x, member: { ...x.member, visits: -1 } },
    ]) expect(adaptAuthorizedCasherMemberSnapshot(invalid)).toBeNull();
    expect(adaptAuthorizedCasherMemberSnapshot(null)).toBeNull();
  });

  it("never simulates bookings or promotional EGP credits", () => {
    const view = adaptAuthorizedCasherMemberSnapshot(sample());
    expect(view?.upcomingVisit).toEqual({ state: "unavailable" });
    expect(view?.wallet.promoCredit).toBeNull();
    expect(view?.member.nextTierProgress).toBeNull();
  });
});
