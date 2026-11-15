/**
 * CUT CLUB 2.0 — host-only cookie & same-origin BFF policy (#60).
 *
 * Pure server-side composition: no Next.js HTTP route, no provider, no DB,
 * no localStorage and no session issuance by importing this file.
 *
 * A future auth route MUST call this only after Casher confirms durable,
 * single-use verified OTP -> unique customer binding -> committed session.
 */
export const CLUB_CUSTOMER_COOKIE = "__Host-cut-club" as const;
export const CLUB_CUSTOMER_SESSION_MAX_AGE_SECONDS = 2 * 60 * 60;

export type ClubCookieSpec = Readonly<{
  name: typeof CLUB_CUSTOMER_COOKIE;
  value: string;
  options: Readonly<{
    httpOnly: true;
    secure: true;
    sameSite: "strict";
    path: "/";
    maxAge: number;
    priority: "high";
  }>;
}>;

const tokenRegex = /^[A-Za-z0-9_-]{43}$/;
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * This is a COOKIEWRITER POLICY, not identity proof. It must never be called
 * on a token from the browser, query string, phone lookup or OTP comparison
 * unless an authoritative durable session insertion has succeeded.
 */
export function makeClubCustomerSessionCookie(verifiedOpaqueToken: unknown): ClubCookieSpec | null {
  if (typeof verifiedOpaqueToken !== "string" || !tokenRegex.test(verifiedOpaqueToken)) return null;
  return Object.freeze({
    name: CLUB_CUSTOMER_COOKIE,
    value: verifiedOpaqueToken,
    options: Object.freeze({
      httpOnly: true as const,
      secure: true as const,
      sameSite: "strict" as const,
      path: "/" as const,
      maxAge: CLUB_CUSTOMER_SESSION_MAX_AGE_SECONDS,
      priority: "high" as const,
    }),
  });
}

/** Logout must revoke the durable Casher session AND clear browser cookie. */
export function clearClubCustomerSessionCookie() {
  return Object.freeze({
    name: CLUB_CUSTOMER_COOKIE,
    value: "",
    options: Object.freeze({
      httpOnly: true as const,
      secure: true as const,
      sameSite: "strict" as const,
      path: "/" as const,
      maxAge: 0,
      priority: "high" as const,
    }),
  });
}

function canonicalOrigin(expected: unknown, allowExplicitLocalhost = false): string | null {
  if (typeof expected !== "string" || expected.length > 250) return null;
  try {
    const u = new URL(expected);
    if (u.username || u.password || u.pathname !== "/" || u.search || u.hash ||
        (u.protocol !== "https:" &&
         !(allowExplicitLocalhost && u.protocol === "http:" && u.hostname === "localhost"))) return null;
    if (u.origin !== expected.replace(/\/$/, "")) return null;
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * Caller MUST pass expectedOrigin from trusted server CONFIG, not Host,
 * Forwarded/X-Forwarded-Host, browser query or body. Authentication remains
 * separate; this only denies unsafe cross-origin writes.
 */
export function allowClubUnsafeOrigin(input: Readonly<{
  method: string;
  requestOrigin: string | null;
  secFetchSite: string | null;
  trustedConfiguredOrigin: string;
  allowExplicitLocalhostForDev?: boolean;
}>): boolean {
  const expected = canonicalOrigin(input.trustedConfiguredOrigin, input.allowExplicitLocalhostForDev === true);
  if (!expected || typeof input.method !== "string") return false;
  const method = input.method.toUpperCase();
  if (!unsafeMethods.has(method)) return method === "GET" || method === "HEAD" || method === "OPTIONS";
  if (input.secFetchSite !== "same-origin" || typeof input.requestOrigin !== "string") return false;
  const received = canonicalOrigin(input.requestOrigin, input.allowExplicitLocalhostForDev === true);
  return received !== null && received === expected;
}

export const CLUB_PRIVATE_RESPONSE_HEADERS = Object.freeze({
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  "Pragma": "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
  "Vary": "Cookie, Origin",
} as const);
