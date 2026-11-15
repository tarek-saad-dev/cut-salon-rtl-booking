import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  allowClubUnsafeOrigin,
  clearClubCustomerSessionCookie,
  CLUB_CUSTOMER_COOKIE,
  CLUB_CUSTOMER_SESSION_MAX_AGE_SECONDS,
  CLUB_PRIVATE_RESPONSE_HEADERS,
  makeClubCustomerSessionCookie,
} from "@/lib/club/sessionCookiePolicy";

describe("CUT CLUB verified customer cookie policy (#60)", () => {
  const token = "T".repeat(43);
  const trustedConfiguredOrigin = "https://cutsaloon.com";

  it("uses __Host prefix, HttpOnly Secure Strict, host-only path and 2-hour TTL", () => {
    expect(CLUB_CUSTOMER_COOKIE).toBe("__Host-cut-club");
    const cookie = makeClubCustomerSessionCookie(token);
    expect(cookie).toEqual({
      name: "__Host-cut-club", value: token,
      options: {
        secure: true, httpOnly: true, sameSite: "strict",
        path: "/", maxAge: 7200, priority: "high",
      },
    });
    expect(CLUB_CUSTOMER_SESSION_MAX_AGE_SECONDS).toBe(7200);
    expect(cookie?.options).not.toHaveProperty("domain");
    expect(cookie?.options).not.toHaveProperty("expires");
  });

  it("does not set cookies from phone, clientId, malformed OTP or arbitrary length", () => {
    for (const bad of [
      "", null, undefined, "clientId=42", "01000000001", "123456",
      "abc.def", "a".repeat(42), "a".repeat(44), { token },
    ]) expect(makeClubCustomerSessionCookie(bad)).toBeNull();
  });

  it("clears the same host-only cookie without reviving a session", () => {
    const clear = clearClubCustomerSessionCookie();
    expect(clear.name).toBe(CLUB_CUSTOMER_COOKIE);
    expect(clear.value).toBe("");
    expect(clear.options).toMatchObject({
      httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0,
    });
    expect(clear.options).not.toHaveProperty("domain");
  });

  it("permits a same-origin configured HTTPS POST only", () => {
    const req = {
      method: "POST", requestOrigin: "https://cutsaloon.com",
      secFetchSite: "same-origin", trustedConfiguredOrigin,
    };
    expect(allowClubUnsafeOrigin(req)).toBe(true);
    for (const method of ["PUT", "PATCH", "DELETE"]) {
      expect(allowClubUnsafeOrigin({ ...req, method })).toBe(true);
    }
    for (const bad of [
      { requestOrigin: "https://evil.example" },
      { requestOrigin: "https://cutsaloon.com.evil.example" },
      { requestOrigin: "http://cutsaloon.com" },
      { requestOrigin: null },
      { requestOrigin: "null" },
      { requestOrigin: "https://cutsaloon.com@evil.example" },
      { requestOrigin: "https://cutsaloon.com/booking" },
      { secFetchSite: "cross-site" },
      { secFetchSite: "same-site" },
      { secFetchSite: "none" },
      { secFetchSite: null },
      { trustedConfiguredOrigin: "http://cutsaloon.com" },
      { trustedConfiguredOrigin: "https://cutsaloon.com/path" },
    ]) expect(allowClubUnsafeOrigin({ ...req, ...bad })).toBe(false);
  });

  it("allows localhost HTTP only with explicit development permission", () => {
    const req = {
      method: "POST",
      requestOrigin: "http://localhost:3000",
      trustedConfiguredOrigin: "http://localhost:3000",
      secFetchSite: "same-origin",
    };
    expect(allowClubUnsafeOrigin(req)).toBe(false);
    expect(allowClubUnsafeOrigin({ ...req, allowExplicitLocalhostForDev: true })).toBe(true);
    expect(allowClubUnsafeOrigin({
      ...req, trustedConfiguredOrigin: "http://some-other-host:3000",
      allowExplicitLocalhostForDev: true,
    })).toBe(false);
  });

  it("sensitive replies are private, no-store and never indexable", () => {
    expect(CLUB_PRIVATE_RESPONSE_HEADERS["Cache-Control"]).toContain("no-store");
    expect(CLUB_PRIVATE_RESPONSE_HEADERS["X-Robots-Tag"]).toContain("noindex");
    expect(CLUB_PRIVATE_RESPONSE_HEADERS.Vary).toContain("Cookie");
    expect(CLUB_PRIVATE_RESPONSE_HEADERS["Referrer-Policy"]).toBe("no-referrer");
  });

  it("does not create routes, fetch wallets or expose browser-stored sessions", () => {
    const src = readFileSync(resolve(process.cwd(), "src/lib/club/sessionCookiePolicy.ts"), "utf8");
    const executable = src.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const forbidden of [
      "new NextResponse", "fetch(", "localStorage", "sessionStorage", "clientId",
      "getPool", "password", "document.cookie", "req.json(",
    ]) expect(executable).not.toContain(forbidden);
  });
});
