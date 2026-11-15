/**
 * CUT CLUB future authenticated BFF response projection contract.
 *
 * NOT an authentication mechanism and NOT used by /club yet.
 * trustedViewer MUST come from a verified, revocable server-side customer
 * session (once Casher security #243 is complete), never from URL/clientId/
 * phone/localStorage/browser JSON. Every Casher source API must ALSO enforce
 * customer+tenant ownership: this validator cannot repair legacy public APIs.
 */
import { z } from "zod";

const tenantId = z.string().uuid();
const customerId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const nonnegativeInt = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const cleanLabel = z.string().trim().min(1).max(120);
const dateLabel = z.string().trim().min(1).max(80);
const cutId = z.string().trim().min(3).max(80);

const ownerSchema = z.object({
  tenantId,
  customerId,
}).strict();

const progressSchema = z.object({
  completed: nonnegativeInt,
  target: z.number().int().min(1).max(100_000),
  label: cleanLabel,
}).strict().refine(x => x.completed <= x.target, "Progress cannot exceed target");

const promoCreditSchema = z.object({
  amountMinor: nonnegativeInt,
  currency: z.literal("EGP"),
  expiryLabel: dateLabel.nullable(),
}).strict();

const voucherSchema = z.object({
  id: cleanLabel,
  owner: ownerSchema,
  title: cleanLabel,
  statusLabel: cleanLabel,
  expiryLabel: dateLabel.nullable(),
}).strict();

const upcomingVisitSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("unavailable") }).strict(),
  z.object({ state: z.literal("empty") }).strict(),
  z.object({
    state: z.literal("booked"),
    owner: ownerSchema,
    branchName: cleanLabel,
    serviceName: cleanLabel,
    dateLabel,
    barberName: cleanLabel.nullable(),
  }).strict(),
]);

export const memberProjectionSchema = z.object({
  owner: ownerSchema,
  member: z.object({
    displayName: cleanLabel,
    cutId,
    tierName: cleanLabel.nullable(),
    coins: nonnegativeInt.nullable(),
    nextTierProgress: progressSchema.nullable(),
  }).strict(),
  wallet: z.object({
    coins: nonnegativeInt.nullable(),
    promoCredit: promoCreditSchema.nullable(),
    vouchers: z.array(voucherSchema).max(100).nullable(),
  }).strict(),
  upcomingVisit: upcomingVisitSchema,
}).strict();

export type TrustedViewer = Readonly<{
  tenantId: string;
  customerId: number;
}>;

export type MemberOverviewProjection = Readonly<{
  member: {
    displayName: string;
    cutId: string;
    tierName: string | null;
    coins: number | null;
    nextTierProgress: { completed: number; target: number; label: string } | null;
  };
  wallet: {
    coins: number | null;
    promoCredit: { amountMinor: number; currency: "EGP"; expiryLabel: string | null } | null;
    vouchers: readonly { id: string; title: string; statusLabel: string; expiryLabel: string | null }[] | null;
  };
  upcomingVisit:
    | { state: "unavailable" }
    | { state: "empty" }
    | { state: "booked"; branchName: string; serviceName: string; dateLabel: string; barberName: string | null };
}>;

export type ProjectionResult =
  | { ok: true; value: MemberOverviewProjection }
  | { ok: false; reason: "NO_TRUSTED_SUBJECT" | "INVALID_PAYLOAD" | "WRONG_OWNER" };

const matches = (a: TrustedViewer, b: TrustedViewer): boolean =>
  a.tenantId === b.tenantId && a.customerId === b.customerId;

export function projectAuthorizedMember(
  raw: unknown,
  trustedViewer: TrustedViewer | null | undefined,
): ProjectionResult {
  const authenticated = ownerSchema.safeParse(trustedViewer);
  if (!authenticated.success) return { ok: false, reason: "NO_TRUSTED_SUBJECT" };

  const result = memberProjectionSchema.safeParse(raw);
  if (!result.success) return { ok: false, reason: "INVALID_PAYLOAD" };
  const src = result.data;
  const viewer = authenticated.data;

  // Two explicitly available representations must agree; never display
  // conflicting point balances as if either were authoritative.
  if (src.member.coins !== null && src.wallet.coins !== null &&
      src.member.coins !== src.wallet.coins) {
    return { ok: false, reason: "INVALID_PAYLOAD" };
  }

  if (!matches(src.owner, viewer)) return { ok: false, reason: "WRONG_OWNER" };
  if (src.wallet.vouchers?.some(v => !matches(v.owner, viewer))) {
    return { ok: false, reason: "WRONG_OWNER" };
  }
  if (src.upcomingVisit.state === "booked" && !matches(src.upcomingVisit.owner, viewer)) {
    return { ok: false, reason: "WRONG_OWNER" };
  }

  const { member, wallet, upcomingVisit } = src;
  return {
    ok: true,
    value: {
      member: {
        displayName: member.displayName,
        cutId: member.cutId,
        tierName: member.tierName,
        coins: member.coins,
        nextTierProgress: member.nextTierProgress,
      },
      wallet: {
        coins: wallet.coins,
        promoCredit: wallet.promoCredit,
        vouchers: wallet.vouchers === null ? null : wallet.vouchers.map(({ id, title, statusLabel, expiryLabel }) =>
          ({ id, title, statusLabel, expiryLabel })),
      },
      upcomingVisit: upcomingVisit.state === "booked"
        ? {
            state: "booked",
            branchName: upcomingVisit.branchName,
            serviceName: upcomingVisit.serviceName,
            dateLabel: upcomingVisit.dateLabel,
            barberName: upcomingVisit.barberName,
          }
        : { state: upcomingVisit.state },
    },
  };
}

/**
 * Defense-in-depth for future authenticated member responses.
 * These headers are NOT authorization; no login session/route is wired.
 */
export const MEMBER_NO_STORE_HEADERS = Object.freeze({
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  "X-Robots-Tag": "noindex, nofollow",
});
