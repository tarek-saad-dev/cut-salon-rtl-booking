import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveBookingAccess,
  getBookingAccess,
  removeBookingAccess,
  clearExpiredBookingAccess,
  _clearAllBookingAccess,
} from "../booking-access-store";

describe("Booking Access Store", () => {
  beforeEach(() => {
    _clearAllBookingAccess();
  });

  it("persists and retrieves access token by booking code", () => {
    saveBookingAccess({ bookingCode: "BK-001", bookingAccessToken: "tok_secret" });
    const entry = getBookingAccess("BK-001");
    expect(entry).not.toBeNull();
    expect(entry!.bookingAccessToken).toBe("tok_secret");
  });

  it("normalizes booking code to uppercase", () => {
    saveBookingAccess({ bookingCode: "bk-002", bookingAccessToken: "tok_2" });
    const entry = getBookingAccess("BK-002");
    expect(entry).not.toBeNull();
  });

  it("removes access token", () => {
    saveBookingAccess({ bookingCode: "BK-003", bookingAccessToken: "tok_3" });
    removeBookingAccess("BK-003");
    expect(getBookingAccess("BK-003")).toBeNull();
  });

  it("clears expired tokens", () => {
    saveBookingAccess({ bookingCode: "BK-OLD", bookingAccessToken: "tok_old", expiresAt: Date.now() - 1000 });
    saveBookingAccess({ bookingCode: "BK-NEW", bookingAccessToken: "tok_new" });
    clearExpiredBookingAccess();
    expect(getBookingAccess("BK-OLD")).toBeNull();
    expect(getBookingAccess("BK-NEW")).not.toBeNull();
  });

  it("does not log access tokens", () => {
    const spy = vi.spyOn(console, "log");
    saveBookingAccess({ bookingCode: "BK-LOG", bookingAccessToken: "secret_tok" });
    getBookingAccess("BK-LOG");
    const allLogs = spy.mock.calls.flat().join(" ");
    expect(allLogs).not.toContain("secret_tok");
    spy.mockRestore();
  });
});
