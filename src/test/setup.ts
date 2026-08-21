import "@testing-library/jest-dom";
import { vi } from "vitest";

// Default: keep existing booking-api modal tests on legacy path.
// Booking V2 integration tests opt in via vi.stubEnv in their own beforeEach.
vi.stubEnv("NEXT_PUBLIC_BOOKING_V2_CLIENT", "false");

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
