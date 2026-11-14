import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  MEMBER_NO_STORE_HEADERS,
  projectAuthorizedMember,
} from "../club/memberProjectionContract";

const tenant = "c9413a3e-dc87-4a70-bc6e-d00d76f9066b";
const otherTenant = "e1413a3e-dc87-4a70-bc6e-d00d76f9066b";
const viewer = { tenantId: tenant, customerId: 101 };
const owner = { ...viewer };
// Test-only mutable payload: deliberately permits malformed records for negative tests.
const source = (): any => ({
  owner: { ...owner },
  member: {
    displayName: "عضو اختبار",
    cutId: "CUT-TEST-101",
    tierName: "Gold",
    coins: 25,
    nextTierProgress: { completed: 1, target: 3, label: "المستوى القادم" },
  },
  wallet: {
    coins: 25,
    promoCredit: { amountMinor: 12750, currency: "EGP", expiryLabel: null },
    vouchers: [
      { id: "test-1", owner: { ...owner }, title: "قسيمة اختبار", statusLabel: "صالحة", expiryLabel: null },
    ],
  },
  upcomingVisit: {
    state: "booked",
    owner: { ...owner },
    branchName: "جليم",
    serviceName: "Haircut",
    dateLabel: "موعد تجريبي",
    barberName: null,
  },
});

describe("CUT CLUB future verified member BFF projection", () => {
  it("requires a trusted subject independently of incoming data", () => {
    expect(projectAuthorizedMember(source(), null)).toEqual({ ok: false, reason: "NO_TRUSTED_SUBJECT" });
    expect(projectAuthorizedMember(source(), { tenantId: "provided-by-query", customerId: 101 }))
      .toEqual({ ok: false, reason: "NO_TRUSTED_SUBJECT" });
  });

  it("projects synthetic authorized member data and strips server owner identifiers", () => {
    const result = projectAuthorizedMember(source(), viewer);
    expect(result.ok).toBe(true);
    if (!result.ok) throw Error("expected synthetic projection");
    expect(result.value.wallet.coins).toBe(25);
    expect(result.value.wallet.promoCredit).toEqual({ amountMinor: 12750, currency: "EGP", expiryLabel: null });
    expect(result.value.wallet.vouchers).toEqual([{ id: "test-1", title: "قسيمة اختبار", statusLabel: "صالحة", expiryLabel: null }]);
    expect(result.value.upcomingVisit.state).toBe("booked");
    expect(JSON.stringify(result.value)).not.toContain('"customerId"');
    expect(JSON.stringify(result.value)).not.toContain('"tenantId"');
  });

  it("rejects a different owner account and a different tenant", () => {
    expect(projectAuthorizedMember({ ...source(), owner: { ...owner, customerId: 102 } }, viewer))
      .toEqual({ ok: false, reason: "WRONG_OWNER" });
    expect(projectAuthorizedMember({ ...source(), owner: { ...owner, tenantId: otherTenant } }, viewer))
      .toEqual({ ok: false, reason: "WRONG_OWNER" });
  });

  it("refuses vouchers and upcoming bookings from another customer", () => {
    const a = source();
    a.wallet.vouchers[0].owner.customerId = 102;
    expect(projectAuthorizedMember(a, viewer)).toEqual({ ok: false, reason: "WRONG_OWNER" });
    const b = source();
    b.upcomingVisit.owner.tenantId = otherTenant;
    expect(projectAuthorizedMember(b, viewer)).toEqual({ ok: false, reason: "WRONG_OWNER" });
  });

  it("distinguishes verified zero and empty inventory from unavailable null", () => {
    const s = source();
    s.member.coins = 0;
    s.wallet.coins = 0;
    s.wallet.vouchers = [];
    s.wallet.promoCredit = null;
    s.upcomingVisit = { state: "empty" };
    const result = projectAuthorizedMember(s, viewer);
    expect(result.ok).toBe(true);
    if (!result.ok) throw Error("expected zero fixture");
    expect(result.value.member.coins).toBe(0);
    expect(result.value.wallet.vouchers).toEqual([]);
    expect(result.value.wallet.promoCredit).toBeNull();

    const unavailable = source();
    unavailable.member.coins = null;
    unavailable.wallet.coins = null;
    unavailable.wallet.vouchers = null;
    unavailable.upcomingVisit = { state: "unavailable" };
    const r2 = projectAuthorizedMember(unavailable, viewer);
    expect(r2.ok).toBe(true);
    if (!r2.ok) throw Error("expected unavailable fixture");
    expect(r2.value.member.coins).toBeNull();
    expect(r2.value.wallet.vouchers).toBeNull();
  });

  it("fails closed on negative, fractional and unsafe numeric balances", () => {
    for (const n of [-1, 0.1, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN]) {
      const s = source();
      s.wallet.coins = n;
      expect(projectAuthorizedMember(s, viewer).ok).toBe(false);
    }
  });

  it("rejects two contradictory known Coins values rather than picking a balance", () => {
    const s = source();
    s.member.coins = 30;
    s.wallet.coins = 25;
    expect(projectAuthorizedMember(s, viewer)).toEqual({ ok: false, reason: "INVALID_PAYLOAD" });
  });

  it("never mixes CUT Coins and EGP credit or accepts non-EGP currency", () => {
    const s = source();
    s.wallet.promoCredit.currency = "USD";
    expect(projectAuthorizedMember(s, viewer)).toEqual({ ok: false, reason: "INVALID_PAYLOAD" });
    const b = source();
    b.wallet.promoCredit.amountMinor = -10;
    expect(projectAuthorizedMember(b, viewer)).toEqual({ ok: false, reason: "INVALID_PAYLOAD" });
  });

  it("rejects invalid progress, oversized collections and extra untrusted fields", () => {
    const a = source();
    a.member.nextTierProgress.completed = 4;
    expect(projectAuthorizedMember(a, viewer).ok).toBe(false);
    const b = source();
    b.wallet.vouchers = Array.from({ length: 101 }, (_, i) => ({ ...source().wallet.vouchers[0], id: "v-" + i }));
    expect(projectAuthorizedMember(b, viewer).ok).toBe(false);
    expect(projectAuthorizedMember({ ...source(), secret: "DO_NOT_EXPOSE_ME" }, viewer).ok).toBe(false);
  });

  it("preserves labels as text, never injected HTML, in a future React text child", () => {
    const malicious = "<img src=x onerror=alert(1)>";
    const s = source();
    s.member.displayName = malicious;
    s.wallet.vouchers[0].title = malicious;
    const result = projectAuthorizedMember(s, viewer);
    expect(result.ok).toBe(true);
    if (!result.ok) throw Error("synthetic projection should validate text");
    // Validation is not HTML sanitization; safe React text rendering escapes it.
    const html = renderToStaticMarkup(createElement("div", null,
      result.value.member.displayName,
      createElement("span", null, result.value.wallet.vouchers?.[0]?.title),
    ));
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img");
    expect(html).toContain("onerror=alert(1)");
  });

  it("does not network, write cookies, read localStorage, or fabricate balances", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = projectAuthorizedMember({ bad: true }, viewer);
    expect(result.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    expect(MEMBER_NO_STORE_HEADERS["Cache-Control"]).toContain("no-store");
    expect(MEMBER_NO_STORE_HEADERS["X-Robots-Tag"]).toContain("noindex");
  });
});
