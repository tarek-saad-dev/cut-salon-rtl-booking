import { _resetBaseUrlCache } from "../booking-api/env";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCasherPublicApiUrl,
  getCasherPublicApiBaseUrl,
} from "../casherPublicApiUrl";

describe("casherPublicApiUrl", () => {
  afterEach(() => {
    _resetBaseUrlCache();
    vi.unstubAllEnvs();
  });

  it("uses configured Casher origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "https://casher-five.vercel.app");
    expect(getCasherPublicApiBaseUrl()).toBe("https://casher-five.vercel.app");
    expect(buildCasherPublicApiUrl("/api/client/lookup")).toBe(
      "https://casher-five.vercel.app/api/client/lookup",
    );
  });

  it("prefixes configured base in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv(
      "NEXT_PUBLIC_BOOKING_API_BASE_URL",
      "https://casher-five.vercel.app/",
    );
    expect(buildCasherPublicApiUrl("/api/client/update")).toBe(
      "https://casher-five.vercel.app/api/client/update",
    );
  });

  it("fails closed when API base is unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "");
    expect(() => buildCasherPublicApiUrl("api/client/lookup")).toThrow(/not configured/);
  });
});
