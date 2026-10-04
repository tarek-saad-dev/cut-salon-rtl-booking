import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const prefetch = vi.fn();
const motionPrefs = { reduced: false };

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, prefetch }) }));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ lang: "ar", isArabic: true }) }));
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: () => motionPrefs.reduced };
});

import OctoberGiftPopup, {
  OCTOBER_GIFT_DISMISS_KEY,
  OCTOBER_GIFT_HREF,
  OCTOBER_GIFT_TIMING,
} from "./OctoberGiftPopup";

const DURING_OFFER = new Date("2026-10-10T12:00:00+03:00");

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function showGift() {
  render(<OctoberGiftPopup />);
  advance(OCTOBER_GIFT_TIMING.showAfterMs + 50);
  return screen.getByRole("link", { name: /احصل على عرض أكتوبر/ });
}

describe("October gift popup on the home page", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(DURING_OFFER);
    sessionStorage.clear();
    push.mockReset();
    prefetch.mockReset();
    motionPrefs.reduced = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("slides in after the hero settles, prefetching the October page, without revealing the price", () => {
    render(<OctoberGiftPopup />);
    expect(screen.queryByRole("complementary", { name: "هدية أكتوبر" })).toBeNull();
    expect(prefetch).toHaveBeenCalledWith(OCTOBER_GIFT_HREF);

    advance(OCTOBER_GIFT_TIMING.showAfterMs + 50);
    const gift = screen.getByRole("complementary", { name: "هدية أكتوبر" });
    expect(gift).toHaveTextContent("احصل على عرض أكتوبر");
    expect(gift).toHaveTextContent("افتح الهدية");
    expect(gift).not.toHaveTextContent(/333|720/);
    expect(screen.getByRole("link", { name: /احصل على عرض أكتوبر/ })).toHaveAttribute("href", OCTOBER_GIFT_HREF);
  });

  it("opens the box, plays the cinematic transition, then navigates to the October page", () => {
    const link = showGift();
    fireEvent.click(link);

    expect(document.querySelector('[data-october-gift]')).toHaveAttribute("data-phase", "opening");
    expect(push).not.toHaveBeenCalled();

    advance(OCTOBER_GIFT_TIMING.openMs);
    expect(document.querySelector("[data-october-gift-transition]")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    advance(OCTOBER_GIFT_TIMING.leaveMs);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(OCTOBER_GIFT_HREF);
  });

  it("ignores repeat taps while the box is opening", () => {
    const link = showGift();
    fireEvent.click(link);
    fireEvent.click(link);
    advance(OCTOBER_GIFT_TIMING.openMs + OCTOBER_GIFT_TIMING.leaveMs);
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("goes straight to the October page with reduced motion", () => {
    motionPrefs.reduced = true;
    fireEvent.click(showGift());
    expect(push).toHaveBeenCalledWith(OCTOBER_GIFT_HREF);
    expect(document.querySelector("[data-october-gift-transition]")).toBeNull();
  });

  it("stays dismissed for the rest of the session", async () => {
    showGift();
    fireEvent.click(screen.getByRole("button", { name: "إخفاء" }));
    expect(sessionStorage.getItem(OCTOBER_GIFT_DISMISS_KEY)).toBe("1");
    vi.useRealTimers();
    await waitFor(() => expect(screen.queryByRole("complementary", { name: "هدية أكتوبر" })).toBeNull());
    expect(push).not.toHaveBeenCalled();
  });

  it("does not come back after it was dismissed", () => {
    sessionStorage.setItem(OCTOBER_GIFT_DISMISS_KEY, "1");
    render(<OctoberGiftPopup />);
    advance(OCTOBER_GIFT_TIMING.showAfterMs + 50);
    expect(screen.queryByRole("complementary", { name: "هدية أكتوبر" })).toBeNull();
  });

  it("is no longer offered once October ends", () => {
    vi.setSystemTime(new Date("2026-11-01T00:30:00+03:00"));
    render(<OctoberGiftPopup />);
    advance(OCTOBER_GIFT_TIMING.showAfterMs + 50);
    expect(screen.queryByRole("complementary", { name: "هدية أكتوبر" })).toBeNull();
    expect(prefetch).not.toHaveBeenCalled();
  });
});
