import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCasherPublicApiUrl,
  getCasherPublicApiBaseUrl,
} from "../casherPublicApiUrl";

describe("casherPublicApiUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses relative paths in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "https://casher-five.vercel.app");
    expect(getCasherPublicApiBaseUrl()).toBe("");
    expect(buildCasherPublicApiUrl("/api/client/lookup")).toBe(
      "/api/client/lookup",
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

  it("falls back to relative paths when dev base is unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "");
    expect(buildCasherPublicApiUrl("api/client/lookup")).toBe(
      "/api/client/lookup",
    );
  });
});
