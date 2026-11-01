import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/context/LanguageContext";
import NovemberProteinPromo, {
  NOVEMBER_PROMO_DISMISS_KEY,
  NOVEMBER_PROMO_HREF,
  NOVEMBER_PROMO_TIMING,
} from "./NovemberProteinPromo";

vi.mock("@/config/novemberProteinOffer", async () => {
  const actual = await vi.importActual<typeof import("@/config/novemberProteinOffer")>(
    "@/config/novemberProteinOffer",
  );
  return {
    ...actual,
    isNovemberCampaignActive: () => true,
  };
});

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("November protein homepage promo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the 600 EGP offer and links to the November landing", () => {
    render(
      <LanguageProvider>
        <NovemberProteinPromo />
      </LanguageProvider>,
    );
    advance(NOVEMBER_PROMO_TIMING.showAfterMs + 20);
    expect(screen.getByRole("region", { name: "عرض نوفمبر" })).toBeInTheDocument();
    expect(screen.getByText(/600/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "احجز العرض" })).toHaveAttribute("href", NOVEMBER_PROMO_HREF);
  });

  it("can be dismissed for the session", () => {
    render(
      <LanguageProvider>
        <NovemberProteinPromo />
      </LanguageProvider>,
    );
    advance(NOVEMBER_PROMO_TIMING.showAfterMs + 20);
    fireEvent.click(screen.getByRole("button", { name: "إخفاء" }));
    expect(sessionStorage.getItem(NOVEMBER_PROMO_DISMISS_KEY)).toBe("1");
    expect(screen.queryByRole("region", { name: "عرض نوفمبر" })).toBeNull();
  });
});
