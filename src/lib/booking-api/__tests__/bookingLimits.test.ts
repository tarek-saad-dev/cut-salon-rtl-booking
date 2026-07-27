import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  UPCOMING_BOOKINGS_MAX_LIMIT,
  UPCOMING_BOOKINGS_DEFAULT_LIMIT,
  BOOKING_CODE_MAX_LENGTH,
  BOOKING_CODE_MIN_LENGTH,
  clampUpcomingLimit,
  normalizeBookingCode,
  isValidBookingCodeShape,
} from "../limits";

describe("booking-public-v1 client limits", () => {
  it("defines upcoming max limit as 25", () => {
    expect(UPCOMING_BOOKINGS_MAX_LIMIT).toBe(25);
  });

  it("defines booking code max length as 32", () => {
    expect(BOOKING_CODE_MAX_LENGTH).toBe(32);
  });

  it("clamps upcoming limit to 25", () => {
    expect(clampUpcomingLimit(50)).toBe(25);
    expect(clampUpcomingLimit(100)).toBe(25);
    expect(clampUpcomingLimit(25)).toBe(25);
    expect(clampUpcomingLimit(1)).toBe(1);
    expect(clampUpcomingLimit(0)).toBe(1);
    expect(clampUpcomingLimit(undefined)).toBe(UPCOMING_BOOKINGS_DEFAULT_LIMIT);
    expect(UPCOMING_BOOKINGS_DEFAULT_LIMIT).toBeLessThanOrEqual(UPCOMING_BOOKINGS_MAX_LIMIT);
  });

  it("truncates booking codes to 32 characters", () => {
    const long = `BK-${"X".repeat(40)}`;
    const normalized = normalizeBookingCode(long);
    expect(normalized.length).toBe(32);
    expect(normalized).toBe(long.trim().toUpperCase().slice(0, 32));
  });

  it("validates booking code shape against min/max", () => {
    expect(isValidBookingCodeShape("AB")).toBe(false);
    expect(isValidBookingCodeShape("BK01")).toBe(true);
    expect(isValidBookingCodeShape("x".repeat(BOOKING_CODE_MAX_LENGTH))).toBe(true);
    expect(BOOKING_CODE_MIN_LENGTH).toBe(4);
  });
});

describe("getUpcomingBookings respects max limit 25", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", mockFetch);
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app");
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends clamped limit 25 when caller requests 50", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "x-booking-contract-version": "booking-public-v1" }),
      text: async () => JSON.stringify({ ok: true, bookings: [] }),
    } as unknown as Response);

    const { getUpcomingBookings } = await import("../booking");
    await getUpcomingBookings("01012345678", { limit: 50 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.limit).toBe(25);
  });
});
