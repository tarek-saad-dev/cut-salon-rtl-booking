import { describe, expect, it, vi } from "vitest";
import { readAuthorizedClubMember, type VerifiedStoreSession } from "../club/memberBffGate";

const tenant = "c9413a3e-dc87-4a70-bc6e-d00d76f9066b";
const otherTenant = "e1413a3e-dc87-4a70-bc6e-d00d76f9066b";
const now = 1_900_000_000;
const session = (): VerifiedStoreSession => ({
  tenantId: tenant,
  customerId: 101,
  sessionId: "test_session_01",
  otpVerified: true,
  verifiedAt: now - 301,
  createdAt: now - 300,
  expiresAt: now + 3600,
  revokedAt: null,
});
const expected = { owner: { tenantId: tenant, customerId: 101 }, data: { displayName: "Synthetic member" } };
const project = vi.fn((raw: unknown) =>
  raw && typeof raw === "object" ? ({ ok: true as const, value: { name: "Synthetic member" } }) :
    ({ ok: false as const, reason: "unavailable" as const }));
const options = (extra: Record<string, unknown> = {}) => ({
  enabled: true,
  trustedTenantId: tenant,
  nowSeconds: now,
  resolveSession: vi.fn(async () => session()),
  loadScopedMember: vi.fn(async () => expected),
  project,
  ...extra,
});

describe("CUT CLUB server-only member BFF access gate (#54)", () => {
  it("stays closed by default and calls neither identity nor data loader", async () => {
    const o = options({ enabled: false });
    expect(await readAuthorizedClubMember(o)).toEqual({ ok: false, reason: "unavailable" });
    expect(o.resolveSession).not.toHaveBeenCalled();
    expect(o.loadScopedMember).not.toHaveBeenCalled();
  });

  it("never resolves the source when trusted session is missing or revoked", async () => {
    for (const value of [null, { ...session(), revokedAt: now - 10 }, { ...session(), otpVerified: false }]) {
      const o = options({ resolveSession: vi.fn(async () => value) });
      expect(await readAuthorizedClubMember(o)).toEqual({ ok: false, reason: "unavailable" });
      expect(o.loadScopedMember).not.toHaveBeenCalled();
    }
  });

  it("rejects expired, not-yet-created and overlong sessions", async () => {
    for (const s of [
      { ...session(), expiresAt: now },
      { ...session(), createdAt: now + 1 },
      { ...session(), expiresAt: now + 8000 },
      { ...session(), verifiedAt: now - 1000 },
      { ...session(), sessionId: "bad" },
    ]) {
      const o = options({ resolveSession: vi.fn(async () => s) });
      expect(await readAuthorizedClubMember(o)).toEqual({ ok: false, reason: "unavailable" });
      expect(o.loadScopedMember).not.toHaveBeenCalled();
    }
  });

  it("rejects session from a different tenant before loading customer data", async () => {
    const o = options({ resolveSession: vi.fn(async () => ({ ...session(), tenantId: otherTenant })) });
    expect(await readAuthorizedClubMember(o)).toEqual({ ok: false, reason: "unavailable" });
    expect(o.loadScopedMember).not.toHaveBeenCalled();
  });

  it("loads only the subject from trusted session, never a caller-selected clientId", async () => {
    const o = options({ userSuppliedClientId: 999999, searchParams: new URLSearchParams("clientId=999999") });
    expect(await readAuthorizedClubMember(o)).toEqual({ ok: true, value: { name: "Synthetic member" } });
    expect(o.loadScopedMember).toHaveBeenCalledWith({ tenantId: tenant, customerId: 101 });
    expect(o.loadScopedMember).toHaveBeenCalledTimes(1);
  });

  it("rejects wrong owner and cross-tenant data without projecting it", async () => {
    for (const owner of [{ tenantId: tenant, customerId: 102 }, { tenantId: otherTenant, customerId: 101 }]) {
      project.mockClear();
      const o = options({ loadScopedMember: vi.fn(async () => ({ ...expected, owner })) });
      expect(await readAuthorizedClubMember(o)).toEqual({ ok: false, reason: "unavailable" });
      expect(project).not.toHaveBeenCalled();
    }
  });

  it("fails closed on storage errors and malformed projection", async () => {
    const broken = options({ resolveSession: vi.fn(async () => { throw Error("private session failure"); }) });
    expect(await readAuthorizedClubMember(broken)).toEqual({ ok: false, reason: "unavailable" });
    const invalid = options({ project: vi.fn(() => ({ ok: false as const, reason: "unavailable" as const })) });
    expect(await readAuthorizedClubMember(invalid)).toEqual({ ok: false, reason: "unavailable" });
  });
});
