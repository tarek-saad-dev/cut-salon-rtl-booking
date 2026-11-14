/**
 * CUT CLUB 2.0 server-only member BFF orchestration CONTRACT (#54).
 *
 * Not an auth verifier, browser entrypoint, session issuer or data API.
 * The future caller MUST resolve an opaque, revocable session from a trusted
 * server-side repository, obtain tenant from server configuration, load the
 * member using a TENANT+CUSTOMER owned query and use a strict DTO projection.
 *
 * No HTTP route calls this; /club and legacy customer pages are unchanged.
 */
export type MemberOwnerKey = Readonly<{
  tenantId: string;
  customerId: number;
}>;

export type VerifiedStoreSession = Readonly<{
  tenantId: string;
  customerId: number;
  sessionId: string;
  otpVerified: true;
  verifiedAt: number;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
}>;

export type OwnerTaggedMember = Readonly<{
  owner: MemberOwnerKey;
  data: unknown;
}>;

export type MemberBffResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; reason: "unavailable" }>;

const failure = (): MemberBffResult<never> =>
  ({ ok: false, reason: "unavailable" });

const positive = (x: unknown): x is number =>
  typeof x === "number" && Number.isSafeInteger(x) && x > 0;
const isTenantUuid = (x: unknown): x is string =>
  typeof x === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const maxSessionSeconds = 2 * 60 * 60;
const maxVerificationGapSeconds = 5 * 60;

/**
 * Gate only. Never pass request-selected identity here.
 *
 * Important: "resolveSession" must itself verify the opaque cookie against a
 * durable, authoritative, revocable session store. A faked resolver in tests
 * only verifies this orchestration, not identity authenticity.
 */
export async function readAuthorizedClubMember<T>(options: Readonly<{
  /** Default OFF until real customer OTP and BFF security are independently approved. */
  enabled: boolean;
  trustedTenantId: string;
  nowSeconds: number;
  resolveSession: () => Promise<VerifiedStoreSession | null>;
  loadScopedMember: (key: MemberOwnerKey) => Promise<OwnerTaggedMember | null>;
  project: (source: unknown, viewer: MemberOwnerKey) => MemberBffResult<T>;
}>): Promise<MemberBffResult<T>> {
  if (options.enabled !== true ||
      !isTenantUuid(options.trustedTenantId) ||
      !positive(options.nowSeconds)) return failure();

  try {
    const session = await options.resolveSession();
    if (!session ||
        session.otpVerified !== true ||
        session.tenantId !== options.trustedTenantId ||
        !positive(session.customerId) ||
        typeof session.sessionId !== "string" ||
        !/^[A-Za-z0-9_-]{8,128}$/.test(session.sessionId) ||
        session.revokedAt !== null ||
        !positive(session.verifiedAt) ||
        !positive(session.createdAt) ||
        !positive(session.expiresAt) ||
        session.verifiedAt > session.createdAt ||
        session.createdAt - session.verifiedAt > maxVerificationGapSeconds ||
        session.createdAt > options.nowSeconds ||
        session.expiresAt <= options.nowSeconds ||
        session.expiresAt - session.createdAt > maxSessionSeconds) return failure();

    const viewer: MemberOwnerKey = Object.freeze({
      tenantId: session.tenantId,
      customerId: session.customerId,
    });
    // No clientId from query/body or localStorage can override this subject.
    const tagged = await options.loadScopedMember(viewer);
    if (!tagged ||
        tagged.owner.tenantId !== viewer.tenantId ||
        tagged.owner.customerId !== viewer.customerId) return failure();

    // Future integration: strict memberProjectionContract (#47) required.
    const projected = options.project(tagged.data, viewer);
    return projected.ok === true ? { ok: true, value: projected.value } : failure();
  } catch {
    // Never surface session existence, DB errors or foreign-member data.
    return failure();
  }
}
